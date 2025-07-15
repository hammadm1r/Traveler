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


const optionalAuthToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded; // Add user if token is valid
    } catch (err) {
      console.warn("Invalid token in optionalAuthToken:", err.message);
      req.user = null; // Ignore token errors
    }
  } else {
    req.user = null; // No token provided
  }

  next();
};

module.exports = {signjwt,verifyAuthToken,optionalAuthToken};

