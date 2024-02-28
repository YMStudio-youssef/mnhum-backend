const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const util = require('util');

// User model
const User = require('../models/User');

// Set up multer storage
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('image');

const uploadPromise = util.promisify(upload);

// Check file type
function checkFileType(file, cb) {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images only!');
  }
}

// Register Page
router.get('/register', (req, res) => {
  const errors = []; // Define an empty errors array

  res.render('register', {
    errors: errors, // Pass the errors variable to the template
    name: "", // Set an empty value for the name variable
    email: "", // Set an empty value for the email variable
  });
});

// Register Handle
router.post('/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  let errors = [];

  // Check required fields
  if (!name || !email || !password || !confirmPassword) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  // Check passwords match
  if (password !== confirmPassword) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      confirmPassword
    });
  } else {
    // Validation passed
    User.findOne({ email: email })
      .then(user => {
        if (user) {
          // User exists
          errors.push({ msg: 'Email is already registered' });
          res.render('register', {
            errors,
            name,
            email,
            password,
            confirmPassword
          });
        } else {
          // Create new user
          const newUser = new User({
            name,
            email,
            password
          });

          // Hash password
          bcrypt.genSalt(10, (err, salt) =>
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              // Set password to hashed
              newUser.password = hash;
              // Save user
              newUser.save()
                .then(user => {
                  req.flash('success_msg', 'You are now registered and can log in');
                  res.redirect('/users/login');
                })
                .catch(err => console.log(err));
            })
          );
        }
      });
  }
});

// Login Page
router.get('/login', (req, res) => {
  res.render('login', { 
    error_msg: req.flash('error_msg'),
    user: req.user
  });
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/users/profile',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Profile Page
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile', {
    user: req.user
  });
});

// Edit Profile Page
router.get('/profile/edit', ensureAuthenticated, (req, res) => {
  res.render('edit-profile', {
    user: req.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
});

// Edit Profile Handle
router.post('/profile/edit', ensureAuthenticated, (req, res) => {
  uploadPromise(req, res)
    .then(() => {
      const { name } = req.body;
      const userId = req.user._id;

      return User.findByIdAndUpdate(userId, { name, image: req.file.filename }, { new: true });
    })
    .then(user => {
      req.flash('success_msg', 'Profile updated successfully');
      res.redirect('/users/profile');
    })
    .catch(err => {
      req.flash('error_msg', err);
      res.redirect('/users/profile/edit');
    });
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

// Check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this page');
  res.redirect('/users/login');
}

module.exports = router;