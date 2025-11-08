const express = require('express');
const bcrypt = require('bcrypt');
const RepositoryFactory = require('../factories/repositoryFactory');
const Auth = require('../middlewares/auth');

class SettingsRoutes {
    constructor() {
        this.router = express.Router();
        this.userRepository = RepositoryFactory.createUserRepository();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.use(Auth.requireAuth);

        this.router.get('/', this.renderSettingsPage.bind(this));
        this.router.put('/update-nickname', this.updateNickname.bind(this));
        this.router.put('/update-email', this.updateEmail.bind(this));
        this.router.put('/update-password', this.updatePassword.bind(this));
    }

    async renderSettingsPage(req, res) {
        try {
            const userProfile = await this.userRepository.getUserProfile(req.session.user.id);

            if (!userProfile) {
                return res.status(404).render('error', {
                    message: 'Profile not found',
                    error: {}
                });
            }

            res.render('settings', {
                title: 'Settings',
                user: req.session.user,
                profile: userProfile,
                currentPage: 'settings'
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load settings page',
                error: req.app.get('env') === 'development' ? error : {}
            });
        }
    }

    async updateNickname(req, res) {
        try {
            const { nickname } = req.body;
            const userId = req.session.user.id;

            if (!nickname || nickname.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    error: 'Nickname must be at least 3 characters long'
                });
            }

            const nicknameExists = await this.userRepository.isNicknameExists(nickname, userId);
            if (nicknameExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Nickname already exists'
                });
            }

            const updateQuery = 'UPDATE users SET nickname = $1 WHERE id = $2 RETURNING id, nickname, email, type, created_at';
            const result = await this.userRepository.query(updateQuery, [nickname, userId]);

            const updatedUser = result[0];
            req.session.user = updatedUser;

            res.json({
                success: true,
                message: 'Nickname updated successfully',
                user: updatedUser
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to update nickname'
            });
        }
    }

    async updateEmail(req, res) {
        try {
            const { email } = req.body;
            const userId = req.session.user.id;

            if (!email || !email.includes('@')) {
                return res.status(400).json({
                    success: false,
                    error: 'Please enter a valid email address'
                });
            }

            const emailExists = await this.userRepository.isEmailExists(email, userId);
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already exists'
                });
            }

            const updateQuery = 'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, nickname, email, type, created_at';
            const result = await this.userRepository.query(updateQuery, [email, userId]);

            const updatedUser = result[0];
            req.session.user = updatedUser;

            res.json({
                success: true,
                message: 'Email updated successfully',
                user: updatedUser
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to update email'
            });
        }
    }

    async updatePassword(req, res) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.session.user.id;

            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password is required'
                });
            }

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'New password must be at least 6 characters long'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'New passwords do not match'
                });
            }

            const user = await this.userRepository.getUserWithPassword(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const updateQuery = 'UPDATE users SET password_hash = $1 WHERE id = $2';
            await this.userRepository.query(updateQuery, [hashedPassword, userId]);

            res.json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to update password'
            });
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new SettingsRoutes().getRouter();