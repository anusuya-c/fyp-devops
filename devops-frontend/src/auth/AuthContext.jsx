import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/api";
import { hasTokenExpired, setLastLoginTime } from "../utils/utils";

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

  const login = async (username, password) => {
    try {
      const response = await api.login({ username, password });
      const { data } = response.data;
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
        toast.error("Login Credentials Invalid");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login Failed, please try again");
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
