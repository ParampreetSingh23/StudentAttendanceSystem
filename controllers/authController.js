const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Render Login Page
exports.getLogin = (req, res) => {
    res.render('login', { 
        title: 'Login', 
        error: null,
        user: req.session.user || null
    });
};

// Handle Login
exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { 
                title: 'Login', 
                error: 'Invalid email or password', 
                user: null 
            });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { 
                title: 'Login', 
                error: 'Invalid email or password', 
                user: null 
            });
        }

        req.session.isLoggedIn = true;
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            instituteType: user.instituteType
        };
        
        req.session.save(err => {
            if (err) console.error(err);
            res.redirect('/students');
        });
    } catch (err) {
        console.error(err);
        res.render('login', { title: 'Login', error: 'An error occurred', user: null });
    }
};

// Render Register Page
exports.getRegister = (req, res) => {
    res.render('register', { title: 'Register', error: null, user: null });
};

// Handle Register
exports.postRegister = async (req, res) => {
    const { name, email, password, instituteType, groupOrClass } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { 
                title: 'Register', 
                error: 'Email already exists', 
                user: null 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            instituteType,
            groupOrClass
        });

        await newUser.save();
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('register', { title: 'Register', error: 'Registration failed', user: null });
    }
};

// Handle Logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) console.error(err);
        res.redirect('/');
    });
};
