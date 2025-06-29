const router = require('express').Router()
const {createPost,likeAndUnlikePost,addComment,deleteComment,deletePost,getPost,searchAll, ratePost} = require('../Controllers/postController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { multipleUpload } = require('../Middleware/uploads');

router.post('/createpost',verifyAuthToken,multipleUpload,createPost);
router.post('/likepost',verifyAuthToken,likeAndUnlikePost);
router.post('/addcomment',verifyAuthToken,addComment);
router.post('/deletecomment',verifyAuthToken,deleteComment);
router.post('/deletepost',verifyAuthToken,deletePost);
router.get('/:_id',verifyAuthToken,getPost)
router.get("/search", verifyAuthToken, searchAll);
router.post('/ratepost', verifyAuthToken, ratePost); // ⬅️ New route


module.exports = router ;