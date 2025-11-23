import axios_api from "../api/app";

const api = axios_api();

// REGISTER
export const registerUser = async(data) => {
    return await api.post("/api/auth/register", data);
}

// LOGIN
export const loginUser = async(data) => {
    return await api.post("/api/auth/login", data);
}

// LOGOUT
export const logoutUser = async() => {
    return await api.post("/api/auth/logout");
};

// GET Current USER
export const getMe = async() => {
    return await api.get("/api/auth/me");
}

// Forget Password
export const forgotPassword = async(email) => {
    return await api.post("/api/auth/forget-password", { email });
};

// Reset Password
export const resetPassword = async(payload) => {
    return await api.post("/api/auth/reset-password", payload);
};

// Verify Email
export const verifyEmail = async(token, id) => {
    return await api.get(`/api/auth/verify-email?token=${token}&id=${id}`);
}

// Update Password (LOgged in)
export const updatePassword = async (payload) => {
    return await api.put("/api/auth/update-password", payload);
}