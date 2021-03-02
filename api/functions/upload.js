// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


const multer = require('multer')
const path = require('path')
const { uploadConfig } = require('../config')


const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'uploads/')
    },
    filename: (req, file, callback) => {
        // callback(null, file.originalname)
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})

const imageFilter = function (req, file, callback) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!'
        return callback(new Error('Only image files are allowed!'), false)
    }
    callback(null, true);
}


module.exports = {
    storage,
    imageFilter
}