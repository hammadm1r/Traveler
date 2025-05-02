const story = require("../Models/story");
const user = require("../Models/user");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput, mapStoryOutput } = require("../Utils/utils");
const express = require("express");
const cloudinary = require("../Utils/cloudinaryConfig");
const dotenv = require("dotenv");
const Story = require("../Models/story");
dotenv.config();

const addStory = async (req, res) => {
  try {
    console.log(req.body);
    const { title, lat, long , url, publicId} = req.body;
    if (!title || !lat || !long || !url || !publicId) {
      return res.send(error(400, "All fields are required"));
    }

    if (!req.user || !req.user.user_Id) {
      return res.send(error(401, "Unauthorized: User not logged in"));
    }

    const author = await user.findById(req.user.user_Id);
    if (!author) {
      return res.send(error(404, "User not found"));
    }

    const newStory = await story.create({
      title,
      location: { latitude: lat, longitude: long },
      userId: req.user.user_Id,
      video : {
        url,
        publicId
      }
    });

    let achivement;
      achivement = "nomad";
    const alreadyHasBadge = author.badges?.some(badge => badge.name === achivement);

    if (!alreadyHasBadge) {
    if (!author.badges) {
      author.badges = []; // Ensure array exists
    }
    
    author.badges.push({
      name: achivement,
      awardedAt: new Date(), // Ensure the date is set
    });
    
    await author.save();
  }

    author.stories.push(newStory._id);
    await author.save();

    const message = "Story has been uploaded successfully";
    return res.send(success(201, { newStory, message }));
  } catch (err) {
    console.error("Error in addStory:", err);
    return res.send(error(500, "Something went wrong"));
  }
};

const generateSignature = (req,res) => {
  const timestamp = Math.round(new Date().getTime() / 1000); // Current timestamp
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "Story_Media", // Optional: Specify folder
    },
    process.env.CLOUDINARY_API_SECRET
  );
  console.log(process.env.API_KEY)
  const data = ({
    signature,
    timestamp,
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.API_KEY,
  });
  return res.send(success(201, {data}));
}

const getStory = async(req,res) => {
  const allStory = await story.find().populate('userId', 'profilePicture');
  const curUserId = req.user?.userId;
  return res.json(success(201,{
    stories: allStory.map((story) => mapStoryOutput(story, curUserId)),
  }
  ))
}

const likeAndUnlikeStory = async (req, res) => {
  try {
    const { storyId } = req.body;
    const curUserId = req.user?.userId; // Ensure user is authenticated

    if (!storyId) {
      return res.status(400).json({ success: false, message: "Story ID is required" });
    }

    console.log("StoryId:", storyId, "Current User Id:", curUserId);

    // Validate MongoDB ObjectId format
    if (!storyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid Story ID format" });
    }

    // Fetch the story and handle cases where it is not found
    const curStory = await story.findById(storyId).populate('userId', 'profilePicture');;
    if (!curStory) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    if (!curStory.likes) {
      return res.status(500).json({ success: false, message: "Likes field is missing in the story document" });
    }

    // Check if user already liked the story
    const isLiked = curStory.likes.includes(curUserId);

    if (isLiked) {
      curStory.likes.pull(curUserId);
    } else {
      curStory.likes.push(curUserId);
    }

    await curStory.save(); // Save updated likes

    return res.status(200).json({
      success: true,
      message: isLiked ? "Story unliked successfully" : "Story liked successfully",
      story: mapStoryOutput(curStory,curUserId) // Include total likes count
    });

  } catch (error) {
    console.error("Error in likeAndUnlikeStory:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later",
      error: error.message, // Include detailed error message
    });
  }
};




module.exports = { addStory,generateSignature,getStory,likeAndUnlikeStory };
