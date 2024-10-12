const express = require('express')
const bodyParser = require("body-parser");
const dbconnection = require('./db');
const authentication = require('./Routers/authenticationRouters');

require('dotenv').config()
dbconnection;

const app = express()
const port = process.env.PORT;

app.use(bodyParser.json());
app.use('/auth',authentication)
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
