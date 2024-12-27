const story = require("../Models/story");
const user = require("../Models/user")
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");
const cloudinary = require("../Utils/cloudinaryConfig");

const addStory = async (req, res) => {
  try {
    // Destructure the required fields from the request body
    console.log(req.body);
    const { title,lat,long } = req.body;
    console.log(req.body);
    // Check if all required fields are present
    if (!title || !lat || !long ) {
      return res.send(error(400, "All fields are required"));
    }
    if (!req.file) {
        return res.send(error(400, "Story video is required"));
    }
    if (req.file) {
          // Create a promise to handle the async upload
          const uploadPromise = new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "Profile_Pictures" },
              (error, result) => {
                if (error) {
                  return reject({ message: "Upload to Cloudinary failed", error });
                }
                resolve({ public_id: result.public_id, url: result.secure_url });
              }
            );
    
            // Send the buffer to Cloudinary
            stream.end(req.file.buffer);
          });
    
          // Wait for the upload to complete
          video = await uploadPromise;
        }
        console.log(req.user.user_Id)
    const auther = await user.findById(req.user.user_Id);

    // Create a new post
    const newStory = await story.create({
        title,
        location: { latitude: lat, longitude: long },
        userId: req.user.user_Id,
        video,
      });
    auther.stories.push(newStory._id);
    await auther.save();
    const message = "Story Has Been Uploarded"
    // Return a success response with the created post
    return res.send(success(201, {newStory,message}));
  } catch (err) {
    console.error(err); // Log the error for debugging purposes
    return res.send(error(500, "Something went wrong"));
  }
};

module.exports = {addStory}