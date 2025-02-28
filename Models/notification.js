const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  }, // Who will receive it
sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true 
}, // Who triggered the event
type: { 
    type: String, 
    enum: ["like", "follow", "comment"], 
    required: true 
}, // Like or Follow
post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Post" 
}, // Optional, for likes
isRead: { 
    type: Boolean, 
    default: false 
}, // Check if notification is seen
createdAt: { 
    type: Date, 
    default: Date.now 
},
});

module.exports = mongoose.model("Notification", notificationSchema);
