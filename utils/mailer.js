const nodemailer = require('nodemailer');

// Create a test account that logs to console instead of sending real emails
let transporter;

// Function to create test SMTP transport (ethereal email or mock)
async function createTestTransport() {
    try {
        // Create a mock transporter
        transporter = nodemailer.createTransport({
            jsonTransport: true // 'JSON' transport - doesn't send emails, just returns the email object
        });
        console.log('Using mock email transport (no emails will be sent)');
    } catch (err) {
        console.log('Error setting up email transport:', err);
    }
}

// Initialize the test transport
createTestTransport();

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
        
        const mailOptions = {
            from: '"Attendance System" <attendance.system.demo@gmail.com>',
            to: email,
            subject: `Attendance Marked: ${statusText} on ${formattedDate}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #333; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px;">Attendance Notification</h2>
                    
                    <p>Dear <strong>${studentName}</strong>,</p>
                    
                    <p>This is to inform you that your attendance has been marked as <strong style="color: ${
                        status === 'present' ? 'green' : 
                        status === 'absent' ? 'red' : 'orange'
                    };">${statusText}</strong> for <strong>${formattedDate}</strong>.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> ${statusText}</p>
                    </div>
                    
                    <p>If you believe there is an error in this record, please contact the administration office.</p>
                    
                    <p style="margin-top: 30px;">Regards,<br>Student Attendance System</p>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
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
        
        const mailOptions = {
            from: '"Attendance System" <attendance.system.demo@gmail.com>',
            to: email,
            subject: `Attendance Updated: ${statusText} on ${formattedDate}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #333; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px;">Attendance Update Notification</h2>
                    
                    <p>Dear <strong>${studentName}</strong>,</p>
                    
                    <p>This is to inform you that your attendance record has been <strong>updated</strong> to <strong style="color: ${
                        status === 'present' ? 'green' : 
                        status === 'absent' ? 'red' : 'orange'
                    };">${statusText}</strong> for <strong>${formattedDate}</strong>.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                        <p style="margin: 5px 0;"><strong>Updated Status:</strong> ${statusText}</p>
                    </div>
                    
                    <p>If you believe there is an error in this updated record, please contact the administration office.</p>
                    
                    <p style="margin-top: 30px;">Regards,<br>Student Attendance System</p>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Update email sent:', info.messageId);
        return info;
    } catch (err) {
        console.error('Error sending update email:', err);
        throw err;
    }
};
