const Post = require("../Models/post");
const user = require("../Models/user");
const { mapPostOutput } = require("../Utils/utils");
const { success, error } = require("../Utils/responseWrapper");

const followAndUnfollow = async (req, res) => {
    try {
        const curUserId = req.user.user_Id;
        const { followId } = req.body;

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
            return res.status(400).send(error(400, "User to follow/unfollow doesn't exist"));
        }

        let isFollowing = curUser.following.includes(followId);

        // Follow or unfollow logic
        if (isFollowing) {
            // Unfollow
            curUser.following = curUser.following.filter(id => id.toString() !== followId.toString());
            followUser.followers = followUser.followers.filter(id => id.toString() !== curUserId.toString());
            console.log("After unfollowing:", curUser.following, followUser.followers);
        } else {
            // Follow
            curUser.following.push(followId);
            followUser.followers.push(curUserId);
        }

        // Save changes
        await curUser.save();
        await followUser.save();

        return res.status(200).send(success(200, {
            message: isFollowing ? "User unfollowed successfully" : "User followed successfully",
            user: {
                _id: followUser._id,
                username: followUser.username,
                followersCount: followUser.followers.length,
                followingCount: followUser.following.length,
                isFollowing: !isFollowing,
            },
            currentUser: {
                _id: curUser._id,
                username: curUser.username,
                followersCount: curUser.followers.length,
                followingCount: curUser.following.length,
            }
        }));
    } catch (err) {
        console.error("Error in followAndUnfollow:", err);
        return res.status(500).send(error(500, "Something went wrong"));
    }
};


const getFeedData = async (req, res) => {
    try {
        // Get the current user's ID
        const curUserId = req.user.user_Id;
        console.log(curUserId);
        // Fetch the current user and populate 'following'
        const curUser = await user.findById(curUserId)

        // Get the IDs of the users that the current user follows
        const followingIds = curUser.following.map(item => item._id);
        followingIds.push(req.user.user_Id); // Add current user's own ID to include their own posts in the feed
        // Fetch posts from users that the current user follows
        const fullPosts = await Post.find({
            userId: { $in: followingIds } // Posts from followed users and the current user
        }).populate('userId'); // Populate user data for each post
        // Map posts to the output format (assuming `mapPostOutput` is defined elsewhere)

        const posts = fullPosts.map(item => mapPostOutput(item, req._id)).reverse(); // Reverse to show newest first

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
  
      // Find the user by ID
      const userProfile = await user.findById(_id);
  
      // If user profile not found, return a 404 error
      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Populate the posts with the 'userId' field data
      const allPosts = await userProfile.populate({
        path: 'posts', // Assuming 'posts' is an array of post references in the user model
        populate: {
          path: 'userId', // Assuming each post has a 'userId' field that you want to populate
        },
      });
      console.log(allPosts);
      const posts = allPosts.posts.map(item => mapPostOutput(item, req._id)).reverse();
      // Log populated user profile (you can modify this or remove it later)
      // Return the user profile and posts
      return res.status(200).json({
        success: true,
        data: {userProfile,posts}
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
  

module.exports = { followAndUnfollow,getFeedData,getUserProfile }