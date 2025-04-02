const path = require('path');
const Database = require('better-sqlite3');

// __dirname aponta para c:\Projetos\Projeto4\src\BackEnd\src. Assim, subindo um nível para 'BackEnd' e acessando 'data'
const dbPath = path.join(__dirname, '..', 'data', 'banco.db');
const db = new Database(dbPath, { verbose: console.log });

module.exports = db;