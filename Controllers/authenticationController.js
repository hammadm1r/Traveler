const user = require("../Models/user");
const { success, error } = require("../Utils/responseWrapper");
const { signjwt } = require("../Middleware/jwtAuthMiddleware");
const cloudinary = require("../Utils/cloudinaryConfig");

const signup = async (req, res) => {
  try {
    const { username, fullname, email, password, dateOfBirth } = req.body;

    // Validate the required fields
    if (!username || !email || !password || !dateOfBirth || !fullname) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }

    // Check if email or username already exists
    const userMailExist = await user.findOne({ email });
    const userNameExist = await user.findOne({ username });
    if (userMailExist) {
      return res.status(400).json({ error: "Email already exists" });
    }
    if (userNameExist) {
      return res
        .status(400)
        .json({ error: "User with this name already exists" });
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
      profilePicture: CloudImg, // Add the profile picture to user object
    });

    // Save the user to the database
    await newUser.save();

    // Generate token
    const token = signjwt(newUser._id);
    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.log(err);
    return res.send(error(500, err.message));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.send(error(400, "Please fill all the fields"));
    }
    const userExisted = await user.findOne({ email });
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
    console.log(user_Id);
    const profile = await user.findById(user_Id);
    return res.send(success(200, profile));
  } catch (error) {}
};

module.exports = { signup, login, getProfile };
