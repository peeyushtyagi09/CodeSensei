import axios from "axios";

const axios_api = () => {
    const api = axios.create({
        baseURL: import.meta.env.VITE_BACKEND_URL,
        withCredentials: true,
    });
    return api;
}

export default axios_api();