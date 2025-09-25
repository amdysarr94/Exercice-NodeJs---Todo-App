const express = require('express');
const pool = require('./db');
const redis = require('redis');
const port = 5000;

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});
const app = express(); 
app.use(express.json());

(async () => {
  redisClient.on('error', (err) => {
    console.error("Erreur client redis", err);
  });
  redisClient.on('ready', () => {
    console.log('Client redis démarré');
  });
  await redisClient.connect();
  await redisClient.ping();
})();


app.get('/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status BOOLEAN DEFAULT false
      )
    `);
    res.status(200).send({ message: "Table créée avec succès" });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// Lire tous les todos (avec cache Redis)
app.get('/todos', async (req, res) => {
  try {
    const cacheData = await redisClient.get('todos');
    if (cacheData) {
      console.log('Données servies depuis le cache Redis');
      return res.status(200).json(JSON.parse(cacheData));
    }

    const result = await pool.query('SELECT * FROM todos ORDER BY id ASC');
    await redisClient.set('todos', JSON.stringify(result.rows), { EX: 60 }); 
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


app.get('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const cacheData = await redisClient.get(`todo:${id}`);
    if (cacheData) {
      console.log(`Todo ${id} servi depuis le cache Redis`);
      return res.status(200).json(JSON.parse(cacheData));
    }

    const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Todo introuvable" });
    }

    await redisClient.set(`todo:${id}`, JSON.stringify(result.rows[0]), { EX: 60 });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


app.post('/todos', async (req, res) => {
  const { name, status } = req.body;
  try {
    await pool.query('INSERT INTO todos (name, status) VALUES ($1, $2)', [name, status ?? false]);
    await redisClient.del('todos'); // on supprime le cache liste
    res.status(201).json({ message: "Todo ajouté avec succès" });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE todos SET name = $1, status = $2 WHERE id = $3 RETURNING *',
      [name, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Todo introuvable" });
    }

    await redisClient.del('todos');
    await redisClient.del(`todo:${id}`);
    res.status(200).json({ message: "Todo mis à jour", todo: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Todo introuvable" });
    }

    await redisClient.del('todos');
    await redisClient.del(`todo:${id}`);
    res.status(200).json({ message: "Todo supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.listen(port, '0.0.0.0', () => console.log(`Serveur lancé sur http://localhost:${port}`));
