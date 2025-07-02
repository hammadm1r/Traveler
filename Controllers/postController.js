const Post = require("../Models/post");
const user = require("../Models/User");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");
const cloudinary = require("../Utils/cloudinaryConfig");
const Notification = require("../Models/notification");
const { notify } = require("../socket");
const createPost = async (req, res) => {
  try {
    const { title, description, location, rating, tags, media, hashtags } = req.body;

    if (!title || !description || !location || !rating || !media || !hashtags) {
      return res.send(error(400, "All fields are required"));
    }

    const parsedMedia = JSON.parse(media);
    const parsedHashtags = JSON.parse(hashtags);

    if (!Array.isArray(parsedMedia) || parsedMedia.length === 0) {
      return res.send(error(400, "Media must be an array"));
    }

    if (tags && tags.length > 0) {
      const existingUsers = await user.find({ username: { $in: tags } });
      if (existingUsers.length !== tags.length) {
        return res.send(error(400, "Some tagged users do not exist"));
      }
    }

    const auther_Id = req.user.user_Id;
    const auther = await user.findById(auther_Id);
    let achivement;

    if (auther.posts.length === 0) {
      achivement = "first_Step";
      const alreadyHasBadge = auther.badges?.some(b => b.name === achivement);
      if (!alreadyHasBadge) {
        auther.badges = auther.badges || [];
        auther.badges.push({ name: achivement, awardedAt: new Date() });
        await auther.save();
      }
    }

    if (auther.posts.length === 99) {
      achivement = "Cultural_Traveler";
      const alreadyHasBadge = auther.badges?.some(b => b.name === achivement);
      if (!alreadyHasBadge) {
        auther.badges.push({ name: achivement, awardedAt: new Date() });
        await auther.save();

        const notification = new Notification({
          recipient: req.user.user_Id,
          sender: req.user.user_Id,
          type: "Achivement",
          post: req.user.user_Id,
        });

        await notification.save();
        notify(notification);
      }
    }

    const newPost = await Post.create({
      userId: req.user.user_Id,
      title,
      description,
      location,
      hashtags: parsedHashtags,
      rating,
      tags: tags || [],
      media: parsedMedia,
    });

    auther.posts.push(newPost._id);
    await auther.save();

    const message = "Post has been uploaded";
    return res.send(success(201, { newPost, message, achivement }));

  } catch (err) {
    console.error("CreatePost Error:", err);
    return res.send(error(500, "Something went wrong"));
  }
};

const generateSignature = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const folder = "Post_Media"; // ✅ Correct format

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET
  );

  const data = {
    signature,
    timestamp,
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.API_KEY,
    folder, // Include the folder so frontend knows where to upload
  };

  return res.send(success(201, { data }));
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

      const hasBadge = postOwner.badges.some((obj) => obj.name === achivement);

      if (!hasBadge) {
        postOwner.badges.push({
          name: achivement,
          awardedAt: new Date(),
        });

        await postOwner.save();
        const notification = new Notification({
          recipient: post.userId._id, // Post owner
          sender: post.userId._id,
          type: "Achivement",
          post: postId,
        });
        await notification.save();
        notify(notification);
      }
    }

    const message = isLiked
      ? "You have unliked the post."
      : "You have liked the post.";
    const updatedPost = await Post.findByIdAndUpdate(postId, updateOperation, {
      new: true,
    }).populate("userId");
    console.log(updatedPost);
    const responsePost = await updatedPost.populate({
      path: "comments", // Populate comments
      populate: {
        path: "userId", // Assuming each comment has an 'author' field to populate
        select: "fullname profilePicture",
      },
    });

    console.log("post user", post.userId._id, "Post Id", postId);
    if (!isLiked) {
      if (!(post.userId._id.toString() === curUserId)) {
        const notification = new Notification({
          recipient: post.userId._id, // Post owner
          sender: curUserId,
          type: "like",
          post: postId,
        });
        await notification.save();
        notify(notification);
      }
    }
    return res
      .status(200)
      .json(
        success(200, { post: mapPostOutput(responsePost, curUserId), message })
      );
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
    if (post.comments.length === 0) {
      achivement = "Nature_Lover";
      console.log("In COmment");
      const hasBadge = postOwner.badges.some((obj) => obj.name === achivement);

      if (!hasBadge) {
        postOwner.badges.push({
          name: achivement,
          awardedAt: new Date(),
        });

        await postOwner.save();
        const notification = new Notification({
          recipient: post.userId._id, // Post owner
          sender: post.userId._id,
          type: "Achivement",
          post: postId,
        });
        await notification.save();
        notify(notification);
      }
    }

    // Push the comment object into the comments array
    post.comments.push(comment);

    // Save the updated post
    await post.save();
    let responsePost = await Post.findById(postId)
      .populate({
        path: "userId", // Populate user data
      })
      .populate({
        path: "comments", // Populate comments
        populate: {
          path: "userId", // Assuming each comment has an 'author' field to populate
          select: "fullname profilePicture",
        },
      });
    responsePost = mapPostOutput(responsePost, curUserId);
    responsePost.comments = responsePost.comments.reverse();
    console.log(responsePost.comments);

    if (!(post.userId._id.toString() === curUserId)) {
      const notification = new Notification({
        recipient: post.userId._id, // Post owner
        sender: curUserId,
        type: "comment",
        post: postId,
      });
      console.log("Inside Notify");
      await notification.save();
      console.log("Entring Notify");
      notify(notification);
    }
    // Return the response with the mapped output of the updated post
    return res.status(200).json(success(200, { responsePost }));
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
      return res
        .status(403)
        .json(error(403, "Unauthorized to delete this comment"));
    }
  } catch (err) {
    return res.send(error(500, "Something went wrong"));
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const curUserId = req.user.user_Id;
    const post = await Post.findById(postId).populate("userId");
    const curUser = await user.findById(curUserId);
    if (!post) {
      return res.send(error(404, "Post Not Found"));
    }
    if (post.userId._id.toString() !== curUserId) {
      return res.send(error(403, "Only Owners can Delete Their Post"));
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
};
const getPost = async (req, res) => {
  try {
    const { _id } = req.params; // Extract post ID from request parameters
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).send(error("Invalid post ID"));
    }
    // Fetch post from the database, populate the userId field
    let post = await Post.findById(_id).populate("userId");
    if (!post) {
      return res.status(404).send(error("Post Not Found")); // Return 404 if post is not found
    }

    console.log(post);

    // Map the post output (assuming mapPostOutput is a method attached to the Post model)
    // Send the post back as a successful response
    return res
      .status(200)
      .send(success(200, { post: mapPostOutput(post, req.user.user_Id) }));
  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).send(error("Something went wrong")); // Return 500 error if an exception occurs
  }
};

const searchAll = async (req, res) => {
  try {
    const { query } = req.query;
    const curUserId = req.user.user_Id;

    if (!query || query.trim() === "") {
      return res.status(400).json(error(400, "Search query is required"));
    }

    // 1. 🔎 Search Users
    const users = await user
      .find({
        $or: [
          { fullname: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
          { bio: { $regex: query, $options: "i" } },
        ],
      })
      .select("username fullname profilePicture bio");

    // 2. 🔎 Search Posts
    const posts = await Post.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { hashtags: { $in: [new RegExp(query, "i")] } }, // supports #hashtag search
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

    // 3. 🧹 Format posts
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

module.exports = {
  createPost,
  likeAndUnlikePost,
  addComment,
  deleteComment,
  deletePost,
  getPost,
  searchAll,
  generateSignature,
};
