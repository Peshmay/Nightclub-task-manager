// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import splashIcon from "../assets/splash-icon.png"; // 👈 adjust path if needed

const Login: React.FC = () => {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const neonPurple = "#9333ea";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // AppShell decides where to go based on email + workspace
      nav("/", { replace: true });
    } catch (err: unknown) {
      console.error(err);
      let msg = "Sign-in failed. Please check your credentials.";
      if (err && typeof err === "object" && "code" in err) {
        const code = (err as { code: string }).code;
        if (code === "auth/user-not-found") msg = "User not found.";
        if (code === "auth/wrong-password") msg = "Incorrect password.";
        if (code === "auth/invalid-email") msg = "Invalid email address.";
        if (code === "auth/invalid-credential")
          msg = "Incorrect email or password.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 sm:p-8 font-inter">
      {/* Outer card */}
      <div className="w-full max-w-6xl rounded-3xl overflow-hidden bg-gray-800/20 backdrop-blur-sm border border-gray-700 shadow-2xl flex flex-col md:flex-row">
        {/* LEFT: icon + glow */}
        <div className="hidden md:flex md:w-5/12 lg:w-4/12 items-center justify-center bg-gray-900/50 relative p-10 border-r border-gray-700/50">
          <div className="relative w-full max-w-xs aspect-square flex items-center justify-center">
            {/* glow ring 1 */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/30 via-cyan-400/20 to-transparent blur-3xl opacity-75 animate-pulse" />
            {/* glow ring 2 */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-tl from-purple-700/20 via-sky-500/10 to-transparent blur-xl" />
            {/* icon image */}
            <div className="relative w-48 h-48 p-4 rounded-3xl bg-gray-900/70 border-4 border-gray-700/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <img
                src={splashIcon}
                alt="Nefertiti icon"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* RIGHT: login form */}
        <div className="w-full md:w-7/12 lg:w-8/12 bg-gray-900/70 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Nefertiti Task Manager
            </h2>
            <p className="text-md text-gray-400 mt-2">
              Sign in to see your tasks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* error */}
            {error && (
              <div className="text-sm rounded-xl border border-red-500/60 bg-red-900/30 text-red-200 px-4 py-3 shadow-inner">
                {error}
              </div>
            )}

            {/* email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bar1@nefertiti.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-300 shadow-md"
              />
            </div>

            {/* password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-300 pr-12 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-xs text-gray-400 hover:text-white transition duration-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: neonPurple }}
              className="w-full mt-6 hover:bg-opacity-90 text-white text-md font-bold rounded-xl py-3.5 disabled:opacity-60 disabled:cursor-not-allowed transition duration-300 transform hover:scale-[1.005] shadow-lg shadow-purple-500/30"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
