# src/python/main.py
from fastapi import FastAPI, HTTPException # Importa HTTPException
from pydantic import BaseModel, Field # Importa Field para nomes com hifen/underline
import numpy as np
import pickle
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
def predict(req: PredictRequest):
    if model is None or not expected_features:
         raise HTTPException(status_code=500, detail="Modelo nao carregado corretamente.")

    try:
        # Cria o array numpy na ORDEM CORRETA definida em expected_features
        input_list = []
        # Converte o Pydantic model para um dicionario para acesso facil
        req_dict = req.dict(by_alias=True) # Usa by_alias=True se usou alias acima

        for feature_name in expected_features:
            if feature_name in req_dict:
                input_list.append(req_dict[feature_name])
            else:
                # Se alguma feature esperada pelo modelo nao veio do Node, da erro
                print(f"Erro: Feature esperada '{feature_name}' ausente no payload recebido.")
                raise HTTPException(status_code=422, detail=f"Feature ausente: {feature_name}")

        vals = np.array([input_list]) # Cria [[val1, val2, ...]]

        # Verifica se o numero de features bate
        if vals.shape[1] != len(expected_features):
             print(f"Erro: Numero de features recebidas ({vals.shape[1]}) diferente do esperado ({len(expected_features)}).")
             raise HTTPException(status_code=422, detail="Numero incorreto de features.")

        # Faz a predicao
        prediction = model.predict(vals)

        # Verifica se a predicao e valida
        if prediction is None or len(prediction) == 0 or not np.isfinite(prediction[0]):
             print(f"Erro: Predicao retornou valor invalido: {prediction}")
             raise HTTPException(status_code=500, detail="Modelo retornou predicao invalida.")

        price = float(prediction[0])
        print(f"Payload recebido: {req_dict}")
        print(f"Array para predict: {vals}")
        print(f"Preco previsto: {price}")
        return {"price": price}

    except HTTPException as http_exc:
         # Re-lanca excecoes HTTP ja tratadas
         raise http_exc
    except Exception as e:
         print(f"Erro inesperado durante a predicao: {type(e).__name__} - {e}")
         # Logar o traceback completo pode ser util aqui
         # import traceback
         # traceback.print_exc()
         raise HTTPException(status_code=500, detail="Erro interno ao processar a predicao.")