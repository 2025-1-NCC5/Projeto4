# Usar uma imagem base oficial do Python
FROM python:3.9-slim

# Definir o diretório de trabalho no container
WORKDIR /app

# Copiar o arquivo de dependências primeiro para aproveitar o cache do Docker
COPY requirements.txt .

# Instalar as dependências
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código da aplicação e a pasta de modelos para dentro do WORKDIR (/app) no container
COPY main.py .
COPY modelos_final/ ./modelos_final/

# Expor a porta que o Uvicorn usará
EXPOSE 8000

# Comando para rodar a aplicação quando o container iniciar
# O host 0.0.0.0 torna a API acessível de fora do container
# "main:app" refere-se ao arquivo main.py e à instância 'app = FastAPI()' nele
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
