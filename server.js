const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();
var cors = require('cors')
app.use(cors())


// Connect to MongoDB 
mongoose.connect('mongodb+srv://joey_cool_one:Joey123@cluster0.gc8pm.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});


const loanSchemeSchema = new mongoose.Schema({
  name: String,
  description: String,
  interestRate: Number,
});



const User = mongoose.model('User', userSchema);
const LoanScheme = mongoose.model('LoanScheme', loanSchemeSchema);

// Middleware for parsing JSON requests
app.use(bodyParser.json());


app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Checking if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hashed the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user if all good
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate and send a JWT token
    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/dashboard', async(req, res) => {
  // Verify the JWT token before allowing access
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Authentication failed' });
  }

  jwt.verify(token, 'your-secret-key',async (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    try {
      const { page = 1, limit = 5 } = req.query;
      const skip = (page - 1) * limit;
      const schemes = await LoanScheme.find()
        .skip(skip)
        .limit(Number(limit));
        res.status(200).json(schemes);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

app.get('/dashboard/data', async (req, res) => {
  
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
