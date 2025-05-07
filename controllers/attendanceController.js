const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const mailer = require('../utils/mailer');

// Display attendance marking page
exports.getMarkAttendancePage = async (req, res) => {
    try {
        const students = await Student.find().sort({ name: 1 });
        res.render('attendance/mark', {
            title: 'Mark Attendance',
            students,
            date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
        });
    } catch (err) {
        console.error('Error fetching students for attendance:', err);
        res.status(500).render('attendance/mark', {
            title: 'Mark Attendance',
            students: [],
            date: new Date().toISOString().split('T')[0],
            error: 'Failed to retrieve students'
        });
    }
};

// Handle attendance marking on POST
exports.markAttendance = async (req, res) => {
    try {
        const { date, markedBy, attendanceData } = req.body;
        const parsedData = typeof attendanceData === 'string' 
            ? JSON.parse(attendanceData) 
            : attendanceData;
        
        if (!date || !markedBy || !parsedData || !Array.isArray(parsedData)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid attendance data' 
            });
        }

        // Process each attendance record
        const operations = [];
        const emailPromises = [];

        for (const record of parsedData) {
            const { studentId, status, notes } = record;
            
            // Create or update attendance record
            operations.push({
                updateOne: {
                    filter: { student: studentId, date: new Date(date) },
                    update: { 
                        student: studentId,
                        date: new Date(date),
                        status,
                        notes: notes || '',
                        markedBy
                    },
                    upsert: true
                }
            });
            
            // Get student info for email
            const student = await Student.findById(studentId);
            if (student) {
                // Send email notification
                emailPromises.push(
                    mailer.sendAttendanceNotification(
                        student.email,
                        student.name,
                        date,
                        status
                    )
                );
            }
        }

        // Execute all attendance update operations
        await Attendance.bulkWrite(operations);
        
        // Wait for all emails to be sent
        await Promise.allSettled(emailPromises);
        
        res.json({ 
            success: true, 
            message: 'Attendance marked successfully' 
        });
    } catch (err) {
        console.error('Error marking attendance:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to mark attendance' 
        });
    }
};

// Display attendance records view page
exports.getViewAttendancePage = async (req, res) => {
    try {
        const { date, studentId } = req.query;
        let query = {};
        
        // Apply filters if provided
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.date = { $gte: startDate, $lte: endDate };
        }
        
        if (studentId) {
            query.student = studentId;
        }
        
        // Get all students for the filter dropdown
        const students = await Student.find().sort({ name: 1 });
        
        // Get attendance records with student details
        const attendance = await Attendance.find(query)
            .populate('student')
            .sort({ date: -1 });
        
        res.render('attendance/view', {
            title: 'View Attendance',
            attendance,
            students,
            selectedDate: date || '',
            selectedStudent: studentId || ''
        });
    } catch (err) {
        console.error('Error fetching attendance records:', err);
        res.status(500).render('attendance/view', {
            title: 'View Attendance',
            attendance: [],
            students: [],
            selectedDate: '',
            selectedStudent: '',
            error: 'Failed to retrieve attendance records'
        });
    }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({ 
                success: false, 
                error: 'Status is required' 
            });
        }
        
        const attendance = await Attendance.findByIdAndUpdate(
            req.params.id,
            { status, notes },
            { new: true }
        ).populate('student');
        
        if (!attendance) {
            return res.status(404).json({ 
                success: false, 
                error: 'Attendance record not found' 
            });
        }
        
        // Send email notification about the update
        await mailer.sendAttendanceUpdateNotification(
            attendance.student.email,
            attendance.student.name,
            attendance.date,
            status
        );
        
        res.json({ 
            success: true, 
            message: 'Attendance updated successfully',
            attendance 
        });
    } catch (err) {
        console.error('Error updating attendance:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update attendance' 
        });
    }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndDelete(req.params.id);
        
        if (!attendance) {
            return res.status(404).json({ 
                success: false, 
                error: 'Attendance record not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Attendance record deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting attendance:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete attendance record' 
        });
    }
};

// Get attendance statistics
exports.getAttendanceStats = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayAttendance = await Attendance.aggregate([
            { 
                $match: { 
                    date: { $gte: today }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const stats = {
            totalStudents,
            present: 0,
            absent: 0,
            late: 0
        };
        
        todayAttendance.forEach(stat => {
            stats[stat._id] = stat.count;
        });
        
        res.json({ 
            success: true, 
            stats 
        });
    } catch (err) {
        console.error('Error getting attendance stats:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve attendance statistics' 
        });
    }
};
