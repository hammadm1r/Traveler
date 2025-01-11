const Post = require("../Models/post");
const user = require("../Models/user");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");
const cloudinary = require("../Utils/cloudinaryConfig");

const createPost = async (req, res) => {
  try {
    // Destructure the required fields from the request body
    const { title, description, location, hashtags, rating, tags } = req.body;
    console.log(req.body);
    // Check if all required fields are present
    if (!title || !description || !location  || !rating) {
      return res.send(error(400, "All fields are required"));
    }
    if (tags && tags.length > 0) {
      const existingUsers = await user.find({ username: { $in: tags } }); // Assuming tags contain usernames
      if (existingUsers.length !== tags.length) {
        return res.send(error(400, "Some tagged users do not exist"));
      }
    }
    const auther_Id = req.user.user_Id;
    const auther = await user.findById(auther_Id);
    let media = [];
    if (req.files && req.files.length > 0) {
      // Create an array of promises for each image upload
      const imageUploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
              if (error) {
                return reject(
                  new Error(
                    "Error uploading image to Cloudinary: " + error.message
                  )
                );
              }
              // Resolve with the media object
              resolve({
                url: result.secure_url, // URL of the uploaded media
                publicId: result.public_id, // Public ID of the uploaded media
              });
            }
          );
          uploadStream.end(file.buffer); // End the stream with the file buffer
        });
      });

      // Wait for all image uploads to complete
      media = await Promise.all(imageUploadPromises);
    }
    // Create a new post
    const newPost = await Post.create({
      userId: req.user.user_Id,
      title,
      description,
      location,
      hashtags,
      rating,
      tags: tags || [], // If tags are not provided, default to an empty array
      media,
    });
    auther.posts.push(newPost._id);
    await auther.save();
    const message = "Post Has Been Uploarded"
    // Return a success response with the created post
    return res.send(success(201, {newPost,message}));
  } catch (err) {
    console.error(err); // Log the error for debugging purposes
    return res.send(error(500, "Something went wrong"));
  }
};

const likeAndUnlikePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const curUserId = req.user.user_Id;
    console.log(postId);
    console.log(curUserId);
    console.log(req.body)
    // Find the post by ID and populate the userId reference
    const post = await Post.findById(postId).populate("userId");
    console.log("83")
    if (!post) {
      return res.status(404).json(error(404, "Post Not Found"));
    }
    console.log("87")

    // Check if the user has already liked the post
    const isLiked = post.likes.includes(curUserId);

    // Perform the atomic like/unlike operation
    const updateOperation = isLiked
      ? { $pull: { likes: curUserId } } // Remove the user ID from likes array
      : { $addToSet: { likes: curUserId } }; // Add the user ID to likes array
    // Update the post and return the updated post
    const message = isLiked
    ? 'You have unliked the post.'
    : 'You have liked the post.';
    const updatedPost = await Post.findByIdAndUpdate(postId, updateOperation, {
      new: true,
    }).populate("userId");
    console.log(updatedPost);
    const responsePost = await updatedPost.populate({
      path: 'comments', // Populate comments
      populate: {
        path: 'userId', // Assuming each comment has an 'author' field to populate
        select: 'fullname profilePicture',
      },
    });
    // Return the response with the mapped output of the updated post
    return res
      .status(200)
      .json(success(200, { post: mapPostOutput(responsePost, curUserId),message }));
  } catch (err) {
    console.error("Error in likeAndUnlikePost:", err); // Log the error for debugging purposes
    return res.status(500).json(error(500, "Something went wrong"));
  }
};

const addComment = async (req, res) => {
  try {
    const { postId, commentText } = req.body;
    const curUserId = req.user.user_Id;

    // Find the post by ID and populate the userId reference
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(error(404, "Post Not Found"));
    }

    // Create a comment object
    const comment = {
      userId: curUserId,
      commentText: commentText,
    };

    // Push the comment object into the comments array
    post.comments.push(comment);

    // Save the updated post
    await post.save();
    let responsePost = await Post.findById(postId).populate({
      path: 'userId', // Populate user data
    })
    .populate({
      path: 'comments', // Populate comments
      populate: {
        path: 'userId', // Assuming each comment has an 'author' field to populate
        select: 'fullname profilePicture',
      },
    });
    responsePost = mapPostOutput(responsePost, curUserId)
    responsePost.comments = responsePost.comments.reverse();
    console.log(responsePost.comments);

    // Return the response with the mapped output of the updated post
    return res
      .status(200)
      .json(success(200, { responsePost}));
  } catch (err) {
    console.error("Error in addComment:", err); // Log the error for debugging purposes
    return res.send(error(500, "Something went wrong"));
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    const curUserId = req.user.user_Id;

    // Find the post by ID and populate comments with userId reference
    const post = await Post.findById(postId).populate("comments.userId");
    if (!post) {
      return res.status(404).json(error(404, "Post Not Found"));
    }

    // Find the comment by ID
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json(error(404, "Comment Not Found"));
    }

    // Check if the comment belongs to the current user
    if (comment.userId._id.toString() === curUserId) {
      // Remove the comment from the comments array
      post.comments.pull(commentId);
      // Save the updated post
      await post.save();
      
      // Return the response with the mapped output of the updated post
      return res
        .status(200)
        .json(success(200, { post: mapPostOutput(post, curUserId) }));
    } else {
      return res.status(403).json(error(403, "Unauthorized to delete this comment"));
    }
  } catch (err) {
    return res.send(error(500, "Something went wrong"));
  }
};

const deletePost = async(req,res) =>{
  try {
    const {postId}=req.body;
        const curUserId = req.user.user_Id;
        const post = await Post.findById(postId).populate("userId");
        const curUser = await user.findById(curUserId);
        if(!post){
          return res.send(error(404,"Post Not Found"));
      }
      if(post.userId._id.toString() !== curUserId){
        return res.send(error(403,'Only Owners can Delete Their Post'))
    }
    const index = curUser.posts.indexOf(postId);
    if (index > -1) {
      curUser.posts.splice(index, 1);
      await curUser.save();
    }

    // Remove the post itself
    await Post.findByIdAndDelete(postId);
    return res
        .status(200)
        .json(success(200, { post: mapPostOutput(post, curUserId) }));
  } catch (err) {
    return res.send(error(500, "Something went wrong"));
  }
}
const getPost = async (req, res) => {
  try {
    const { _id } = req.params; // Extract post ID from request parameters
    console.log(_id);

    // Fetch post from the database, populate the userId field
    let post = await Post.findById(_id).populate("userId");
    if (!post) {
      return res.status(404).send(error("Post Not Found")); // Return 404 if post is not found
    }

    console.log(post);

    // Map the post output (assuming mapPostOutput is a method attached to the Post model)
    // Send the post back as a successful response
    return res.status(200).send(success(200,{post:mapPostOutput(post, req.user.user_Id)}));

  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).send(error("Something went wrong")); // Return 500 error if an exception occurs
  }
};



module.exports = { createPost, likeAndUnlikePost, addComment, deleteComment, deletePost, getPost};
