import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/api";
import { hasTokenExpired, setLastLoginTime } from "../utils/utils";
import { useNavigate } from "react-router";
import { notifications } from "@mantine/notifications";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

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
      const response = await api.login(payload);
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
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("login_time");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
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
