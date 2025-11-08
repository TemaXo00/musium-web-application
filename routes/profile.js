const express = require('express');
const RepositoryFactory = require('../factories/repositoryFactory');
const Auth = require('../middlewares/auth');

class ProfileRoutes {
    constructor() {
        this.router = express.Router();
        this.userRepository = RepositoryFactory.createUserRepository();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.use(Auth.requireAuth);

        this.router.get('/', this.renderProfilePage.bind(this));
        this.router.get('/:id', this.renderUserProfilePage.bind(this));
        this.router.get('/api/:id', this.getUserProfileApi.bind(this));
        this.router.put('/update', this.updateProfile.bind(this));
        this.router.get('/history/:id', this.getProfileHistoryApi.bind(this));
        this.router.get('/:id/history', this.renderProfileHistoryPage.bind(this));
    }

    async renderProfilePage(req, res) {
        try {
            const userProfile = await this.userRepository.getUserProfile(req.session.user.id);

            if (!userProfile) {
                return res.status(404).render('error', {
                    message: 'Profile not found',
                    error: {}
                });
            }

            res.render('profile', {
                title: `${userProfile.nickname}`,
                user: req.session.user,
                profile: userProfile,
                currentPage: 'profile'
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load profile page',
                error: req.app.get('env') === 'development' ? error : {}
            });
        }
    }

    async renderUserProfilePage(req, res) {
        try {
            const userId = req.params.id;
            const userProfile = await this.userRepository.getUserProfile(userId);

            if (!userProfile) {
                return res.status(404).render('error', {
                    message: 'User not found',
                    error: {}
                });
            }

            res.render('profile', {
                title: `${userProfile.nickname}`,
                user: req.session.user,
                profile: userProfile,
                currentPage: 'profile'
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load profile page',
                error: req.app.get('env') === 'development' ? error : {}
            });
        }
    }

    async getUserProfileApi(req, res) {
        try {
            const userId = req.params.id;
            const userProfile = await this.userRepository.getUserProfile(userId);

            if (!userProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                data: userProfile
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to load profile'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const { gender, description, avatar_url } = req.body;
            const userId = req.session.user.id;

            await this.userRepository.updateProfileHistory(userId, {
                avatar_url: avatar_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_GrWvA5oKbxeiALyR8O5xG6zkVxgFVFQpQw&s',
                gender: gender || 'N/A',
                description: description || 'No description provided'
            });

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to update profile'
            });
        }
    }

    async getProfileHistoryApi(req, res) {
        try {
            const userId = req.params.id;
            const history = await this.userRepository.getProfileHistory(userId);

            res.json({
                success: true,
                data: history || []
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to load profile history'
            });
        }
    }

    async renderProfileHistoryPage(req, res) {
        try {
            const userId = req.params.id;
            const userProfile = await this.userRepository.getUserProfile(userId);
            const history = await this.userRepository.getProfileHistory(userId);

            if (!userProfile) {
                return res.status(404).render('error', {
                    message: 'User not found',
                    error: {}
                });
            }

            res.render('profile-history', {
                title: `${userProfile.nickname} - History`,
                user: req.session.user,
                profile: userProfile,
                history: history || [],
                formatDate: this.userRepository.formatDate.bind(this.userRepository),
                currentPage: 'profile'
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load profile history',
                error: req.app.get('env') === 'development' ? error : {}
            });
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new ProfileRoutes().getRouter();