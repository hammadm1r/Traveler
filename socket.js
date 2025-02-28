const Notification = require('./Models/notification');
let ioInstance;
let onlineUsers = new Map();
const initsocket = (io) => {
    ioInstance = io;
    io.on('connection',(socket)=>{
        console.log('connected',socket.id)
        socket.on("join",(userId)=>{
            onlineUsers.set(userId,socket.id);
            console.log(`User ${userId} is online.`);
        })
        socket.on("disconnect",()=>{
            for(let [key,value] of onlineUsers ){
                if(value === socket.id){
                    onlineUsers.delete(key)
                    break;
                }
            }
            console.log('User disconnected:', socket.id);
        })
    })
}

const notify = async(notification) => {
    if(!ioInstance){
        return;
    }
    try {
        // Fetch the notification with populated data
        const populatedNotification = await Notification.findById(notification._id)
            .populate("sender", "username profilePicture") // Populate recipient with selected fields
            .exec();
        console.log('populated Notify:',populatedNotification)
        if (!populatedNotification) {
            console.error("Notification not found");
            return;
        }
        console.log(populatedNotification.recipient.toString());
        const recipientSocketId = onlineUsers.get(populatedNotification.recipient.toString());
        console.log(onlineUsers);
        if (recipientSocketId) {
            console.log('If')
            ioInstance.to(recipientSocketId).emit("newNotification", populatedNotification);
        }
    } catch (error) {
        console.error("Error populating notification:", error);
    }
};

module.exports = {initsocket,notify}