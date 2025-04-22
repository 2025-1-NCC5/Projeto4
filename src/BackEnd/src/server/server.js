const express = require('express');
const cors = require('cors');
const routes = require('./routes');
// const path = require('path'); // Importa o módulo 'path' do Node.js

// Carrega as variáveis de ambiente do arquivo .env localizado NA MESMA PASTA que server.js
// require('dotenv').config({ path: path.resolve(__dirname, './.env') });
// OU, mais simples se o CWD for sempre o esperado (geralmente funciona):
require('dotenv').config({ path: 'C:/Projetos/Projeto4/src/BackEnd/src/server/.env' });

// Opcional: Verifica se auth.js foi carregado corretamente
try {
  require('./auth');
} catch (err) {
  console.error("Erro ao carregar auth.js:", err);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', routes); // As rotas definidas em routes.js serão montadas aqui

const PORT = process.env.PORT || 3000; // Usa a porta do .env ou 3000 como padrão
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    // Log para confirmar que as variáveis foram carregadas (OPCIONAL - remova em produção)
    console.log("ML Service URL:", process.env.ML_SERVICE_URL);
    console.log("ORS API Key Loaded:", process.env.ORS_API_KEY ? 'Sim' : 'NAO');
});