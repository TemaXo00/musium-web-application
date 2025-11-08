const express = require('express');
const AuthMiddleware = require('../middlewares/authMiddleware');
const ControllerFactory = require('../factories/controllerFactory');

class authorRoutes {
    constructor() {
        this.router = express.Router();
        this.authorController = ControllerFactory.createAuthorController();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.use(AuthMiddleware.isAuthor);

        this.router.get('/', this.authorController.renderAuthorPage.bind(this.authorController));
        this.router.get('/entities', this.authorController.getEntities.bind(this.authorController));
        this.router.get('/genres', this.authorController.getGenres.bind(this.authorController));
        this.router.get('/entity/:id', this.authorController.getEntityDetails.bind(this.authorController));
        this.router.post('/entity', this.authorController.createEntity.bind(this.authorController));
        this.router.put('/entity/:id', this.authorController.updateEntity.bind(this.authorController));
        this.router.delete('/entity/:id', this.authorController.deleteEntity.bind(this.authorController));
        this.router.patch('/entity/:id/restore', this.authorController.restoreEntity.bind(this.authorController));
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new authorRoutes().getRouter();