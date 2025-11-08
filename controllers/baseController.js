const express = require('express');

class BaseController {
    constructor() {
        this.router = express.Router();
    }

    sendSuccess(res, data = null, message = 'Success') {
        res.json({
            success: true,
            message: message,
            data: data
        });
    }

    sendError(res, error = 'Internal server error', statusCode = 500) {
        res.status(statusCode).json({
            success: false,
            error: error
        });
    }

    sendNotFound(res, message = 'Resource not found') {
        res.status(404).json({
            success: false,
            error: message
        });
    }

    handleError(res, error, message = 'An error occurred') {
        res.status(500).render('error', {
            message: message,
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = BaseController;