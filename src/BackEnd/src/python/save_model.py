# -*- coding: utf-8 -*-
# src/python/save_model.py

import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
import holidays # Necessário para a feature de feriado
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from datetime import datetime # Necessário para a função fix_date_str

# --- 0) CONFIGURACAO MANUAL ---
MERGE_KEY     = "RideID"
PRICE_COL     = "Price"                # Coluna de preço do estimative_v3.csv
DISTANCE_COL  = "distancia_m"          # Coluna de distância do distancia_tempo_corridas.csv
DURATION_COL  = "tempo_estim_segundos" # Coluna de tempo do distancia_tempo_corridas.csv
DATETIME_COL  = "Create"               # <<< CORRIGIDO: Coluna de data/hora do ride_v2.csv
# ──────────────────────────────────────────────────────────────────────

# --- Função para corrigir formato da string de data/hora ---
def fix_date_str(date_str):
    if pd.isna(date_str): return None
    date_str = str(date_str).strip()
    if '.' in date_str:
        parts = date_str.split('.')
        # Garante que a parte da fração de segundo tenha no máximo 6 dígitos
        if len(parts) > 1 and len(parts[1]) > 6:
             base_time = parts[0]
             fraction = parts[1][:6]
             time_parts = base_time.split(':')
             if len(time_parts) >= 2: # Precisa ter pelo menos HH:MM
                 return base_time + '.' + fraction
    return date_str

print("1) Carregando CSVs brutos...")
try:
    # Usar separador explícito é mais robusto
    rides    = pd.read_csv("./data/ride_v2.csv", sep=';', low_memory=False, on_bad_lines="warn")
    estim    = pd.read_csv("./data/rideestimative_v3.csv", sep=';', low_memory=False, on_bad_lines="warn")
    dist_ors = pd.read_csv("./data/distancia_tempo_corridas.csv", sep=',', low_memory=False, on_bad_lines="warn") # Assumindo CSV separado por vírgula
except Exception as e:
     print(f"Erro ao carregar CSVs: {e}")
     print("Verifique os caminhos e separadores (sep=';' ou sep=',')")
     exit()

# --- 1.1) Exibe colunas para conferência ---
print("\n→ Colunas em rides:")
print(rides.columns.tolist())
print("\n→ Colunas em estim:")
print(estim.columns.tolist())
print("\n→ Colunas em dist_ors:")
print(dist_ors.columns.tolist())

# --- 1.2) Valida presença das colunas configuradas ---
missing_rides = [c for c in [MERGE_KEY, DATETIME_COL] if c not in rides.columns]
if missing_rides:
    raise RuntimeError(f"Nao achei as colunas {missing_rides} no CSV de corridas (ride_v2.csv). Ajuste MERGE_KEY ou DATETIME_COL.")

missing_estim = [c for c in [MERGE_KEY, PRICE_COL] if c not in estim.columns]
if missing_estim:
    raise RuntimeError(f"Nao achei as colunas {missing_estim} no CSV de estimativa. Ajuste PRICE_COL ou MERGE_KEY.")

missing_dist = [c for c in [MERGE_KEY, DISTANCE_COL, DURATION_COL] if c not in dist_ors.columns]
if missing_dist:
    raise RuntimeError(f"Nao achei as colunas {missing_dist} no CSV de distancia/tempo. Ajuste DISTANCE_COL, DURATION_COL ou MERGE_KEY.")

print(f"\n2) Colunas confirmadas: merge='{MERGE_KEY}', price='{PRICE_COL}', datetime='{DATETIME_COL}', dist='{DISTANCE_COL}', dur='{DURATION_COL}'")

# --- 2) Fazendo merges ---
# Seleciona apenas as colunas necessárias ANTES do merge para eficiência
rides_subset = rides[[MERGE_KEY, DATETIME_COL]].copy()
estim_subset = estim[[MERGE_KEY, PRICE_COL]].copy()
dist_ors_subset = dist_ors[[MERGE_KEY, DISTANCE_COL, DURATION_COL]].copy()

print("Realizando merges...")
try:
    df = (
        rides_subset
        .merge(estim_subset, on=MERGE_KEY, how="inner")
        .merge(dist_ors_subset, on=MERGE_KEY, how="inner")
    )
except Exception as e:
     print(f"Erro durante o merge: {e}")
     print("Verifique se a coluna '{MERGE_KEY}' tem tipos de dados compativeis entre os DataFrames.")
     exit()

print(f"   → {len(df)} corridas após merge.")

# --- 3) Extraindo datetime e criando features básicas ---
print(f"Processando coluna de data/hora: '{DATETIME_COL}'...")
# Aplica correção de formato primeiro
df['fixed_datetime_str'] = df[DATETIME_COL].apply(fix_date_str)
df["datetime"] = pd.to_datetime(df['fixed_datetime_str'], errors="coerce", infer_datetime_format=True, cache=True)

# Remove linhas onde a data/hora não pôde ser convertida
initial_len = len(df)
df = df.dropna(subset=["datetime"])
removed_count = initial_len - len(df)
if removed_count > 0:
    print(f"   → Removidas {removed_count} linhas com data/hora invalida.")

print("Extraindo features de data/hora...")
df["hour_val"]    = df["datetime"].dt.hour + df["datetime"].dt.minute / 60.0 # Usa float para precisao
df["weekday_val"] = df["datetime"].dt.weekday + 1  # Segunda=1…Domingo=7
df["day"]         = df["datetime"].dt.day
df["month"]       = df["datetime"].dt.month
df["year"]        = df["datetime"].dt.year

# --- 4) Features cíclicas e feriado ---
print("Criando features ciclicas e de feriado...")
df["hour_min"]    = df["hour_val"] # Mantem para compatibilidade com features list
df["hour_sin"]    = np.sin(2 * np.pi * df["hour_min"] / 24)
df["hour_cos"]    = np.cos(2 * np.pi * df["hour_min"] / 24)
df["weekday_sin"] = np.sin(2 * np.pi * df["weekday_val"] / 7)
df["weekday_cos"] = np.cos(2 * np.pi * df["weekday_val"] / 7)

try:
    br_hols = holidays.Brazil(years=df["year"].unique().tolist())
    # Usa dt.date para comparar apenas a data, nao a hora
    df["is_holiday"]  = df["datetime"].dt.date.apply(lambda date: 1 if date in br_hols else 0)
except Exception as e:
     print(f"Erro ao processar feriados: {e}. Criando coluna 'is_holiday' com zeros.")
     df["is_holiday"] = 0 # Fallback: assume que nao e feriado

# --- 4.1) Tratamento de Valores Ausentes em Distância/Duração ---
print("Verificando NaNs em distancia/duracao...")
dist_nan_count = df[DISTANCE_COL].isna().sum()
dur_nan_count = df[DURATION_COL].isna().sum()
print(f"   → Linhas com distancia NaN: {dist_nan_count}")
print(f"   → Linhas com duracao NaN: {dur_nan_count}")

# Estrategia: Remover linhas com distancia NaN. Imputar duracao com a media.
initial_len = len(df)
df = df.dropna(subset=[DISTANCE_COL])
removed_dist_nan = initial_len - len(df)
if removed_dist_nan > 0:
    print(f"   → Removidas {removed_dist_nan} linhas com distancia NaN.")

if dur_nan_count > 0:
    mean_duration = df[DURATION_COL].mean()
    df[DURATION_COL].fillna(mean_duration, inplace=True)
    print(f"   → NaNs em duracao imputados com a media: {mean_duration:.2f}")

# --- 5) Definição de features / target ────────────────────────────────
features = [
    "hour_min",    # Original hora.minuto
    "hour_sin",    # Componente seno da hora
    "hour_cos",    # Componente cosseno da hora
    "weekday_val", # Original dia da semana (1-7)
    "weekday_sin", # Componente seno do dia da semana
    "weekday_cos", # Componente cosseno do dia da semana
    "is_holiday",  # Flag de feriado (0 ou 1)
    DISTANCE_COL,  # Distancia (ex: 'distancia_m')
    DURATION_COL,  # Duracao (ex: 'tempo_estim_segundos')
    "day",         # Dia do mes
    "month",       # Mes
    "year"         # Ano
]
target = PRICE_COL

# Verifica se todas as features existem no DataFrame final
missing_features = [f for f in features if f not in df.columns]
if missing_features:
     raise RuntimeError(f"Erro interno: Features {missing_features} nao encontradas no DataFrame final.")

print(f"\n5) Features selecionadas para o modelo: {features}")
print(f"   Target: {target}")

# --- 6) Split treino/teste e treinamento do XGBoost ───────────────────
X = df[features]
y = df[target]

# Verifica se ainda ha dados apos a limpeza
if len(X) == 0:
    raise RuntimeError("Nao ha dados restantes apos limpeza e merges para treinar o modelo.")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"\n6) Split treino/teste → {len(X_train)}/{len(X_test)} exemplos")

print("Treinando modelo XGBoost...")
model = xgb.XGBRegressor(
    objective="reg:squarederror", n_estimators=100, learning_rate=0.1,
    max_depth=5, subsample=0.8, colsample_bytree=0.8,
    random_state=42, n_jobs=-1, # Usar todos os cores disponiveis
    enable_categorical=False # Definir explicitamente (geralmente nao necessario se nao houver categoricas)
)
model.fit(X_train, y_train)
print("   → Treinamento concluido.")

# --- 7) Avaliação ────────────────────────────────────────────────────
print("\n7) Avaliando o modelo no conjunto de teste...")
predictions = model.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, predictions))
# Calcular R² (Score)
r2_score = model.score(X_test, y_test)

print(f"   → RMSE no teste: {rmse:.4f}")
print(f"   → R² Score no teste: {r2_score:.4f}")

# --- 8) Serialização ─────────────────────────────────────────────────
output_model_file = "model.pkl"
print(f"\n8) Salvando modelo e lista de features em '{output_model_file}'...")
try:
    with open(output_model_file, "wb") as f:
        pickle.dump({"model": model, "features": features}, f)
    print(f"✅ '{output_model_file}' gerado com sucesso!")
except Exception as e:
    print(f"Erro ao salvar o arquivo pickle: {e}")