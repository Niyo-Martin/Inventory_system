import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await api.post("/auth/register", { username, password });
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500); // go to login after 1.5s
    } catch (err) {
      setError("❌ Username may already be taken.");
    }
  };

  return (
    <div style={{ padding: "3rem", maxWidth: "400px", margin: "auto" }}>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button onClick={handleRegister}>Register</button>
      {success && <p style={{ color: "green" }}>✅ Registered! Redirecting to login...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
