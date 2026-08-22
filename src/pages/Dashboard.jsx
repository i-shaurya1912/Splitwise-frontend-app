import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getGroups, createGroup } from '../api/groups';
import { getBalances } from '../api/expenses';

const GROUP_ICONS = ['flight', 'home', 'restaurant', 'celebration', 'shopping_cart', 'directions_car'];
const getGroupIcon = (name) => GROUP_ICONS[name.charCodeAt(0) % GROUP_ICONS.length];

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState({ owed: 0, owe: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const res = await getGroups();
      setGroups(res.data);

      // Har group ki balances fetch karke apna total nikalo
      const balanceResults = await Promise.all(
        res.data.map((g) => getBalances(g._id).catch(() => ({ data: [] })))
      );

      let owed = 0;
      let owe = 0;
      balanceResults.forEach((r) => {
        const mine = r.data.find((b) => b.email === user?.email);
        if (mine) {
          if (mine.balance > 0) owed += mine.balance;
          else owe += Math.abs(mine.balance);
        }
      });
      setSummary({ owed, owe });
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
    <div className="min-h-screen bg-[#F3F3F4] dark:bg-[#151618] transition-colors pb-10">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#F3F3F4] dark:bg-[#151618] px-5 pt-4 pb-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full neu flex items-center justify-center text-[#006b56] dark:text-[#49ddb9]">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <h1 className="text-lg font-bold text-[#1a1c1d] dark:text-white tracking-tight">SplitSmart</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full neu neu-btn flex items-center justify-center text-[#006b56] dark:text-[#49ddb9]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-[#575766] dark:text-gray-400 neu neu-btn px-3 py-2 rounded-xl"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 mt-4">
        {/* Balance summary card */}
        <section className="neu rounded-2xl p-6 mb-8">
          <div className="flex flex-col items-center mb-5">
            <span className="text-xs font-medium text-[#575766] dark:text-gray-400 uppercase tracking-wider mb-1">
              Net Balance
            </span>
            <span
              className={`text-3xl font-bold ${
                summary.owed - summary.owe >= 0 ? 'text-[#006b56] dark:text-[#49ddb9]' : 'text-[#EA4C89]'
              }`}
            >
              ₹{Math.abs(summary.owed - summary.owe).toFixed(2)}
            </span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 neu-inset rounded-xl p-4 flex flex-col items-center">
              <span className="text-xs text-[#575766] dark:text-gray-400 mb-1">You are owed</span>
              <span className="text-lg font-semibold text-[#1cc29f]">₹{summary.owed.toFixed(2)}</span>
            </div>
            <div className="flex-1 neu-inset rounded-xl p-4 flex flex-col items-center">
              <span className="text-xs text-[#575766] dark:text-gray-400 mb-1">You owe</span>
              <span className="text-lg font-semibold text-[#EA4C89]">₹{summary.owe.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Groups */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1a1c1d] dark:text-white">Your groups</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#006b56] text-white text-sm font-medium px-4 py-2 rounded-xl neu-btn hover:opacity-90 transition-opacity"
          >
            + New group
          </button>
        </div>

        {loading ? (
          <p className="text-[#575766] dark:text-gray-400 text-sm">Loading...</p>
        ) : groups.length === 0 ? (
          <div className="neu-inset rounded-2xl p-10 text-center">
            <span className="material-symbols-outlined text-[#575766] dark:text-gray-500 mb-2" style={{ fontSize: 32 }}>
              group_add
            </span>
            <p className="text-[#1a1c1d] dark:text-white font-medium">No groups yet</p>
            <p className="text-[#575766] dark:text-gray-500 text-sm mt-1">Create one to start splitting expenses</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => navigate(`/groups/${group._id}`)}
                className="neu rounded-2xl p-4 flex flex-col items-center cursor-pointer neu-btn"
              >
                <div className="w-12 h-12 rounded-full neu-inset flex items-center justify-center mb-3 text-[#006b56] dark:text-[#49ddb9]">
                  <span className="material-symbols-outlined">{getGroupIcon(group.name)}</span>
                </div>
                <span className="text-sm font-medium text-[#1a1c1d] dark:text-white text-center truncate w-full">
                  {group.name}
                </span>
                <span className="text-xs text-[#575766] dark:text-gray-500 mt-0.5">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </span>
              </div>
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
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="neu rounded-2xl p-6 w-full max-w-sm bg-[#F3F3F4] dark:bg-[#1e1f22]"
            >
              <h3 className="text-[#1a1c1d] dark:text-white font-semibold mb-4">Create new group</h3>
              {error && (
                <div className="bg-[#ffdad6] text-[#93000a] px-3 py-2 rounded-xl mb-3 text-sm">{error}</div>
              )}
              <form onSubmit={handleCreateGroup}>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Goa Trip"
                  autoFocus
                  className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm text-[#1a1c1d] dark:text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006b56]/40 mb-4"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 neu neu-btn text-[#575766] dark:text-gray-300 text-sm py-2.5 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-[#006b56] text-white text-sm font-medium py-2.5 rounded-xl neu-btn disabled:opacity-50"
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