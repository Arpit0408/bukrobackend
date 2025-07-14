const multer = require('multer');
const express = require('express');
const path = require('path');
const storage = multer.memoryStorage();
const upload = multer({storage:storage});
const router = express.Router();


module.exports = upload;
