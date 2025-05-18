const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');


router.get('/mark', attendanceController.getMarkAttendancePage);


router.post('/mark', attendanceController.markAttendance);


router.get('/view', attendanceController.getViewAttendancePage);


router.post('/update/:id', attendanceController.updateAttendance);


router.post('/delete/:id', attendanceController.deleteAttendance);


router.get('/stats', attendanceController.getAttendanceStats);

module.exports = router;
