// backend/config/razorpay.js
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id:  'rzp_test_p3ewJSntSBveJK',       // Use your real keys in .env!
  key_secret:  'wE9LEunzeK1Ks6oXnVJMNNAb',
});

module.exports = razorpay;
