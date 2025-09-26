const express = require('express');
const todosRoutes = require('./routes/todosRoutes');

const app = express();

app.use(express.json());
app.use('/', todosRoutes);

module.exports = app;
