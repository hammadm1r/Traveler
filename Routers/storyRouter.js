const router = require('express').Router()
const {addStory} = require('../Controllers/storyController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { storyUpload } = require('../Middleware/uploads');

router.post('/addstory',verifyAuthToken,storyUpload,addStory);

module.exports = router;