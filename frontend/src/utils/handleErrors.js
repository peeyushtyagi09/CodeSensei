export const handleError = (err) => {
    if(!err.response) return "Network error";
    return err.response.data?.error || "Something went wrong";
};