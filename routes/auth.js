const express = require('express');
const ControllerFactory = require('../factories/controllerFactory');

class authRoutes {
    constructor() {
        this.router = express.Router();
        this.authController = ControllerFactory.createAuthController();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.post('/register', this.authController.register.bind(this.authController));
        this.router.post('/login', this.authController.login.bind(this.authController));
        this.router.post('/logout', this.authController.logout.bind(this.authController));
        this.router.get('/me', this.authController.getCurrentUser.bind(this.authController));
        this.router.delete('/delete-account', this.authController.deleteAccount.bind(this.authController));

        this.router.get('/login', this.renderLoginPage.bind(this));
        this.router.get('/register', this.renderRegisterPage.bind(this));
    }

    renderLoginPage(req, res) {
        res.render('auth/login', {
            title: 'Login',
            user: req.session.user || null
        });
    }

    renderRegisterPage(req, res) {
        res.render('auth/register', {
            title: 'Register',
            user: req.session.user || null
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new authRoutes().getRouter();