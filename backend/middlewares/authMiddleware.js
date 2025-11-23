const jwt = require("jsonwebtoken");
const User = require('../models/Users');

const protect = async(req, res, next) => {
    let token;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }else if(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")){
        token = req.headers.authorization.split(" ")[1];
    }
    if(!token) {
        return res.status(401).json({ success: false, error: 'Not authorized, token missing'});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if(!user) return res.status(401).json({ success: false, error: 'User not found'});

        req.user = user;
        next();
    }catch(err){
        return res.status(401).json({ success: false, error: 'Not authorized, token invalid'});
    }
};

module.exports = { protect };