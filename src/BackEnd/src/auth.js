const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SALT_ROUNDS = 10; // Número de rounds do bcrypt
const SECRET_KEY = process.env.JWT_SECRET;

// Função para criptografar senha
async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

// Função para comparar senha
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Função para gerar um token JWT
function generateToken(user) {
    return jwt.sign(
        { UserId: user.UserId, UserEmail: user.UserEmail },
        SECRET_KEY,
        { expiresIn: '1h' }
    );
}

module.exports = { hashPassword, comparePassword, generateToken };
