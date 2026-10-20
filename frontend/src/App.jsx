import { useEffect, useState } from "react";
import Login from "./pages/Login";
import DonorDashboard from "./pages/DonorDashboard";
import DonationCamps from "./pages/DonationCamps";
import Profile from "./pages/Profile";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [page, setPage] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("dashboard");
  };

  if (!user) {
    return <Login onLoginSuccess={(loggedInUser) => {
      setUser(loggedInUser);
      setPage("dashboard");
    }} />;
  }

  if (page === "camps") {
    return <DonationCamps user={user} onBack={() => setPage("dashboard")} onOpenProfile={() => setPage("profile")} onLogout={handleLogout} />;
  }

  if (page === "profile") {
    return <Profile darkMode={darkMode} onBack={() => setPage("dashboard")} onLogout={handleLogout} onToggleDarkMode={() => setDarkMode((current) => !current)} user={user} onUserUpdate={setUser} />;
  }

  return <DonorDashboard user={user} onLogout={handleLogout} onOpenCamps={() => setPage("camps")} onOpenProfile={() => setPage("profile")} />;
}

export default App;
