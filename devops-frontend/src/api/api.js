import axios from "axios";

const API_BASE_URL = "http://localhost:8000";
const API_VERSION = "/api/";

// Create a public axios instance for endpoints that don't need authentication
const publicApiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    login: (data) => axios.post(`${API_BASE_URL}${API_VERSION}auth/login/`, data),
    register: (data) => axios.post(`${API_BASE_URL}${API_VERSION}auth/registration/`, data),
    passwordReset: (email) => publicApiClient.post('auth/password/reset/', { email }),
    passwordResetConfirm: (data) => publicApiClient.post(`auth/password/reset/${data.uid}/${data.token}/`, {
      new_password1: data.new_password1,
      new_password2: data.new_password2,
    }),

    // Other API endpoints that need authentication
    getJenkinsJobs: () => apiClient.get("/jenkins/jobs/"),
    getJenkinsJobDetails: (jobName) => apiClient.get(`/jenkins/jobs/${jobName}/details/`),
    getSonarQubeProjects: () => apiClient.get("/sonarqube/projects/"),
    getSonarQubeProjectDetails: (projectKey) => apiClient.get(`/sonarqube/projects/${projectKey}/details/`),
    getArgocdApplications: () => apiClient.get("/argocd/applications/"),
    getNotifications: () => apiClient.get("/notifications/"),
    markNotificationAsSeen: (notificationId) => apiClient.post(`/notifications/${notificationId}/mark-seen/`)
}