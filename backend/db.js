const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Aumentamos os tempos para dar folga à conexão
  connectionTimeoutMillis: 10000, // 10 segundos para conectar
  idleTimeoutMillis: 30000,       // 30 segundos antes de fechar conexão ociosa
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};