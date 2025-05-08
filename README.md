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

### Configurar e rodar FrontEnd

```sh
cd src/FrontEnd
npm install
npm run dev
```

### Configurar e rodar Servidor

```sh
cd src/BackEnd
npm install
npm run dev
```

### Configurar e rodar modelo de IA

```sh
cd src/BackEnd/src/python
pip install fastapi uvicorn pydantic numpy scikit-learn
python -m uvicorn main:app --reload
```

---

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
