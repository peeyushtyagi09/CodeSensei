require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectdb = require("./db/db");

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get("/", (req, res) => {
    res.send("Hello world!");
})

// connectdb
connectdb();

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