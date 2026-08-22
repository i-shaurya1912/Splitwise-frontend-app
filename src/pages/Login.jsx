import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
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
              account_balance_wallet
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1a1c1d] dark:text-white tracking-tight">SplitSmart</h1>
        </div>

        <div className="neu rounded-2xl p-7">
          <h2 className="text-lg font-semibold text-[#1a1c1d] dark:text-white mb-1">Welcome back</h2>
          <p className="text-[#575766] dark:text-gray-400 text-sm mb-6">Log in to continue</p>

          {error && (
            <div className="bg-[#ffdad6] text-[#93000a] px-3 py-2 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#575766] dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm text-[#1a1c1d] dark:text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006b56]/40"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#575766] dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full neu-inset rounded-xl pl-4 pr-11 py-2.5 text-sm text-[#1a1c1d] dark:text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006b56]/40"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#575766] hover:text-[#006b56] dark:text-gray-400 dark:hover:text-[#49ddb9] transition-colors p-1 flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006b56] text-white font-medium text-sm py-3 rounded-xl neu-btn hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="text-sm text-center mt-5 text-[#575766] dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#006b56] dark:text-[#49ddb9] font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;