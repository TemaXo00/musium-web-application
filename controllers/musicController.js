const BaseController = require('./baseController');

class musicController extends BaseController {
    constructor(musicRepository) {
        super();
        this.musicRepository = musicRepository;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/new/content', this.getNewContent.bind(this));
        this.router.get('/new', this.renderNewPage.bind(this));
    }

    async getNewContent(req, res) {
        try {
            const content = await this.fetchAllNewContent();
            this.sendSuccess(res, content);
        } catch (error) {
            this.sendError(res, 'Failed to get new content');
        }
    }

    async renderNewPage(req, res) {
        try {
            const content = await this.fetchAllNewContent();

            res.render('subpages/new', {
                releases: content.releases || [],
                songs: content.songs || [],
                albums: content.albums || [],
                eps: content.eps || [],
                user: req.session.user || null,
                formatDate: this.musicRepository.formatDate.bind(this.musicRepository)
            });
        } catch (error) {
            this.handleError(res, error, 'Failed to load new releases');
        }
    }

    async fetchAllNewContent() {
        const [songs, albums, eps, releases] = await Promise.all([
            this.musicRepository.getNewSongs(6),
            this.musicRepository.getNewAlbums(6),
            this.musicRepository.getNewEPs(6),
            this.musicRepository.getNewReleases(6)
        ]);

        return {
            releases: releases,
            songs: songs,
            albums: albums,
            eps: eps
        };
    }
}

module.exports = musicController;