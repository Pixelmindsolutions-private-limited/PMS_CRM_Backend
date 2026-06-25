// // cron/installmentReminder.js
// const cron = require('node-cron');
// const { sendReminders } = require('../controllers/project.controller');

// // Start the cron job (runs every day at 9:00 AM)
// const startReminderJob = () => {
//     cron.schedule('0 9 * * *', async () => {
//         console.log('\n=================================');
//         console.log(`📅 ${new Date().toLocaleDateString()} - Running scheduled reminder check`);
//         console.log('=================================');
        
//         try {
//             // Create a mock request and response for the controller
//             const req = {};
//             const res = {
//                 json: (data) => console.log('✅ Reminder job completed:', data.message),
//                 status: () => ({ json: (data) => console.error('❌ Reminder job failed:', data) })
//             };
            
//             await sendReminders(req, res);
//         } catch (error) {
//             console.error('❌ Scheduled reminder job error:', error);
//         }
//     });
    
//     console.log('⏰ Installment reminder job scheduled at 9:00 AM daily.');
//     console.log('📧 Reminder emails will be sent for installments due tomorrow.');
// };

// module.exports = startReminderJob;


// cron/installmentReminder.js
const cron = require('node-cron');
const Project = require('../models/Project');
const transporter = require('../config/mailConfig');

// Send reminder email
const sendReminderEmail = (clientEmail, clientName, installment, projectName) => {
    const mailOptions = {
        from: process.env.MAIL_USER,
        to: clientEmail,
        cc: process.env.COMPANY_EMAIL || process.env.MAIL_USER,
        bcc: process.env.COMPANY_BCC_EMAIL || '',
        subject: `⏰ Installment Reminder - ${projectName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: auto; padding: 20px; }
                    .header { background: #2c3e50; color: white; padding: 15px; text-align: center; }
                    .content { padding: 20px; }
                    .details { margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .footer { text-align: center; padding: 15px; color: #777; border-top: 1px solid #eee; margin-top: 20px; }
                    .highlight { color: #e74c3c; font-weight: bold; }
                    .company-logo { font-size: 20px; font-weight: bold; color: white; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="company-logo">${process.env.COMPANY_NAME || 'Your Company'}</div>
                        <h2>⏰ Installment Reminder</h2>
                    </div>
                    <div class="content">
                        <h3>Hello ${clientName},</h3>
                        <p>This is a reminder for your upcoming installment.</p>
                        
                        <div class="details">
                            <div class="detail-row">
                                <span><strong>Project:</strong></span>
                                <span>${projectName}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Installment:</strong></span>
                                <span>${installment.title}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Amount:</strong></span>
                                <span class="highlight">${installment.type === 'percentage' ? installment.value + '%' : '₹' + installment.value}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Due Date:</strong></span>
                                <span class="highlight">${installment.dueDate ? new Date(installment.dueDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Status:</strong></span>
                                <span>${installment.status === 'pending' ? '⏳ Pending' : '✅ Paid'}</span>
                            </div>
                        </div>

                        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>📌 Please Note:</strong></p>
                            <p>Please ensure the payment is completed on time to avoid any delay in the project.</p>
                            <p>If you have already made the payment, please ignore this email.</p>
                        </div>

                        <div style="text-align: center; margin: 20px 0;">
                            <p style="color: #777; font-size: 12px;">
                                This is an automated reminder. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p><strong>${process.env.COMPANY_NAME || 'Your Company'}</strong></p>
                        <p>${process.env.COMPANY_EMAIL || 'info@yourcompany.com'} | ${process.env.COMPANY_PHONE || '1234567890'}</p>
                        <p style="font-size: 12px; color: #999;">
                            ${process.env.COMPANY_ADDRESS || ''}
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error(`❌ Error sending email to ${clientEmail}:`, err);
        } else {
            console.log(`✅ Reminder email sent to ${clientEmail} for ${projectName}`);
            if (process.env.COMPANY_EMAIL) {
                console.log(`📧 CC sent to company: ${process.env.COMPANY_EMAIL}`);
            }
        }
    });
};

// ============ FIXED: Use UTC for date comparison ============
const checkAndSendReminders = async () => {
    console.log('🔄 Running installment reminder check...');
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    
    try {
        // ✅ FIX: Use UTC date
        const now = new Date();
        const tomorrow = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0, 0, 0, 0
        ));

        const nextDay = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 2,
            0, 0, 0, 0
        ));

        console.log(`📅 UTC Tomorrow: ${tomorrow.toISOString()}`);
        console.log(`📅 UTC Next Day: ${nextDay.toISOString()}`);

        // Find projects with installments due tomorrow (UTC)
        const projects = await Project.find({
            isDeleted: false,
            'installments.status': 'pending',
            'installments.dueDate': {
                $gte: tomorrow,
                $lt: nextDay
            }
        }).populate('clientId');

        console.log(`📋 Found ${projects.length} projects with due installments`);

        let totalReminders = 0;
        let totalClients = 0;

        for (const project of projects) {
            const dueInstallments = project.installments.filter(i => 
                i.status === 'pending' && 
                i.dueDate && 
                new Date(i.dueDate).getTime() >= tomorrow.getTime() &&
                new Date(i.dueDate).getTime() < nextDay.getTime()
            );

            console.log(`  📌 Project: ${project.projectName} - ${dueInstallments.length} due installments`);

            for (const installment of dueInstallments) {
                if (project.clientId && project.clientId.email) {
                    sendReminderEmail(
                        project.clientId.email,
                        project.clientId.name || 'Client',
                        installment,
                        project.projectName
                    );
                    totalReminders++;
                    totalClients++;
                } else {
                    console.log(`⚠️ No email found for client: ${project.clientId?.name || 'Unknown'}`);
                }
            }
        }

        console.log(`✅ ${totalReminders} reminder emails sent for tomorrow's due installments.`);
        console.log(`👥 ${totalClients} clients notified.`);
        console.log('---');
    } catch (error) {
        console.error('❌ Error in reminder check:', error);
    }
};

// ============ START CRON JOB ============

const startReminderJob = () => {
    // ✅ PRODUCTION: Runs at 9:00 AM daily
    cron.schedule('0 9 * * *', () => {
        console.log('\n=================================');
        console.log(`📅 ${new Date().toLocaleDateString()} - Running scheduled reminder check (9:00 AM)`);
        console.log('=================================');
        checkAndSendReminders();
    });

    console.log('⏰ Installment reminder job scheduled at 9:00 AM daily.');
    console.log('📧 Reminder emails will be sent for installments due tomorrow.');
};

module.exports = startReminderJob;