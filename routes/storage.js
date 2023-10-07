const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const router = express.Router();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer configuration
const storage = multer.memoryStorage(); // Use memory storage
const upload = multer({ storage: storage });

async function saveImageUrlToDb(username, imageUrl) {
  // Find the user by username
  const user = await User.findOne({ username: username });

  if (!user) {
    throw new Error("User not found");
  }

  // Update the user's image URL
  user.profilePicture = imageUrl;

  // Save the user
  await user.save();

  return user;
}

router.post("/upload", upload.single("userImage"), async (req, res) => {
  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder: `fut-card-profile-pics/${req.body.username}`,
          transformation: [
            { height: 350, crop: "fit" },
            { gravity: "auto:face", height: 350, width: 250, crop: "crop" },
          ],
        },
        (error, result) => {
          if (error) throw error;
          res.json(result);
        }
      )
      .end(req.file.buffer);

    const imageUrl = result.secure_url;

    const updatedUser = await saveImageUrlToDb(req.body.username, imageUrl);
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" });
  }
});

module.exports = router;
