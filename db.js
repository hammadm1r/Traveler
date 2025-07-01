const mongoose = require('mongoose');
require('dotenv').config()
const URI = process.env.URI;
mongoose.connect(URI);
const db = mongoose.connection;

db.on('connected',()=>{
    console.log("Connected to MongoDB")
})
db.on('error',(err)=>{
    console.log('Database Connection Error:',err);
})
db.on('disconnect',()=>{
    console.log("Disconnected from MongoDB")
})