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
    id:    user.UserId,
    email: user.UserEmail
  };
  // opcional: você pode incluir aqui outras propriedades no payload
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '2h' });
}

// 4) Middleware para proteger rotas
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // { id, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
