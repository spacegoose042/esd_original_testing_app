const cron = require('node-cron');
const { sendWeeklyReport } = require('./services/emailService');
const { checkMorningTests, checkAfternoonTests } = require('./services/scheduler');

// Schedule morning check for 10:01 AM CST (after the morning window ends)
const scheduleMorningCheck = () => {
    cron.schedule('1 10 * * 1-5', async () => {
        console.log('Running morning test check');
        await checkMorningTests();
    }, {
        timezone: "America/Chicago"
    });
};

// Schedule afternoon check for 3:01 PM CST (after the afternoon window ends)
const scheduleAfternoonCheck = () => {
    cron.schedule('1 15 * * 1-5', async () => {
        console.log('Running afternoon test check');
        await checkAfternoonTests();
    }, {
        timezone: "America/Chicago"
    });
};

// Schedule job for every Friday at 4:45 PM CST
const scheduleWeeklyReport = () => {
    cron.schedule('45 16 * * 5', async () => {
        console.log('Running weekly report job');
        await sendWeeklyReport();
    }, {
        timezone: "America/Chicago"
    });
};

module.exports = { 
    scheduleWeeklyReport,
    scheduleMorningCheck,
    scheduleAfternoonCheck
};