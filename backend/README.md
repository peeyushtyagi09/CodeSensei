# CodeSensei Backend

![CodeSensei Banner](https://placehold.co/1200x300/0D1117/FFFFFF?text=CodeSensei&font=montserrat)

## Overview

Welcome to the backend of **CodeSensei**, an intelligent platform designed to help users prepare for technical interviews. CodeSensei provides a personalized and adaptive learning experience by generating coding challenges, evaluating user submissions against test cases, and offering features tailored to individual user goals and skill levels.

This backend is a robust Node.js application built with Express, connected to a MongoDB database. It serves as the core API for the CodeSensei platform, managing user data, authentication, question generation, code execution, and more.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
- [Key Components Explained](#key-components-explained)
  - [Code Execution](#code-execution)
  - [AI Question Generation](#ai-question-generation)
  - [Authentication](#authentication)
  - [Email Service](#email-service)
- [Contributing](#contributing)
- [License](#license)

---

## Features

*   **User Authentication**: Secure user registration and login using JWT (JSON Web Tokens).
*   **Personalized Profiles**: Users can set their experience level, interview goals, preferred roles, and bio.
*   **Skill Tracking**: Users can manage their strong and weak topics to receive tailored challenges.
*   **Remote Code Execution**: Executes user-submitted code in various languages against test cases using the [Piston API](https://github.com/engineer-man/piston).
*   **AI-Powered Question Generation**: (Experimental) Leverages the Groq API with Llama 3 to dynamically generate unique coding problems, including descriptions, examples, constraints, and solutions.
*   **Email Notifications**: Integrated email service for account-related communications.
*   **Scalable Architecture**: Built with a modular structure, separating concerns for easy maintenance and scalability.
*   **Secure & Robust**: Implements security best practices using `helmet`, `cors`, and input validation.

---

## Tech Stack

| Category      | Technology                                                              |
|---------------|-------------------------------------------------------------------------|
| **Framework** | Express.js                                    |
| **Database**  | MongoDB with Mongoose |
| **Runtime**   | Node.js                                          |
| **Auth**      | JSON Web Tokens (JWT), cookie-parser |
| **Security**  | Helmet, CORS |
| **Code Runner**| Piston API via Axios |
| **Email**     | Nodemailer                                   |
| **Dev Tools** | Morgan for logging, dotenv for environment variables |

---

## Project Structure

The backend follows a feature-oriented, modular structure to keep the codebase organized and maintainable.

```
backend/
├── controllers/      # Handles request logic for each route
│   └── ProfileController.js
├── db/               # Database connection logic
│   └── db.js
├── middlewares/      # Custom Express middlewares
│   ├── asyncHandler.js
│   └── errorMiddleware.js
├── models/           # Mongoose schemas for database models
│   └── User.js
├── routes/           # API route definitions
│   ├── Users_routes.js
│   ├── codeRoutes.js
│   ├── questionRoutes.js
│   └── testcaseRoutes.js
├── utils/            # Reusable utility functions
│   ├── aiClient.js
│   ├── codeRunner.js
│   ├── generateToken.js
│   └── sendEmail.js
├── .env.example      # Example environment variables
├── index.js          # Main server entry point
└── package.json
```

---

## API Endpoints

The following are the primary API routes exposed by the server:

*   `POST /api/auth/register`: Register a new user.
*   `POST /api/auth/login`: Authenticate a user and get a JWT.
*   `GET /api/auth/profile`: Get the current user's profile.
*   `PUT /api/auth/profile`: Update user profile details.
*   `PUT /api/auth/preferences`: Update user skill preferences (strong/weak topics).
*   `PUT /api/auth/avatar`: Update user avatar URL.
*   `GET /api/questions`: Fetch coding questions.
*   `POST /api/code/run`: Execute a piece of code.
*   `GET /api/testcases`: Fetch test cases for a specific question.

---

## Getting Started

### Prerequisites

*   Node.js (v18.x or higher)
*   MongoDB instance (local or cloud-based like MongoDB Atlas)
*   Access to a Piston API instance.
*   (Optional) Groq API Key for AI features.
*   (Optional) Gmail account with an "App Password" for the email service.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd CodeSensei/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Configuration

1.  Create a `.env` file in the `backend` directory by copying the `.env.example` file.
2.  Fill in the required environment variables. This is a critical step.

    ```ini
    # Server
    BACKEND_PORT=8000
    NODE_ENV=development
    FRONTEND_URL=http://localhost:5173

    # Database
    MONGO_URI=<your_mongodb_connection_string>

    # JWT Authentication
    JWT_SECRET=<your_strong_jwt_secret>
    JWT_EXPIRES_IN=30d

    # Piston API for Code Execution
    PISTON_URL=<your_piston_api_url>
    RUN_TIMEOUT_MS=5000
    CODE_MAX_BYTES=65536
    INPUT_MAX_BYTES=10240

    # AI Service (Groq)
    GROQ_API_KEY=<your_groq_api_key>

    # Email Service (Nodemailer with Gmail)
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=<your_gmail_address>
    EMAIL_PASS=<your_gmail_app_password>
    FROM_EMAIL="CodeSensei <no-reply@codesensei.com>"
    ```

---

## Usage

Run the following command to start the development server:

```bash
npm run dev
```

The server will start on the port specified in your `.env` file (e.g., `http://localhost:8000`).

---

## Key Components Explained

### Code Execution

The `utils/codeRunner.js` module is responsible for executing user code. It sends a payload containing the language, code, and standard input to a Piston API endpoint. It enforces timeouts and size limits to prevent abuse and ensure server stability.

### AI Question Generation

The `utils/aiClient.js` module (currently experimental) interfaces with the Groq AI API. It uses a carefully crafted prompt to request a complete coding problem package in a strict JSON format. This includes everything from the problem title to a brute-force solution for verification.

### Authentication

Authentication is handled via JWTs. The `utils/generateToken.js` utility creates a token upon successful login, which is then sent to the client as an HTTP-only cookie for security. Routes are protected using middleware that verifies this token.

### Email Service

The `utils/sendEmail.js` module uses Nodemailer to send emails. It is configured to work with Gmail out-of-the-box but can be adapted for other email transport services. This is essential for features like password resets and email confirmations.

---

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License.