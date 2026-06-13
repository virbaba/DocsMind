import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { CgSpinner } from 'react-icons/cg';
import axiosInstance from '../api/axiosInstance';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Please enter your email address.');

    setIsLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
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
        <p className="text-sm text-[#6b7280] mb-7 font-normal">
          {sent ? 'Check your inbox' : 'Reset your password'}
        </p>

        {/* Card */}
        <div className="w-full bg-[#10121a] border border-[#1c1f30] rounded-2xl p-7 shadow-[0_8px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(91,79,212,0.06)]">
          {sent ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-14 h-14 rounded-full bg-[#0d2d1a] border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e] mb-1">
                <FiCheckCircle size={28} />
              </div>
              <h2 className="text-lg font-bold text-[#fafafa]">Email sent!</h2>
              <p className="text-[13px] text-[#6b7280] leading-relaxed">
                If <strong className="text-[#9ca3af]">{email}</strong> is registered, you'll receive a
                reset link shortly. Check your spam folder if you don't see it.
              </p>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center gap-2 text-[13px] text-[#5b4fd4] hover:text-[#a29bfe] font-semibold no-underline transition-colors"
              >
                <FiArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} noValidate>
              <p className="text-[13px] text-[#6b7280] leading-relaxed mb-5">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.18)] rounded-lg px-3.5 py-2.5 mb-5 text-[#f87171] text-[13px] font-medium">
                  <span className="text-[8px] shrink-0">●</span>
                  {error}
                </div>
              )}

              <div className="mb-5">
                <label htmlFor="fp-email" className="block text-[13px] font-medium text-[#9ca3af] mb-2">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#4e527a] flex items-center pointer-events-none">
                    <FiMail size={16} />
                  </span>
                  <input
                    id="fp-email"
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

              <button
                id="send-reset-btn"
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#7c3aed] to-[#2563eb] hover:from-[#8b5cf6] hover:to-[#3b82f6] text-white rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 shadow-[0_4px_24px_rgba(91,79,212,0.45),0_0_0_1px_rgba(124,91,247,0.25)] hover:shadow-[0_6px_32px_rgba(91,79,212,0.60),0_0_0_1px_rgba(124,91,247,0.35)] hover:-translate-y-px flex items-center justify-center gap-2 cursor-pointer mb-4 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <><CgSpinner size={16} className="animate-spin" /> Sending…</>
                ) : (
                  'Send Reset Link'
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
          )}
        </div>

        <p className="mt-7 text-xs text-[#4e527a] text-center tracking-wide">
          Your documents, your AI assistant — all in one place.
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
