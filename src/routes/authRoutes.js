const express = require('express');
const path = require('path');
const router = express.Router();
const authController = require('../controllers/authController.js');
const passport = require('passport');

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/register.html'));
});

router.post('/register', authController.register);

router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, '../../public/html/dashboard.html'));
    } else {
        res.sendFile(path.join(__dirname, '../../public/html/login.html'));
    }
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/dashboard', authController.checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/dashboard.html'));
});

// Route pour démarrer l'authentification Facebook
router.get('/auth/facebook', passport.authenticate('facebook'));

// Route de callback après l'authentification Facebook
router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
        // Logique de succès, par exemple redirection vers le tableau de bord
        res.redirect('/dashboard');
    }
);

module.exports = router;