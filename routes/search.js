const express = require('express');
const RepositoryFactory = require('../factories/repositoryFactory');

class SearchRoutes {
    constructor() {
        this.router = express.Router();
        this.musicRepository = RepositoryFactory.createMusicRepository();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.get('/', this.renderSearchPage.bind(this));
    }

    async renderSearchPage(req, res) {
        try {
            const query = req.query.q || '';
            const type = req.query.type || 'all';
            const genre = req.query.genre || 'all';
            const sort = req.query.sort || 'relevance';

            const genres = await this.musicRepository.getAllGenres();

            let searchResults = [];

            if (query) {
                searchResults = await this.musicRepository.searchMusic(query, type, genre, sort, 20);
            }

            res.render('search', {
                title: query ? `Search: ${query}` : 'Search',
                query: query,
                results: searchResults || [],
                filters: { type, genre, sort },
                genres: genres || [],
                user: req.session.user || null,
                currentPage: 'search',
                formatDate: this.formatDate.bind(this)
            });

        } catch (error) {
            res.status(500).send('Search error: ' + error.message);
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new SearchRoutes().getRouter();