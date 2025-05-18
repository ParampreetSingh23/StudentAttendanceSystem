const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'parampreetsinghlall@gmail.com',  
        pass: 'nbau rppn cqsw nwce'   
    }
});


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
            from: 'parampreetsinghlall@gmail.com', 
            to: email,
            subject: `Attendance Marked: ${statusText} on ${formattedDate}`,
            html: html
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
};


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
            from: '"parampreetsinghlall@gmail.com',  // Replace with your Gmail email address
            to: email,
            subject: `Attendance Updated: ${statusText} on ${formattedDate}`,
            html: html
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Update email sent:', info.messageId);
        return info;
    } catch (err) {
        console.error('Error sending update email:', err);
        throw err;
    }
};
