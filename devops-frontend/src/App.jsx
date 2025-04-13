// src/App.jsx
import "./App.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import '@mantine/charts/styles.css';

import { Loader, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";

import RegisterPage from "./pages/auth/Register";
import LoginPage from "./pages/auth/Login";
import HomePage from "./pages/Home";
import JenkinsJobsPage from "./pages/jenkins/JenkinsJobsPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import JenkinsJobDetailsPage from "./pages/jenkins/JenkinsJobDetailsPage";
import SonarQubeProjectsPage from "./pages/sonarqube/SonarQubeProjectsPage";
import SonarQubeProjectDetailsPage from "./pages/sonarqube/SonarQubeProjectDetailsPage";

function App() {
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
      return (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <Loader /> </div>);
    }
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  const RedirectIfAuthenticated = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
      return (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <Loader /> </div>);
    }
    return isAuthenticated ? <Navigate to="/" replace /> : children;
  };

  return (
    <MantineProvider>
      <Notifications />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/register"
              element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>}
            />
            <Route
              path="/login"
              element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>}
            />
            <Route
              path="/"
              element={<ProtectedRoute><HomePage /></ProtectedRoute>}
            />
            <Route
              path="/home"
              element={<ProtectedRoute><HomePage /></ProtectedRoute>}
            />
            <Route
              path="/jenkins-jobs"
              element={<ProtectedRoute><JenkinsJobsPage /></ProtectedRoute>}
            />
            <Route
              path="/sonarqube-projects"
              element={<ProtectedRoute><SonarQubeProjectsPage /></ProtectedRoute>}
            />
            <Route
              path="/jenkins-jobs/:jobName/details" // Or just /jenkins-jobs/:jobName
              element={<ProtectedRoute><JenkinsJobDetailsPage /></ProtectedRoute>}
            />
            <Route
              path="/sonarqube-projects/:projectKey/details"
              element={<ProtectedRoute><SonarQubeProjectDetailsPage /></ProtectedRoute>}
            />
            <Route
              path="/settings"
              element={<ProtectedRoute><PlaceholderPage title="Settings" needsSidebar={true} /></ProtectedRoute>}
            />
            <Route
              path="/other"
              element={<ProtectedRoute><PlaceholderPage title="Other Section" needsSidebar={true} /></ProtectedRoute>}
            />

            {/* --- Catch-all --- */}
            <Route path="*" element={<PlaceholderPage title="404 - Not Found" needsSidebar={false} />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;