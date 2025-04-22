import pickle
import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, r2_score

# 1. Carregar modelo e lista de features
with open("model.pkl", "rb") as f:
    data = pickle.load(f)
model = data["model"]
features = data["features"]

# 2. Carregar e preparar os dados (ajuste os caminhos conforme necessário)
df = pd.read_csv("./data/ride_v2.csv", sep=';', low_memory=False)
# ...repita aqui o processamento de merges e features igual ao save_model.py...

# Exemplo: supondo que df_final seja o DataFrame final já preparado
# X = df_final[features]
# y = df_final["Price"]

# 3. Fazer previsões e calcular métricas
# predictions = model.predict(X)
# rmse = np.sqrt(mean_squared_error(y, predictions))
# r2 = r2_score(y, predictions)
# print(f"RMSE: {rmse:.4f}")
# print(f"R²: {r2:.4f}")

# Observação: copie o processamento de features do save_model.py para garantir compatibilidade!
