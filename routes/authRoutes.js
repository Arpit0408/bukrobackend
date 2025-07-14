const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require("../middlewares/authMiddleware"); // Correct import

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/checkuser', protect, authController.checkUser); // Use protect

router.get('/', (req, res) => {
    res.send('Auth route working!');
});

module.exports = router;