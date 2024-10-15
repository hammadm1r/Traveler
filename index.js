const express = require('express')
const bodyParser = require("body-parser");
const dbconnection = require('./db');
const authentication = require('./Routers/authenticationRouters');
const morgan = require('morgan')
const cloudinary = require('cloudinary').v2;


require('dotenv').config()
dbconnection;

// configuration  Cloudinary           
cloudinary.config({ 
  cloud_name: 'djiqzvcev', 
  api_key: '322681695714438', 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const app = express()
const port = process.env.PORT;

app.use(morgan('common'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/auth',authentication)
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
