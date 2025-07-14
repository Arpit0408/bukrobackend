const userModel = require("../models/User");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");
// ✅ REGISTER USER
module.exports.register = async function (req, res) {
  try {
    let { email, password, name } = req.body;

    email = email.trim();
    password = password.trim();
    name = name.trim();

    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      email,
      password: hashedPassword,
      name
    });

    const token = generateToken(user);

    // ✅ Set cookie and return token in body
    res.cookie("token", token, {
      // httpOnly: true,
      // secure: process.env.NODE_ENV === "production", 
      // sameSite: "lax",

      httpOnly: false,
  sameSite: "lax",    // ✅ Allows cookies from different port
  secure: false,      // ❌ Only true for HTTPS (use false for localhost)
    });

    res.status(201).json({
      message: "User registered successfully",
      token, // 👉 return token for frontend/localStorage if needed
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

// ✅ LOGIN USER
module.exports.login = async function (req, res) {
  try {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
     httpOnly: false,
  sameSite: "lax",    // ✅ Allows cookies from different port
  secure: false,
    });

    res.status(200).json({
      message: "Login successful",
      token, // 👉 return token for frontend/localStorage if needed
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

// ✅ LOGOUT USER
module.exports.logoutUser = async function (req, res) {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};


// ✅ CHECK LOGGED-IN USER
module.exports.checkUser = async function (req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const dbUser = await userModel.findById(user.id).select("name email");
    res.status(200).json({ user: dbUser });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};
