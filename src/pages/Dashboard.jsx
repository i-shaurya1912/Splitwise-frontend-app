import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGroups, createGroup } from '../api/groups';

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const res = await getGroups();
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    if (!newGroupName.trim()) return;

    setCreating(true);
    try {
      await createGroup(newGroupName);
      setNewGroupName('');
      setShowModal(false);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create group');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background blobs */}
      <motion.div
        className="absolute w-64 h-64 sm:w-96 sm:h-96 bg-purple-600/20 rounded-full blur-3xl"
        animate={{ x: [0, 80, 0], y: [0, 50, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '-5%', left: '0%' }}
      />
      <motion.div
        className="absolute w-64 h-64 sm:w-96 sm:h-96 bg-blue-600/20 rounded-full blur-3xl"
        animate={{ x: [0, -60, 0], y: [0, 70, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '30%', right: '0%' }}
      />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-white">
            Split<span className="text-purple-400">wise</span>
          </h1>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:block text-sm text-gray-400">
              Hi, {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Your groups</h2>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm sm:text-base font-medium px-4 py-2 rounded-lg"
          >
            + New group
          </motion.button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : groups.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-gray-400 mb-2">No groups yet</p>
            <p className="text-gray-500 text-sm">Create one to start splitting expenses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, i) => (
              <motion.div
                key={group._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/groups/${group._id}`)}
                className="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer hover:border-purple-500/50 transition-all"
              >
                <h3 className="text-white font-semibold text-lg mb-1">{group.name}</h3>
                <p className="text-gray-400 text-sm">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-white text-lg font-semibold mb-4">Create new group</h3>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-lg mb-3 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateGroup}>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Goa Trip"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-white/10 text-gray-300 py-2.5 rounded-lg hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-lg disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;