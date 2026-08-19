import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await API.post('/auth/signup', { name, email, password });
      navigate('/login');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        setError(errors[0].msg);
      } else {
        setError(err.response?.data?.message || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center px-4 sm:px-6">
      <motion.div
        className="absolute w-56 h-56 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-600/30 rounded-full blur-3xl"
        animate={{ x: [0, 100, 0], y: [0, 60, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '10%', left: '5%' }}
      />
      <motion.div
        className="absolute w-56 h-56 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-blue-600/30 rounded-full blur-3xl"
        animate={{ x: [0, -80, 0], y: [0, 100, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{ bottom: '10%', right: '5%' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm sm:max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-1 text-center"
        >
          Create account
        </motion.h1>
        <p className="text-gray-400 text-center mb-6 sm:mb-8 text-xs sm:text-sm">
          Start splitting expenses with friends
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-xs sm:text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Rahul Sharma"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2.5 sm:py-3 text-sm sm:text-base rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </motion.button>
        </form>

        <p className="text-xs sm:text-sm text-center mt-5 sm:mt-6 text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Signup;