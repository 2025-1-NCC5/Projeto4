# src/python/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import joblib # Usar joblib para carregar os modelos .pkl
import time
import datetime # Para gerar features de data/hora atuais
# 'requests' para BrasilAPI, se a função get_holiday_info for usada aqui
import requests 
import pandas as pd

# --- Funções Auxiliares (Copie do seu Bloco 5 de previsão) ---
# É importante que estas funções sejam consistentes com as usadas na previsão offline
def get_holiday_info_api(target_year): # Renomeada para evitar conflito se você tiver outra
    today = datetime.date.today()
    if target_year != today.year: return 0
    try:
        # Substitua por sua lógica real de API de feriados se necessário
        # Exemplo simplificado, pode não funcionar sem 'requests' e uma API real
        # response = requests.get(f"https://brasilapi.com.br/api/feriados/v1/{target_year}", timeout=2)
        # response.raise_for_status()
        # feriados = response.json()
        # return 1 if any(f.get('date') == today.strftime('%Y-%m-%d') for f in feriados) else 0
        print("AVISO: get_holiday_info_api usando mock (retornando 0). Implemente com API real se necessário.")
        return 0 # Mock para rodar sem a API
    except Exception:
        return 0

def prepare_input_for_fastapi_model(
    distance_m_user, duration_s_user,
    expected_column_names_model, # Lista de colunas que o pipeline específico espera
    target_subcategory_for_big_model=None # Ex: 'uberx', para a feature 'subcategory_feature' do Modelão
):
    now = datetime.datetime.now()
    current_year = now.year
    current_month = now.month
    current_weekday_num = now.weekday()
    current_hour_of_day = now.hour
    current_minute = now.minute

    is_holiday_val = get_holiday_info_api(current_year)
    hour_rad = (current_hour_of_day + current_minute / 60) * (2 * np.pi / 24)
    weekday_rad = current_weekday_num * (2 * np.pi / 7)
    is_peak = ((5 <= current_hour_of_day <= 8) or (16 <= current_hour_of_day <= 19))
    
    generated_features = {
        'distance_m': distance_m_user,
        'duration_s': duration_s_user,
        'year': current_year,
        'month': current_month,
        'is_holiday': is_holiday_val,
        'hour_sin': np.sin(hour_rad),
        'hour_cos': np.cos(hour_rad),
        'weekday_sin': np.sin(weekday_rad),
        'weekday_cos': np.cos(weekday_rad),
        'is_peak_hour': int(is_peak)
    }
    if target_subcategory_for_big_model: # Se estiver usando um Modelão que espera esta feature
        generated_features['subcategory_feature'] = target_subcategory_for_big_model
    
    input_dict = {}
    missing_cols_debug_api = []
    for col_expected in expected_column_names_model:
        if col_expected in generated_features:
            input_dict[col_expected] = generated_features[col_expected]
        else:
            # Se uma coluna esperada não foi gerada, isso é um problema de consistência
            # entre o treinamento e esta função de preparação.
            missing_cols_debug_api.append(col_expected)
            input_dict[col_expected] = np.nan # Ou um valor default mais apropriado
    
    if missing_cols_debug_api:
        print(f"    ALERTA API (prepare_input): Colunas esperadas pelo modelo mas não geradas: {missing_cols_debug_api}. Usando NaN.")
            
    return pd.DataFrame([input_dict], columns=expected_column_names_model)

# --- Fim das Funções Auxiliares ---


# Nomes dos modelos e seus arquivos .pkl
# As chaves aqui serão usadas na resposta JSON
MODEL_FILES = {
    "uberX": "UberX.pkl",
    "uberComfort": "UberComfort.pkl",
    "uberBlack": "UberBlack.pkl",
    "99Pop": "99Pop.pkl",
    "99Plus": "99plus.pkl",
    # Se você tivesse um "Modelão" RF, adicionaria aqui:
    # "MODELAO_RF": "MODELAO_Random_Forest.pkl" 
}

# Dicionário para armazenar os modelos carregados e suas features esperadas
loaded_models_dict = {}

print("--- Carregando Modelos Para API ---")
for model_key_name, pkl_filename in MODEL_FILES.items():
    try:
        # Assumindo que os arquivos .pkl estão no mesmo diretório ou em 'modelos_exportados/'
        # Ajuste o caminho se necessário, ex: f"modelos_exportados/{pkl_filename}"
        full_path = f"modelos_final/{pkl_filename}" # << AJUSTE O CAMINHO SE NECESSÁRIO
        with open(full_path, "rb") as f:
            data = joblib.load(f) # Usar joblib se salvou com joblib
        
        loaded_models_dict[model_key_name] = {
            "pipeline": data["pipeline"],
            "features": data["feature_columns"] # A lista de colunas salva com o pipeline
        }
        print(f"  Modelo '{model_key_name}' ({pkl_filename}) carregado. Features esperadas: {len(data['feature_columns'])}.")
    except FileNotFoundError:
        print(f"  ERRO CRÍTICO: Arquivo do modelo '{full_path}' não encontrado.")
        # Você pode decidir encerrar a aplicação se um modelo crucial não for encontrado
        # ou apenas logar e continuar (o modelo não estará disponível para previsão).
    except Exception as e:
        print(f"  ERRO CRÍTICO ao carregar o modelo '{pkl_filename}': {type(e).__name__} - {e}")

if not loaded_models_dict:
    print("ALERTA: Nenhum modelo foi carregado com sucesso. O endpoint /predict não funcionará corretamente.")

# Define o Pydantic Model para o payload do Node.js
# Este payload SÓ precisa de distância e duração, o resto será gerado no Python.
class PredictRequest(BaseModel):
    distancia_m: float = Field(..., alias='distancia_m')
    tempo_estim_segundos: float = Field(..., alias='tempo_estim_segundos')
    # Não precisamos mais das features de data/hora aqui, pois serão geradas no Python

app = FastAPI()

@app.post("/predict")
async def predict_prices(req: PredictRequest):
    if not loaded_models_dict:
         raise HTTPException(status_code=503, detail="Serviço de modelos indisponível (nenhum modelo carregado).")

    print(f"INFO: Requisição recebida em /predict com payload: {req.dict(by_alias=True)}")
    
    predictions = {}
    distance = req.distancia_m
    duration = req.tempo_estim_segundos

    start_time_total = time.time()

    for model_name, model_data in loaded_models_dict.items():
        pipeline = model_data["pipeline"]
        expected_features_list = model_data["features"]
        
        print(f"  INFO: Preparando input para o modelo '{model_name}'...")
        # Se este modelo for um "Modelão" que espera 'subcategory_feature',
        # você precisaria passar o 'target_subcategory_for_big_model' apropriado.
        # Para modelos individuais, target_subcategory_for_big_model é None.
        
        # Exemplo: Se você tivesse um MODELAO_RF e quisesse prever como se fosse 'uberX'
        # target_subcat = None
        # if model_name == "MODELAO_RF": # Ou qualquer nome que você deu ao seu modelão
        #     target_subcat = "uberX" # Ou outra subcategoria base para a previsão do modelão

        input_df = prepare_input_for_fastapi_model(
            distance, 
            duration,
            expected_column_names_model=expected_features_list
            # target_subcategory_for_big_model=target_subcat # Descomente e ajuste se tiver um modelão
        )
        
        # print(f"    DEBUG: Input DF para '{model_name}':\n{input_df.to_string()}")

        try:
            print(f"  INFO: Chamando predict() para '{model_name}'...")
            start_predict_time = time.time()
            prediction_array = pipeline.predict(input_df)
            end_predict_time = time.time()
            print(f"  INFO: Predição para '{model_name}' concluída em {end_predict_time - start_predict_time:.4f}s.")

            if prediction_array is None or len(prediction_array) == 0 or not np.isfinite(prediction_array[0]):
                print(f"  ERRO: Predição inválida para '{model_name}': {prediction_array}")
                predictions[model_name] = None # Ou "Erro"
            else:
                predictions[model_name] = round(float(prediction_array[0]), 2)
        except Exception as e:
            print(f"  ERRO ao prever com o modelo '{model_name}': {type(e).__name__} - {e}")
            # import traceback # Para depuração mais profunda
            # traceback.print_exc()
            predictions[model_name] = None # Ou "Erro"

    end_time_total = time.time()
    print(f"INFO: Todas as previsões concluídas em {end_time_total - start_time_total:.4f} segundos.")
    print(f"INFO: Preços previstos: {predictions}")
    
    # Filtrar apenas os resultados que não são None (ou "Erro")
    valid_predictions = {k: v for k, v in predictions.items() if v is not None}
    
    if not valid_predictions:
        raise HTTPException(status_code=500, detail="Nenhuma previsão válida pôde ser gerada.")
        
    return valid_predictions