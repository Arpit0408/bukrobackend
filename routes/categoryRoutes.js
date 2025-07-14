const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const auth = require("../middlewares/authMiddleware");

// You can add `auth.protect` and `auth.admin` if you want to protect them
//auth.protect, auth.admin,
router.post("/",   categoryController.createCategory);
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategory);
router.put("/:id",   categoryController.updateCategory);
router.delete("/:id",   categoryController.deleteCategory);
router.get("/top-level", categoryController.getTopLevelCategories);
module.exports = router;
