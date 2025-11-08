class ErrorRedirect {
    static redirect(statusCode, message) {
        return (req, res) => {
            res.status(statusCode).render('error', {
                message: message,
                error: req.app.get('env') === 'development' ? { message } : {},
                statusCode: statusCode
            });
        };
    }
}

module.exports = ErrorRedirect;