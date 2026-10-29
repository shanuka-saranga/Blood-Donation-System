import { useState } from "react";
import axios from "axios";
import "./Login.css";

const API_URL = "/api/auth";
const initialForm = { name: "", email: "", password: "", confirmPassword: "" };

function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const isLogin = mode === "login";

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setForm(initialForm);
    setMessage({ type: "", text: "" });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password || (!isLogin && !form.name)) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }
    if (!isLogin && form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const endpoint = isLogin ? "/login" : "/register";
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            role: "donor",
          };
      const response = await axios.post(`${API_URL}${endpoint}`, payload);

      if (isLogin) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setMessage({
          type: "success",
          text: `Welcome back, ${response.data.user.name}!`,
        });
        if (onLoginSuccess) onLoginSuccess(response.data.user);
      } else {
        setMessage({
          type: "success",
          text: "Registration successful. You can now sign in.",
        });
        setMode("login");
        setForm({ ...initialForm, email: form.email });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to connect to the server. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <section className="login-hero">
          <div className="hero-circle hero-circle-top" />
          <div className="hero-circle hero-circle-bottom" />
          <div className="hero-content">
            <div className="brand brand-light">
              <div className="brand-icon">
                <HeartIcon />
              </div>
              <span>BloodCare</span>
            </div>
            <p className="hero-eyebrow">Give blood. Save lives.</p>
            <h1 className="hero-title">Every donation makes a difference.</h1>
            <p className="hero-description">
              Join our community and help connect blood donors with people who
              need them most.
            </p>
          </div>
          <p className="hero-footer">
            Faculty of Technology · University of Ruhuna
          </p>
        </section>

        <section className="login-form-section">
          <div className="login-form-wrapper">
            <div className="mobile-brand">
              <div className="brand brand-dark">
                <div className="brand-icon">
                  <HeartIcon />
                </div>
                <span>BloodCare</span>
              </div>
            </div>

            <div className="form-heading" key={`heading-${mode}`}>
              <p className="form-eyebrow">Welcome</p>
              <h2>
                {isLogin ? "Sign in to your account" : "Create your account"}
              </h2>
              <p className="form-description">
                {isLogin
                  ? "Manage your blood donation journey with us."
                  : "Become a donor and help save lives today."}
              </p>
            </div>

            <div className="mode-switcher">
              <button
                className={`mode-button ${isLogin ? "mode-button-active" : ""}`}
                onClick={() => switchMode("login")}
                type="button"
              >
                Login
              </button>
              <button
                className={`mode-button ${!isLogin ? "mode-button-active" : ""}`}
                onClick={() => switchMode("register")}
                type="button"
              >
                Register
              </button>
            </div>

            {message.text && (
              <div
                className={`form-message ${message.type === "error" ? "form-message-error" : "form-message-success"}`}
                role="alert"
              >
                {message.text}
              </div>
            )}

            <form className="auth-form" key={mode} onSubmit={handleSubmit}>
              {!isLogin && (
                <Input
                  label="Full name"
                  name="name"
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  value={form.name}
                />
              )}
              <Input
                label="Email address"
                name="email"
                onChange={handleChange}
                placeholder="you@example.com"
                type="email"
                value={form.email}
              />
              <Input
                label="Password"
                name="password"
                onChange={handleChange}
                placeholder="Enter your password"
                type="password"
                value={form.password}
              />
              {!isLogin && (
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  type="password"
                  value={form.confirmPassword}
                />
              )}
              <button
                className="submit-button"
                disabled={isLoading}
                type="submit"
              >
                {isLoading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in"
                    : "Create account"}
                {!isLoading && <ArrowIcon />}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Input({ label, name, onChange, placeholder, type = "text", value }) {
  return (
    <label className="input-group">
      <span className="input-label">{label}</span>
      <input
        className="form-input"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

function HeartIcon() {
  return (
    <svg className="heart-icon" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.017 6.017 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="arrow-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default Login;
