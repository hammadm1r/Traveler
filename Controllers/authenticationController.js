const user = require("../Models/user");
const { success, error } = require("../Utils/responseWrapper");
const { signjwt } = require("../Middleware/jwtAuthMiddleware");

const signup = async (req, res) => {
  try {
    console.log(req.body);
    const {username,email,password,dateOfBirth,profilePicture } = req.body;
    if (!username || !email || !password || !dateOfBirth) {
      return res.send(error(400, "Please fill all the fields"));
    }
    const userMailExist = await user.findOne({ email });
    const userNameExist = await user.findOne({ username });
    if (userMailExist) {
      return res.send(error(400, "Email already exist"));
    }
    if (userNameExist) {
      return res.send(error(400, "User with this name already exist"));
    }
    let cloudImg = { public_id: null, url: null }; // default empty object
    if (profilePicture) {
      cloudImg = await cloudinary.uploader.upload(profilePicture, {
        folder: "Profile_Pictures"
      });
      console.log(cloudImg);
    }
    const newUser = new user({ username, email, password, dateOfBirth, profilePicture:{
        publicId:cloudImg.public_id,
        url:cloudImg.url,
    } });
    await newUser.save();
    const token = signjwt(newUser._id);
    return res.send(success(200, token));
  } catch (err) {
    return res.send(error(400, err));
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

module.exports = { signup,login, getProfile };
