const router = require('express').Router()
const {createPost,likeAndUnlikePost,addComment,deleteComment,deletePost,getPost} = require('../Controllers/postController')
const {verifyAuthToken} = require('../Middleware/jwtAuthMiddleware')
const { multipleUpload } = require('../Middleware/uploads');

const setupPostRoutes = (io,onlineUsers) => {
router.post('/createpost',verifyAuthToken,multipleUpload,createPost);
router.post('/likepost',verifyAuthToken,(req,res)=>likeAndUnlikePost(req,res,io,onlineUsers));
router.post('/addcomment',verifyAuthToken,addComment);
router.post('/deletecomment',verifyAuthToken,deleteComment);
router.post('/deletepost',verifyAuthToken,deletePost);
router.get('/:_id',verifyAuthToken,getPost)
return router;
}
module.exports = { router, setupPostRoutes };