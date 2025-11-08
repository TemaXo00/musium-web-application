const express = require('express');
const ControllerFactory = require('../factories/controllerFactory');

class newRoutes {
    constructor() {
        this.router = express.Router();
        this.musicController = ControllerFactory.createMusicController();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/api', this.musicController.getNewContent.bind(this.musicController));
        this.router.get('/', this.musicController.renderNewPage.bind(this.musicController));
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new newRoutes().getRouter();