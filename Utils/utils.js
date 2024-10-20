const ta = require('time-ago');

// Inside mapPostOutput or wherever you're formatting the post
const mapPostOutput = (post, curUserId) => {
  const timeAgo = ta;
  return {
    id: post._id,
    title: post.title,
    description: post.description,
    location: post.location,
    hashtags: post.hashtags,
    postingDate: post.postingDate,
    timeAgo: timeAgo.ago(post.postingDate),  // Adding human-readable time ago
    rating: post.rating,
    media: post.media,
    tags: post.tags,
    likesCount: post.likes.length,
    isLikedByUser: post.likes.includes(curUserId),
    comments: post.comments.map(comment => ({
      userId: comment.userId,
      commentText: comment.commentText,
      commentedAt: timeAgo.ago(comment.commentedAt), // Showing comment time as "time ago"
    })),
  };
};

module.exports = {
    mapPostOutput,
  };