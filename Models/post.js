const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User", // Reference to the user who made the post
    required: true,
  },
  heading: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String, // Could be city, country, or detailed place name
    required: true,
  },
  hashtags: {
    type: [String], // Array of strings for hashtags
    validate: {
      validator: function (v) {
        return v.length <= 5; // Maximum of 5 hashtags
      },
      message: "You can add up to 5 hashtags only!",
    },
  },
  postingDate: {
    type: Date,
    default: Date.now, // Automatically sets the current date when a post is created
  },
  rating: {
    type: Number, // A number rating for the visited location
    min: 1,
    max: 5,
    required: true,
  },
  media: [
    {
      url: {
        type: String,
        required: true, // Media URLs (images/videos)
      },
      publicId: {
        type: String, // If using a media storage service like Cloudinary
      },
    },
  ],
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to users tagged in the post
    },
  ],
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to the user who liked the post
    },
  ],
  comments: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the user who commented
        required: true,
      },
      commentText: {
        type: String,
        required: true,
      },
      commentedAt: {
        type: Date,
        default: Date.now, // Timestamp for the comment
      },
    },
  ],
});

module.exports = mongoose.model("Post", postSchema);