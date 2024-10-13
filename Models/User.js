const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: "", // Link or path to user's profile picture
  },
  bio: {
    type: String,
    maxLength: 300, // Optional short bio
  },
  dateOfBirth: {
    type: Date, // Field to store date of birth
    required: true, // Change to true if you want to make it mandatory
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ], // References to the user's posts
  stories: [
    {
      type: Schema.Types.ObjectId,
      ref: "Story",
    },
  ], // References to the user's Stories
  followers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ], // List of followers
  following: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ], // List of following users
  badges: [
    {
      name: {
        type: String,
      },
      description: {
        type: String,
      },
      awardedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('user', userSchema);
