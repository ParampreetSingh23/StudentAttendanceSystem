const Group = require('../models/Group');
const Student = require('../models/Student');

// Get all groups for the logged-in user
exports.getGroups = async (req, res) => {
    try {
        const groups = await Group.find({ user: req.session.user.id }).sort({ name: 1 });
        // Optional: Count students in each group
        const groupIds = groups.map(g => g._id);
        const studentCounts = await Student.aggregate([
            { $match: { group: { $in: groupIds } } },
            { $group: { _id: '$group', count: { $sum: 1 } } }
        ]);
        
        const countsMap = {};
        studentCounts.forEach(c => countsMap[c._id.toString()] = c.count);
        
        // Improve groups with counts
        const groupsWithCounts = groups.map(g => ({
            ...g.toObject(),
            studentCount: countsMap[g._id.toString()] || 0
        }));

        res.render('groups/list', { 
            title: 'My Classes', 
            groups: groupsWithCounts,
            error: null
        });
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).render('groups/list', { 
            title: 'My Classes', 
            groups: [], 
            error: 'Failed to retrieve classes' 
        });
    }
};

// Render Create Group Form
exports.getCreateGroupForm = (req, res) => {
    res.render('groups/add', { title: 'Create New Class', error: null });
};

// Handle Create Group
exports.createGroup = async (req, res) => {
    try {
        const { name, description, schedule } = req.body;
        
        const group = new Group({
            name,
            description,
            user: req.session.user.id,
            schedule: schedule ? (Array.isArray(schedule) ? schedule : [schedule]) : []
        });
        
        await group.save();
        res.redirect('/groups');
    } catch (err) {
        console.error('Error creating group:', err);
        res.render('groups/add', { 
            title: 'Create New Class', 
            error: 'Failed to create class' 
        });
    }
};

// Get Single Group Dashboard
exports.getGroupById = async (req, res) => {
    try {
        const group = await Group.findOne({ _id: req.params.id, user: req.session.user.id });
        if (!group) return res.status(404).redirect('/groups');
        
        const students = await Student.find({ group: group._id }).sort({ name: 1 });
        
        res.render('groups/dashboard', {
            title: group.name,
            group,
            students
        });
    } catch (err) {
        console.error('Error fetching group:', err);
        res.status(500).redirect('/groups');
    }
};

// Delete Group
exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findOneAndDelete({ _id: req.params.id, user: req.session.user.id });
        if (group) {
            // Optional: Delete all students in this group? Or keep them?
            // For safety, let's keep them but maybe orphan them or delete them.
            // Let's delete them for now as per "Class Management" logic.
            await Student.deleteMany({ group: group._id });
        }
        res.redirect('/groups');
    } catch (err) {
        console.error('Error deleting group:', err);
        res.status(500).redirect('/groups');
    }
};
