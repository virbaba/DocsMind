import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import { CgSpinner } from 'react-icons/cg';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) return setError('Please enter your email address.');
    if (!password) return setError('Please enter your password.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#0c0d12] relative overflow-hidden px-4 py-6"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Background blue-purple radial glow — same as dashboard palette */}
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(91,79,212,0.10) 0%, rgba(64,53,168,0.05) 45%, transparent 70%)'
        }}
      />
      {/* Subtle bottom corner glow */}
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom right, rgba(91,79,212,0.06) 0%, transparent 65%)'
        }}
      />

      <div className="flex flex-col items-center w-full max-w-[480px] relative z-10">
        {/* Logo */}
        <div className="mb-4">
          <img
            src="/images/docs_mind_logo.png?v=3"
            alt="DocsMind logo"
            className="w-60 h-40 object-contain"
          />
        </div>

        {/* Heading */}
        <h1 className="text-[26px] font-bold text-[#fafafa] tracking-[-0.5px] mb-1.5">DocsMind</h1>
        <p className="text-sm text-[#8a91a5] mb-7 font-normal text-center px-4">Enter details to sign in or register instantly</p>

        {/* Card */}
        <div className="w-full bg-[#10121a] border border-[#1c1f30] rounded-2xl p-7 shadow-[0_8px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(91,79,212,0.06)]">
          <form onSubmit={handleSubmit} noValidate>
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.18)] rounded-lg px-3.5 py-2.5 mb-5 text-[#f87171] text-[13px] font-medium">
                <span className="text-[8px] shrink-0">●</span>
                {error}
              </div>
            )}

            {/* Email field */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-[13px] font-medium text-[#9ca3af] mb-2 tracking-wide">
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#4e527a] flex items-center pointer-events-none">
                  <FiMail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full bg-[#1a1c2e] border border-[#20223a] rounded-lg py-2.5 pl-10 pr-3.5 text-[#f0f0f8] text-sm outline-none transition-all focus:border-[#5b4fd4] focus:ring-1 focus:ring-[#5b4fd4]/40 placeholder-[#4e527a]"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="mb-2">
              <label htmlFor="password" className="block text-[13px] font-medium text-[#9ca3af] mb-2 tracking-wide">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#4e527a] flex items-center pointer-events-none">
                  <FiLock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-[#1a1c2e] border border-[#20223a] rounded-lg py-2.5 pl-10 pr-11 text-[#f0f0f8] text-sm outline-none transition-all focus:border-[#5b4fd4] focus:ring-1 focus:ring-[#5b4fd4]/40 placeholder-[#4e527a]"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 text-[#4e527a] hover:text-[#a29bfe] transition-colors p-1 flex items-center cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end mb-4">
              <Link to="/forgot-password" className="text-xs text-[#5b4fd4] hover:text-[#a29bfe] no-underline font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Direct Login Banner */}
            <div className="bg-[#171a2e]/70 border border-[#232742] rounded-xl px-3.5 py-3 mb-5 flex items-start gap-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
              <span className="text-xs text-[#818cf8] shrink-0 pt-0.5" aria-hidden="true">✨</span>
              <p className="text-[11.5px] text-[#9ca3af] leading-[1.5] m-0 font-normal">
                <strong className="text-[#a5b4fc] font-semibold">Direct Access:</strong> If an account doesn't exist yet, we will automatically create one and log you in.
              </p>
            </div>

            {/* Submit button */}
            <button
              id="signin-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#2563eb] hover:from-[#8b5cf6] hover:to-[#3b82f6] text-white rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 shadow-[0_4px_24px_rgba(91,79,212,0.45),0_0_0_1px_rgba(124,91,247,0.25)] hover:shadow-[0_6px_32px_rgba(91,79,212,0.60),0_0_0_1px_rgba(124,91,247,0.35)] hover:-translate-y-px flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <CgSpinner size={18} className="animate-spin" /> Accessing Workspace…
                </>
              ) : (
                <>
                  <FiLogIn size={16} /> Sign In / Register
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-7 text-xs text-[#4e527a] text-center tracking-wide">
          Your documents, your AI assistant — all in one place.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
