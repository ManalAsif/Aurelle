class AuthController {
  constructor(authUseCases) {
    this.authUseCases = authUseCases;
  }

  register = async (req, res, next) => {
    try {
      const { fullName, email, password } = req.body;
      if (!fullName || !email || !password)
        return res.status(400).json({ message: "All fields required" });
      const result = await this.authUseCases.register({ fullName, email, password });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ message: "Email and password required" });
      const result = await this.authUseCases.login({ email, password });
      res.json(result);
    } catch (err) {
      err.status = 401;
      next(err);
    }
  };

  getMe = async (req, res, next) => {
    try {
      const user = await this.authUseCases.getProfile(req.user._id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = AuthController;
