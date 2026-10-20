import { useState } from "react";
import Login from "./pages/Login";
import DonorDashboard from "./pages/DonorDashboard";
import DonationCamps from "./pages/DonationCamps";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [page, setPage] = useState("dashboard");

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
    return <DonationCamps user={user} onBack={() => setPage("dashboard")} onLogout={handleLogout} />;
  }

  return <DonorDashboard user={user} onLogout={handleLogout} onOpenCamps={() => setPage("camps")} />;
}

export default App;
