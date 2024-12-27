const Post = require("../Models/post");
const getTrendingPosts = async () => {
  const trendingPosts = await Post.find({})
    .sort({ likesCount: -1 }) // Sort by the number of likes
    .limit(10) // Limit to top 10 trending posts
    .populate("userId", "fullname profilePicture") // Populate user details
    .populate({
      path: "comments",
      populate: {
        path: "userId",
        select: "fullname profilePicture",
      },
    });
  return trendingPosts;
};

const getRandomPosts = async (followingIds, limit = 10) => {
  const randomPosts = await Post.find({ userId: { $nin: followingIds } })
    .limit(limit)
    .populate("userId", "fullname profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "userId",
        select: "fullname profilePicture",
      },
    });
  return randomPosts;
};

module.exports = {
  getTrendingPosts,
  getRandomPosts,
};
