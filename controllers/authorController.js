const BaseController = require('./baseController');

class authorController extends BaseController {
    constructor(authorRepository) {
        super();
        this.authorRepository = authorRepository;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', this.renderAuthorPage.bind(this));
        this.router.get('/entities', this.getEntities.bind(this));
        this.router.get('/entities/:id', this.getEntityDetails.bind(this));
        this.router.get('/genres', this.getGenres.bind(this));
        this.router.post('/entities', this.createEntity.bind(this));
        this.router.put('/entities/:id', this.updateEntity.bind(this));
        this.router.delete('/entities/:id', this.deleteEntity.bind(this));
        this.router.patch('/entities/:id/restore', this.restoreEntity.bind(this));
    }

    async renderAuthorPage(req, res) {
        try {
            res.render('author', {
                title: 'Author Panel',
                user: req.session.user || null,
                currentPage: 'author'
            });
        } catch (error) {
            this.handleError(res, error, 'Failed to load author panel');
        }
    }

    async getEntities(req, res) {
        try {
            const { type, status } = req.query;
            const authorId = req.session.user.id;

            const entities = await this.authorRepository.getAuthorEntities(authorId, type, status);
            this.sendSuccess(res, entities);
        } catch (error) {
            this.sendError(res, 'Failed to get entities');
        }
    }

    async createEntity(req, res) {
        try {
            const { type, name, description, avatar_url, entity_url, genre_id, tracks } = req.body;
            const authorId = req.session.user.id;

            const result = await this.authorRepository.createMusicEntityWithDetails({
                type,
                name,
                description,
                avatar_url,
                entity_url,
                genre_id: parseInt(genre_id),
                author_id: authorId,
                tracks
            });

            this.sendSuccess(res, result, `${type} created successfully`);
        } catch (error) {
            this.sendError(res, 'Failed to create entity: ' + error.message);
        }
    }

    async updateEntity(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            await this.validateEntityOwnership(id, req.session.user.id);

            const updatedEntity = await this.authorRepository.updateMusicEntityWithTracks(id, updateData);

            this.sendSuccess(res, updatedEntity, 'Entity updated successfully and sent for review');
        } catch (error) {
            this.sendError(res, 'Failed to update entity: ' + error.message);
        }
    }

    async deleteEntity(req, res) {
        try {
            const { id } = req.params;
            await this.validateEntityOwnership(id, req.session.user.id);

            const deletedEntity = await this.authorRepository.softDeleteEntity(id);
            this.sendSuccess(res, deletedEntity, 'Entity deleted successfully');
        } catch (error) {
            this.sendError(res, 'Failed to delete entity');
        }
    }

    async restoreEntity(req, res) {
        try {
            const { id } = req.params;
            await this.validateEntityOwnership(id, req.session.user.id);

            const restoredEntity = await this.authorRepository.restoreEntity(id);
            this.sendSuccess(res, restoredEntity, 'Entity restored successfully');
        } catch (error) {
            this.sendError(res, 'Failed to restore entity');
        }
    }

    async getEntityDetails(req, res) {
        try {
            const { id } = req.params;
            await this.validateEntityOwnership(id, req.session.user.id);

            const entityDetails = await this.authorRepository.getEntityWithTracks(id);
            this.sendSuccess(res, entityDetails);
        } catch (error) {
            this.sendError(res, 'Failed to get entity details');
        }
    }

    async getGenres(req, res) {
        try {
            const genres = await this.authorRepository.getAllGenres();
            this.sendSuccess(res, genres);
        } catch (error) {
            this.sendError(res, 'Failed to get genres');
        }
    }

    async validateEntityOwnership(entityId, userId) {
        const entity = await this.authorRepository.getEntityById(entityId);
        if (!entity || entity.author_id !== userId) {
            throw new Error('Access denied');
        }
        return entity;
    }
}

module.exports = authorController;