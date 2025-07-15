const router = require('express').Router()
const {createPost,likeAndUnlikePost,addComment,deleteComment,deletePost,getPost,searchAll, generateSignature} = require('../Controllers/postController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { multipleUpload } = require('../Middleware/uploads');
const {optionalAuthToken} = require('../Middleware/jwtAuthMiddleware')

router.post('/createpost',verifyAuthToken,multipleUpload,createPost);
router.get('/signature',verifyAuthToken,generateSignature);
router.post('/likepost',verifyAuthToken,likeAndUnlikePost);
router.post('/addcomment',verifyAuthToken,addComment);
router.post('/deletecomment',verifyAuthToken,deleteComment);
router.post('/deletepost',verifyAuthToken,deletePost);
router.get("/search",verifyAuthToken, searchAll);
router.get('/:_id',optionalAuthToken,getPost)
router.get("/search", verifyAuthToken, searchAll);

module.exports = router ;