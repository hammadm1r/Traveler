const router = require('express').Router()
const {addStory,generateSignature} = require('../Controllers/storyController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { storyUpload } = require('../Middleware/uploads');

router.post('/addstory',verifyAuthToken,storyUpload,addStory);
router.get('/generate-signature',generateSignature),

module.exports = router;