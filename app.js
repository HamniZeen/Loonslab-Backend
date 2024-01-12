const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'loonsLabSecret', resave: true, saveUninitialized: true }));

mongoose.connect("mongodb+srv://hamna:mzOEzRP2MF3QmxLQ@cluster0.lts1eva.mongodb.net/loonslab", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    const fileName = req.body.firstName + ' ' + req.body.lastName + fileExtension;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  mobileNumber: String,
  email: String,
  password: String,
  picture: String,
});

const User = mongoose.model('User', UserSchema);

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

app.get('/', (req, res) => {
    res.send(`Welcome to Loons Lab Dispensary Booking System
    <p>Not registered yet? <a href="/register">Register here</a>.</p>
    <p>Already have an account? <a href="/login">Login here</a>.</p>
    `);
  });

app.get('/register', (req, res) => {
  res.send(`
    <form method="post" action="/register" enctype="multipart/form-data">
      <label>First Name: <input type="text" name="firstName" required></label><br>
      <label>Last Name: <input type="text" name="lastName" required></label><br>
      <label>Mobile Number: <input type="text" name="mobileNumber" required pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number"></label><br>
      <label>Email: <input type="email" name="email" required pattern="[^\s@]+@[^\s@]+\.[^\s@]+" title="Please enter a valid email address"></label><br>
      <label>Picture: <input type="file" name="picture" accept="image/*" required></label><br>
      <label>Password: <input type="password" name="password" required minlength="6"></label><br>
      <input type="submit" value="Register">
    </form>
  `);
});

app.post('/register', upload.single('picture'), async (req, res) => {
  const { firstName, lastName, mobileNumber, email, password } = req.body;


  if (!firstName || !lastName || !mobileNumber || !email || !password) {
    return res.send('All fields are required. Please fill in all the details.');
  }

  if (!validateEmail(email)) {
    return res.send('Invalid email address. Please provide a valid email.');
  }


  if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
    return res.send('Invalid mobile number. Please enter a valid 10-digit mobile number.');
  }

  const picture = req.file && req.file.filename;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.send('User with this email already exists. Please use a different email.');
  }

  const user = new User({ firstName, lastName, mobileNumber, email, password, picture });
  await user.save();

  res.send(`Registration successful! Now you can <a href="/login">login</a>.`);
});

app.get('/login', (req, res) => {
  res.send(`
    <form method="post" action="/login">
      <label>Email: <input type="email" name="email" required pattern="[^\s@]+@[^\s@]+\.[^\s@]+" title="Please enter a valid email address"></label><br>
      <label>Password: <input type="password" name="password" required minlength="6"></label><br>
      <input type="submit" value="Login">
    </form>
  `);
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

 
  if (!email || !password) {
    return res.send('Both email and password are required for login. Please provide both.');
  }

  if (!validateEmail(email)) {
    return res.send('Invalid email address. Please provide a valid email.');
  }

  const user = await User.findOne({ email, password });

  if (user) {
    req.session.user = user;
    res.redirect('/dashboard');
  } else {
    res.send('Invalid credentials. <a href="/login">Try again</a>.');
  }
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = req.session.user;
  res.send(`
    <h1>Welcome to your Dashboard, ${user.firstName} ${user.lastName}!</h1>
    <p>Mobile Number: ${user.mobileNumber}</p>
    <p>Email: ${user.email}</p>
    <img src="/uploads/${user.picture}" alt="Profile Picture" style="width: 200px; height: 200px;">
 `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
