const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController"); // ✅ Path must be correct
const authMiddleware = require("../middlewares/authMiddleware"); 


console.log("CreateProduct:", productController.createProduct);
console.log("Admin Middleware:", authMiddleware.admin);
console.log("Protect Middleware:", authMiddleware.protect);

// Public Routes
router.get("/", productController.getAllProducts);
router.get('/category/:slug', productController.getProductsByCategory);
router.get("/:id", productController.getProductById);

// Admin Routes
router.post("/",  productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id",  productController.deleteProduct);

module.exports = router;
