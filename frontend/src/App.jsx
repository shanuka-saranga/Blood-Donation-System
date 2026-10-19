import { useState } from "react";
import Login from "./pages/Login";
import DonorDashboard from "./pages/DonorDashboard";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    user ? <DonorDashboard user={user} onLogout={handleLogout} /> : <Login onLoginSuccess={setUser} />
  );
}

export default App;
