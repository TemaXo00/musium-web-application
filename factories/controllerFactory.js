const AdminController = require('../controllers/adminController');
const AuthorController = require('../controllers/authorController');
const MusicController = require('../controllers/musicController');
const AuthController = require('../controllers/authController');
const MusicEntityController = require('../controllers/musicEntityController');
const RepositoryFactory = require('./repositoryFactory');

class ControllerFactory {
    static createAdminController() {
        const repositories = RepositoryFactory.getAllRepositories();
        return new AdminController(repositories.musicRepository, repositories.userRepository);
    }

    static createAuthorController() {
        const repositories = RepositoryFactory.getAllRepositories();
        return new AuthorController(repositories.authorRepository);
    }

    static createMusicController() {
        const repositories = RepositoryFactory.getAllRepositories();
        return new MusicController(repositories.musicRepository);
    }

    static createAuthController() {
        const repositories = RepositoryFactory.getAllRepositories();
        return new AuthController(repositories.userRepository);
    }

    static createMusicEntityController() {
        const repositories = RepositoryFactory.getAllRepositories();
        return new MusicEntityController(repositories.musicRepository);
    }

    static getAllControllers() {
        return {
            adminController: this.createAdminController(),
            authorController: this.createAuthorController(),
            musicController: this.createMusicController(),
            authController: this.createAuthController(),
            musicEntityController: this.createMusicEntityController()
        };
    }

    static getControllerRoutes() {
        const controllers = this.getAllControllers();
        const routes = {};

        Object.keys(controllers).forEach(controllerName => {
            const controller = controllers[controllerName];
            routes[controllerName] = {
                router: controller.getRouter(),
                basePath: this.getBasePath(controllerName)
            };
        });

        return routes;
    }

    static getBasePath(controllerName) {
        const pathMap = {
            adminController: '/admin',
            authorController: '/author',
            musicController: '/music',
            authController: '/auth',
            musicEntityController: '/entity'
        };
        return pathMap[controllerName] || '/';
    }
}

module.exports = ControllerFactory;