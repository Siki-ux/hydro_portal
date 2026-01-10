import axios from "axios";

// Create Axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to attach the Token if available
// Note: In Next.js Server Components, we might use headers() or cookies() to get the token.
// In Client Components, we use useSession() from next-auth.
// This generic interceptor is a starting point and may need adjustment for SSR vs CSR.
api.interceptors.request.use(
    async (config) => {
        // Todo: Integrate with Session management to inject Authorization header
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
