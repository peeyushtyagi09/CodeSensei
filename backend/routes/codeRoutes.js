// routes/codeRoutes.js
const express = require('express');
const router = express.Router();
const { runCode, submitCode } = require('../controllers/codeController');
const { protect } = require('../middlewares/authMiddleware'); // optional: require auth

// Run code quick test (single run with provided stdin)
router.post('/run', protect, runCode);

// Submit code against question testcases
router.post('/submit', protect, submitCode);

module.exports = router;
