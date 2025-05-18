const { sendAttendanceNotification } = require('./mailer');

sendAttendanceNotification(
    'student.email@example.com',
    'Test Student',
    new Date(),
    'present'
).then(console.log).catch(console.error);
