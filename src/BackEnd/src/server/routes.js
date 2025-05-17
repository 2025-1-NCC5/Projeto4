// src/BackEnd/src/server/routes.js
const express = require('express');
const axios = require('axios'); // Para chamadas HTTP (ORS, ML Service, BrasilAPI)
const { body, validationResult } = require('express-validator'); // Para validar corpo da requisicao
const db = require('./db'); // Sua conexao com banco de dados (better-sqlite3)
const {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken // Middleware de verificacao JWT
} = require('./auth'); // Suas funcoes de autenticacao

const router = express.Router(); // Cria um roteador do Express

// --- Cache e Funcao Auxiliar para Feriados ---
const holidayCache = {}; // Cache simples em memoria

async function isHoliday(date) {
  const year = date.getFullYear();
  // Formata a data como YYYY-MM-DD
  const dateString = date.toISOString().split('T')[0];

  // 1. Verifica o cache
  if (holidayCache[year]) {
    // console.log(`DEBUG: Usando feriados do cache para ${year}`);
    return holidayCache[year].has(dateString) ? 1 : 0;
  }

  // 2. Se nao esta no cache, busca na BrasilAPI
  const apiUrl = `https://brasilapi.com.br/api/feriados/v1/${year}`;
  console.log(`INFO: Buscando feriados na BrasilAPI para ${year}...`);
  try {
    const response = await axios.get(apiUrl, { timeout: 5000 }); // Timeout de 5 segundos
    if (response.status === 200 && Array.isArray(response.data)) {
      // Cria um Set das datas para busca rapida O(1)
      const holidaySet = new Set(response.data.map(feriado => feriado.date));
      // Armazena no cache para futuras requisicoes do mesmo ano
      holidayCache[year] = holidaySet;
      console.log(`INFO: Feriados para ${year} carregados e cacheados.`);
      return holidaySet.has(dateString) ? 1 : 0; // Retorna 1 se for feriado, 0 se nao
    } else {
      // Loga erro se a API nao retornar 200 ou formato inesperado
      console.error(`WARN: Erro ao buscar feriados (${response.status}): Formato de resposta inesperado.`);
      return 0; // Assume que nao e feriado em caso de erro da API
    }
  } catch (error) {
    // Loga erro se houver problema de rede/timeout
    console.error(`WARN: Erro de rede ao conectar com BrasilAPI para feriados: ${error.message}`);
    return 0; // Assume que nao e feriado em caso de erro de rede
  }
}
// --------------------------------------------

// --- Endpoint de Registro ---
router.post(
  '/register',
  [ // Validacoes de entrada usando express-validator
    body('UserName', 'Nome de usuario é obrigatório').notEmpty().trim().escape(),
    body('UserEmail', 'Email inválido').isEmail().normalizeEmail(),
    body('UserCellphone', 'Celular é obrigatório').notEmpty().trim().escape(),
    body('UserPassword', 'Senha deve ter pelo menos 6 caracteres').isLength({ min: 6 }),
    body('UserFavoriteApp', 'App favorito inválido').isInt({ min: 1 }), // Assume IDs positivos
    body('UserIs', 'Tipo de usuário inválido').isInt({ min: 1, max: 3 }) // Assume 1, 2, 3
  ],
  async (req, res) => {
    console.log("INFO: Recebida requisicao POST /api/register");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("WARN: Falha na validacao do registro:", errors.array({ onlyFirstError: true })[0].msg);
      // Retorna a primeira mensagem de erro
      return res.status(400).json({ error: errors.array({ onlyFirstError: true })[0].msg });
    }

    const { UserName, UserEmail, UserCellphone, UserPassword, UserFavoriteApp, UserIs } = req.body;

    try {
        // Verifica email existente
        const existingUser = db.prepare('SELECT UserId FROM Users WHERE UserEmail = ?').get(UserEmail); // Usa UserId
        if (existingUser) {
          console.warn(`WARN: Tentativa de registro com email ja existente: ${UserEmail}`);
          return res.status(400).json({ error: 'E-mail já cadastrado' });
        }

        // Hash da senha
        const hashedPassword = await hashPassword(UserPassword);
        console.log(`INFO: Senha hashada para ${UserEmail}`);

        // Insercao no banco
        const stmt = db.prepare(
          `INSERT INTO Users (UserName, UserEmail, UserCellphone, UserPassword, UserFavoriteApp, UserIs)
           VALUES (?, ?, ?, ?, ?, ?)`
        );
        stmt.run(UserName, UserEmail, UserCellphone, hashedPassword, UserFavoriteApp, UserIs);
        console.log(`INFO: Usuario ${UserEmail} registrado com sucesso.`);

        // Nao retorna o ID aqui por seguranca, apenas sucesso
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });

    } catch (dbError) {
         console.error("ERRO: Erro no banco de dados ao registrar:", dbError);
         res.status(500).json({ error: "Erro interno ao registrar usuario." });
    }
  }
);

// --- Endpoint de Login ---
router.post(
  '/login',
  [ // Validacoes basicas
    body('UserEmail', 'Email inválido').isEmail().normalizeEmail(),
    body('UserPassword', 'Senha é obrigatória').notEmpty()
  ],
  async (req, res) => {
    console.log("INFO: Recebida requisicao POST /api/login");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("WARN: Falha na validacao do login:", errors.array({ onlyFirstError: true })[0].msg);
      return res.status(400).json({ error: errors.array({ onlyFirstError: true })[0].msg });
    }

    const { UserEmail, UserPassword } = req.body;

    try {
        // Busca usuario pelo email
        const user = db.prepare('SELECT * FROM Users WHERE UserEmail = ?').get(UserEmail);

        // Verifica usuario e compara senha hasheada
        if (!user || !(await comparePassword(UserPassword, user.UserPassword))) {
          console.warn(`WARN: Tentativa de login falhou para ${UserEmail}`);
          // Mensagem generica para nao indicar qual campo esta errado
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gera e retorna o token JWT
        const token = generateToken(user); // Passa o objeto user (que tem UserId)
        console.log(`INFO: Login bem-sucedido para ${UserEmail}. Token gerado.`);
        res.json({ message: 'Login realizado com sucesso!', token: token }); // Envia o token

    } catch (dbError) {
        console.error("ERRO: Erro no banco de dados ao logar:", dbError);
        res.status(500).json({ error: "Erro interno ao realizar login." });
    }
  }
);

// --- Rota Protegida de Exemplo ---
// O middleware 'verifyToken' sera executado antes da funcao handler da rota
router.get('/user-profile', verifyToken, (req, res) => {
  // Se chegou aqui, o token e valido e verifyToken adicionou req.user
  const userIdFromToken = req.user.id; // Pega o ID do payload do token
  console.log(`INFO: Acessando rota protegida /user-profile para UserId: ${userIdFromToken}`);

  try {
      // Busca os dados do usuario no banco (sem a senha)
      const userProfile = db.prepare(
          'SELECT UserId, UserName, UserEmail, UserCellphone, UserFavoriteApp, UserIs FROM Users WHERE UserId = ?'
      ).get(userIdFromToken); // Busca pelo ID do token

      if (!userProfile) {
          // Isso nao deveria acontecer se o token e valido, mas e uma verificacao de seguranca
          console.error(`ERRO: Usuario com ID ${userIdFromToken} (do token) nao encontrado no banco.`);
          return res.status(404).json({ error: 'Usuario nao encontrado' });
      }
      res.json(userProfile); // Retorna os dados do perfil
  } catch(dbError) {
      console.error("ERRO: Erro no banco de dados ao buscar perfil:", dbError);
      res.status(500).json({ error: "Erro ao buscar dados do usuario." });
  }
});


// --- Endpoint de Simulação (Publico ou Protegido) ---
// Para proteger, descomente verifyToken:
// router.post('/simulate', verifyToken, async (req, res) => {
router.post('/simulate', async (req, res) => {
  console.log("--- Rota /api/simulate iniciada ---");
  try {
    const { origin, destination } = req.body;
    // ... (validação de origin/destination como antes) ...

    let distance_m = null;
    let duration_s = null;
    let route_geometry = null; // Para armazenar as coordenadas da rota

    try {
      console.log("INFO: Chamando API ORS (com solicitação de geometria)...");
      const orsApiKey = process.env.ORS_API_KEY;
      if (!orsApiKey) throw new Error("Chave da API ORS não configurada.");

      const orsPayload = {
        coordinates: [[Number(origin.lon), Number(origin.lat)], [Number(destination.lon), Number(destination.lat)]],
        // Adicionar para obter a geometria em formato GeoJSON, que é mais fácil de usar
        // Se não funcionar, ORS retorna 'geometry' como uma string polyline codificada
        // e precisaremos decodificá-la (geralmente no frontend).
        // A API v2 do ORS geralmente retorna a geometria por padrão.
        // Vamos verificar a estrutura da resposta.
        // format: "geojson" // Descomente se precisar especificar formato de resposta global
        // A geometria da rota geralmente está em routes[0].geometry (string polyline)
        // ou em routes[0].feature.geometry.coordinates (se a resposta for GeoJSON)
      };

      const orsResp = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        orsPayload,
        { headers: { Authorization: orsApiKey }, timeout: 15000 }
      );

      if (orsResp.data?.routes?.[0]) {
        const route = orsResp.data.routes[0];
        if (route.summary) {
          distance_m = route.summary.distance;
          duration_s = route.summary.duration;
        } else {
          throw new Error("Sumário da rota não encontrado na resposta ORS.");
        }

        // A geometria da rota é uma string Polyline codificada
        // Ex: "o~ciFz{fg@fHz@..."
        // Precisaremos de uma biblioteca no frontend para decodificá-la para [lat, lon]
        if (route.geometry) {
          route_geometry = route.geometry; // Esta é a string Polyline
          console.log("INFO: Geometria da rota (polyline) obtida da ORS.");
        } else {
          console.warn("AVISO: Geometria da rota não encontrada na resposta ORS.");
        }
        
        if (typeof distance_m !== 'number' || typeof duration_s !== 'number') {
          throw new Error("Valores inválidos (distância/duração) da API ORS.");
        }
        console.log("INFO: Resposta ORS OK:", { distance_m, duration_s, geometry_present: !!route_geometry });
      } else {
        throw new Error("Resposta inesperada ou sem rota da API ORS.");
      }
    } catch (orsError) {
      // ... (seu tratamento de erro ORS como antes) ...
      console.error("!!! ERRO API ORS !!!");
      const orsErrorMessage = orsError.response?.data?.error?.message || orsError.response?.data?.message || orsError.message;
      console.error(" Detalhe ORS:", orsError.response ? JSON.stringify(orsError.response.data) : orsErrorMessage);
      return res.status(500).json({ message: `Erro ao obter dados de rota (ORS): ${orsErrorMessage}` });
    }

    // ... (cálculo do mlPayload e chamada ao Python como antes) ...
    const mlPayload = {
      distancia_m: distance_m,
      tempo_estim_segundos: duration_s
    };
    // ... (chamada ao Python ML) ...
    let predictedPrices;
    // ... (lógica para obter predictedPrices) ...
    // Simulação da resposta do ML para este exemplo
     const mlServiceUrl = process.env.ML_SERVICE_URL; 
     if (!mlServiceUrl) throw new Error("URL do serviço de ML não configurada.");
     try {
       const mlResp = await axios.post(`${mlServiceUrl}/predict`, mlPayload, { timeout: 30000 });
       if (mlResp.data && typeof mlResp.data === 'object' && Object.keys(mlResp.data).length > 0) {
         predictedPrices = mlResp.data;
       } else {
         throw new Error("Resposta de preços inválida do modelo ML.");
       }
     } catch (mlError) {
       const mlErrorMessage = mlError.response?.data?.detail || mlError.response?.data?.message || mlError.message;
       return res.status(500).json({ message: `Erro ao calcular preços (ML): ${mlErrorMessage}` });
     }


    // Formatar distância e duração
    const distancia_km = Math.round((distance_m / 1000) * 10) / 10;
    let duracao_str = '';
    const minutos = Math.round(duration_s / 60);
    if (minutos < 60) { duracao_str = `${minutos} min`; }
    else { const h = Math.floor(minutos / 60); const m = minutos % 60; duracao_str = `${h}h${m.toString().padStart(2, '0')}`; }

    console.log("--- Rota /api/simulate concluida com sucesso ---");
    return res.json({ 
        prices: predictedPrices, 
        distancia_km, 
        duracao_str,
        route_geometry: route_geometry // Adiciona a string polyline da geometria à resposta
    });

  } catch (err) {
    // ... (seu tratamento de erro geral como antes) ...
    console.error("!!! ERRO GERAL /api/simulate:", err.stack || err.message);
    return res.status(500).json({ message: err.message || 'Erro interno do servidor ao simular rota.' });
  }
});

// Rota Ping (para teste de conectividade basica)
router.get('/ping', (_req, res) => {
  res.json({ pong: true });
});

module.exports = router; // Exporta o roteador configurado