const crypto = require("crypto");
const User = require("../models/User");
const asyncHandler = require('../middlewares/asyncHandler');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id.toString()); 
    const cookieOptions = {
        httpOnly: true, 
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    };
    if(process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'Node';
    }
    res
        .status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true, 
            token, 
            data: {
                id: user._id,
                username: user.username, 
                email: user.email, 
                role: user.role, 
                isVerified: user.isVerified,
            }
        });
};

exports.register = asyncHandler(async(req, res) => {
    const { username, email, password} = req.body;

    if(!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide username, email and password'});
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if(userExists){
        return res.status(400).json({ success: false, error: 'Userwith provided email or username already exists'});
    }

    const user = await User.create({ username, email, password});

    // create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = Buffer.from(
      await crypto.subtle.digest(
          "SHA-256",
          Buffer.from(verificationToken)
      )
  ).toString("hex");
    user.verificationToken = hashedToken;
    user.verificationTokenExpiry = Date.now() + 1000 * 60 * 60 * 24;
    await user.save({ validateBeforeSave: false });
  // send verification email
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&id=${user._id}`;
  const message = `
    Please verify your email by clicking the link below:
    ${verifyUrl}
    This link expires in 24 hours.
  `;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify Your CodeSensei Account',
      text: message,
    });
  } catch (err) {
    // clean up tokens if email fails
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, error: 'Email could not be sent' });
  }

  sendTokenResponse(user, 201, res);
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token, id } = req.query;

  if (!token || !id) {
    return res.status(400).json({ success: false, error: "Invalid verification link" });
  }

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    _id: id,  // FIXED HERE
    verificationToken: hashed,
    verificationTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: "Invalid or expired verification token",
    });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: "Email verified successfully" });
});


exports.login = asyncHandler(async (req, res) => {
    const { emailOrUsername, password } = req.body;
    if(!emailOrUsername || !password){
      return res.status(400).json({ success: false, error: 'please provide email/username and password'});
    }

    const user = await User.findOne({
      $or: [
        {email: emailOrUsername.toLowerCase()},
        { username: emailOrUsername}
      ]
    }).select('+password');

    if(!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials'});
    }

    const isMatch = await user.comparePassword(password);
    if(!isMatch){
      return res.status(400).json({ success: false, error: 'Invalid credentials'});
    }

    sendTokenResponse(user, 200, res);
})

exports.logout = asyncHandler(async(req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10* 1000),
    httpOnly: true,
  });
  res.json({ success: true, message: 'Logged out'});
})


exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Please provide email' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // respond success to avoid email enumeration
    return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  }

  // create reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;
  const message = `You requested a password reset. Use this link: ${resetUrl} \nThis link expires in 1 hour.`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - CodeSensei',
      text: message,
    });
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (err) {
    // cleanup
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, error: 'Email could not be sent' });
  }
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, id, newPassword } = req.body;
  if (!token || !id || !newPassword) {
    return res.status(400).json({ success: false, error: 'Invalid request' });
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    _id: id,
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // auto login after reset
  sendTokenResponse(user, 200, res);
});

/**
 * @desc Get current user profile
 * @route GET /api/auth/me
 */
exports.getMe = asyncHandler(async (req, res) => {
  // protect middleware sets req.user
  const user = req.user;
  res.json({ success: true, data: user });
});

/**
 * @desc Update password when logged in
 * @route PUT /api/auth/update-password
 * @body { currentPassword, newPassword }
 */
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Provide current and new password' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return res.status(401).json({ success: false, error: 'Current password is incorrect' });

  user.password = newPassword;
  await user.save();

  // return new token
  sendTokenResponse(user, 200, res);
});