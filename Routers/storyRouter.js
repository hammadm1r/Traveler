const router = require('express').Router()
const {addStory,generateSignature,getStory,likeAndUnlikeStory} = require('../Controllers/storyController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { storyUpload } = require('../Middleware/uploads');

router.post('/addstory',verifyAuthToken,addStory);
router.get('/generate-signature',generateSignature),
router.get('/getstory',verifyAuthToken,getStory);
router.post('/like',verifyAuthToken,likeAndUnlikeStory);
module.exports = router;