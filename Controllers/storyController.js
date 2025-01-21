const story = require("../Models/story");
const user = require("../Models/user");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");
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
  return res.json(success(201, {data}));
}

const getStory = async(req,res) => {
  const allStory = await story.find();
  console.log(allStory);
  return res.json(success(201,{allStory}));
}


module.exports = { addStory,generateSignature,getStory };
