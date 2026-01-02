const Student = require('../models/Student');
const Group = require('../models/Group');
const csv = require('csv-parser');
const stream = require('stream');


exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({ user: req.session.user.id }).sort({ name: 1 });
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
exports.getAddStudentForm = async (req, res) => {
    try {
        const groups = await Group.find({ user: req.session.user.id }).sort({ name: 1 });
        res.render('students/add', { 
            title: 'Add New Student',
            student: null,
            groups,
            selectedGroupId: req.query.groupId || null,
            errors: null
        });
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.redirect('/students');
    }
};

// Handle student create on POST
exports.createStudent = async (req, res) => {
    try {
        const { rollNumber, name, email, phone, course, semester, group } = req.body;
        
        // Simple validation
        let errors = [];
        if (!group) errors.push('Class/Group is required');
        if (!rollNumber) errors.push('Roll number is required');
        if (!name) errors.push('Name is required');
        if (!email) errors.push('Email is required');
        if (!phone) errors.push('Phone is required');
        if (!course) errors.push('Course is required');
        if (!semester) errors.push('Semester is required');
        
        if (errors.length > 0) {
            const groups = await Group.find({ user: req.session.user.id }).sort({ name: 1 });
            return res.render('students/add', {
                title: 'Add New Student',
                student: req.body,
                groups,
                selectedGroupId: group,
                errors
            });
        }
        
      
        const existingStudent = await Student.findOne({ rollNumber });
        if (existingStudent) {
            return res.render('students/add', {
                title: 'Add New Student',
                student: req.body,
                errors: ['A student with this roll number already exists']
            });
        }
        
       
        const student = new Student({
            rollNumber,
            name,
            email,
            phone,
            course,
            semester,
            group,
            user: req.session.user.id
        });
        
        await student.save();
        res.redirect(`/groups/${group}`); // Redirect to the group dashboard instead of clean student list
    } catch (err) {
        console.error('Error creating student:', err);
        res.render('students/add', {
            title: 'Add New Student',
            student: req.body,
            errors: ['An error occurred while saving the student. Please try again.']
        });
    }
};


exports.getEditStudentForm = async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, user: req.session.user.id });
        if (!student) {
            return res.status(404).redirect('/students');
        }
        const groups = await Group.find({ user: req.session.user.id }).sort({ name: 1 });
        res.render('students/edit', { 
            title: 'Edit Student',
            student,
            groups,
            errors: null
        });
    } catch (err) {
        console.error('Error fetching student:', err);
        res.status(500).redirect('/students');
    }
};


exports.updateStudent = async (req, res) => {
    try {
        const { rollNumber, name, email, phone, course, semester } = req.body;
        
        
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
        
       
        const student = await Student.findOneAndUpdate(
            { _id: req.params.id, user: req.session.user.id },
            {
                rollNumber,
                name,
                email,
                phone,
                course,
                semester,
                group: req.body.group
            }, 
            { new: true }
        );
        
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

exports.deleteStudent = async (req, res) => {
    try {
        await Student.findOneAndDelete({ _id: req.params.id, user: req.session.user.id });
        res.redirect('/students');
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).redirect('/students');
    }
};


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

exports.getImportForm = async (req, res) => {
    try {
        const groups = await Group.find({ user: req.session.user.id }).sort({ name: 1 });
        res.render('students/import', { 
            title: 'Import Students', 
            groups,
            selectedGroupId: req.query.groupId || null,
            error: null,
            success: null
        });
    } catch (err) {
        console.error('Error fetching groups for import:', err);
        res.redirect('/students');
    }
};

exports.importStudents = async (req, res) => {
    const { group: groupId } = req.body;
    
    // Default error render
    const renderError = async (msg, selectedGroupId = null) => {
        const groups = await Group.find({ user: req.session.user.id }).sort({ name: 1 });
        return res.render('students/import', {
            title: 'Import Students',
            groups,
            selectedGroupId: selectedGroupId || groupId,
            error: msg,
            success: null
        });
    };

    if (!groupId) {
        return await renderError('Please select a class');
    }

    if (!req.file) {
         return await renderError('Please upload a CSV file', groupId);
    }

    const results = [];
    const errors = [];
    
    // Create stream from buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let successCount = 0;
            
            for (const row of results) {
                // Normalize keys to lowercase
                const normalizedRow = {};
                Object.keys(row).forEach(key => {
                    normalizedRow[key.trim().toLowerCase()] = row[key].trim();
                });

                // Extract fields with multiple possible fallbacks
                const rollNumber = normalizedRow['roll number'] || normalizedRow['rollnumber'] || normalizedRow['roll_number'];
                const name = normalizedRow['name'] || normalizedRow['student name'] || normalizedRow['full name'];
                // Email is often case-insensitive in systems but stored as is or lowercase. Let's keep input but check key.
                const email = normalizedRow['email'] || normalizedRow['email address'];
                const phone = normalizedRow['phone'] || normalizedRow['phone number'] || normalizedRow['mobile'];
                const course = normalizedRow['course'];
                const semester = normalizedRow['semester'];

                if (!rollNumber || !name || !email) {
                    errors.push(`Skipped row: Missing required fields (Roll: ${rollNumber || 'Missing'}, Name: ${name || 'Missing'}, Email: ${email || 'Missing'})`);
                    continue;
                }

                try {
                    // Check duplicate for this user
                    const existing = await Student.findOne({ rollNumber, user: req.session.user.id });
                    if (existing) {
                        errors.push(`Skipped ${rollNumber}: Already exists`);
                        continue;
                    }

                    await Student.create({
                        rollNumber,
                        name,
                        email,
                        phone: phone || 'N/A',
                        course: course || 'N/A',
                        semester: semester || '1',
                        group: groupId,
                        user: req.session.user.id
                    });
                    successCount++;
                } catch (err) {
                    errors.push(`Error adding ${rollNumber}: ${err.message}`);
                }
            }
            
            const groups = await Group.find({ user: req.session.user.id }).sort({ name: 1 });
            
            res.render('students/import', {
                title: 'Import Students',
                groups,
                selectedGroupId: groupId,
                error: errors.length > 0 ? `Imported ${successCount} students. Errors:\n${errors.slice(0, 5).join('\n')}` : null,
                success: `Successfully imported ${successCount} students!`
            });
        });
};
