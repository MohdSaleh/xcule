const jwt = require("jsonwebtoken");

// const config = process.env;

const {TOKEN_KEY} = process.env

const verifyToken = (req, res, next) => {
  
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const decoded = jwt.verify(token, '1234567890');
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;