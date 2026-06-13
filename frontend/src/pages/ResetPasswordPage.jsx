import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { CgSpinner } from 'react-icons/cg';
import axiosInstance from '../api/axiosInstance';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) return setError('Please enter a new password.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setIsLoading(true);
    try {
      await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      navigate('/', { replace: true, state: { passwordReset: true } });
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
        backgroundSize: '24px 24px',
      }}
    >
      {/* Main center glow */}
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(91,79,212,0.10) 0%, rgba(64,53,168,0.05) 45%, transparent 70%)' }}
      />
      {/* Bottom corner glow */}
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(91,79,212,0.06) 0%, transparent 65%)' }}
      />

      <div className="flex flex-col items-center w-full max-w-[480px] relative z-10">
        {/* Logo */}
        <div className="mb-4">
          <img src="/images/docs_mind_logo.png?v=3" alt="DocsMind" className="w-60 h-40 object-contain" />
        </div>

        <h1 className="text-[26px] font-bold text-[#fafafa] tracking-[-0.5px] mb-1.5">DocsMind</h1>
        <p className="text-sm text-[#6b7280] mb-7 font-normal">Choose a new password</p>

        {/* Card */}
        <div className="w-full bg-[#10121a] border border-[#1c1f30] rounded-2xl p-7 shadow-[0_8px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(91,79,212,0.06)]">
          <form onSubmit={handleSubmit} noValidate>
            <p className="text-[13px] text-[#6b7280] leading-relaxed mb-5">
              Your new password must be at least 6 characters long.
            </p>

            {error && (
              <div className="flex items-center gap-2 bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.18)] rounded-lg px-3.5 py-2.5 mb-5 text-[#f87171] text-[13px] font-medium">
                <span className="text-[8px] shrink-0">●</span>
                {error}
              </div>
            )}

            {/* New Password */}
            <div className="mb-4">
              <label htmlFor="new-password" className="block text-[13px] font-medium text-[#9ca3af] mb-2">
                New Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#4e527a] flex items-center pointer-events-none">
                  <FiLock size={16} />
                </span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-[#1a1c2e] border border-[#20223a] rounded-lg py-2.5 pl-10 pr-11 text-[#f0f0f8] text-sm outline-none transition-all focus:border-[#5b4fd4] focus:ring-1 focus:ring-[#5b4fd4]/40 placeholder-[#4e527a]"
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

            {/* Confirm Password */}
            <div className="mb-6">
              <label htmlFor="confirm-password" className="block text-[13px] font-medium text-[#9ca3af] mb-2">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#4e527a] flex items-center pointer-events-none">
                  <FiLock size={16} />
                </span>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  className="w-full bg-[#1a1c2e] border border-[#20223a] rounded-lg py-2.5 pl-10 pr-11 text-[#f0f0f8] text-sm outline-none transition-all focus:border-[#5b4fd4] focus:ring-1 focus:ring-[#5b4fd4]/40 placeholder-[#4e527a]"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 text-[#4e527a] hover:text-[#a29bfe] transition-colors p-1 flex items-center cursor-pointer"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="reset-password-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#2563eb] hover:from-[#8b5cf6] hover:to-[#3b82f6] text-white rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 shadow-[0_4px_24px_rgba(91,79,212,0.45),0_0_0_1px_rgba(124,91,247,0.25)] hover:shadow-[0_6px_32px_rgba(91,79,212,0.60),0_0_0_1px_rgba(124,91,247,0.35)] hover:-translate-y-px flex items-center justify-center gap-2 cursor-pointer mb-4 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <><CgSpinner size={16} className="animate-spin" /> Resetting…</>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#a29bfe] no-underline font-medium transition-colors"
              >
                <FiArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-7 text-xs text-[#4e527a] text-center tracking-wide">
          Your documents, your AI assistant — all in one place.
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
