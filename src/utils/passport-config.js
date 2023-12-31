// Importation des stratégies de passport
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Module de hachage de mot de passe
const bcrypt = require('bcrypt');

// Connexion à la base de données
const connection = require('../db');

// Modèle d'utilisateur
const User = require('../models/userModel');

// Configuration des variables d'environnement
require('dotenv').config(); 

module.exports = function initialize(passport) {

    // Stratégie locale (connexion avec un nom d'utilisateur et un mot de passe)
    passport.use(new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
        connection.query('SELECT * FROM users WHERE mail = ?', [username], (err, result) => {
            if (err) { return done(err); }
            if (result.length === 0) { return done(null, false, { message: 'No user with that email' }); }

            const user = result[0];
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) { return done(err); }
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            });
        });
    }));

    // Stratégie Facebook
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            connection.query('SELECT * FROM users WHERE other_app_id = ?', [profile.id], (err, result) => {
                if (err) { return done(err); }
    
                if (result.length > 0) {
                    // L'utilisateur existe déjà, connectez l'utilisateur
                    return done(null, result[0]);
                } else {
                    // Créez un nouvel utilisateur
                    const newUserQuery = 'INSERT INTO users (other_app_id, other_app_label, name) VALUES (?, ?, ?)';
                    connection.query(newUserQuery, [profile.id, 'facebook', profile.displayName], (err, result) => {
                        if (err) { return done(err); }
                        const newUser = {
                            user_id: result.insertId,
                            other_app_id: profile.id
                        };
                        return done(null, newUser);
                    });
                }
            });
        } catch (err) {
            return done(err);
        }
    }));

    // Stratégie Google
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback"
    }, (accessToken, refreshToken, profile, done) => {
        try {
            connection.query('SELECT * FROM users WHERE other_app_id = ?', [profile.id], (err, result) => {
                if (err) { return done(err); }
    
                if (result.length > 0) {
                    // L'utilisateur existe déjà, connectez l'utilisateur
                    return done(null, result[0]);
                } else {
                    // Créez un nouvel utilisateur
                    const newUserQuery = 'INSERT INTO users (other_app_id, other_app_label, name) VALUES (?, ?, ?)';
                    connection.query(newUserQuery, [profile.id, 'google', profile.displayName], (err, result) => {
                        if (err) { return done(err); }
                        const newUser = {
                            user_id: result.insertId,
                            other_app_id: profile.id
                        };
                        return done(null, newUser);
                    });
                }
            });
        } catch (err) {
            return done(err);
        }
    }));

    // Sérialisation et Désérialisation des utilisateurs
    passport.serializeUser((user, done) => done(null, user.user_id));
    passport.deserializeUser((id, done) => {
        connection.query('SELECT * FROM users WHERE user_id = ?', [id], (err, result) => {
            done(err, result[0]);
        });
    });
};
