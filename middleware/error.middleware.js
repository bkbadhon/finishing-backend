class ErrorMiddleware {
    handle404(req, res, next) {
        res.status(404).json({
            success: false,
            error: 'Route not found',
            message: `Cannot ${req.method} ${req.url}`
        });
    }

    handleError(err, req, res, next) {
        console.error('Server error:', err);

        // Default error
        let statusCode = err.statusCode || 500;
        let errorMessage = err.message || 'Internal server error';

        // MongoDB duplicate key error
        if (err.code === 11000) {
            statusCode = 400;
            errorMessage = 'Duplicate key error: Record already exists';
        }

        // MongoDB validation error
        if (err.name === 'ValidationError') {
            statusCode = 400;
            errorMessage = err.message;
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
}

module.exports = new ErrorMiddleware();