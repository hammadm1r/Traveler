const user = require("../Models/user");
const { success, error } = require("../Utils/responseWrapper");
const { signjwt } = require("../Middleware/jwtAuthMiddleware");

const signup = async (req, res) => {
  try {
    console.log(req.body);
    const {username,fullname,email,password,dateOfBirth,profilePicture } = req.body;
    if (!username || !email || !password || !dateOfBirth || !fullname) {
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
    let UploadedImg = { public_id: null, url: "/uploads/defaultProfileImage.png" }; // default empty object
    if (req.file.filename) {
      UploadedImg = { url:`/uploads/${req.file.filename}`};
    }
    const newUser = new user({ username, fullname, email, password, dateOfBirth, profilePicture:{
        url:UploadedImg.url,
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

module.exports = {signup,login, getProfile };
