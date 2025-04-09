import "./App.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { MantineProvider } from "@mantine/core";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Notifications } from "@mantine/notifications";
import { BrowserRouter, Route, Routes } from "react-router";

import HomePage from "./pages/Home";
import RegisterPage from "./pages/auth/Register";
import LoginPage from "./pages/auth/Login";
import { Navigate } from "react-router";

function App() {
  const ProtectedRoute = ({ Component }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? Component : <Navigate to="/login" replace />;
  };

  const LoginRedirect = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/home" replace /> : children;
  };

  return (
    <MantineProvider>
      <Notifications />
      <AuthProvider>
        <Notifications />
        <BrowserRouter>
          <Routes>
            <Route
              path="/register"
              element={
                <LoginRedirect>
                  <RegisterPage />
                </LoginRedirect>
              }
            />
            <Route
              path="/login"
              element={
                <LoginRedirect>
                  <LoginPage />
                </LoginRedirect>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
