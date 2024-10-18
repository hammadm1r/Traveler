const multer  = require('multer')
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })

  const upload = multer({ storage: storage ,
    limits: {
        // limits file size to 5 MB
        fileSize: 1024 * 1024 * 5
    }
    // ,fileFilter: fileFilterConfig,
});
  module.exports = upload;