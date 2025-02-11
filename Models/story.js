const mongoose = require('mongoose');
const cloudinary = require("../Utils/cloudinaryConfig");

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  video: {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    }
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Reference to the user who liked the post
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: "24h" }
  },
});


const Story = mongoose.model('Story', storySchema);
module.exports = Story;
