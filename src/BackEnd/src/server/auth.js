// auth.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
require('dotenv').config();

const SALT_ROUNDS = 10;
const SECRET_KEY  = process.env.JWT_SECRET;

// 1) Gera o hash da senha
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// 2) Compara senha na hora do login
async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// 3) Gera um JWT contendo UserId e UserEmail
function generateToken(user) {
  const payload = {
    id: user.UserId, // <<< Usa UserId do banco
    email: user.UserEmail
    // Adicione outros dados se quiser (nome, tipo, etc.)
  };
  // Adiciona expiracao
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '2h' });
}

// 4) Middleware para proteger rotas
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) { // Verifica Bearer
    return res.status(401).json({ error: 'Token nao fornecido ou mal formatado' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token ausente apos Bearer' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // req.user tera { id, email, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
    }
    console.error("Erro ao verificar token:", err.message); // Log do erro real
    return res.status(401).json({ error: 'Token invalido' });
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
