const cron = require('node-cron');
const { sendWeeklyReport } = require('./services/emailService');

// Schedule job for every Friday at 4:45 PM
const scheduleWeeklyReport = () => {
    cron.schedule('45 16 * * 5', async () => {
        console.log('Running weekly report job');
        await sendWeeklyReport();
    }, {
        timezone: "America/Los_Angeles"  // Adjust timezone as needed
    });
};

module.exports = { scheduleWeeklyReport };