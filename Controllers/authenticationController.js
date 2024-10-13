const User = require('../Models/user');
const {success,error} = require('../Utils/responseWrapper');

function signup(req,res){
    const {username,email,password,dateOfBirth} = req.body
    res.json(username);
}

module.exports = {signup}