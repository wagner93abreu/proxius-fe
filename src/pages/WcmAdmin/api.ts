import axios from "axios";

// Separate client: tenant JWTs must never be attached to platform requests.
export const adminApi = axios.create({
    baseURL: "http://localhost:8081/wcmadmin",
    withCredentials: true,
});
