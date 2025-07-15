const mongoose = require('mongoose');
const config = require("config");
const dbgr = require("debug")("development:mongoose")
mongoose.connect(`${config.get("mongodb+srv://paliwalarpit180:oyANJmADfmOAKiUy@cluster0.ybr1tgz.mongodb.net/buykrao?retryWrites=true&w=majority")}`)
.then(function () {
    dbgr("connected");
    
})
.catch(function(err){
 dgbr(err);
})

module.exports = mongoose.connection;
