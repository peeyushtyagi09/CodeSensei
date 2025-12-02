const express = require('express');
const router = express.Router();
const { runCode, submitCode } = require('../controllers/codeController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/run', protect, runCode);
router.post('/submit', protect, submitCode);

module.exports = router;
