const {Pool} = require('pg');
const pool = new Pool({
  host: 'localhost',  
  port: 5432,
  user: 'postgres',    
  password: 'root',    
  database: 'todo_app' 
});

module.exports = pool;