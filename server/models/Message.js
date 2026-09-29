const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        
    },

    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
      
    },
    message: {
        type: String,
        default: ""
    },

    mediaUrl: {
        type: String,
        default: ""
    },

    mediaName: {
        type: String,
        default: ""
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedForEveryone: {
        type: Boolean,
        default: false
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Message = mongoose.model("Message",messageSchema);
module.exports = Message;