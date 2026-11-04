const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { badRequest } = require("./stock");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

class AuthUseCases {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register({ fullName, email, password }) {
    const existing = await this.userRepository.findByEmailRaw(email);
    if (existing) throw badRequest("Email already in use");
    const user = await this.userRepository.create({ fullName, email, password });
    return {
      user: { id: user.id, fullName: user.fullName, email: user.email, isAdmin: user.isAdmin || false },
      token: generateToken(user.id),
    };
  }

  async login({ email, password }) {
    const doc = await this.userRepository.findByEmailRaw(email);
    if (!doc) throw new Error("Invalid email or password");
    const match = await doc.matchPassword(password);
    if (!match) throw new Error("Invalid email or password");
    return {
      user: { id: doc._id, fullName: doc.fullName, email: doc.email, isAdmin: doc.isAdmin || false },
      token: generateToken(doc._id),
    };
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    const { password, ...profile } = user; // never send the password hash to the client
    return profile;
  }
}

module.exports = AuthUseCases;
