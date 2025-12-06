const express = require('express');
const AuthMiddleware = require('../middlewares/authMiddleware');
const ControllerFactory = require('../factories/controllerFactory');

class adminRoutes {
    constructor() {
        this.router = express.Router();
        this.adminController = ControllerFactory.createAdminController();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.use(AuthMiddleware.isAdmin);

        this.router.get('/', this.adminController.renderAdminPage.bind(this.adminController));
        this.router.get('/tracks', this.adminController.getTracks.bind(this.adminController));
        this.router.get('/albums', this.adminController.getAlbums.bind(this.adminController));
        this.router.get('/eps', this.adminController.getEPs.bind(this.adminController));
        this.router.get('/users', this.adminController.getUsers.bind(this.adminController));
        this.router.post('/approve/:type/:id', this.adminController.approveEntity.bind(this.adminController));
        this.router.post('/reject/:type/:id', this.adminController.rejectEntity.bind(this.adminController));
        this.router.post('/users/search', this.adminController.searchUsers.bind(this.adminController));
        this.router.delete('/users/delete/:id', this.adminController.deleteUser.bind(this.adminController));
        this.router.post('/reports/generate', this.adminController.generateReport.bind(this.adminController));
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new adminRoutes().getRouter();