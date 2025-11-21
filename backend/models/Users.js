const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchemma = new mongoose.Schema({
    username: {
        type: String, 
        required: [true, "Username is required"],
        minLength: [3, "Username must be at least 3 character"],
        maxLength: [50, "Username too long"],
        trim: true, 
        unique: true,
    }, 
    email:{
        type:String, 
        required: [true, "Email is required"], 
        unique: true, 
        lowercase: true, 
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
        type: String, 
        required: [true, "Password is required"], 
        minlength: [6, "Password must be at least 6 characters"],
        select: false,
    },
    role: {
        type:String, 
        enum: ["user", "admin"], 
        default: "user",
    }, 
    isVerified: {
        type: Boolean, 
        default: false,
    }, 
    verificationToken: String, 
    verificationTokenExpiry: Date, 
    resetPasswordToken:String, 
    resetPasswordExpires: Date, 
},
{
    timestamp: true, 
    toJSON: {virtuals: true },
    toObject: { virtuals: true},
}
);

UserSchemma.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();
});

UserSchemma.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchemma);
