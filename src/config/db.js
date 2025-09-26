const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'db',      
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'root',
  database: process.env.PGDATABASE || 'todo_app'
});

module.exports = pool;
