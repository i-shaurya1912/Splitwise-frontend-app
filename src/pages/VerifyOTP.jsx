import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../api/auth';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();

  const email = location.state?.email || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    // Keep only numbers
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Handle pasting multi-digit OTP
    if (cleanValue.length > 1) {
      const pasted = cleanValue.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Single digit input
    const newDigits = [...digits];
    newDigits[index] = cleanValue.slice(-1);
    setDigits(newDigits);

    // Auto-advance focus to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otp = digits.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter complete 6-digit OTP code');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await verifyOTP(email, otp);
      setMessage('Verification successful! Logging you in...');
      
      // Auto-login if token is returned
      if (res.data?.token && res.data?.user) {
        login(res.data.user, res.data.token);
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setTimeout(() => navigate('/login'), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setMessage('');
    try {
      await resendOTP(email);
      setMessage('New 6-digit verification code sent to your email!');
      setResendCooldown(30); // 30 seconds cooldown
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F3F4] dark:bg-[#151618] flex items-center justify-center px-4 transition-colors">
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 w-10 h-10 rounded-full neu neu-btn flex items-center justify-center text-[#006b56] dark:text-[#49ddb9]"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined">
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl neu flex items-center justify-center mb-3 text-[#006b56] dark:text-[#49ddb9]">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
              mark_email_read
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1a1c1d] dark:text-white tracking-tight">Verify Email</h1>
        </div>

        <div className="neu rounded-2xl p-7">
          <h2 className="text-lg font-semibold text-[#1a1c1d] dark:text-white mb-1 text-center">
            Enter OTP Code
          </h2>
          <p className="text-[#575766] dark:text-gray-400 text-xs text-center mb-6 leading-relaxed">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-[#1a1c1d] dark:text-gray-200 block truncate">{email || 'your email'}</span>
          </p>

          {error && (
            <div className="bg-[#ffdad6] text-[#93000a] px-3.5 py-2.5 rounded-xl mb-4 text-xs font-medium text-center flex items-center justify-center gap-1.5 animate-fadeIn">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              {error}
            </div>
          )}

          {message && (
            <div className="bg-[#ccebe1] text-[#004b3b] dark:bg-[#004b3b]/30 dark:text-[#49ddb9] px-3.5 py-2.5 rounded-xl mb-4 text-xs font-medium text-center flex items-center justify-center gap-1.5 animate-fadeIn">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-12 text-center text-lg font-bold neu-inset rounded-xl text-[#1a1c1d] dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-[#006b56] dark:focus:ring-[#49ddb9] transition-all duration-150"
                  required
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-[#006b56] text-white font-medium text-sm py-3 rounded-xl neu-btn hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-200 shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-[#575766] dark:text-gray-400">Didn't receive code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-xs font-semibold text-[#006b56] dark:text-[#49ddb9] hover:underline disabled:opacity-50 disabled:no-underline transition-all flex items-center gap-1"
            >
              {resendCooldown > 0 ? (
                <>Resend in {resendCooldown}s</>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
                  Resend OTP
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-sm text-center mt-5 text-[#575766] dark:text-gray-400">
          <Link to="/login" className="text-[#006b56] dark:text-[#49ddb9] font-medium hover:underline flex items-center justify-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;