require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');


const connectdb = require("./db/db");
const errorHandler = require("./middlewares/errorMiddleware");
const authRoutes = require("./routes/Users_routes");

const app = express();

// Middlewares
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }

// CORS (IMPORTANT for cookies + frontend URL)
app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  );

app.get("/", (req, res) => {
    res.send("Hello world!");
})

// connectdb
connectdb();

// routes 
app.use('/api/auth', authRoutes);

/* -------------------- Error Middleware (LAST) -------------------- */
app.use(errorHandler);


const startServer = async () => {
    try {
        await connectdb();

        const PORT = process.env.BACKEND_PORT;
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        // Graceful shutdown
        const gracefulShutdown = async () => {
            console.log("\n Shutting down gracefully...");
            server.close(() => {
                console.log('Closed all connections');
                process.exit(0);
            });
        };

        process.on("SIGALRM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);
    }catch(err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

startServer();

module.exports = app;