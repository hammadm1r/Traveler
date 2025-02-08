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
      console.log(user_Id)
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
 
    const updateProfile = async(req,res) =>{
      console.log(req.body);
      
    }


module.exports = { signup, login, getProfile ,updateProfile};
