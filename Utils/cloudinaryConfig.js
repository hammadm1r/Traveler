const cloudinary = require('cloudinary').v2;

// configuration  Cloudinary           
cloudinary.config({ 
  cloud_name: 'djiqzvcev', 
  api_key: '322681695714438', 
  api_secret: 'eF82umZY3DHZOEiux6vWsbFZv8c'
});

  module.exports = cloudinary;