const story = require("../Models/story");
const user = require("../Models/user");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");
const express = require("express");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const addStory = async (req, res) => {
  try {
    const { title, lat, long } = req.body;

    if (!title || !lat || !long) {
      return res.send(error(400, "All fields are required"));
    }

    if (!req.file) {
      return res.send(error(400, "Story media is required"));
    }

    console.log("Received File");

    const resourceType = req.file.mimetype.startsWith("video/") ? "video" : "image";

    let media;
    try {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "Story_Media",
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) {
              return reject({
                message: "Upload to Cloudinary failed",
                error,
              });
            }
            resolve({ public_id: result.public_id, url: result.secure_url });
          }
        );
        stream.end(req.file.buffer);
      });

      media = await uploadPromise;
      console.log("Uploaded media details:", media);
    } catch (uploadError) {
      return res.send(error(500, "Failed to upload media"));
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
      video: media, // Save media object directly
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

  res.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}

module.exports = { addStory,generateSignature };
