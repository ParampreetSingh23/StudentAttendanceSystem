const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// GET student list
router.get('/', studentController.getAllStudents);

// GET add student form
router.get('/add', studentController.getAddStudentForm);

// POST create new student
router.post('/add', studentController.createStudent);

// GET edit student form
router.get('/edit/:id', studentController.getEditStudentForm);

// POST update student
router.post('/edit/:id', studentController.updateStudent);

// POST delete student
router.post('/delete/:id', studentController.deleteStudent);

// GET student by ID (API)
router.get('/api/:id', studentController.getStudentById);

module.exports = router;
