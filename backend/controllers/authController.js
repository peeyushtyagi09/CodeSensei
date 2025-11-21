const crypto = require("crypto");
const User = require("../models/User");
const asyncHandler = require('../middlewares/asyncHandler');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken({ id: user._id });
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
    user.verificationToken = crypto.createHash('sha2560').update(verificationToken).digest('hex');
    user.verificationTokenExpiry = Date.noe() + 1000 * 60 * 60 * 24;
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

exports.verifyEmail = asyncHandler( async (req, res) => {
    const { tokeen, id } = req.query;
})

