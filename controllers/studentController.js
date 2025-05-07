const Student = require('../models/Student');

// Display list of all students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().sort({ name: 1 });
        res.render('students/list', { 
            title: 'Student List', 
            students 
        });
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).render('students/list', { 
            title: 'Student List', 
            students: [],
            error: 'Failed to retrieve students' 
        });
    }
};

// Display student create form
exports.getAddStudentForm = (req, res) => {
    res.render('students/add', { 
        title: 'Add New Student',
        student: null,
        errors: null
    });
};

// Handle student create on POST
exports.createStudent = async (req, res) => {
    try {
        const { rollNumber, name, email, phone, course, semester } = req.body;
        
        // Simple validation
        let errors = [];
        if (!rollNumber) errors.push('Roll number is required');
        if (!name) errors.push('Name is required');
        if (!email) errors.push('Email is required');
        if (!phone) errors.push('Phone is required');
        if (!course) errors.push('Course is required');
        if (!semester) errors.push('Semester is required');
        
        if (errors.length > 0) {
            return res.render('students/add', {
                title: 'Add New Student',
                student: req.body,
                errors
            });
        }
        
        // Check if student with roll number already exists
        const existingStudent = await Student.findOne({ rollNumber });
        if (existingStudent) {
            return res.render('students/add', {
                title: 'Add New Student',
                student: req.body,
                errors: ['A student with this roll number already exists']
            });
        }
        
        // Create new student
        const student = new Student({
            rollNumber,
            name,
            email,
            phone,
            course,
            semester
        });
        
        await student.save();
        res.redirect('/students');
    } catch (err) {
        console.error('Error creating student:', err);
        res.render('students/add', {
            title: 'Add New Student',
            student: req.body,
            errors: ['An error occurred while saving the student. Please try again.']
        });
    }
};

// Display student edit form
exports.getEditStudentForm = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).redirect('/students');
        }
        res.render('students/edit', { 
            title: 'Edit Student',
            student,
            errors: null
        });
    } catch (err) {
        console.error('Error fetching student:', err);
        res.status(500).redirect('/students');
    }
};

// Handle student update on POST
exports.updateStudent = async (req, res) => {
    try {
        const { rollNumber, name, email, phone, course, semester } = req.body;
        
        // Simple validation
        let errors = [];
        if (!rollNumber) errors.push('Roll number is required');
        if (!name) errors.push('Name is required');
        if (!email) errors.push('Email is required');
        if (!phone) errors.push('Phone is required');
        if (!course) errors.push('Course is required');
        if (!semester) errors.push('Semester is required');
        
        if (errors.length > 0) {
            return res.render('students/edit', {
                title: 'Edit Student',
                student: { 
                    _id: req.params.id,
                    ...req.body 
                },
                errors
            });
        }
        
        // Check if roll number exists for another student
        const existingStudent = await Student.findOne({ 
            rollNumber, 
            _id: { $ne: req.params.id } 
        });
        
        if (existingStudent) {
            return res.render('students/edit', {
                title: 'Edit Student',
                student: { 
                    _id: req.params.id,
                    ...req.body 
                },
                errors: ['This roll number is already assigned to another student']
            });
        }
        
        // Update student
        const student = await Student.findByIdAndUpdate(req.params.id, {
            rollNumber,
            name,
            email,
            phone,
            course,
            semester
        }, { new: true });
        
        if (!student) {
            return res.status(404).redirect('/students');
        }
        
        res.redirect('/students');
    } catch (err) {
        console.error('Error updating student:', err);
        res.render('students/edit', {
            title: 'Edit Student',
            student: { 
                _id: req.params.id,
                ...req.body 
            },
            errors: ['An error occurred while updating the student. Please try again.']
        });
    }
};

// Handle student delete
exports.deleteStudent = async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        res.redirect('/students');
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).redirect('/students');
    }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (err) {
        console.error('Error fetching student:', err);
        res.status(500).json({ error: 'Failed to retrieve student' });
    }
};
