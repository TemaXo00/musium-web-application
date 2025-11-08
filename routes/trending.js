const express = require('express');
const RepositoryFactory = require('../factories/repositoryFactory');

class TrendingRoutes {
    constructor() {
        this.router = express.Router();
        this.musicRepository = RepositoryFactory.createMusicRepository();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', this.renderTrendingPage.bind(this));
    }

    async renderTrendingPage(req, res) {
        try {
            const [songs, albums, eps] = await Promise.all([
                this.musicRepository.getTrendingSongs(10),
                this.musicRepository.getTrendingAlbums(10),
                this.musicRepository.getTrendingEPs(10)
            ]);

            res.render('subpages/trending', {
                title: 'Trending',
                songs: songs,
                albums: albums,
                eps: eps,
                user: req.session.user || null,
                formatDate: this.musicRepository.formatDate.bind(this.musicRepository)
            });
        } catch (error) {
            res.status(500).send('Failed to load trending content');
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new TrendingRoutes().getRouter();