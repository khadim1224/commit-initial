const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (userData) => {
  const { username, email, password, name } = userData;

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new Error('User already exists');
  }

  const user = await User.create({
    username,
    email,
    password,
    name,
  });

  if (user) {
    return { ...user.toObject(), token: generateToken(user._id) };
  }

  throw new Error('Invalid user data');
};

const loginUser = async (loginData) => {
  const { email, password } = loginData;

  const user = await User.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    return { ...user.toObject(), token: generateToken(user._id) };
  }

  throw new Error('Invalid email or password');
};

module.exports = {
  registerUser,
  loginUser,
};