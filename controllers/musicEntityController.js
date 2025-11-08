const BaseController = require('./baseController');

class MusicEntityController extends BaseController {
    constructor(musicRepository) {
        super();
        this.musicRepository = musicRepository;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/api/:id', this.getEntityDetails.bind(this));
        this.router.post('/api/:id/view', this.incrementViews.bind(this));
        this.router.get('/:id', this.renderEntityPage.bind(this));
    }

    async renderEntityPage(req, res) {
        try {
            const entityId = req.params.id;

            const entity = await this.musicRepository.getEntityById(entityId);

            if (!entity) {
                return res.redirect('/error?message=Music entity not found&code=404');
            }

            let tracks = [];
            if (entity.type === 'Album') {
                tracks = await this.musicRepository.getAlbumTracks(entityId);
            } else if (entity.type === 'EP') {
                tracks = await this.musicRepository.getEpTracks(entityId);
            }

            await this.musicRepository.incrementViews(entityId);

            res.render('entity', {
                title: entity.name,
                entity: {
                    ...entity,
                    formatted_created_at: this.musicRepository.formatDate(entity.created_at)
                },
                tracks: tracks,
                user: req.session.user || null
            });

        } catch (error) {
            console.error('Error rendering entity page:', error);
            res.redirect('/error?message=Failed to load music entity&code=500');
        }
    }

    async getEntityDetails(req, res) {
        try {
            const entityId = req.params.id;

            const entity = await this.musicRepository.getEntityById(entityId);

            if (!entity) {
                return this.sendNotFound(res, 'Music entity not found');
            }

            let tracks = [];
            if (entity.type === 'Album') {
                tracks = await this.musicRepository.getAlbumTracks(entityId);
            } else if (entity.type === 'EP') {
                tracks = await this.musicRepository.getEpTracks(entityId);
            }

            const formattedEntity = {
                ...entity,
                formatted_created_at: this.musicRepository.formatDate(entity.created_at),
                tracks: tracks
            };

            this.sendSuccess(res, formattedEntity);

        } catch (error) {
            console.error('Error getting entity details:', error);
            this.sendError(res, 'Failed to get entity details');
        }
    }

    async incrementViews(req, res) {
        try {
            const entityId = req.params.id;
            await this.musicRepository.incrementViews(entityId);
            this.sendSuccess(res, { message: 'Views incremented' });
        } catch (error) {
            console.error('Error incrementing views:', error);
            this.sendError(res, 'Failed to increment views');
        }
    }
}

module.exports = MusicEntityController;