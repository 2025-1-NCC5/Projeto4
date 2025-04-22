const express = require('express');
const axios = require("axios"); // Ja deve estar importado
const { body, validationResult } = require('express-validator');
const db = require('./db');
const { hashPassword, comparePassword, generateToken } = require('./auth');
const router = express.Router();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Cache simples para feriados (evita chamar a API repetidamente para o mesmo ano)
const holidayCache = {}

// Funcao auxiliar assincrona para buscar feriados
async function isHoliday(date) {
    const year = date.getFullYear();
    const dateString = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
    // Verifica o cache primeiro
    if (holidayCache[year]) {
      // console.log(`Usando feriados do cache para ${year}`); // Log de debug
      return holidayCache[year].has(dateString) ? 1 : 0;
    }

    // Se nao esta no cache, busca na API
  const apiUrl = `https://brasilapi.com.br/api/feriados/v1/${year}`;
  console.log(`Buscando feriados na BrasilAPI para ${year}...`);
  try {
    const response = await axios.get(apiUrl, { timeout: 5000 }); // Timeout de 5s
    if (response.status === 200 && Array.isArray(response.data)) {
      // Armazena as datas no cache como um Set para busca rapida
      const holidaySet = new Set(response.data.map(feriado => feriado.date));
      holidayCache[year] = holidaySet;
      console.log(`Feriados para ${year} carregados e cacheados.`);
      return holidaySet.has(dateString) ? 1 : 0;
    } else {
      console.error(`Erro ao buscar feriados (${response.status}): ${response.data}`);
      return 0; // Assume que nao e feriado em caso de erro da API
    }
  } catch (error) {
    console.error(`Erro de rede ao conectar com BrasilAPI para feriados: ${error.message}`);
    return 0; // Assume que nao e feriado em caso de erro de rede
  }
}

// Endpoint de Registro
router.post('/register', [
    body('UserName').notEmpty(),
    body('UserEmail').isEmail(),
    body('UserCellphone').notEmpty(),
    body('UserPassword').isLength({ min: 6 }),
    body('UserFavoriteApp').isInt(),
    body('UserIs').isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0]?.msg || "Dados inválidos" });
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
    const stmt = db.prepare('INSERT INTO Users (UserName, UserEmail, UserCellphone, UserPassword, UserFavoriteApp, UserIs) VALUES (?, ?, ?, ?, ?, ?)');
    const result = stmt.run(UserName, UserEmail, UserCellphone, hashedPassword, UserFavoriteApp, UserIs);

    res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: result.lastInsertRowid });
});

// Endpoint de Login
router.post('/login', [
    body('UserEmail').isEmail(),
    body('UserPassword').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0]?.msg || "Dados inválidos" });
    }

    const { UserEmail, UserPassword } = req.body;

    // Busca o usuário no banco
    const user = db.prepare('SELECT * FROM Users WHERE UserEmail = ?').get(UserEmail);
    if (!user) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // Verifica a senha
    const isValidPassword = await comparePassword(UserPassword, user.UserPassword);
    if (!isValidPassword) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // Gera o token JWT (opcional)
    // const token = generateToken(user);

    res.json({ message: 'Login realizado com sucesso!' });
});

// POST /api/simulate
// POST /api/simulate
router.post("/simulate", async (req, res) => { // A rota ja e async
    console.log("--- Rota /api/simulate iniciada ---");
    try {
      const { origin, destination, datetime } = req.body;
      console.log("Dados recebidos:", { origin, destination, datetime });
  
      if (!origin || !destination || !datetime || !origin.lon || !origin.lat || !destination.lon || !destination.lat ) {
          console.error("Erro: Dados de entrada incompletos ou invalidos.");
          return res.status(400).json({ message: "Dados insuficientes ou invalidos (lat/lon)." });
      }
  
              // 1) Chama OpenRouteService
              let distance_m = null; // Inicializa com null
              let duration_s = null; // Inicializa com null
              try {
                console.log("Chamando API ORS...");
                console.log("API Key ORS:", process.env.ORS_API_KEY ? '*** Presente ***' : '!!! AUSENTE !!!');
      
                // --- INICIO: Chamada Axios RESTAURADA ---
                const orsResp = await axios.post(
                  "https://api.openrouteservice.org/v2/directions/driving-car", // URL da API ORS
                  { // Corpo da requisicao (payload)
                    coordinates: [
                      [Number(origin.lon), Number(origin.lat)],
                      [Number(destination.lon), Number(destination.lat)],
                    ],
                  },
                  { // Configuracoes da requisicao (headers, timeout)
                    headers: {
                      Authorization: process.env.ORS_API_KEY, // Pega a chave do .env
                      "Content-Type": "application/json",
                    },
                    timeout: 10000 // Timeout de 10 segundos
                  }
                );
                // --- FIM: Chamada Axios RESTAURADA ---
      
                // Validacao e Extracao (como estava antes, usando a estrutura correta)
                if (orsResp.data && orsResp.data.routes && orsResp.data.routes.length > 0) {
                   const route = orsResp.data.routes[0];
                   if (route && route.summary) {
                       distance_m = route.summary.distance;
                       duration_s = route.summary.duration;
                       if (typeof distance_m !== 'number' || typeof duration_s !== 'number') {
                           console.error("Erro: Distancia ou Duracao invalidas na resposta ORS:", route.summary);
                           throw new Error("Valores invalidos recebidos da API ORS (dist/dur)");
                       }
                       console.log("Resposta ORS OK:", { distance_m, duration_s });
                   } else {
                       console.error("Erro: Campo 'summary' nao encontrado na primeira rota da resposta ORS:", route);
                       throw new Error("Formato de resposta inesperado da API ORS (sem summary na rota)");
                   }
                } else {
                   console.error("Erro: Resposta da API ORS nao contem 'routes' validas:", orsResp.data);
                   throw new Error("Formato de resposta inesperado da API ORS (sem routes)");
                }
      
              } catch (orsError) {
                 console.error("!!! ERRO ao chamar API ORS !!!");
                 // Log detalhado do erro
                 if (orsError.response) {
                   console.error("Status:", orsError.response.status);
                   console.error("Data:", orsError.response.data);
                   // console.error("Headers:", orsError.response.headers); // Descomente se precisar dos headers
                 } else if (orsError.request) {
                   console.error("Nenhuma resposta recebida da API ORS.");
                   // console.error("Request:", orsError.request); // Descomente se precisar ver a requisicao
                 } else {
                   console.error('Erro na configuração da requisicao ORS:', orsError.message);
                 }
                 // console.error("Config do erro ORS:", orsError.config); // Descomente se precisar ver a config
                 return res.status(500).json({ message: "Erro ao obter dados de rota (ORS)." });
              }
      
              // Verifica se distance_m e duration_s foram obtidos (mantido)
              if (distance_m === null || duration_s === null) {
                   console.error("Erro: Nao foi possivel extrair distancia ou duracao da ORS.");
                   return res.status(500).json({ message: "Falha ao obter dados de rota completos." });
              }
  
  
      // 2) Extrai data/hora e CALCULA FEATURES DERIVADAS
      console.log("Extraindo e calculando features de data/hora...");
      const dt = new Date(datetime); // Objeto Date
      const hour_val = dt.getHours() + dt.getMinutes() / 60.0;
      const weekday_val = dt.getDay() === 0 ? 7 : dt.getDay();
      const day = dt.getDate();
      const month = dt.getMonth() + 1;
      const year = dt.getFullYear();
  
      // Calcula features ciclicas
      const hour_min = hour_val;
      const hour_sin = Math.sin(2 * Math.PI * hour_min / 24);
      const hour_cos = Math.cos(2 * Math.PI * hour_min / 24);
      const weekday_sin = Math.sin(2 * Math.PI * weekday_val / 7);
      const weekday_cos = Math.cos(2 * Math.PI * weekday_val / 7);
  
      // --- INICIO: Calcula feriado usando BrasilAPI ---
      const is_holiday = await isHoliday(dt); // Chama a funcao auxiliar async
      console.log(`Verificando feriado para ${dt.toISOString().split('T')[0]}: ${is_holiday === 1 ? 'Sim' : 'Nao'}`);
      // --- FIM: Calcula feriado usando BrasilAPI ---
  
      console.log("Data/hora/derivadas extraídas:", { hour_val, weekday_val, day, month, year, hour_sin, hour_cos, weekday_sin, weekday_cos, is_holiday });
  
// 3) Monta payload COMPLETO para o serviço de ML
    // --- GARANTA QUE ESTE BLOCO ESTÁ PRESENTE E CORRETO ---
    const mlPayload = {
        hour_min: hour_val,           // Alias ou valor de hour_val
        hour_sin: hour_sin,
        hour_cos: hour_cos,
        weekday_val: weekday_val,     // Valor original 1-7
        weekday_sin: weekday_sin,
        weekday_cos: weekday_cos,
        is_holiday: is_holiday,
        distancia_m: distance_m,        // Usar o nome exato da coluna do treino
        tempo_estim_segundos: duration_s, // Usar o nome exato da coluna do treino
        day: day,
        month: month,
        year: year
      };
      // --- FIM DO BLOCO DE MONTAGEM ---
      console.log("Payload COMPLETO para ML:", mlPayload); // Agora deve mostrar os valores
  
      // Verifica payload (mantido)
      if (Object.values(mlPayload).some(val => val === undefined || val === null || (typeof val === 'number' && isNaN(val)))) {
          console.error("Erro: Payload para ML contem valores invalidos:", mlPayload);
          throw new Error("Dados invalidos para o modelo de ML");
      }
  
      // 4) Chama microserviço Python (mantido)
      let price;
      try {
          console.log("Chamando servico Python ML em:", process.env.ML_SERVICE_URL);
          const mlResp = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, mlPayload, { timeout: 15000 });
          price = mlResp.data.price;
          if (typeof price !== 'number' || isNaN(price)) { throw new Error("Preco invalido retornado pelo modelo"); }
          console.log("Resposta do ML OK:", { price });
      } catch (mlError) { /* ... bloco catch ML ... */ return res.status(500).json({ message: "Erro ao calcular preco (ML)." }); }
  
      console.log("--- Rota /api/simulate concluida com sucesso ---");
      return res.json({ price });
  
    } catch (err) {
      console.error("!!! ERRO GERAL na rota /api/simulate !!!");
      console.error(err.message || err);
      return res.status(500).json({ message: err.message || "Erro interno do servidor." });
    }
  });

// Não adicione nada abaixo sem função handler!
module.exports = router;
