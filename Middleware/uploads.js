const multer  = require('multer')


const storage = multer.memoryStorage()

const upload = multer({ storage: storage ,
    limits: {
        // limits file size to 5 MB
        fileSize: 1024 * 1024 * 5
    }
    // ,fileFilter: fileFilterConfig,
});
const singleUpload = upload.single('profilePicture'); // For single file uploads
const multipleUpload = upload.array('media[]', 5);   // For multiple file uploads (max 10)

// Export the upload middleware
module.exports = { singleUpload, multipleUpload };