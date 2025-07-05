const express = require('express');
const router = express.Router();
const formController = require('../controllers/form.controller');

router.get('/questions', formController.getQuestions);
router.post('/answers', formController.submitAnswers);

module.exports = router;
