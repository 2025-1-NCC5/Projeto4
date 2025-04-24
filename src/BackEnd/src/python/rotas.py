# -*- coding: utf-8 -*-
# Script para calcular rotas usando ORS local (Teste de Conexao Direta)

import pandas as pd
import numpy as np
import openrouteservice
from tqdm.notebook import tqdm
import time
import requests

print("--- Script de Calculo de Rotas ORS Local (Teste Direto) ---")

# --- 1. Configuracoes ---
ADDRESS_FILE_PATH   = r'c:/Projetos/Projeto4/src/BackEnd/src/python/data/rideaddress_v1.csv'
# <<< USE A PORTA QUE VOCE MAPEOU NO DOCKER RUN (8080 ou 8082) >>>
PORTA_ORS           = 8082 # Altere para 8080 se necessario
ORS_BASE_URL        = f'http://localhost:{PORTA_ORS}/ors' # Tenta localhost
ORS_BASE_URL_IP     = f'http://127.0.0.1:{PORTA_ORS}/ors' # Tenta 127.0.0.1
OUTPUT_CSV_FILE     = './data/ors_local_coords_only_results.csv'
REQUEST_TIMEOUT    = 60 # Timeout para chamadas ORS
PAUSE_BETWEEN_REQUESTS = 0.02

# --- 2. Carregar e Preparar Dados (Igual ao anterior) ---
# ... (codigo de carregamento, limpeza de coordenadas e pivotagem igual ao script anterior) ...
# Certifique-se que address_pivoted_valid é criado corretamente
print(f"\n1. Carregando enderecos de: {ADDRESS_FILE_PATH}")
try:
    address_df = pd.read_csv(ADDRESS_FILE_PATH, sep=';', encoding='utf-8', low_memory=False)
except UnicodeDecodeError:
    print("   Falha UTF-8, tentando Latin-1...")
    address_df = pd.read_csv(ADDRESS_FILE_PATH, sep=';', encoding='latin-1', low_memory=False)

address_df = address_df[["Lat", "Lng", "RideAddressTypeID", "RideID"]].copy()
address_df.rename(columns={"Lat": "lat", "Lng": "lng", "RideAddressTypeID": "address_type", "RideID": "ride_id"}, inplace=True)
print(f"   → Carregadas {len(address_df)} linhas.")

def clean_coord(coord):
    if pd.isna(coord): return np.nan
    if isinstance(coord, (int, float)): return float(coord)
    if isinstance(coord, str):
        try: return float(coord.replace(',', '.'))
        except: return np.nan
    return np.nan

print("2. Limpando coordenadas...")
address_df['lat_clean'] = address_df['lat'].apply(clean_coord)
address_df['lng_clean'] = address_df['lng'].apply(clean_coord)
address_df.dropna(subset=['lat_clean', 'lng_clean'], inplace=True)
print(f"   → {len(address_df)} linhas com coordenadas validas.")

print("3. Pivotando enderecos...")
try:
    address_pivoted = address_df.pivot_table(index='ride_id', columns='address_type', values=['lat_clean', 'lng_clean'], aggfunc='mean')
    address_pivoted.columns = ['_'.join(map(str, col)).strip() for col in address_pivoted.columns.values]
    address_pivoted.reset_index(inplace=True)
    address_pivoted.rename(columns={'lat_clean_1': 'lat_origin', 'lng_clean_1': 'lng_origin', 'lat_clean_2': 'lat_dest', 'lng_clean_2': 'lng_dest'}, inplace=True)
    address_pivoted_valid = address_pivoted.dropna(subset=['lat_origin', 'lng_origin', 'lat_dest', 'lng_dest']).copy()
    print(f"   → {len(address_pivoted_valid)} corridas com coordenadas validas de origem E destino.")
except Exception as e:
    print(f"   !!! Erro ao pivotar: {e}")
    address_pivoted_valid = pd.DataFrame()


# --- 4. Teste Direto da Conexao e Inicializacao do Cliente ---
print(f"\n4. Testando conexao e inicializando cliente ORS...")
client_ors = None
connected_url = None # Guarda a URL que funcionou

# Tenta primeiro com localhost
urls_to_test = [ORS_BASE_URL, ORS_BASE_URL_IP]
# Opcional: Tentar o IP do WSL (se voce conseguir obter)
# try:
#    import subprocess
#    ip_process = subprocess.run(['wsl', 'hostname', '-i'], capture_output=True, text=True, check=True)
#    wsl_ip = ip_process.stdout.strip()
#    if wsl_ip:
#        urls_to_test.append(f'http://{wsl_ip}:{PORTA_ORS}/ors')
# except Exception as e:
#    print(f"   (Info: Nao foi possivel obter IP do WSL - {e})")


for url_teste in urls_to_test:
    print(f"   → Tentando conectar em: {url_teste}")
    try:
        client_test = openrouteservice.Client(base_url=url_teste, timeout=REQUEST_TIMEOUT)
        # Faz uma requisicao de teste real para 'directions'
        test_coords_br = ((-46.6333, -23.5505), (-46.6340, -23.5510)) # SP
        routes_test = client_test.directions(coordinates=test_coords_br, profile='driving-car')

        # Verifica se a resposta e valida (tem rotas)
        if routes_test and routes_test.get('routes'):
            print(f"   >>> SUCESSO! Conexao e rota OK em: {url_teste}")
            client_ors = client_test # Usa este cliente
            connected_url = url_teste
            break # Para de tentar outras URLs
        else:
            # Conectou, mas nao obteve rota (pode ser problema no ORS ou coords de teste)
            print(f"   → WARN: Conectou a {url_teste}, mas nao obteve rota no teste. Verifique o ORS.")
            # Decide continuar com este cliente mesmo assim? Ou tentar outra URL?
            # Por ora, vamos assumir que a conexao esta ok se nao deu erro.
            client_ors = client_test
            connected_url = url_teste
            break # Para de tentar

    except requests.exceptions.ConnectionError as conn_err:
        print(f"      Falha de conexao (ex: Connection Refused/Aborted): {conn_err}")
        continue # Tenta a proxima URL
    except requests.exceptions.Timeout:
        print(f"      Timeout ao conectar.")
        continue # Tenta a proxima URL
    except openrouteservice.exceptions.ApiError as api_err:
        print(f"      Erro da API ORS no teste (Status {api_err.status_code}): {api_err.message}")
        # Se for 404 no teste, a conexao esta ok, podemos parar e usar este cliente
        if api_err.status_code == 404:
             print(f"   >>> Conexao OK (recebeu 404 da API - rota nao encontrada) em: {url_teste}")
             client_ors = client_test
             connected_url = url_teste
             break
        else: # Outro erro da API pode ser mais serio
             print(f"      Continuando para tentar outra URL, se houver...")
             continue
    except Exception as e:
        print(f"      Erro inesperado ao testar {url_teste}: {type(e).__name__} - {e}")
        continue # Tenta a proxima URL

if client_ors:
    print(f"\n   Cliente ORS configurado para usar: {connected_url}")
else:
    print("\n   !!! ERRO FATAL: Nao foi possivel estabelecer conexao com o servidor ORS em nenhuma das URLs testadas.")
    print("      Verifique os logs do Docker, mapeamento de portas e firewall/antivirus.")

# --- 5. Loop de Processamento de Rotas ORS (Igual ao anterior) ---
results_ors = []
if client_ors and not address_pivoted_valid.empty:
    print(f"\n5. Iniciando calculo de rotas ORS para {len(address_pivoted_valid)} corridas...")
    tqdm.pandas(desc="Calculando Rotas ORS")

    def get_ors_route_data_simple(row):
        coords = ((row['lng_origin'], row['lat_origin']), (row['lng_dest'], row['lat_dest']))
        distance, duration, error_msg = np.nan, np.nan, None
        if coords[0] == coords[1]:
            distance, duration = 0.0, 0.0
        else:
            try:
                # Usa o cliente que funcionou no teste
                routes = client_ors.directions(coordinates=coords, profile='driving-car', format='geojson', preference='fastest')
                if routes and routes.get('routes') and routes['routes']:
                    route = routes['routes'][0]
                    if route and route.get('summary'):
                        distance = route['summary'].get('distance')
                        duration = route['summary'].get('duration')
                        if not isinstance(distance, (int, float)) or not isinstance(duration, (int, float)):
                            error_msg = "ORS: Dist/Dur invalidos"
                            distance, duration = np.nan, np.nan
                    else: error_msg = "ORS: Sem summary"
                else: error_msg = "ORS: Sem routes"
            except openrouteservice.exceptions.ApiError as api_err:
                error_msg = f"ORS_API_{api_err.status_code}"
                 # Logar erros 5xx podem indicar problemas no servidor ORS sob carga
                if api_err.status_code >= 500 :
                     print(f"\nWARN: Erro {api_err.status_code} no servidor ORS para RideID {row['ride_id']}. Pausando...")
                     time.sleep(5) # Pausa maior para erros de servidor
            except requests.exceptions.RequestException as req_err:
                 error_msg = f"ORS_CONN_ERR"
                 print(f"\nWARN: Erro de conexao durante loop para RideID {row['ride_id']}: {req_err}. Pausando...")
                 time.sleep(10) # Pausa maior
            except Exception as e:
                 error_msg = f"ORS_UNK_ERR_{type(e).__name__}"
                 print(f"\nWARN: Erro inesperado {error_msg} para RideID {row['ride_id']}: {e}")

        time.sleep(PAUSE_BETWEEN_REQUESTS) # Pausa entre CADA tentativa
        return pd.Series([distance, duration, error_msg], index=['distance_m', 'duration_s', 'ors_error_detail'])

    ors_results_series = address_pivoted_valid.progress_apply(get_ors_route_data_simple, axis=1)
    address_pivoted_valid[['distance_m', 'duration_s', 'ors_error_detail']] = ors_results_series
    print("   → Calculo de rotas ORS concluido.")

    output_df = address_pivoted_valid[['ride_id', 'distance_m', 'duration_s', 'ors_error_detail']].copy()

    # --- 6. Análise e Salvamento (Igual ao anterior) ---
    # ... (codigo de analise e salvamento igual ao script anterior) ...
    print("\n6. Analise e Salvamento...")
    print(output_df.head())
    success_count = output_df['distance_m'].notna().sum()
    print(f"   → Rotas ORS calculadas: {success_count} / {len(output_df)}")
    print(output_df['ors_error_detail'].value_counts())
    try:
        output_df.to_csv(OUTPUT_CSV_FILE, index=False, encoding='utf-8', sep=';')
        print(f"   → Resultados salvos em {OUTPUT_CSV_FILE}")
    except Exception as e: print(f"   !!! Erro ao salvar CSV: {e}")

else:
    print("\n5. Cliente ORS nao inicializado ou sem dados validos. Nenhum calculo sera feito.")

print("\n--- Fim do Script ---")