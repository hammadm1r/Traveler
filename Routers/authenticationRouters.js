const router = require('express').Router()
const {signup,login,getProfile} = require('../Controllers/authenticationController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')

router.post('/signup',signup);
router.post('/login',login);
router.get('/profile',verifyAuthToken,getProfile);
module.exports = router;