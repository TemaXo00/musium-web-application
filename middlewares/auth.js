const authService = require('../services/authService');
const ErrorRedirect = require('./errorRedirect');

class Auth {
    static requireAuth(req, res, next) {
        if (!req.session.user) {
            return ErrorRedirect.redirect(401, 'Authentication required to view profile')(req, res);
        }
        next();
    }

    static async requireAuthor(req, res, next) {
        try {
            if (!req.session.user) {
                return ErrorRedirect.redirect(401, 'Authentication required')(req, res);
            }

            const isAuthor = await authService.isAuthor(req.session.user.id);
            if (!isAuthor) {
                return ErrorRedirect.redirect(403, 'Author access required')(req, res);
            }

            next();
        } catch (error) {
            ErrorRedirect.redirect(500, 'Authentication error')(req, res);
        }
    }

    static async requireAdmin(req, res, next) {
        try {
            if (!req.session.user) {
                return ErrorRedirect.redirect(401, 'Authentication required')(req, res);
            }

            const isAdmin = await authService.isAdmin(req.session.user.id);
            if (!isAdmin) {
                return ErrorRedirect.redirect(403, 'Admin access required')(req, res);
            }

            next();
        } catch (error) {
            ErrorRedirect.redirect(500, 'Authentication error')(req, res);
        }
    }
}

module.exports = Auth;