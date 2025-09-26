const express = require('express');
const router = express.Router();
const todosController = require('../controllers/todosController');

router.get('/setup', todosController.setup);
router.get('/todos', todosController.getTodos);
router.get('/todos/:id', todosController.getTodoById);
router.post('/todos', todosController.createTodo);
router.put('/todos/:id', todosController.updateTodo);
router.delete('/todos/:id', todosController.deleteTodo);

module.exports = router;
