# src/python/main.py
from fastapi import FastAPI, HTTPException # Importa HTTPException
from pydantic import BaseModel, Field # Importa Field para nomes com hifen/underline
import numpy as np
import pickle
import time
# Nao precisa mais de 'holidays' aqui

# Carrega modelo serializado
try:
    with open("model.pkl", "rb") as f:
        data = pickle.load(f)
    model = data["model"]
    # Le a ordem EXATA das features do arquivo pickle
    expected_features = data["features"]
    print(f"Modelo carregado. Features esperadas: {expected_features}")
except Exception as e:
    print(f"Erro critico ao carregar model.pkl: {e}")
    # Encerrar a aplicacao ou lidar com o erro de forma apropriada
    model = None
    expected_features = []


# Define o Pydantic Model para corresponder EXATAMENTE ao payload enviado pelo Node
# Usa alias se o nome da variavel python for diferente da chave JSON
class PredictRequest(BaseModel):
    hour_min: float
    hour_sin: float
    hour_cos: float
    weekday_val: int
    weekday_sin: float
    weekday_cos: float
    is_holiday: int
    distancia_m: float = Field(..., alias='distancia_m') # Usa alias se necessario
    tempo_estim_segundos: float = Field(..., alias='tempo_estim_segundos') # Usa alias se necessario
    day: int
    month: int
    year: int

app = FastAPI()

@app.post("/predict")
async def predict(req: PredictRequest): # <<< Tornar async se o modelo for muito lento
    if model is None or not expected_features:
         raise HTTPException(status_code=500, detail="Modelo nao carregado corretamente.")

    print("INFO: Requisicao recebida em /predict") # Log inicial

    try:
        req_dict = req.dict(by_alias=True)
        print(f"DEBUG: Payload recebido do Node: {req_dict}") # Log do payload

        input_list = []
        for feature_name in expected_features:
            if feature_name in req_dict:
                input_list.append(req_dict[feature_name])
            else:
                print(f"ERRO: Feature esperada '{feature_name}' ausente.")
                raise HTTPException(status_code=422, detail=f"Feature ausente: {feature_name}")

        vals = np.array([input_list])
        print(f"DEBUG: Array numpy para o modelo: {vals}") # Log do array

        if vals.shape[1] != len(expected_features):
             print(f"ERRO: Discrepancia no numero de features: esperado {len(expected_features)}, recebido {vals.shape[1]}.")
             raise HTTPException(status_code=422, detail="Numero incorreto de features.")

        # --- Chamada do Modelo ---
        print("INFO: Chamando model.predict()...")
        start_time = time.time() # Medir tempo
        # Se model.predict for sincrono (normal para scikit-learn/xgboost):
        prediction = model.predict(vals)
        # Se fosse uma operacao I/O-bound ou muito longa, poderiamos usar asyncio:
        # prediction = await asyncio.to_thread(model.predict, vals)
        end_time = time.time()
        print(f"INFO: model.predict() concluido em {end_time - start_time:.4f} segundos.")
        # -------------------------


        if prediction is None or len(prediction) == 0 or not np.isfinite(prediction[0]):
             print(f"ERRO: Predicao retornou valor invalido: {prediction}")
             raise HTTPException(status_code=500, detail="Modelo retornou predicao invalida.")

        price = float(prediction[0])
        print(f"INFO: Preco previsto: {price}")
        return {"price": price}

    except HTTPException as http_exc:
         raise http_exc
    except Exception as e:
         print(f"ERRO: Erro inesperado durante a predicao: {type(e).__name__} - {e}")
         import traceback
         traceback.print_exc() # Imprime o traceback completo no console do Python
         raise HTTPException(status_code=500, detail=f"Erro interno no servico ML: {type(e).__name__}")