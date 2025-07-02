const router = require('express').Router()
const {signup,login,getProfile,updateProfile,generateProfilePicSignature} = require('../Controllers/authenticationController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { singleUpload } = require('../Middleware/uploads');

router.post('/signup',signup);
router.get('/signature',generateProfilePicSignature);
router.post('/login',login);
router.post('/updateprofile',verifyAuthToken,singleUpload,updateProfile);
router.get('/profile',verifyAuthToken,getProfile);
module.exports = router;