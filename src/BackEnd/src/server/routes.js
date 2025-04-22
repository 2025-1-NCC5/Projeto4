const express = require('express');
const axios = require("axios");
const { body, validationResult } = require('express-validator');
const db = require('./db');
const { hashPassword, comparePassword, generateToken } = require('./auth');

const router = express.Router();

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

// Endpoint de Simulação
router.post("/simulate", async (req, res) => {
    console.log("--- Rota /api/simulate iniciada ---"); // Log inicial
    try {
      const { origin, destination, datetime } = req.body;
      console.log("Dados recebidos:", { origin, destination, datetime }); // Log dos dados
  
      if (!origin || !destination || !datetime || !origin.lon || !origin.lat || !destination.lon || !destination.lat ) {
         console.error("Erro: Dados de entrada incompletos ou invalidos.");
         return res.status(400).json({ message: "Dados insuficientes ou invalidos (lat/lon)." });
      }
  
      // 1) Chama OpenRouteService
      // 1) Chama OpenRouteService
      let distance_m = null; // Inicializa com null
      let duration_s = null; // Inicializa com null
      try {
        console.log("Chamando API ORS...");
        console.log("API Key ORS:", process.env.ORS_API_KEY ? '*** Presente ***' : '!!! AUSENTE !!!');
        const orsResp = await axios.post(
          "https://api.openrouteservice.org/v2/directions/driving-car",
          {
            coordinates: [
              [Number(origin.lon), Number(origin.lat)],
              [Number(destination.lon), Number(destination.lat)],
            ],
          },
          {
            headers: {
              Authorization: process.env.ORS_API_KEY,
              "Content-Type": "application/json",
            },
            timeout: 10000
          }
        );

        // --- INICIO: Validacao e Extracao Corrigidas ---
        if (orsResp.data && orsResp.data.features && orsResp.data.features.length > 0) {
           const properties = orsResp.data.features[0].properties;
           if (properties && properties.summary) {
               distance_m = properties.summary.distance; // Pega a distancia
               duration_s = properties.summary.duration; // Pega a duracao

               // Verifica se os valores extraidos sao numeros validos
               if (typeof distance_m !== 'number' || typeof duration_s !== 'number') {
                   console.error("Erro: Distancia ou Duracao invalidas na resposta ORS:", properties.summary);
                   throw new Error("Valores invalidos recebidos da API ORS (dist/dur)");
               }
               console.log("Resposta ORS OK:", { distance_m, duration_s });

           } else {
               console.error("Erro: Campo 'summary' nao encontrado nas propriedades da resposta ORS:", properties);
               throw new Error("Formato de resposta inesperado da API ORS (sem summary)");
           }
        } else {
           console.error("Erro: Resposta da API ORS nao contem 'features' validas:", orsResp.data);
           throw new Error("Formato de resposta inesperado da API ORS (sem features)");
        }
        // --- FIM: Validacao e Extracao Corrigidas ---

      } catch (orsError) {
        // ... (bloco catch continua o mesmo) ...
         console.error("!!! ERRO ao chamar API ORS !!!");
         // ... (logs detalhados) ...
         return res.status(500).json({ message: "Erro ao obter dados de rota (ORS)." });
      }

      // Verifica se distance_m e duration_s foram obtidos
      if (distance_m === null || duration_s === null) {
           console.error("Erro: Nao foi possivel extrair distancia ou duracao da ORS.");
           return res.status(500).json({ message: "Falha ao obter dados de rota completos." });
      }

  
      // 2) Extrai data/hora do usuário
      console.log("Extraindo data/hora...");
      const dt = new Date(datetime);
      const hour_val = dt.getHours() + dt.getMinutes() / 60;
      const weekday_val = dt.getDay() === 0 ? 7 : dt.getDay(); // domingo=7
      const day = dt.getDate();
      const month = dt.getMonth() + 1;
      const year = dt.getFullYear();
      console.log("Data/hora extraída:", { hour_val, weekday_val, day, month, year });
  
      // 3) Monta payload para o serviço de ML
      const mlPayload = {
        hour_val,
        weekday_val,
        distance_m,
        duration_s,
        day,
        month,
        year,
      };
      console.log("Payload para ML:", mlPayload);
  
      // Verifica se alguma feature crucial é NaN ou undefined antes de enviar
      if (Object.values(mlPayload).some(val => val === undefined || val === null || (typeof val === 'number' && isNaN(val)))) {
           console.error("Erro: Payload para ML contem valores invalidos:", mlPayload);
           throw new Error("Dados invalidos para o modelo de ML");
      }
  
  
      // 4) Chama microserviço Python
      let price;
      try {
        console.log("Chamando servico Python ML em:", process.env.ML_SERVICE_URL);
        const mlResp = await axios.post(
          `${process.env.ML_SERVICE_URL}/predict`, // Usa a URL do .env
          mlPayload,
          { timeout: 15000 } // Timeout de 15 segundos
        );
        price = mlResp.data.price;
        console.log("Resposta do ML OK:", { price });
      } catch (mlError) {
         // Log detalhado do erro do ML
         console.error("!!! ERRO ao chamar servico Python ML !!!");
         if (mlError.response) {
           console.error("Status:", mlError.response.status);
           console.error("Data:", mlError.response.data);
           console.error("Headers:", mlError.response.headers);
         } else if (mlError.request) {
           console.error("Request:", mlError.request);
           console.error("Nenhuma resposta recebida do servico ML.");
         } else {
           console.error('Erro na configuração da requisição ML:', mlError.message);
         }
         console.error("Config do erro ML:", mlError.config);
         // Retorna erro 500 específico
         return res.status(500).json({ message: "Erro ao calcular preco (ML)." });
      }
  
      console.log("--- Rota /api/simulate concluida com sucesso ---");
      return res.json({ price });
  
    } catch (err) {
      // Captura erros gerais (como o de payload inválido)
      console.error("!!! ERRO GERAL na rota /api/simulate !!!");
      console.error(err.message);
      return res.status(500).json({ message: err.message || "Erro interno do servidor." });
    }
  });

// Não adicione nada abaixo sem função handler!
module.exports = router;
