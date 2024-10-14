const router = require('express').Router()
const {signup,getProfile} = require('../Controllers/authenticationController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')

router.post('/signup',signup);
router.get('/profile',verifyAuthToken,getProfile);
module.exports = router;