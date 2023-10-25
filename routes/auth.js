const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");

maxAge = 1000 * 24 * 60 * 60;

const createToken = (userObject) => {
  return jwt.sign(userObject, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

router.post("/register", async (req, res) => {
  try {
    // Check if the username already exists
    const existingUsername = await User.findOne({
      username: req.body.username,
    });
    if (existingUsername) {
      return res.status(400).json("Username already exists");
    }

    // Check if the email already exists
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).json("Email already exists");
    }

    //generate new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //create new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    //save user and respond
    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json("User not found"); // Add return statement here
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json("Invalid Password"); // Add return statement here for clarity
    }

    const token = createToken({
      id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
    });
    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ err });
  }
});
module.exports = router;
