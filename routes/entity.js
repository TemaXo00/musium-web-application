const express = require('express');
const ControllerFactory = require('../factories/controllerFactory');

class EntityRoutes {
    constructor() {
        this.router = express.Router();
        this.musicEntityController = ControllerFactory.createMusicEntityController();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/api/:id', this.musicEntityController.getEntityDetails.bind(this.musicEntityController));
        this.router.post('/api/:id/view', this.musicEntityController.incrementViews.bind(this.musicEntityController));
        this.router.get('/:id', this.musicEntityController.renderEntityPage.bind(this.musicEntityController));
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new EntityRoutes().getRouter();