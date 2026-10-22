import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import AppContent from "./components/AppContent";

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
  });
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate replace to={user.role === "admin" ? "/admin" : "/dashboard"} />
            ) : (
              <Login
                onLoginSuccess={(loggedInUser) => {
                  setUser(loggedInUser);
                }}
              />
            )
          }
        />
        <Route
          path="/*"
          element={
            user ? (
              <AppContent
                darkMode={darkMode}
                onLogout={handleLogout}
                onToggleDarkMode={() => setDarkMode((current) => !current)}
                user={user}
                onUserUpdate={setUser}
              />
            ) : (
              <Navigate replace to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
