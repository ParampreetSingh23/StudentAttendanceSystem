const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// GET attendance marking page
router.get('/mark', attendanceController.getMarkAttendancePage);

// POST mark attendance
router.post('/mark', attendanceController.markAttendance);

// GET view attendance page
router.get('/view', attendanceController.getViewAttendancePage);

// POST update attendance
router.post('/update/:id', attendanceController.updateAttendance);

// POST delete attendance
router.post('/delete/:id', attendanceController.deleteAttendance);

// GET attendance statistics
router.get('/stats', attendanceController.getAttendanceStats);

module.exports = router;
