import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/api";
import { hasTokenExpired, setLastLoginTime } from "../utils/utils";
import { useNavigate } from "react-router";
import { notifications } from "@mantine/notifications";
import axios from "axios";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    const tokenExpired = hasTokenExpired();

    if (!tokenExpired && accessToken) {
    } else {
      logout();
    }
  }, []);

  const login = async (payload) => {
    try {
      setLoading(true);
      //const response = await api.login(payload);
      const response = await axios.post('http://localhost:8000/api/auth/login', payload);
      const data  = response.data;
      if (data && data.access) {
        const userData = {
          id: data.pk,
          username: data.username,
          accessToken: data.access,
        };

        setUser(userData);

        localStorage.setItem("access_token", data.access);
        setLastLoginTime();
      } else {
        notifications.show({
          title: 'Login Error',
          message: `Login Failed`
        })
      }
    } catch (error) {
      console.error("Login failed:", error);
      notifications.show({
        title: 'Login Error',
        message: `Login Failed`
      })
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("login_time");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, setLoading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
