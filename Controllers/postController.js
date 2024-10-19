const user = require("../Models/user");
const { success, error } = require("../Utils/responseWrapper");
const { signjwt } = require("../Middleware/jwtAuthMiddleware");

const createPost = async(req,res) =>{
    try{
        return res.send(success(200,req.user.user_Id));
    }catch(err){
        return res.send(error(500,err));
    }
}

module.exports = { createPost}