const express = require("express");
const router = express.Router();
const { generateTestcases } = require("../controllers/testcaseController");

router.post('/generate/:questionId', generateTestcases);

module.exports = router;

