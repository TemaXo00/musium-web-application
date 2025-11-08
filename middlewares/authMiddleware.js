const authService = require('../services/authService');

class AuthMiddleware {
    static async isAdmin(req, res, next) {
        try {
            if (!req.session.user) {
                return res.status(401).redirect('/auth/login');
            }

            const isAdmin = await authService.isAdmin(req.session.user.id);
            if (!isAdmin) {
                return res.status(403).render('error', {
                    message: 'Access denied. Admin privileges required.',
                    error: {}
                });
            }

            next();
        } catch (error) {
            res.status(500).render('error', {
                message: 'Authentication error',
                error: req.app.get('env') === 'development' ? error : {}
            });
        }
    }

    static async isAuthor(req, res, next) {
        try {
            if (!req.session.user) {
                return res.status(401).redirect('/auth/login');
            }

            const isAuthor = await authService.isAuthor(req.session.user.id);
            if (!isAuthor) {
                return res.status(403).render('error', {
                    message: 'Access denied. Author privileges required.',
                    error: {}
                });
            }

            next();
        } catch (error) {
            res.status(500).render('error', {
                message: 'Authentication error',
                error: req.app.get('env') === 'development' ? error : {}
            });
        }
    }
}

module.exports = AuthMiddleware;