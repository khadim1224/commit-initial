const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await authService.loginUser(req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
};