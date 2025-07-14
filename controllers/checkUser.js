// ✅ CHECK LOGGED-IN USER
module.exports.checkUser = async function (req, res) {
  try {
    // Debug: Check if user is attached by protect middleware
    console.log("req.user:", req.user);

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const firstLetter = req.user.name
      ? req.user.name.charAt(0).toUpperCase()
      : null;

    res.status(200).json({
      message: "User is logged in",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        firstLetter: firstLetter,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking user" });
  }
};