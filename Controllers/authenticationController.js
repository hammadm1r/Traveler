const user = require("../Models/user");
const { success, error } = require("../Utils/responseWrapper");
const { signjwt } = require("../Middleware/jwtAuthMiddleware");
const mongoose = require("mongoose");
const { mapPostOutput } = require("../Utils/utils");
const cloudinary = require("../Utils/cloudinaryConfig");

const signup = async (req, res) => {
  try {
    console.log(req.body);
    const { username, fullname, email, password, dateOfBirth,bio,kofi } = req.body;
    console.log(req.body);
    // Validate the required fields
    if (!username || !email || !password || !dateOfBirth || !fullname || !bio) {
      return res.send(error(400, "Please fill all the fields"));
    }

    // Check if email or username already exists
    const userMailExist = await user.findOne({ email });
    const userNameExist = await user.findOne({ username });
    if (userMailExist) {
      return res.send(error(400, "Email already exists"));
    }
    if (userNameExist) {
      return res.send(error(400, "User with this name already exists"));
    }

    // Initialize default profile image
    let CloudImg = { public_id: null, url: "/https://res.cloudinary.com/djiqzvcev/image/upload/v1729021294/blank-profile-picture-973460_1280_kwgltq.png" }; // default empty object
    console.log("fuick");
    // Handle file upload to Cloudinary
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
      CloudImg = await uploadPromise;
    }
    console.log("Line 52");
    // Create new user with or without uploaded profile image
    const newUser = new user({
      username,
      fullname,
      email,
      password,
      dateOfBirth,
      koFiUrl: kofi,
      bio,
      profilePicture: CloudImg, // Add the profile picture to user object
    });
    console.log(newUser);
    // Save the user to the database
    await newUser.save();

    // Generate token
    const token = signjwt(newUser._id);
    return res.send(success(200, token ));
  } catch (err) {
    console.log(err);
    return res.send(error(500, err.message));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (!email || !password) {
      return res.send(error(400, "Please fill all the fields"));
    }
    const userExisted = await user.findOne({ email }).select('+password');;
    console.log(userExisted);
    if (!userExisted) {
      return res.send(error(403, "User does'nt Existed"));
    }
    const isMatch = await userExisted.comparePassword(password);
    if (!isMatch) {
      return res.send(error(403, "Incorrect Password"));
    }
    const token = signjwt(userExisted._id);
    return res.send(success(200, { token }));
  } catch (err) {
    return res.send(error(400, err));
  }
};

const getProfile = async (req, res) => {
  try {
    const user_Id = req.user.user_Id;  
        // Find the user by ID
        const userProfile = await user.findById(user_Id);
    
        // If user profile not found, return a 404 error
        if (!userProfile) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Populate the posts with the 'userId' field data
        const allPosts = await userProfile.populate({
          path: 'posts', // Assuming 'posts' is an array of post references in the user model
          populate: [{
            path: 'userId', // Assuming each post has a 'userId' field that you want to populate
          },{
            path: 'comments', populate: { path: 'userId',select: 'fullname profilePicture', } // Assuming 'comments' is another field to populate
          },
        ]});

        const posts = allPosts?.posts?.map(item => mapPostOutput(item, req._id)).reverse();
        // Log populated user profile (you can modify this or remove it later)
        // Return the user profile and posts
        return res.status(200).json({
          success: true,
          data: {userProfile,posts}
        });
    
      } catch (err) {
        console.error(err);
        // Handle errors
        return res.status(500).json({
          success: false,
          message: "Server error",
          error: err.message,
        });
      }
    }
 
    const updateProfile = async (req, res) => {
      try {
        console.log("Request Body:", req.body);
        const user_Id = req.user.user_Id;
        const { fullname, username, email, password, dateOfBirth, bio } = req.body;
        console.log("Bio received:", bio);
    
        // Find the current user
        const existingUser = await user.findById(user_Id);
        if (!existingUser) {
          return res.send(error(404, "User not found"));
        }
    
        // Check if username already exists (excluding current user)
        if (username && username !== existingUser.username) {
          const usernameExists = await user.findOne({ 
            username, 
            _id: { $ne: user_Id } 
          });
          if (usernameExists) {
            return res.send(error(400, "Username already exists"));
          }
        }
    
        // Check if email already exists (excluding current user)
        if (email && email !== existingUser.email) {
          const emailExists = await user.findOne({ 
            email, 
            _id: { $ne: user_Id } 
          });
          if (emailExists) {
            return res.send(error(400, "Email already exists"));
          }
        }
    
        // Validate bio length
        if (bio && bio.length > 300) {
          return res.send(error(400, "Bio cannot exceed 300 characters"));
        }
    
        // Handle profile image upload
        let CloudImg = existingUser.profilePicture;
        if (req.file) {
          // Upload new profile image to Cloudinary
          const uploadPromise = new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { 
                folder: "Profile_Pictures",
                transformation: [
                  { width: 500, height: 500, crop: 'fill' }
                ]
              },
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
          CloudImg = await uploadPromise;
    
          // If there was a previous image, delete it from Cloudinary
          if (existingUser.profilePicture?.public_id) {
            await cloudinary.uploader.destroy(existingUser.profilePicture.public_id);
          }
        }
    
        // Update user fields
        if (fullname) existingUser.fullname = fullname;
        if (username) existingUser.username = username;
        if (email) existingUser.email = email;
        if (dateOfBirth) existingUser.dateOfBirth = dateOfBirth;
        if (bio !== undefined) existingUser.bio = bio; // Allow empty string
        
        // Update profile picture if a new one was uploaded
        if (CloudImg) existingUser.profilePicture = CloudImg;
    
        // Handle password update
        if (password) {
          existingUser.password = password; // This assumes your pre-save middleware handles password hashing
        }
    
        // Save the updated user
        await existingUser.save();
    
        // Prepare response (exclude sensitive information)
        const updatedUserResponse = {
          fullname: existingUser.fullname,
          username: existingUser.username,
          email: existingUser.email,
          dateOfBirth: existingUser.dateOfBirth,
          profilePicture: existingUser.profilePicture,
          bio: existingUser.bio,
          koFiUrl: existingUser.koFiUrl
        };
    
        // Send success response
        return res.send(success(200, updatedUserResponse));
      } catch (err) {
        console.error('Profile update error:', err);
        return res.send(error(500, "Internal server error"));
      }
    };


module.exports = { signup, login, getProfile ,updateProfile};
