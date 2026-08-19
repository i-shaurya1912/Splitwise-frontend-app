import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroupById, addMember } from '../api/groups';
import { getGroupExpenses, createExpense, getBalances, getSettlements } from '../api/expenses';

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      const [groupRes, expensesRes, balancesRes, settlementsRes] = await Promise.all([
        getGroupById(groupId),
        getGroupExpenses(groupId),
        getBalances(groupId),
        getSettlements(groupId),
      ]);
      setGroup(groupRes);
      setExpenses(expensesRes.data);
      setBalances(balancesRes.data);
      setSettlements(settlementsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [groupId]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    if (!description.trim() || !amount) return;

    setSubmitting(true);
    try {
      await createExpense(description, parseFloat(amount), groupId);
      setDescription('');
      setAmount('');
      setShowExpenseModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    if (!memberEmail.trim()) return;

    setSubmitting(true);
    try {
      await addMember(groupId, memberEmail);
      setMemberEmail('');
      setShowMemberModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add member');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Back
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-white">{group?.name}</h1>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Members + Add member button */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {group?.members.map((m) => (
              <span
                key={m._id}
                className="bg-white/5 border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-full"
              >
                {m.name}
              </span>
            ))}
          </div>
          <button
            onClick={() => setShowMemberModal(true)}
            className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg"
          >
            + Add member
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {['expenses', 'balances', 'settlements'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? 'text-white border-purple-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-end mb-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowExpenseModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  + Add expense
                </motion.button>
              </div>

              {expenses.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No expenses yet</p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div
                      key={exp._id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-white font-medium">{exp.description}</p>
                        <p className="text-gray-500 text-xs mt-1">Paid by {exp.paidBy.name}</p>
                      </div>
                      <p className="text-white font-semibold">₹{exp.amount}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'balances' && (
            <motion.div
              key="balances"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {balances.map((b) => (
                <div
                  key={b.email}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center"
                >
                  <p className="text-white font-medium">{b.name}</p>
                  <p className={`font-semibold ${b.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {b.balance >= 0 ? '+' : ''}₹{b.balance.toFixed(2)}
                  </p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'settlements' && (
            <motion.div
              key="settlements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {settlements.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">All settled up 🎉</p>
              ) : (
                settlements.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"
                  >
                    <p className="text-gray-300 text-sm">
                      <span className="text-white font-medium">{s.from}</span> owes{' '}
                      <span className="text-white font-medium">{s.to}</span>
                    </p>
                    <p className="text-purple-400 font-semibold">₹{s.amount}</p>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setShowExpenseModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-white text-lg font-semibold mb-4">Add expense</h3>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-lg mb-3 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleAddExpense} className="space-y-3">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Hotel booking"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="flex-1 border border-white/10 text-gray-300 py-2.5 rounded-lg hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showMemberModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setShowMemberModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-white text-lg font-semibold mb-4">Add member</h3>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-lg mb-3 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleAddMember} className="space-y-3">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="friend@example.com"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(false)}
                    className="flex-1 border border-white/10 text-gray-300 py-2.5 rounded-lg hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add'}
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

export default GroupDetail;