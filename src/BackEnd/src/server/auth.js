const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SALT_ROUNDS = 10;
const SECRET_KEY = process.env.JWT_SECRET
