const multer  = require('multer')
const path = require('path');

const storage = multer.memoryStorage()

const upload = multer({ storage: storage ,
    limits: {
        // limits file size to 5 MB
        fileSize: 1024 * 1024 * 5
    }
    // ,fileFilter: fileFilterConfig,
});

  module.exports = upload;