const router = require('express').Router()
const {createPost} = require('../Controllers/postController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const upload = require('../Middleware/uploads')

router.post('/createpost',verifyAuthToken,createPost);
module.exports = router;