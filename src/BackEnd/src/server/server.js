const express = require('express');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config();

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
app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
