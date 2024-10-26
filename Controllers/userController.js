const Post = require("../Models/post");
const user = require("../Models/user");
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

        if (!followUser) {
            return res.status(400).send(error(400, "User doesn't exist"));
        }

        // Follow or unfollow logic
        if (curUser.following.includes(followId)) {
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

        return res.status(200).send(success(200, { user: followUser }));
    } catch (err) {
        console.error("Error in followAndUnfollow:", err);
        return res.status(500).send(error(500, "Something went wrong"));
    }
};


module.exports = { followAndUnfollow }