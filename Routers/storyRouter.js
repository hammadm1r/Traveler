const router = require('express').Router()
const {addStory,generateSignature,getStory} = require('../Controllers/storyController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { storyUpload } = require('../Middleware/uploads');

router.post('/addstory',verifyAuthToken,addStory);
router.get('/generate-signature',generateSignature),
router.get('/getstory',verifyAuthToken,getStory);
module.exports = router;