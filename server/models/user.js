const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },
    
  profilePic: {
      type: String,
      enum: ["/female-avatar.png" ,"/male-avatar.png"],
      required: true
  }
});



const user = mongoose.model("User", userSchema);

module.exports =user;