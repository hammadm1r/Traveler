const Post = require("../Models/post");
const user = require("../Models/User");
const mongoose = require("mongoose");
const { mapPostOutput } = require("../Utils/utils");
const { success, error } = require("../Utils/responseWrapper");
const { getTrendingPosts, getRandomPosts } = require("../Utils/helpers");
const Notification = require("../Models/notification");
const { notify } = require("../socket");

const followAndUnfollow = async (req, res) => {
  try {
    const curUserId = req.user.user_Id;
    const { followId } = req.body;
    console.log(req.body);
    // Check for self-follow attempt
    if (curUserId === followId) {
      return res.status(400).send(error(400, "You can't follow yourself"));
    }

    // Fetch current user and the user to be followed/unfollowed
    const curUser = await user.findById(curUserId);
    const followUser = await user.findById(followId);

    if (!curUser) {
      return res.status(400).send(error(400, "Current user doesn't exist"));
    }

    if (!followUser) {
      return res
        .status(400)
        .send(error(400, "User to follow/unfollow doesn't exist"));
    }

    let isFollowing = curUser.following.includes(followId);

    // Follow or unfollow logic
    if (isFollowing) {
      // Unfollow
      curUser.following = curUser.following.filter(
        (id) => id.toString() !== followId.toString()
      );
      followUser.followers = followUser.followers.filter(
        (id) => id.toString() !== curUserId.toString()
      );
      console.log(
        "After unfollowing:",
        curUser.following,
        followUser.followers
      );
    } else {
      // Follow
      curUser.following.push(followId);
      followUser.followers.push(curUserId);
      
    }

    let achivement;
    if (followUser.followers.length === 0 ) {
      achivement = "adventurer";
      const hasBadge = followUser.badges.some(obj => obj.name === achivement);
    
      if (!hasBadge) {
        followUser.badges.push({
          name: achivement,
          awardedAt: new Date(),
        });
    
        await followUser.save();
        const notification = new Notification({
                    recipient: req.user.user_Id, // Post owner
                    sender: req.user.user_Id,
                    type: 'Achivement',
                    post: req.user.user_Id,
                  });
                  await notification.save();
                  notify(notification);
      }
    }

    // Save changes
    await curUser.save();
    await followUser.save();
    if(!isFollowing){
      const notification = new Notification({
        recipient: followId, // Post owner
        sender: curUserId,
        type: 'follow',
    })
    await notification.save();
    notify(notification)
    }
    return res.status(200).send(
      success(200, {
        message: isFollowing
          ? "User unfollowed successfully"
          : "User followed successfully",
        user: {
          username: followUser.username,
          followersCount: followUser.followers,
          followingCount: followUser.following,
          isFollowing: !isFollowing,
        },
        currentUser: {
          username: curUser.username,
          followersCount: curUser.followers,
          followingCount: curUser.following,
        },
      })
    );
  } catch (err) {
    console.error("Error in followAndUnfollow:", err);
    return res.status(500).send(error(500, "Something went wrong"));
  }
};

const getFeedData = async (req, res) => {
  try {
    // Get the current user's ID
    const curUserId = req.user.user_Id;
    // Fetch the current user and populate 'following'
    const curUser = await user.findById(curUserId);
    // Get the IDs of the users that the current user follows
    const followingIds = curUser.following.map((item) => item._id);
    followingIds.push(req.user.user_Id); // Add current user's own ID to include their own posts in the feed
    // Fetch posts from users that the current user follows

    const followingPosts = await Post.find({
      userId: { $in: followingIds },
    })
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
    const trending = await getTrendingPosts();
    console.log('After Treanding :',trending);
        const postMap = new Map();
    // Add following posts to the map
    followingPosts.forEach((post) => {
      postMap.set(post._id.toString(), post); // Use string ID as key
    });
    // Add trending posts to the map (skipping duplicates)
    trending.forEach((post) => {
      if (!postMap.has(post._id.toString())) {
        postMap.set(post._id.toString(), post);
      }
    });
    // Convert the map values back to an array
    const fullPosts = Array.from(postMap.values());
    const posts = fullPosts
      .map((item) => mapPostOutput(item, curUserId))
      .reverse(); // Reverse to show newest first
    // Send back only the posts (no user details or suggestions)
    return res.send(success(200, posts));
  } catch (err) {
    // If an error occurs, send a 500 error response
    return res.send(error(500, err));
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { _id } = req.params;
    console.log(_id);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    // Find the user by ID
    const userProfile = await user.findById(_id);

    // If user profile not found, return a 404 error
    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    // Populate the posts with the 'userId' field data
    const allPosts = await userProfile.populate({
      path: "posts", // Assuming 'posts' is an array of post references in the user model
      populate: [
        {
          path: "userId", // Assuming each post has a 'userId' field that you want to populate
        },
        {
          path: "comments",
          populate: { path: "userId", select: "fullname profilePicture" }, // Assuming 'comments' is another field to populate
        },
      ],
    });

    const posts = allPosts.posts
      .map((item) => mapPostOutput(item, req.user.user_Id))
      .reverse();
    const isFollowing = userProfile.followers.includes(req.user.user_Id);
    // Log populated user profile (you can modify this or remove it later)
    // Return the user profile and posts
    return res.status(200).json({
      success: true,
      data: { userProfile, posts, isFollowing },
    });
  } catch (err) {
    console.error(err);
    // Handle errors
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


const getNotifications = async (req,res) => {
  try {
    const curUserId = req.user.user_Id;
    const notificationList = await Notification.find({ recipient: curUserId.toString() }).populate({
      path: 'sender',
      select: 'profilePicture username',
    });

    return res.status(200).json({ success: true, notifications: notificationList });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


module.exports = { followAndUnfollow, getFeedData, getUserProfile, getNotifications };
