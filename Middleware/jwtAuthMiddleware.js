const jwt = require('jsonwebtoken')
const {success,error} = require('../Utils/responseWrapper');

const verifyAuthToken = (req,res,next) =>{
    if (
        !req.headers ||
        !req.headers.authorization ||
        !req.headers.authorization.startsWith("Bearer")
      ) {
        return res.send(error(401,'Authorization Header is Required'));
      }
      const token = req.headers.authorization.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        console.log('After Verification');
        next();
    } catch (err) {
        return res.send(error(401,err));
    }
}
const signjwt = (user_Id) =>{
    return jwt.sign({user_Id},process.env.SECRET_KEY)
}


module.exports = {signjwt,verifyAuthToken};

