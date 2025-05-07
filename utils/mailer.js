const nodemailer = require('nodemailer');

// Try loading SendGrid if available
let sendgrid;
try {
    sendgrid = require('@sendgrid/mail');
} catch (err) {
    console.log('SendGrid not available, will try other email methods');
}

// Create email transporter
let transporter;

// Function to create appropriate email transport based on available configurations
async function createEmailTransport() {
    try {
        // Check for SendGrid API key
        if (process.env.SENDGRID_API_KEY && sendgrid) {
            // Configure SendGrid
            sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
            console.log('Using SendGrid email transport');
            return true;
        } 
        // Check for SMTP configuration (e.g., Gmail)
        else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Create SMTP transporter
            transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            console.log('Using SMTP email transport');
            return true;
        } 
        // Fall back to mock transport for development
        else {
            // Create a mock transporter
            transporter = nodemailer.createTransport({
                jsonTransport: true // doesn't send emails, just returns the email object
            });
            console.log('Using mock email transport (no emails will be sent)');
            console.log('To use real emails, set up SendGrid or SMTP configuration');
            return false;
        }
    } catch (err) {
        console.log('Error setting up email transport:', err);
        // Fall back to mock transport
        transporter = nodemailer.createTransport({
            jsonTransport: true
        });
        console.log('Falling back to mock email transport');
        return false;
    }
}

// Initialize the email transport
createEmailTransport();

// Helper function to generate email HTML
function generateEmailHTML(studentName, date, status, isUpdate = false) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const title = isUpdate ? 'Attendance Update Notification' : 'Attendance Notification';
    const message = isUpdate 
        ? `This is to inform you that your attendance record has been <strong>updated</strong> to <strong style="color: ${
            status === 'present' ? 'green' : 
            status === 'absent' ? 'red' : 'orange'
        };">${statusText}</strong> for <strong>${formattedDate}</strong>.`
        : `This is to inform you that your attendance has been marked as <strong style="color: ${
            status === 'present' ? 'green' : 
            status === 'absent' ? 'red' : 'orange'
        };">${statusText}</strong> for <strong>${formattedDate}</strong>.`;
    
    const statusLabel = isUpdate ? 'Updated Status' : 'Status';
    
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #333; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px;">${title}</h2>
            
            <p>Dear <strong>${studentName}</strong>,</p>
            
            <p>${message}</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 5px 0;"><strong>${statusLabel}:</strong> ${statusText}</p>
            </div>
            
            <p>If you believe there is an error in this record, please contact the administration office.</p>
            
            <p style="margin-top: 30px;">Regards,<br>Student Attendance System</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    `;
}

// Function to send attendance notification email
exports.sendAttendanceNotification = async (email, studentName, date, status) => {
    try {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        const html = generateEmailHTML(studentName, date, status, false);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Attendance System" <attendance.system.demo@gmail.com>',
            to: email,
            subject: `Attendance Marked: ${statusText} on ${formattedDate}`,
            html: html
        };
        
        // Send email using SendGrid if available
        if (process.env.SENDGRID_API_KEY && sendgrid) {
            const msg = {
                to: email,
                from: process.env.EMAIL_FROM || 'attendance.system.demo@gmail.com',
                subject: `Attendance Marked: ${statusText} on ${formattedDate}`,
                html: html
            };
            
            await sendgrid.send(msg);
            console.log('SendGrid email sent successfully');
            return { messageId: 'sendgrid_message' };
        } 
        // Otherwise use nodemailer
        else {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return info;
        }
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
};

// Function to send attendance update notification email
exports.sendAttendanceUpdateNotification = async (email, studentName, date, status) => {
    try {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        const html = generateEmailHTML(studentName, date, status, true);
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Attendance System" <attendance.system.demo@gmail.com>',
            to: email,
            subject: `Attendance Updated: ${statusText} on ${formattedDate}`,
            html: html
        };
        
        // Send email using SendGrid if available
        if (process.env.SENDGRID_API_KEY && sendgrid) {
            const msg = {
                to: email,
                from: process.env.EMAIL_FROM || 'attendance.system.demo@gmail.com',
                subject: `Attendance Updated: ${statusText} on ${formattedDate}`,
                html: html
            };
            
            await sendgrid.send(msg);
            console.log('SendGrid update email sent successfully');
            return { messageId: 'sendgrid_message' };
        } 
        // Otherwise use nodemailer
        else {
            const info = await transporter.sendMail(mailOptions);
            console.log('Update email sent:', info.messageId);
            return info;
        }
    } catch (err) {
        console.error('Error sending update email:', err);
        throw err;
    }
};
