const router = require('express').Router()
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const {followAndUnfollow,getFeedData,getUserProfile,getNotifications} = require('../Controllers/userController');

router.post('/follow',verifyAuthToken,followAndUnfollow);
router.get('/feed', verifyAuthToken , getFeedData);
router.get('/getuserprofile/:_id',verifyAuthToken,getUserProfile);
router.get('/getnotification',verifyAuthToken,getNotifications);


module.exports = router;