const BaseController = require('./baseController');

class adminController extends BaseController {
    constructor(musicRepository, userRepository) {
        super();
        this.musicRepository = musicRepository;
        this.userRepository = userRepository;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/', this.renderAdminPage.bind(this));
        this.router.get('/tracks', this.getTracks.bind(this));
        this.router.get('/albums', this.getAlbums.bind(this));
        this.router.get('/eps', this.getEPs.bind(this));
        this.router.get('/users', this.getUsers.bind(this));
        this.router.post('/approve/:type/:id', this.approveEntity.bind(this));
        this.router.post('/reject/:type/:id', this.rejectEntity.bind(this));
        this.router.post('/users/search', this.searchUsers.bind(this));
        this.router.delete('/users/delete/:id', this.deleteUser.bind(this));
    }

    async renderAdminPage(req, res) {
        try {
            res.render('admin', {
                title: 'Admin Panel',
                user: req.session.user || null,
                currentPage: 'admin'
            });
        } catch (error) {
            this.handleError(res, error, 'Failed to load admin panel');
        }
    }

    async getTracks(req, res) {
        try {
            const tracks = await this.musicRepository.getPendingTracks();
            this.sendSuccess(res, tracks);
        } catch (error) {
            this.sendError(res, 'Failed to get tracks');
        }
    }

    async getAlbums(req, res) {
        try {
            const albums = await this.musicRepository.getPendingAlbums();
            this.sendSuccess(res, albums);
        } catch (error) {
            this.sendError(res, 'Failed to get albums');
        }
    }

    async getEPs(req, res) {
        try {
            const eps = await this.musicRepository.getPendingEPs();
            this.sendSuccess(res, eps);
        } catch (error) {
            this.sendError(res, 'Failed to get EPs');
        }
    }

    async getUsers(req, res) {
        try {
            const users = await this.userRepository.getAllUsers();
            this.sendSuccess(res, users);
        } catch (error) {
            this.sendError(res, 'Failed to get users');
        }
    }

    async searchUsers(req, res) {
        try {
            const { nickname } = req.body;
            const users = await this.userRepository.searchByNickname(nickname);
            this.sendSuccess(res, users);
        } catch (error) {
            this.sendError(res, 'Failed to search users');
        }
    }

    async approveEntity(req, res) {
        try {
            const { type, id } = req.params;
            const result = await this.processEntityApproval(type, id);

            if (result && result.length > 0) {
                this.sendSuccess(res, null, `${type} approved successfully`);
            } else {
                this.sendNotFound(res, `${type} not found`);
            }
        } catch (error) {
            this.sendError(res, 'Failed to approve entity');
        }
    }

    async rejectEntity(req, res) {
        try {
            const { type, id } = req.params;
            const { reason } = req.body;
            const result = await this.processEntityRejection(type, id, reason);

            if (result && result.length > 0) {
                this.sendSuccess(res, null, `${type} rejected successfully`);
            } else {
                this.sendNotFound(res, `${type} not found`);
            }
        } catch (error) {
            this.sendError(res, 'Failed to reject entity: ' + error.message);
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            await this.userRepository.deleteUser(id);
            this.sendSuccess(res, null, 'User deleted successfully');
        } catch (error) {
            this.sendError(res, 'Failed to delete user');
        }
    }

    processEntityApproval(type, id) {
        return this.musicRepository.approveEntity(type, id);
    }

    processEntityRejection(type, id, reason) {
        return this.musicRepository.rejectEntity(type, id, reason);
    }
}

module.exports = adminController;