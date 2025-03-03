require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');


const app = express();
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Recipe Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String
});

const recipeSchema = new mongoose.Schema({

    title: String,
    image: String,
    ingredients: [String],
    process: String,
    time: String,
    reviews: [{
        rating: Number,
        comment: String
    }],
    wishlist: Boolean,
    user: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        avatar: String
    },
    createdAt: { type: Date, default: Date.now }
});


const User = mongoose.model('User', userSchema);
const Recipe = mongoose.model('Recipe', recipeSchema);

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error('Invalid credentials');
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Download recipe as text file
app.get('/api/recipes/:id/download', authenticate, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const content = `
Recipe: ${recipe.title}
Added by: ${recipe.user.name}
Created: ${new Date(recipe.createdAt).toLocaleDateString()}

Ingredients:
${recipe.ingredients.join('\n')}

Instructions:
${recipe.process}
    `;

    const filePath = path.join(__dirname, 'downloads', `${recipe.title}.txt`);
    fs.writeFileSync(filePath, content);
    
    res.download(filePath, () => {
      fs.unlinkSync(filePath); // Delete file after download
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Routes
app.get('/api/recipes', async (req, res) => {
    try {
        const recipes = await Recipe.find();
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/recipes', authenticate, async (req, res) => {

const user = await User.findById(req.user.userId);
const userData = {
    name: user.name,
    email: user.email,
    avatar: user.avatar
};


const recipe = new Recipe({
    ...req.body,
    user: userData
});

    try {
        const newRecipe = await recipe.save();
        res.status(201).json(newRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/recipes/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(recipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/recipes/:id', async (req, res) => {
    try {
        await Recipe.findByIdAndDelete(req.params.id);
        res.json({ message: 'Recipe deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
