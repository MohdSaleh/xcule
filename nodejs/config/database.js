const mongoose = require("mongoose");

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_HOST,
  MONGO_PORT,
  MONGO_SERVER,
  MONGO_DATABASE
} = process.env

const MONGO_URI = `${MONGO_SERVER}://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}?authSource=admin`;

exports.connect = () => {
  // Connecting to the database
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Successfully connected to database");
    })
    .catch((error) => {
      console.log("database connection failed. exiting now...");
      console.error(error);
      process.exit(1);
    });
};