const express = require('express');
const RepositoryFactory = require('../factories/repositoryFactory');

class MainRoutes {
    constructor() {
        this.router = express.Router();
        this.musicRepository = RepositoryFactory.createMusicRepository();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', this.renderHomePage.bind(this));
    }

    async renderHomePage(req, res) {
        try {
            const [newSongs, newAlbums, newEPs, trending] = await Promise.all([
                this.musicRepository.getNewSongs(5),
                this.musicRepository.getNewAlbums(5),
                this.musicRepository.getNewEPs(5),
                this.musicRepository.getTrendingSongs(5)
            ]);

            res.render('main', {
                title: 'Home',
                newSongs: newSongs,
                newAlbums: newAlbums,
                newEPs: newEPs,
                trending: trending,
                user: req.session.user || null,
                formatDate: this.musicRepository.formatDate.bind(this.musicRepository)
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load home page',
                error: req.app.get('env') === 'development' ? error : {}
            });
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new MainRoutes().getRouter();