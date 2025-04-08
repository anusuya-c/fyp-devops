import axios from "axios";

const API_BASE_URL = "https://localhost:8000";
const API_VERSION = "/api/";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export const api = {
    // Authentication API
    login: (data) => apiClient.post("/authenticate/login/", data),

    register: (data) => apiClient.post("/authenticate/registration/", data)

}