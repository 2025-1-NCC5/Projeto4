# Estimador de Preços - Khipo

Este projeto é um estimador de preços para serviços de transporte, como Uber, utilizando técnicas de Machine Learning.

## Estrutura do Projeto

```
.
├── backend/             # API FastAPI
├── frontend/           # Interface React
├── ml_model/          # Modelos de Machine Learning
└── src/               # Dados fonte
```

## Requisitos

- Python 3.8+
- Node.js 14+
- NPM 6+

## Instalação

### Backend

1. Crie um ambiente virtual Python:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Instale as dependências:
```bash
cd backend
pip install -r requirements.txt
```

### Frontend

1. Instale as dependências:
```bash
cd frontend
npm install
```

### Modelo de Machine Learning

1. Treine os modelos:
```bash
cd ml_model
python src/train.py
```

## Executando o Projeto

1. Inicie o backend:
```bash
cd backend
uvicorn app.main:app --reload
```

2. Inicie o frontend:
```bash
cd frontend
npm start
```

3. Acesse a aplicação em `http://localhost:3000`

## Funcionalidades

- Estimativa de preços para diferentes categorias de serviço (UberX, Uber Comfort, Uber Black)
- Interface intuitiva para inserção de origem e destino
- Cálculo de distância e tempo estimado
- Visualização de múltiplas estimativas

## Tecnologias Utilizadas

- Backend: FastAPI, SQLAlchemy, Pandas, Scikit-learn
- Frontend: React, Material-UI, TypeScript
- ML: Scikit-learn, Pandas, NumPy
