const Post = require("../Models/post");
const user = require("../Models/user");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");
const cloudinary = require("../Utils/cloudinaryConfig");
const Notification = require("../Models/notification");
const { notify } = require("../socket");
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
    // Assigning Achivements if Any

    
    let achivement;
    if(auther.posts.length === 0){
      achivement = "first_Step";
      const alreadyHasBadge = auther.badges?.some(badge => badge.name === achivement);
      if (!alreadyHasBadge) {
        if (!auther.badges) {
          auther.badges = []; // Ensure array exists
        }
        
        auther.badges.push({
          name: achivement,
          awardedAt: new Date(), // Ensure the date is set
        });
        
        await auther.save();
      }
    }
    if(auther.posts.length === 99){
      achivement = "Cultural_Traveler";
      if (!alreadyHasBadge) {
        auther.badges.push({
          name: achivement,
          awardedAt: new Date(), // Ensure the date is set
        });
        
        await auther.save();
      }
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
    
    
    const message = "Post Has Been Uploarded"
    // Return a success response with the created post
    return res.send(success(201, {newPost,message,achivement}));
  } catch (err) {
    console.error(err); // Log the error for debugging purposes
    return res.send(error(500, "Something went wrong"));
  }
};

const likeAndUnlikePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const curUserId = req.user.user_Id;
    // Find the post by ID and populate the userId reference
    const post = await Post.findById(postId).populate("userId");
    const postOwner = await user.findById(post.userId);
    if (!post) {
      return res.status(404).json(error(404, "Post Not Found"));
    }

    // Check if the user has already liked the post
    const isLiked = post.likes.includes(curUserId);

    // Perform the atomic like/unlike operation
    const updateOperation = isLiked
      ? { $pull: { likes: curUserId } } // Remove the user ID from likes array
      : { $addToSet: { likes: curUserId } }; // Add the user ID to likes array
    // Update the post and return the updated post
    let achivement;
if (post.likes.length === 0 && !isLiked) {
  achivement = "explorer";

  const hasBadge = postOwner.badges.some(obj => obj.name === achivement);

  if (!hasBadge) {
    postOwner.badges.push({
      name: achivement,
      awardedAt: new Date(),
    });

    await postOwner.save();
    const notification = new Notification({
        recipient: post.userId._id, // Post owner
        sender: post.userId._id,
        type: 'Achivement',
        post: postId,
      });
      await notification.save();
      notify(notification);
  }
}

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
    
    console.log('post user',post.userId._id,'Post Id', postId);
    if(!isLiked){
      if(!(post.userId._id.toString() === curUserId)){
      const notification = new Notification({
        recipient: post.userId._id, // Post owner
        sender: curUserId,
        type: 'like',
        post: postId,
      });
      await notification.save();
      notify(notification);
    }}
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
    const postOwner = await user.findById(post.userId);
    // Create a comment object
    const comment = {
      userId: curUserId,
      commentText: commentText,
    };

    let achivement;
    if (post.comments.length === 0  ) {
      achivement = "Nature_Lover";
      console.log("In COmment");
      const hasBadge = postOwner.badges.some(obj => obj.name === achivement);
    
      if (!hasBadge) {
        postOwner.badges.push({
          name: achivement,
          awardedAt: new Date(),
        });
    
        await postOwner.save();
      }
    }

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

    if(!(post.userId._id.toString() === curUserId)){
      const notification = new Notification({
        recipient: post.userId._id, // Post owner
        sender: curUserId,
        type: 'comment',
        post: postId,
      });
      console.log('Inside Notify');
      await notification.save();
      console.log('Entring Notify')
      notify(notification);
    }
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

const ratePost = async (req, res) => {
  try {
    const { postId, rating } = req.body;

    if (!postId || !rating) {
      return res.status(400).json(error(400, "Post ID and rating are required"));
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json(error(400, "Rating must be between 1 and 5"));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json(error(404, "Post not found"));
    }

    post.rating = rating;
    await post.save();

    return res.status(200).json(success(200, { message: "Rating updated", rating }));
  } catch (err) {
    console.error("Rating error:", err);
    return res.status(500).json(error(500, "Server error while rating"));
  }
};




const searchAll = async (req, res) => {
  try {
    const { query } = req.query;
    const curUserId = req.user.user_Id;

    if (!query) {
      return res.status(400).json(error(400, "Search query is required"));
    }

    // Search Users
    const users = await User.find({
      $or: [
        { fullname: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
    }).select("username fullname profilePicture bio");

    // Search Posts
    const posts = await Post.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { hashtags: { $in: [new RegExp(query, "i")] } },
      ],
    })
      .populate("userId", "fullname username profilePicture")
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "fullname profilePicture",
        },
      });

    const formattedPosts = posts.map((post) => mapPostOutput(post, curUserId));

    return res.status(200).json(
      success(200, {
        users,
        posts: formattedPosts,
      })
    );
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json(error(500, "Internal Server Error"));
  }
};





module.exports = { createPost, likeAndUnlikePost, addComment, deleteComment, deletePost, getPost ,searchAll, ratePost,};
