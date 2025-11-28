const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const RepositoryFactory = require('./factories/repositoryFactory');

class Application {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.set('view engine', 'ejs');

        this.app.use(logger('dev'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());
        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
            resave: true,
            saveUninitialized: false,
            cookie: {
                secure: false,
                maxAge: 30 * 24 * 60 * 60 * 1000
            }
        }));

        this.app.use(this.userSessionMiddleware.bind(this));
    }

    async userSessionMiddleware(req, res, next) {
        if (req.session.user && req.session.user.id) {
            try {
                const userRepository = RepositoryFactory.createUserRepository();
                const user = await userRepository.findById(req.session.user.id);
                if (user) {
                    const { password_hash, ...userWithoutPassword } = user;
                    res.locals.user = userWithoutPassword;
                    req.session.user = userWithoutPassword;
                } else {
                    req.session.destroy();
                    res.locals.user = null;
                }
            } catch (err) {
                req.session.destroy();
                res.locals.user = null;
            }
        } else {
            res.locals.user = null;
        }
        next();
    }

    setupRoutes() {
        const mainRoutes = require('./routes/main');
        const trendingRoutes = require('./routes/trending');
        const searchRoutes = require('./routes/search');
        const profileRoutes = require('./routes/profile');
        const settingsRoutes = require('./routes/settings');
        const authRoutes = require('./routes/auth');
        const adminRoutes = require('./routes/admin');
        const authorRoutes = require('./routes/author');
        const newRoutes = require('./routes/new');
        const entityRoutes = require('./routes/entity');

        this.app.use('/', mainRoutes);
        this.app.use('/auth', authRoutes);
        this.app.use('/admin', adminRoutes);
        this.app.use('/author', authorRoutes);
        this.app.use('/content/trending', trendingRoutes);
        this.app.use('/content/search', searchRoutes);
        this.app.use('/content/new', newRoutes);
        this.app.use('/profile', profileRoutes);
        this.app.use('/settings', settingsRoutes);
        this.app.use('/entity', entityRoutes);
    }

    setupErrorHandling() {
        this.app.use(this.notFoundHandler.bind(this));
        this.app.use(this.errorHandler.bind(this));
    }

    notFoundHandler(req, res, next) {
        next(createError(404));
    }

    errorHandler(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            status: err.status,
            message: err.message,
            error: req.app.get('env') === 'development' ? err : {}
        });
    }

    getApp() {
        return this.app;
    }
}

module.exports = new Application().getApp();