const express = require('express')
const dbconnection = require('./db');
const http = require('http'); // Required for socket.io
const { Server } = require('socket.io');
const authentication = require('./Routers/authenticationRouters');
const morgan = require('morgan');
const cors = require('cors');



require('dotenv').config()
dbconnection;



const app = express()
const port = process.env.PORT;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true,
  },
});

let onlineUsers = new Map(); // Store connected users
const story = require('./Routers/storyRouter');
const postRouter = require('./Routers/postRouter');
const userRouter = require('./Routers/userRouter');
const {initsocket} = require('./socket')
initsocket(io);
// Listen for user connections
app.use(cors({ 
  credentials: true,
  origin:'http://localhost:5173',
}));
app.use(morgan('common'));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb',extended: true }));
app.use('/auth',authentication)
app.use('/story',story)
app.use('/post',postRouter)
app.use('/user',userRouter)
app.get('/', (req, res) => {
  res.send('Hello World!')
})

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
