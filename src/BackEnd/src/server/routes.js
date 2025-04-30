// routes.js
const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const db = require('./db');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('./auth');
const router = express.Router();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Cache simples para feriados (evita chamar a API repetidamente para o mesmo ano)
const holidayCache = {};

// Função auxiliar para buscar feriados
async function isHoliday(date) {
  const year = date.getFullYear();
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

  if (holidayCache[year]) {
    return holidayCache[year].has(dateString) ? 1 : 0;
  }

  const apiUrl = `https://brasilapi.com.br/api/feriados/v1/${year}`;
  try {
    const response = await axios.get(apiUrl, { timeout: 5000 });
    if (response.status === 200 && Array.isArray(response.data)) {
      const holidaySet = new Set(response.data.map(f => f.date));
      holidayCache[year] = holidaySet;
      return holidaySet.has(dateString) ? 1 : 0;
    }
  } catch (err) {
    console.error('Erro ao buscar feriados:', err.message);
  }

  return 0;
}

// Endpoint de Registro
router.post(
  '/register',
  [
    body('UserName').notEmpty(),
    body('UserEmail').isEmail(),
    body('UserCellphone').notEmpty(),
    body('UserPassword').isLength({ min: 6 }),
    body('UserFavoriteApp').isInt(),
    body('UserIs').isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg || 'Dados inválidos' });
    }

    const { UserName, UserEmail, UserCellphone, UserPassword, UserFavoriteApp, UserIs } = req.body;

    // Verifica se o e-mail já está cadastrado
    const existingUser = db.prepare('SELECT * FROM Users WHERE UserEmail = ?').get(UserEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    // Criptografa a senha
    const hashedPassword = await hashPassword(UserPassword);

    // Insere o usuário no banco
    const stmt = db.prepare(
      `INSERT INTO Users (UserName, UserEmail, UserCellphone, UserPassword, UserFavoriteApp, UserIs)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(UserName, UserEmail, UserCellphone, hashedPassword, UserFavoriteApp, UserIs);

    res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: result.lastInsertRowid });
  }
);

// Endpoint de Login
router.post(
  '/login',
  [body('UserEmail').isEmail(), body('UserPassword').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg || 'Dados inválidos' });
    }

    const { UserEmail, UserPassword } = req.body;
    const user = db.prepare('SELECT * FROM Users WHERE UserEmail = ?').get(UserEmail);

    if (!user || !(await comparePassword(UserPassword, user.UserPassword))) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // Gera e retorna o token JWT
    const token = generateToken(user);
    res.json({ message: 'Login realizado com sucesso!', token });
  }
);

// Rota protegida de teste
router.get('/protected', verifyToken, (req, res) => {
  res.json({ msg: 'Você acessou uma rota protegida!', user: req.user });
});

// Endpoint de Simulação (público)
router.post('/simulate', async (req, res) => {
  console.log('--- Rota /api/simulate iniciada ---');
  try {
    const { origin, destination, datetime } = req.body;
    if (!origin || !destination || !datetime || !origin.lon || !origin.lat || !destination.lon || !destination.lat) {
      return res.status(400).json({ message: 'Dados insuficientes ou inválidos (lat/lon).' });
    }

    // Chamada ORS
    let distance_m, duration_s;
    try {
      const orsResp = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        { coordinates: [[Number(origin.lon), Number(origin.lat)], [Number(destination.lon), Number(destination.lat)]] },
        { headers: { Authorization: process.env.ORS_API_KEY }, timeout: 10000 }
      );
      const route = orsResp.data.routes[0];
      distance_m = route.summary.distance;
      duration_s = route.summary.duration;
    } catch (orsError) {
      console.error('Erro ao chamar ORS:', orsError.message);
      return res.status(500).json({ message: 'Erro ao obter dados de rota (ORS).' });
    }

    // Cálculos de data/hora
    const dt = new Date(datetime);
    const hour_val = dt.getHours() + dt.getMinutes() / 60;
    const weekday_val = dt.getDay() === 0 ? 7 : dt.getDay();
    const day = dt.getDate();
    const month = dt.getMonth() + 1;
    const year = dt.getFullYear();
    const hour_sin = Math.sin((2 * Math.PI * hour_val) / 24);
    const hour_cos = Math.cos((2 * Math.PI * hour_val) / 24);
    const weekday_sin = Math.sin((2 * Math.PI * weekday_val) / 7);
    const weekday_cos = Math.cos((2 * Math.PI * weekday_val) / 7);
    const is_holiday = await isHoliday(dt);

    const mlPayload = {
      hour_min: hour_val,
      hour_sin,
      hour_cos,
      weekday_val,
      weekday_sin,
      weekday_cos,
      is_holiday,
      distancia_m: distance_m,
      tempo_estim_segundos: duration_s,
      day,
      month,
      year,
    };

    // Validação do payload
    if (Object.values(mlPayload).some(val => val == null || (typeof val === 'number' && isNaN(val)))) {
      throw new Error('Dados inválidos para o modelo de ML');
    }

    // Chamada ao microserviço de ML
    let price;
    try {
      const mlResp = await axios.post(
        `${process.env.ML_SERVICE_URL}/predict`,
        mlPayload,
        { timeout: 15000 }
      );
      price = mlResp.data.price;
    } catch (mlError) {
      return res.status(500).json({ message: 'Erro ao calcular preço (ML).' });
    }

    return res.json({ price });
  } catch (err) {
    console.error('Erro geral /simulate:', err.message);
    return res.status(500).json({ message: err.message || 'Erro interno do servidor.' });
  }
});

// Teste de conectividade
router.get('/ping', (_req, res) => {
  res.json({ pong: true });
});

module.exports = router;
