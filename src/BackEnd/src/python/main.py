# src/python/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import pickle
import holidays

# Carrega modelo serializado
with open("model.pkl", "rb") as f:
    data = pickle.load(f)
model = data["model"]
features = data["features"]

BR_HOLIDAYS = holidays.Brazil()

class PredictRequest(BaseModel):
    hour_val: float
    weekday_val: int
    distance_m: float
    duration_s: float
    day: int
    month: int
    year: int

app = FastAPI()

@app.post("/predict")
def predict(req: PredictRequest):
    # Reconstrói as features derivadas
    hour_min    = req.hour_val
    hour_sin    = np.sin(2 * np.pi * hour_min / 24)
    hour_cos    = np.cos(2 * np.pi * hour_min / 24)
    weekday_sin = np.sin(2 * np.pi * req.weekday_val / 7)
    weekday_cos = np.cos(2 * np.pi * req.weekday_val / 7)
    is_holiday  = int(
        BR_HOLIDAYS.get(f"{req.year}-{req.month:02d}-{req.day:02d}") is not None
    )

    # monta array na ordem das features
    vals = [
        hour_min, hour_sin, hour_cos,
        weekday_sin, weekday_cos, req.weekday_val,
        is_holiday, req.distance_m, req.duration_s,
        req.day, req.month, req.year
    ]
    arr = np.array([vals])
    price = float(model.predict(arr)[0])
    return {"price": price}
