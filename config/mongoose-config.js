const mongoose = require('mongoose');
const config = require("config");
const dbgr = require("debug")("development:mongoose")
mongoose.connect(`${config.get("MONGODB_URI")}`)
.then(function () {
console.log("✅ MongoDB connected"))    
})
.catch(function(err){
 console.error("❌ MongoDB connection error:", err); // ✅ Proper logging})

module.exports = mongoose.connection;
