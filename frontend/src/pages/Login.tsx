// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import splashIcon from '../assets/splash-icon.png'; // 👈 adjust path if needed

const Login: React.FC = () => {
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // AppShell decides where to go based on email + workspace
      nav('/', { replace: true });
    } catch (err: unknown) {
      console.error(err);
      let msg = 'Sign-in failed. Please check your credentials.';
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/user-not-found') msg = 'User not found.';
        if (code === 'auth/wrong-password') msg = 'Incorrect password.';
        if (code === 'auth/invalid-email') msg = 'Invalid email address.';
        if (code === 'auth/invalid-credential') msg = 'Incorrect email or password.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0b0f19] text-white font-inter">
      <section className="flex h-full w-full flex-col md:flex-row">
        {/* LEFT: Nefertiti icon + glow */}
        <div className="flex w-full items-center justify-center px-6 py-20 md:w-1/2 md:px-8 md:py-0 lg:px-16">
          {/* Increased max-w to allow for a much larger icon */}
          <div className="w-full max-w-xl flex items-center justify-center">
            {/* Further increased icon size (approx. 350px) */}
            <div className="relative w-[350px] h-[350px] flex items-center justify-center">
              {/* Adjusted inset values for glow rings to scale with larger icon */}
              {/* These values might need fine-tuning based on actual icon aspect and desired spread */}
              <div className="absolute inset-16 rounded-full bg-gradient-to-br from-purple-500/30 via-cyan-400/20 to-transparent blur-3xl opacity-75 animate-pulse" />
              <div className="absolute inset-32 rounded-full bg-gradient-to-tl from-purple-700/20 via-sky-500/10 to-transparent blur-xl" />
              {/* Icon image container: Reduced border visibility and adjusted padding slightly */}
              <div className="relative w-full h-full p-6 rounded-3xl bg-gray-900/70 border border-gray-700/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center">
                <img
                  src={splashIcon}
                  alt="Nefertiti icon"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: login form */}
        <div className="flex w-full items-center justify-center px-6 py-20 md:w-1/2 md:px-8 md:py-0 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center md:text-left">
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl xl:text-6xl">
                VenueFlow <span className="block text-yellow-400">Task Manager</span>
              </h1>
              <p className="mt-4 text-sm text-white/70 sm:text-base lg:text-lg">
                Sign in to see your tasks.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-sm rounded-xl border border-red-500/60 bg-red-900/30 text-red-200 px-4 py-3 shadow-inner">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70 block">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bar1@nefertiti.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300 shadow-md"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-300 pr-12 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-xs text-gray-400 hover:text-white transition duration-200"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-yellow-500 hover:bg-yellow-400 text-black text-md font-bold rounded-xl py-3.5 disabled:opacity-60 disabled:cursor-not-allowed transition duration-300 transform hover:scale-[1.005]"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
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
                  'Sign in'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
