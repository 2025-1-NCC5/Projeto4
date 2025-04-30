# -*- coding: utf-8 -*-
"""
Script robusto para cálculo de rotas com ORS local, salvando em append:
- Health‐check com retry
- Limpeza e validação de coordenadas
- Filtro de bounding‐box (Brasil)
- Batch Matrix + fallback Directions
- Barra de progresso no terminal
- Salvamento incremental + resume automático
"""

import re
import os
import time
import logging
import requests
import pandas as pd
import numpy as np
import openrouteservice
from tqdm import tqdm

# — Configurações gerais —
ADDRESS_FILE_PATH      = r'c:/Projetos/Projeto4/src/BackEnd/src/python/data/rideaddress_v1.csv'
OUTPUT_DIR             = r'./data'
OUTPUT_CSV_FILE        = os.path.join(OUTPUT_DIR, 'ors_local_coords_only_results.csv')
PORTA_ORS              = 8082
ORS_BASE_URL           = f'http://localhost:{PORTA_ORS}/ors'
REQUEST_TIMEOUT        = 60
PAUSE_BETWEEN_BATCHES  = 0      # segundos de pausa entre batches
MATRIX_BATCH_SIZE      = 50    # ajuste conforme memória e latência

# Limites aproximados do grafo (Brasil)
MIN_LNG, MAX_LNG = -74.0, -34.0
MIN_LAT, MAX_LAT = -35.0,   6.0

# — Logging básico —
logging.basicConfig(
    format='[%(asctime)s] %(levelname)s: %(message)s',
    level=logging.INFO,
    datefmt='%H:%M:%S'
)

# — 0) Prepara diretório e retoma progresso anterior —
os.makedirs(OUTPUT_DIR, exist_ok=True)
if os.path.exists(OUTPUT_CSV_FILE):
    processed = pd.read_csv(OUTPUT_CSV_FILE, sep=';')['ride_id'].unique()
    processed_set = set(processed)
    logging.info("Retomando: %d rides já processadas serão puladas", len(processed_set))
else:
    processed_set = set()
    logging.info("Nenhum arquivo anterior encontrado — início completo")

# — 1) Health-check com retry —
logging.info("Verificando ORS em %s/v2/health …", ORS_BASE_URL)
for attempt in range(20):
    try:
        r = requests.get(f"{ORS_BASE_URL}/v2/health", timeout=10)
        r.raise_for_status()
        if r.json().get('status') == 'ready':
            logging.info("ORS está pronto!")
            break
        logging.warning("ORS não pronto (status=%s), retry…", r.json().get('status'))
    except Exception as e:
        logging.warning("Health-check falhou (%s), retry em 5s…", e)
    time.sleep(5)
else:
    raise RuntimeError("ORS local não ficou pronto a tempo.")

# — 2) Inicializa cliente ORS —
client = openrouteservice.Client(base_url=ORS_BASE_URL, timeout=REQUEST_TIMEOUT)
logging.info("Cliente ORS inicializado em %s", ORS_BASE_URL)

# — 3) Carregamento e limpeza dos dados —
logging.info("1. Carregando CSV de endereços: %s", ADDRESS_FILE_PATH)
df = pd.read_csv(
    ADDRESS_FILE_PATH,
    sep=';',
    encoding='utf-8',
    usecols=["Lat","Lng","RideAddressTypeID","RideID"],
    low_memory=False
).rename(columns={
    "Lat":"raw_lat",
    "Lng":"raw_lng",
    "RideAddressTypeID":"address_type",
    "RideID":"ride_id"
})

def clean_coord(x):
    if pd.isna(x): return np.nan
    s = str(x).replace(',', '.')
    m = re.search(r'[-+]?\d*\.\d+|\d+', s)
    return float(m.group()) if m else np.nan

logging.info("2. Limpando coordenadas…")
df['lat'] = df['raw_lat'].map(clean_coord)
df['lng'] = df['raw_lng'].map(clean_coord)
df.dropna(subset=['lat','lng'], inplace=True)

# validação de origem/destino
counts = df.groupby(['ride_id','address_type']).size().unstack(fill_value=0)
valid_ids = counts[(counts.get(1,0)>=1) & (counts.get(2,0)>=1)].index.get_level_values(0)
logging.info("→ %d rides com origem e destino válidos", len(valid_ids))
df = df[df['ride_id'].isin(valid_ids)]

# pivot para lat_o/lng_o e lat_d/lng_d
logging.info("3. Pivotando origens/destinos…")
pivot = df.pivot_table(
    index='ride_id',
    columns='address_type',
    values=['lat','lng'],
    aggfunc='mean'
)
pivot.columns = ['lat_o','lat_d','lng_o','lng_d']
pivot.reset_index(inplace=True)

# filtro pelo bounding-box do Brasil
mask = (
    pivot.lng_o.between(MIN_LNG,MAX_LNG) &
    pivot.lat_o.between(MIN_LAT,MAX_LAT) &
    pivot.lng_d.between(MIN_LNG,MAX_LNG) &
    pivot.lat_d.between(MIN_LAT,MAX_LAT)
)
removed = len(pivot) - mask.sum()
if removed:
    logging.warning("Removendo %d rides fora do Brasil", removed)
rides = pivot[mask].reset_index(drop=True)
total = len(rides)
logging.info("→ %d corridas finais para processar", total)

# — 4) Função batch_matrix com fallback —
def batch_matrix(origins, destinations):
    try:
        body = {
            "locations": origins + destinations,
            "metrics": ["distance","duration"],
            "units": "m",
            "sources": list(range(len(origins))),
            "destinations": list(range(len(origins), len(origins)+len(destinations)))
        }
        resp = client.request("/v2/matrix/driving-car", post_json=body)
        dists = resp.get("distances", [])
        durs  = resp.get("durations", [])
        return (
            [dists[i][i] if i<len(dists) and i<len(dists[i]) else np.nan for i in range(len(origins))],
            [durs[i][i]  if i<len(durs)  and i<len(durs[i])  else np.nan for i in range(len(origins))]
        )
    except openrouteservice.exceptions.ApiError as e:
        logging.warning("Matrix falhou: %s", e)
        return None, None

# — 5) Loop de batches com salvamento incremental —
coords = list(zip(rides.lng_o, rides.lat_o, rides.lng_d, rides.lat_d))
ids    = rides.ride_id.tolist()
write_header = not os.path.exists(OUTPUT_CSV_FILE)

logging.info("5. Calculando em batches de %d…", MATRIX_BATCH_SIZE)
with tqdm(range(0, total, MATRIX_BATCH_SIZE), desc="Batches") as bar:
    for start in bar:
        batch_ids = ids[start:start+MATRIX_BATCH_SIZE]
        # se **todos** já processados, pula o batch inteiro
        if all(rid in processed_set for rid in batch_ids):
            continue

        batch = coords[start:start+MATRIX_BATCH_SIZE]
        origins      = [(lng_o, lat_o) for lng_o,lat_o,_,_ in batch]
        destinations = [(lng_d, lat_d) for _,_,lng_d,lat_d in batch]

        dists, durs = batch_matrix(origins, destinations)
        batch_results = []

        if dists is None:
            # fallback one-by-one sem sleep
            for idx, (o, d) in enumerate(zip(origins, destinations)):
                ride_id = batch_ids[idx]
                if ride_id in processed_set:  # pula individuais já feitos
                    continue
                try:
                    r = client.directions(coordinates=[o,d], profile="driving-car", format="json")
                    s = r['routes'][0]['summary']
                    batch_results.append((ride_id, s['distance'], s['duration'], None))
                except Exception as e:
                    logging.debug("Fallback erro ride %s: %s", ride_id, e)
                    batch_results.append((ride_id, np.nan, np.nan, "FALLBACK_ERR"))
        else:
            # usa matrix
            for idx, (dist, dur) in enumerate(zip(dists, durs)):
                ride_id = batch_ids[idx]
                if ride_id in processed_set:
                    continue
                if pd.notna(dist) and pd.notna(dur):
                    batch_results.append((ride_id, dist, dur, None))
                else:
                    batch_results.append((ride_id, np.nan, np.nan, "NO_ROUTE"))

        # grava o batch
        if batch_results:
            df_out = pd.DataFrame(batch_results, columns=['ride_id','distance_m','duration_s','error'])
            df_out.to_csv(
                OUTPUT_CSV_FILE,
                sep=';',
                index=False,
                header=write_header,
                mode='a',
                encoding='utf-8'
            )
            write_header = False
            processed_set.update(r[0] for r in batch_results)

        if PAUSE_BETWEEN_BATCHES:
            time.sleep(PAUSE_BETWEEN_BATCHES)

# — 6) Conclusão —
logging.info("Processamento finalizado. Total gravado: %d rides.", len(processed_set))
