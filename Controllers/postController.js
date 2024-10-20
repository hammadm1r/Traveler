const Post = require("../Models/post");
const user = require('../Models/user');
const { success, error } = require("../Utils/responseWrapper");
const cloudinary = require("../Utils/cloudinaryConfig");

const createPost = async (req, res) => {
    try {
        // Destructure the required fields from the request body
        const { title, description, location, hashtags, rating ,tags } = req.body;
        
        // Check if all required fields are present
        if (!title || !description || !location || !hashtags || !rating) {
            return res.send(error(400, "All fields are required"));
        }
        if (tags && tags.length > 0) {
            const existingUsers = await user.find({ username: { $in: tags } });  // Assuming tags contain usernames
            if (existingUsers.length !== tags.length) {
                return res.send(error(400, "Some tagged users do not exist"));
            }
        }
        const auther_Id = req.user.user_Id
        const auther = await user.findById(auther_Id);
        let media = [];
        if (req.files && req.files.length > 0) {
            // Create an array of promises for each image upload
            const imageUploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
                        if (error) {
                            return reject(new Error("Error uploading image to Cloudinary: " + error.message));
                        }
                        // Resolve with the media object
                        resolve({
                            url: result.secure_url, // URL of the uploaded media
                            publicId: result.public_id // Public ID of the uploaded media
                        });
                    });
                    uploadStream.end(file.buffer); // End the stream with the file buffer
                });
            });

            // Wait for all image uploads to complete
            media = await Promise.all(imageUploadPromises);
        }
        // Create a new post
        const newPost = await Post.create({
            userId: req.user.user_Id,
            title,
            description,
            location,
            hashtags,
            rating,
            tags: tags || [], // If tags are not provided, default to an empty array
            media
        });
        auther.posts.push(newPost._id);
        await auther.save();
        // Return a success response with the created post
        return res.send(success(201, newPost));
    } catch (err) {
        console.error(err);  // Log the error for debugging purposes
        return res.send(error(500, "Something went wrong"));
    }
}

module.exports = { createPost };
