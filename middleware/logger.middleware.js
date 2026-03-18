const fs = require('fs');
const path = require('path');

class LoggerMiddleware {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.logFile = path.join(this.logDir, 'app.log');
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }
    }

    logRequest(req, res, next) {
        const logEntry = `${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`;
        console.log(logEntry);
        
        // Write to log file
        fs.appendFile(this.logFile, logEntry + '\n', (err) => {
            if (err) console.error('Error writing to log file:', err);
        });
        
        next();
    }

    logError(error, req, res, next) {
        const logEntry = `${new Date().toISOString()} - ERROR: ${error.message} - ${req.method} ${req.url}`;
        console.error(logEntry);
        
        fs.appendFile(this.logFile, 'ERROR: ' + logEntry + '\n', (err) => {
            if (err) console.error('Error writing error to log file:', err);
        });
        
        next(error);
    }
}

module.exports = new LoggerMiddleware();