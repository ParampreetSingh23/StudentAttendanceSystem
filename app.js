const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Set up MongoDB connection
async function connectToMongoDB() {
    console.log('Attempting to connect to local MongoDB...');
    
    try {
        // Set a connection timeout of 5 seconds
        const connectionOptions = {
            serverSelectionTimeoutMS: 5000, // 5 seconds timeout
            connectTimeoutMS: 5000
        };
        
        // Try to connect to local MongoDB first
        await mongoose.connect('mongodb://127.0.0.1:27017/student_attendance', connectionOptions);
        console.log('✅ Connected to local MongoDB successfully');
        return true;
    } catch (err) {
        console.error('❌ Local MongoDB connection error:', err.message);
        console.log('Falling back to in-memory database...');
        return false;
    }
}

// Call the connection function and use in-memory as fallback
console.log('Starting MongoDB connection process...');
connectToMongoDB().then(isConnected => {
    if (!isConnected) {
        console.log('Local MongoDB connection failed, setting up in-memory database');
        setupInMemoryMongoDB();
    }
}).catch(err => {
    console.error('Unexpected error in MongoDB connection process:', err);
    console.log('Attempting in-memory database as fallback');
    setupInMemoryMongoDB();
});

// Fallback function for in-memory MongoDB in case local connection fails
async function setupInMemoryMongoDB() {
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
