const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const isAuth = require('../middleware/isAuth');


router.get('/mark', isAuth, attendanceController.getMarkAttendancePage);


router.post('/mark', isAuth, attendanceController.markAttendance);


router.get('/view', isAuth, attendanceController.getViewAttendancePage);


router.post('/update/:id', isAuth, attendanceController.updateAttendance);


router.post('/delete/:id', isAuth, attendanceController.deleteAttendance);


router.get('/stats', isAuth, attendanceController.getAttendanceStats);

module.exports = router;
