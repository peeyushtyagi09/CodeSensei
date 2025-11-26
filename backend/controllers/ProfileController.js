const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json({
        success: true,
        data: user,
    });
});


exports.updateProfile = asyncHandler(async (req, res) => {
    const allowedFields = [
        "persona",
        "experienceLevel",
        "interviewGoal",
        "role",
        "bio",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
        if(req.body[field] !== undefined){
            updates[field] = req.body[field];
        }
    });

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        {new: true, runValidators: true}
    ).select("-password");

    res.status(200).json({
        success: true,
        data: updatedUser,
    })
});
exports.updatePreferences = asyncHandler(async (req, res) => {
    const allowedFields = ["weakTopics", "strongTopics", "preferredRoles"];
  
    const updates = {};
  
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
  
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");
  
    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  });
  
  // -------------------------------------------------
  // @desc   Update avatar URL
  // @route  PUT /api/user/update-avatar
  // @access Private
  // -------------------------------------------------
  exports.updateAvatar = asyncHandler(async (req, res) => {
    if (!req.body.avatar) {
      return res.status(400).json({ success: false, error: "Avatar URL required" });
    }
  
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.body.avatar },
      { new: true }
    ).select("-password");
  
    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  });