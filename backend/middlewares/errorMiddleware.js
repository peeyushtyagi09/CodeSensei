const errorHandler = (err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Server error";

    // Mongoose validation duplicate key
    if(err.code === 11000){
        const key = Object.keys(err.keyValue)[0];
        res.status(400).json({
            success: false,
            error: `${key} already exists`,
        });
        return;
    }

    res.status(statusCode).json({
        success: false,
        error: message, 
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};

module.exports = errorHandler;
