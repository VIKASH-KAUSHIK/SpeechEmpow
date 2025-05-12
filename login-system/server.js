// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/loginSystem', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.error('MongoDB Connection Error:', err));

// User Schema - Removed confirmPassword from schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    birthdate: { type: Date, required: true },
    gender: { type: String, required: true },
    password: { type: String, required: true }
});

// Hash password before saving - Modified to remove confirmPassword
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); 
    }
});

// User Model
const User = mongoose.model('User', userSchema);

// Routes for serving HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'loginform.html'));
});

// Direct file routes
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'loginform.html'));
});

app.get('/forgot', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Forgot.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Add logout route
app.get('/logout', (req, res) => {
    // In a real app with sessions, you would destroy the session here
    res.redirect('/login');
});

// Register Route - Updated to remove confirmPassword storage
app.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        
        // Extract form data - these names match the "name" attributes in the HTML form
        const { fname, lname, uname, email, date, gender, pass, conpass } = req.body;
        
        // Validate passwords match
        if (pass !== conpass) {
            return res.status(400).send('Passwords do not match');
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email: email }, { username: uname }] 
        });
        
        if (existingUser) {
            return res.status(400).send('User with this email or username already exists');
        }
        
        // Create new user - don't store confirmPassword
        const newUser = new User({
            firstName: fname,
            lastName: lname,
            username: uname,
            email: email,
            birthdate: date,
            gender: gender,
            password: pass
        });
        
        await newUser.save();
        console.log('User registered successfully:', uname);
        
        // After successful registration, redirect to login page
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Server error during registration: ' + error.message);
    }
});

// Login Route - Enhanced with detailed logging
app.post('/login', async (req, res) => {
    try {
        console.log('Login attempt with:', { 
            username: req.body.username,
            passwordProvided: !!req.body.password
        });
          
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            console.log('Missing credentials');
            return res.status(400).send('Username and password are required');
        }
        
        // Find user by email or username
        const user = await User.findOne({ 
            $or: [{ email: username }, { username: username }] 
        });
        
        if (!user) {
            console.log('User not found:', username);
            return res.status(400).send('Invalid username or password');
        }
        
        console.log('User found:', user.username);
        
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            console.log('Password mismatch for user:', user.username);
            return res.status(400).send('Invalid username or password');
        }
        
        console.log('Login successful for user:', user.username);
        
        // Success - redirect to welcome page
        return res.redirect('home');
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).send('Server error during login: ' + error.message);
    }
});

// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
    try {
        const { username } = req.body;
        
        // Find user
        const user = await User.findOne({ 
            $or: [{ email: username }, { username: username }] 
        });
        
        if (!user) {
            return res.status(400).send('User not found');
        }
        
        // In a real application, you would:
        // 1. Generate a password reset token
        // 2. Send an email with a reset link
        // 3. Create a reset password page
        
        res.send('Password reset instructions sent to your email');
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).send('Server error during password reset');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});