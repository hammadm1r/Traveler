const router = require('express').Router()
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const {followAndUnfollow} = require('../Controllers/userController');

router.post('/follow',verifyAuthToken,followAndUnfollow);




module.exports = router;