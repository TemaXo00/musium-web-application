const BaseController = require('./baseController');
const authService = require('../services/authService');

class authController extends BaseController {
    constructor(userRepository) {
        super();
        this.userRepository = userRepository;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/register', this.register.bind(this));
        this.router.post('/login', this.login.bind(this));
        this.router.post('/logout', this.logout.bind(this));
        this.router.get('/current', this.getCurrentUser.bind(this));
        this.router.delete('/account', this.deleteAccount.bind(this));
    }

    async register(req, res) {
        try {
            const { nickname, email, password, userType } = req.body;

            if (!nickname || !email || !password) {
                return this.sendError(res, 'All fields are required', 400);
            }

            const validTypes = ['User', 'Author', 'Admin'];
            const finalUserType = validTypes.includes(userType) ? userType : 'User';

            const user = await authService.register({
                nickname,
                email,
                password,
                userType: finalUserType
            });

            req.session.user = user;

            this.sendSuccess(res, user, 'Registration successful');
        } catch (error) {
            this.sendError(res, error.message, 400);
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return this.sendError(res, 'Email and password are required', 400);
            }

            const user = await authService.login({
                email,
                password
            });

            req.session.user = user;

            this.sendSuccess(res, user, 'Login successful');
        } catch (error) {
            this.sendError(res, error.message, 400);
        }
    }

    logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return this.sendError(res, 'Logout failed');
            }
            this.sendSuccess(res, null, 'Logout successful');
        });
    }

    getCurrentUser(req, res) {
        if (req.session.user) {
            this.sendSuccess(res, req.session.user);
        } else {
            this.sendSuccess(res, null);
        }
    }

    async deleteAccount(req, res) {
        try {
            if (!req.session.user) {
                return this.sendError(res, 'Authentication required', 401);
            }

            await this.userRepository.deleteUser(req.session.user.id);

            req.session.destroy((err) => {
                if (err) {
                    return this.sendError(res, 'Account deletion failed');
                }
                this.sendSuccess(res, null, 'Account deleted successfully');
            });
        } catch (error) {
            this.sendError(res, 'Failed to delete account');
        }
    }
}

module.exports = authController;