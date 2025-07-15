const express = require('express');
const app = express();
const config = require('config');
const mongoose = require('./config/mongoose-config');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require("./routes/categoryRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require('./routes/cart'); // ✅ Import cart routes
const addressRoutes = require('./routes/addressRoutes'); // ✅ Import address routes
const ordersRoutes = require('./routes/order.js'); // ✅ Import orders routes
const paymentRoutes = require('./routes/paymentRoutes'); // ✅ Import payment routes
const productreview = require('./routes/reviewRoutes.js'); // ✅ Import Review model
const cors = require('cors');
const cookieParser = require('cookie-parser'); // ✅ Add this
const path = require('path');
require('dotenv').config();


// Now this will work
const uri = process.env.MONGODB_URI;


// Serve uploads folder statically (ye line add karo)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cookieParser()); // ✅ Use it before routes
// Serve uploads folder statically
// ✅ CORS configuration
const allowedOrigins = ['http://localhost:3001', 'http://localhost:5173'];
// app.use(cors({
//   origin: true,  // ye sab origins allow karega
//   credentials: true
// }));
const corsOptions = {
  origin: function (origin, callback) {
    // origin null bhi ho sakta hai for tools like Postman or server-side calls
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // ✅ PATCH added
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Express.js example
app.use(cors(corsOptions));


// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wishlist", userRoutes);
app.use('/api/cart', cartRoutes); 
app.use('/api/address', addressRoutes); 
app.use('/api/orders', ordersRoutes); 
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', productreview); // ✅ Use review routes


// ✅ Default route
app.get("/", (req, res) => res.send("BuyKaro Backend Running"));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});


// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
