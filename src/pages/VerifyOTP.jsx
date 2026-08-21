import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../api/auth';
import { useTheme } from '../context/ThemeContext';

function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOTP(email, otp);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      await resendOTP(email);
      setMessage('OTP resent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d10] flex items-center justify-center px-4 transition-colors">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-300"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-7 sm:p-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Verify your email
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            We sent a 6-digit code to {email || 'your email'}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg mb-4 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full text-center tracking-[0.5em] text-lg bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
              required
            />
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <button
            onClick={handleResend}
            className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mt-4"
          >
            Resend code
          </button>
        </div>

        <p className="text-sm text-center mt-5 text-gray-500 dark:text-gray-400">
          <Link to="/login" className="text-gray-900 dark:text-white font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;