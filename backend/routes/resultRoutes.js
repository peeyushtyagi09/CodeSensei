const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');

// fetch submission by job id (jobId maps to submission._id saved by worker)
router.get('/submission/:id', async (req, res) => {
  try {
    const s = await Submission.findById(req.params.id).lean();
    if(!s) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, submission: s });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
