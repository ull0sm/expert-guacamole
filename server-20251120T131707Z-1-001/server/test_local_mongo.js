const mongoose = require('mongoose');

const localURI = 'mongodb://localhost:27017/test_db';

mongoose.connect(localURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("Local MongoDB connected successfully!");
  process.exit(0);
})
.catch((err) => {
  console.error("Local MongoDB connection failed:", err.message);
  process.exit(1);
});
