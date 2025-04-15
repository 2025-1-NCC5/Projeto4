const express = require('express');
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

// Não adicione nada abaixo sem função handler!
module.exports = router;
