const nodemailer = require('nodemailer');
const { Parser } = require('json2csv');
const pool = require('../db');

// Email templates
const templates = {
    morningMissing: (userName) => ({
        subject: 'Missing Morning ESD Test Alert',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e53e3e;">Missing Morning ESD Test Alert</h2>
                <p>This is an automated alert to inform you that <strong>${userName}</strong> has not completed their morning ESD test.</p>
                <p>Required test window: 6:00 AM - 10:00 AM</p>
                <p>Please ensure the test is completed as soon as possible.</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated message from the ESD Testing System.</p>
            </div>
        `
    }),
    
    afternoonMissing: (userName) => ({
        subject: 'Missing Afternoon ESD Test Alert',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e53e3e;">Missing Afternoon ESD Test Alert</h2>
                <p>This is an automated alert to inform you that <strong>${userName}</strong> has not completed their afternoon ESD test.</p>
                <p>Required test window: 12:00 PM - 3:00 PM</p>
                <p>Please ensure the test is completed as soon as possible.</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated message from the ESD Testing System.</p>
            </div>
        `
    }),

    weeklyReport: (startDate, endDate) => ({
        subject: `ESD Test Results Report (${startDate} - ${endDate})`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2b6cb0;">Weekly ESD Test Results Report</h2>
                <p>Please find attached the ESD test results for the period:</p>
                <p><strong>${startDate}</strong> to <strong>${endDate}</strong></p>
                <p>This report includes all test results from the past 7 days.</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated message from the ESD Testing System.</p>
            </div>
        `
    })
};

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendMissingTestAlert = async (userName, period, managerEmail) => {
    console.log(`Sending ${period} alert for ${userName} to ${managerEmail}`);
    
    const template = period === 'morning' 
        ? templates.morningMissing(userName)
        : templates.afternoonMissing(userName);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: managerEmail,
        subject: template.subject,
        html: template.html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

async function getLastSevenDaysTests() {
    const query = `
        SELECT 
            t.test_date,
            t.test_time,
            t.test_period,
            CASE WHEN t.passed THEN 'PASS' ELSE 'FAIL' END as result,
            u.first_name,
            u.last_name,
            u.manager_email
        FROM esd_tests t
        JOIN users u ON t.user_id = u.id
        WHERE t.test_date >= CURRENT_DATE - INTERVAL '6 days'
        AND t.test_date <= CURRENT_DATE
        ORDER BY t.test_date DESC, t.test_time DESC
    `;

    const result = await pool.query(query);
    return result.rows;
}

async function sendWeeklyReport() {
    try {
        const tests = await getLastSevenDaysTests();
        
        const fields = ['test_date', 'test_time', 'test_period', 'result', 'first_name', 'last_name', 'manager_email'];
        const parser = new Parser({ fields });
        const csv = parser.parse(tests);

        const endDate = new Date().toLocaleDateString();
        const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString();

        const template = templates.weeklyReport(startDate, endDate);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'michael.knapp@sandyindustries.com',
            subject: template.subject,
            html: template.html,
            attachments: [{
                filename: `esd_tests_${startDate}_${endDate}.csv`,
                content: csv
            }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Weekly report email sent successfully:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending weekly report:', error);
        return false;
    }
}

module.exports = { 
    sendMissingTestAlert,
    sendWeeklyReport 
};