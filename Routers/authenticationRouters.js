const router = require('express').Router()
const {signup,login,getProfile} = require('../Controllers/authenticationController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { singleUpload } = require('../Middleware/uploads');

router.post('/signup',singleUpload,signup);
router.post('/login',login);
router.get('/profile',verifyAuthToken,getProfile);
module.exports = router;