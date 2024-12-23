const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir);
        }
    }

    logToFile(endpoint, data, type = 'info') {
        const today = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toISOString();
        const logFile = path.join(this.logsDir, `${today}.log`);

        const logEntry = {
            timestamp,
            endpoint,
            type,
            data
        };

        const logMessage = `${JSON.stringify(logEntry)}\n`;

        fs.appendFileSync(logFile, logMessage);
    }

    error(endpoint, error) {
        this.logToFile(endpoint, {
            message: error.message,
            stack: error.stack
        }, 'error');
    }

    info(endpoint, data) {
        this.logToFile(endpoint, data, 'info');
    }

    getRecentLogs(limit = 100) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.logsDir, `${today}.log`);
            
            if (!fs.existsSync(logFile)) {
                return [];
            }

            const content = fs.readFileSync(logFile, 'utf8');
            const logs = content
                .trim()
                .split('\n')
                .filter(Boolean)
                .map(line => JSON.parse(line))
                .reverse()
                .slice(0, limit);

            return logs;
        } catch (error) {
            console.error('Error reading logs:', error);
            return [];
        }
    }
}

module.exports = new Logger();
