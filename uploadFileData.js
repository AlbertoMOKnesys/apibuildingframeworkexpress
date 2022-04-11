const util = require("util");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const maxSize = 50 * 1024 * 1024;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // setting destination of uploading files
    const pathToSaveFile =
      req.folder == undefined ? __basedir + "/files/tmp" : req.folder;
    cb(null, pathToSaveFile);
  },
  filename: (req, file, cb) => {
    // naming file
    const nameFile = uuidv4() + path.extname(file.originalname);
    cb(null, nameFile);
  },
});

let uploadFotoDatos = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).fields([
  {
    name: "file",
    maxCount: 1,
  },
  {
    name: "data",
    maxCount: 1,
  },
]);

let uploadFotoDatosMiddleware = util.promisify(uploadFotoDatos);
module.exports = uploadFotoDatosMiddleware;
