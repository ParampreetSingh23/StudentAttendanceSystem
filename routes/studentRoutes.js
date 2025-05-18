const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');


router.get('/', studentController.getAllStudents);


router.get('/add', studentController.getAddStudentForm);


router.post('/add', studentController.createStudent);


router.get('/edit/:id', studentController.getEditStudentForm);


router.post('/edit/:id', studentController.updateStudent);


router.post('/delete/:id', studentController.deleteStudent);


router.get('/api/:id', studentController.getStudentById);

module.exports = router;
