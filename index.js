const express = require('express')
const bodyParser = require("body-parser");
const dbconnection = require('./db');
const authentication = require('./Routers/authenticationRouters');
const morgan = require('morgan')
const postRouter = require('./Routers/postRouter');
const cors = require('cors');



require('dotenv').config()
dbconnection;



const app = express()
const port = process.env.PORT;

app.use(cors({ 
  credentials: true,
  origin:'*',
}));
app.use("/uploads", express.static("uploads"));
app.use(morgan('common'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/auth',authentication)
app.use('/post',postRouter)
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
