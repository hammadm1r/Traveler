const express = require('express')
const dbconnection = require('./db');
const authentication = require('./Routers/authenticationRouters');
const story = require('./Routers/storyRouter');
const morgan = require('morgan');
const postRouter = require('./Routers/postRouter');
const userRouter = require('./Routers/userRouter');
const cors = require('cors');



require('dotenv').config()
dbconnection;



const app = express()
const port = process.env.PORT;

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
