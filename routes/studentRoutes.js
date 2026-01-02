const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const isAuth = require('../middleware/isAuth');
const multer = require('multer');

// Configure multer for memory storage (process CSV in memory)
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', isAuth, studentController.getAllStudents);


router.get('/add', isAuth, studentController.getAddStudentForm);


router.post('/add', isAuth, studentController.createStudent);

// Import Route
router.get('/import', isAuth, studentController.getImportForm);
router.post('/import', isAuth, upload.single('file'), studentController.importStudents);

router.get('/edit/:id', isAuth, studentController.getEditStudentForm);


router.post('/edit/:id', isAuth, studentController.updateStudent);


router.post('/delete/:id', isAuth, studentController.deleteStudent);


router.get('/api/:id', isAuth, studentController.getStudentById);

module.exports = router;
