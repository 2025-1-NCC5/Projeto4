# Estimador de Preços - Khipo

Este projeto é um estimador de preços para serviços de transporte, como Uber, utilizando técnicas de Machine Learning.

## Estrutura do Projeto

```sh
.├── Documentos
     ├── Entrega 1/
     ├── Entrega 2/
     ├── Entrega 3/
     └── Importantes/ # modelos, fotos e tabelas
 ├── Imagens/
 └── src/
     ├── FrontEnd/ # front e seus módulos
     ├── BackEnd/ # backend e seus módulos
         └── src/
             ├── python/ # modelo de IA
             └── server/ # RestAPI
```

## Ambiente de dev

### 1. Configurar e rodar FrontEnd

```sh
cd src/FrontEnd
npm install
npm run dev
```

### 2. Configurar e rodar Servidor

```sh
cd src/BackEnd
npm install
npm run dev
```

### 3. Configurar e rodar modelo de IA

```sh
cd src/BackEnd/src/python
pip install fastapi uvicorn pydantic numpy scikit-learn
python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

Além disso, é necessário fazer o download dos modelos de IA, que estão disponíveis no [Google Drive](https://drive.google.com/file/d/16lhmyuqmGNP3n_KUpem4iaeZNBg5oCkw/view?usp=drive_link)

Após o download, arraste o arquivo para a pastas `src/BackEnd/src/python/modelos_final/` e descompacte-o.

### 4. Acessar o frontend

Acessar o FrontEnd via [localhost](http://localhost:5173/)


## Funcionalidades

- Estimativa de preços para diferentes categorias de serviço (UberX, Uber Comfort, Uber Black)
- Interface intuitiva para inserção de origem e destino
- Cálculo de distância e tempo estimado
- Visualização de múltiplas estimativas

## Tecnologias Utilizadas

- Backend: NodeJS, SQLite
- Frontend: React, JavaScript
- ML: Python com scikit-learn
