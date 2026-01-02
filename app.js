require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const session = require('express-session');
const MongoDBStore = require('connect-mongo').default;
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const exportRouter = require('./routes/export');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');




const app = express();




const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/mydatabase";

mongoose.connect(mongoURI)
  .then(() => console.log(" Connected to MongoDB"))
  .catch(err => console.error(" MongoDB connection error:", err));
  

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const store = MongoDBStore.create({
    mongoUrl: mongoURI,
    collectionName: 'sessions'
});

app.use(
    session({
        secret: 'my secret key',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.user = req.session.user;
    next();
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const Group = require('./models/Group');

app.get('/', async (req, res) => {
    let groups = [];
    if (req.session.user) {
        try {
            groups = await Group.find({ user: req.session.user.id }).limit(3).sort({ name: 1 });
        } catch (err) {
            console.error(err);
        }
    }
    res.render('index', { 
        title: 'Student Attendance System',
        user: req.session.user || null,
        groups
    });
});

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/students', studentRoutes);
app.use('/attendance', attendanceRoutes);
app.use("/", exportRouter);

app.listen(3000, () => {
    console.log(`Server running`);
});
