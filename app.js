const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Set up MongoDB connection (in-memory for demo)
async function setupMongoDB() {
    try {
        // Create an in-memory MongoDB server
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Connect to the in-memory database
        await mongoose.connect(mongoUri);
        
        console.log('Connected to in-memory MongoDB successfully');
        console.log('Note: Data will not persist between server restarts');
    } catch (err) {
        console.error('Failed to connect to in-memory MongoDB:', err);
        process.exit(1);
    }
}

// Initialize MongoDB connection
setupMongoDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Student Attendance System' });
});

app.use('/students', studentRoutes);
app.use('/attendance', attendanceRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
