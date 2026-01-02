const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Group = require('../models/Group');
const mailer = require('../utils/mailer');


exports.getMarkAttendancePage = async (req, res) => {
    try {
        const { groupId } = req.query;
        
        if (!groupId) {
             return res.redirect('/groups');
        }

        const group = await Group.findOne({ _id: groupId, user: req.session.user.id });
        if (!group) {
             return res.redirect('/groups');
        }

        const students = await Student.find({ group: groupId }).sort({ name: 1 });
        
        res.render('attendance/mark', {
            title: 'Mark Attendance',
            students,
            group,
            date: new Date().toISOString().split('T')[0] 
        });
    } catch (err) {
        console.error('Error fetching students for attendance:', err);
        res.status(500).render('attendance/mark', {
            title: 'Mark Attendance',
            students: [],
            group: null,
            date: new Date().toISOString().split('T')[0],
            error: 'Failed to retrieve students'
        });
    }
};


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

       
        const operations = [];
        const emailPromises = [];

        for (const record of parsedData) {
            const { studentId, status, notes } = record;
            
            
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
            
            
            const student = await Student.findById(studentId);
            if (student) {
                
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

        
        await Attendance.bulkWrite(operations);
        
        
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


exports.getViewAttendancePage = async (req, res) => {
    try {
        const { date, studentId, groupId } = req.query;
        let query = {};
        
        if (!groupId) {
            return res.redirect('/groups');
        }

        const group = await Group.findOne({ _id: groupId, user: req.session.user.id });
        if (!group) {
             return res.redirect('/groups');
        }
        
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.date = { $gte: startDate, $lte: endDate };
        }
        
        // Filter students by Group
        const userStudents = await Student.find({ group: groupId }).sort({ name: 1 });
        const userStudentIds = userStudents.map(s => s._id);

        if (studentId) {
             if (userStudentIds.some(id => id.toString() === studentId)) {
                query.student = studentId;
            } else {
                query.student = null; 
            }
        } else {
            query.student = { $in: userStudentIds };
        }
        
        // Get attendance records with student details
        const attendance = await Attendance.find(query)
            .populate('student')
            .sort({ date: -1 });
        
        res.render('attendance/view', {
            title: 'View Attendance',
            attendance,
            students: userStudents,
            selectedDate: date || '',
            selectedStudent: studentId || '',
            group
        });
    } catch (err) {
        console.error('Error fetching attendance records:', err);
        res.status(500).render('attendance/view', {
            title: 'View Attendance',
            attendance: [],
            students: [],
            selectedDate: '',
            selectedStudent: '',
            group: null,
            error: 'Failed to retrieve attendance records'
        });
    }
};


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


exports.getAttendanceStats = async (req, res) => {
    try {
        const userStudentIds = await Student.find({ user: req.session.user.id }).distinct('_id');
        const totalStudents = await Student.countDocuments({ user: req.session.user.id });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayAttendance = await Attendance.aggregate([
            { 
                $match: { 
                    date: { $gte: today },
                    student: { $in: userStudentIds }
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
