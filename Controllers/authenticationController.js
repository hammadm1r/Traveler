const user = require('../Models/user');
const {success,error} = require('../Utils/responseWrapper');
const {signjwt} = require('../Middleware/jwtAuthMiddleware')
const signup = async(req,res) =>{
    try {
        
        const {username,email,password,dateOfBirth} = req.body
        if(!username||!email||!password||!dateOfBirth){
            return res.status(400).json({message:'Please fill all the fields'})
        }
        const userMailExist = await user.findOne({email});
        const userNameExist = await user.findOne({username});
        if(userMailExist){
            return res.status(400).json({message:'Email already exist'})
        }
        if(userNameExist){
            return res.status(400).json({message:'User with this name already exist'})
        }
        const newUser = new user({username,email,password,dateOfBirth});
        await newUser.save();
        const token = signjwt(newUser._id);
        return res.send(success(200,token));
    } catch (err) {
        return res.send(error(400,err));
    }
}

const getProfile = async(req,res) =>{
    try {
        const user_Id = req.user.user_Id;
        console.log(user_Id);
        const profile = await user.findById(user_Id);
        return res.send(success(200,profile));
    } catch (error) {
        
    }
}

module.exports = {signup,getProfile}