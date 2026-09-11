import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const token = localStorage.getItem("kq_token");
 if (!token) {
 setLoading(false);
 return;
 }
 api
 .me()
 .then((data) => setUser(data.user))
 .catch(() => {
 localStorage.removeItem("kq_token");
 })
 .finally(() => setLoading(false));
 }, []);

 function loginSuccess(token, user) {
 localStorage.setItem("kq_token", token);
 setUser(user);
 }

 function logout() {
 localStorage.removeItem("kq_token");
 setUser(null);
 }

 return (
 <AuthContext.Provider value={{ user, loading, loginSuccess, logout }}>
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth() {
 return useContext(AuthContext);
}
