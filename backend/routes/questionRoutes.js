const express = require("express");
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    createQuestion,
    getRandomQuestions,
    getQuestionsByTopic,
    getQuestionBydifficulty,    
    getQuestionById,
} = require('../controllers/questionController')

const { createAIQuestion } = require('../controllers/aiQuestionController');

router.post('/ai-create', protect, createAIQuestion); 

router.post('/create', protect, createQuestion);

router.get("/random", getRandomQuestions);

router.get("/topic/:topic", getQuestionsByTopic);

router.get("/difficulty/:level", getQuestionBydifficulty);

router.get("/:id", getQuestionById);

module.exports = router;