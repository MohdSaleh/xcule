const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: { type: String },
  token: { type: String },
});

// const chartSchema = new mongoose.Schema({
//   name: { type: String},
//   content: { type: String },
//   symbol: { type: String },
//   resolution: {type: String},
//   user: {type: userSchema}
// });

module.exports = mongoose.model("user", userSchema);
// module.exports = mongoose.model("chart", chartSchema);