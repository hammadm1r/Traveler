const router = require('express').Router()
const {createPost,likeAndUnlikePost,addComment} = require('../Controllers/postController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { multipleUpload } = require('../Middleware/uploads');

router.post('/createpost',verifyAuthToken,multipleUpload,createPost);
router.post('/likepost',verifyAuthToken,likeAndUnlikePost);
router.post('/addcomment',verifyAuthToken,addComment);
module.exports = router;