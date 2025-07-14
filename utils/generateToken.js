// let token = jwt.sign({ email, id: user._id },"jkhdsfhsehjkjhk", );
const jwt = require("jsonwebtoken");

module.exports = generateToken = (user) => {
    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return token;
}
