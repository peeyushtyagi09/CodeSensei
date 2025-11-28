const express = require("express");
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
    getProfile,
    updateProfile,
    updatePreferences,
    updateAvatar
} = require("../controllers/ProfileController")

// Public
router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);

// Protected
router.get('/me', protect, authController.getMe);
router.put('/update-password', protect, authController.updatePassword);

// Profile
router.get("/profile", protect, getProfile);
router.put("/update-profile", protect, updateProfile);
router.put("/update-preferences", protect, updatePreferences);
router.put("/update-avatar", protect, updateAvatar);

module.exports = router;