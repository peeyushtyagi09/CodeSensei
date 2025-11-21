const mongoose = require("mongoose");

const connectdb = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }catch(err) {
        console.error("MongoDB Connected failed:", err.message || err);
        process.exit(1);
    }
};;

module.exports = connectdb;