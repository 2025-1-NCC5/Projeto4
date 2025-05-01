// src/BackEnd/src/server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // <<< 1. Importa o modulo path

// <<< 2. Carrega .env usando caminho absoluto relativo a este arquivo (server.js) >>>
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const routes = require('./routes');

// 3. Verifica se variaveis essenciais foram carregadas (mantido)
if (!process.env.ORS_API_KEY) { /* ... aviso ... */ }
if (!process.env.ML_SERVICE_URL) { /* ... aviso ... */ }
if (!process.env.JWT_SECRET) { /* ... aviso ... */ }

const app = express();

// Middlewares (mantidos)
app.use(cors());
app.use(express.json());

// Rotas da API (mantidas)
app.use('/api', routes);

// Tratamento 404 e 500 (mantidos)
app.use((req, res, next) => { /* ... 404 ... */ });
app.use((err, req, res, next) => { /* ... 500 ... */ });

// Iniciar servidor (mantido)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    // Logs de confirmacao (mantidos)
    console.log("ML Service URL:", process.env.ML_SERVICE_URL || "Nao definido");
    console.log("ORS API Key Loaded:", process.env.ORS_API_KEY ? 'Sim' : 'NAO');
    console.log("JWT Secret Loaded:", process.env.JWT_SECRET ? 'Sim' : 'NAO (Usando padrao?)');
});