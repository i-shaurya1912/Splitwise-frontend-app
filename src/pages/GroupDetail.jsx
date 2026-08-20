import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroupById, addMember } from '../api/groups';
import { getGroupExpenses, createExpense, getBalances, getSettlements } from '../api/expenses';
import { createOrder, verifyPayment } from '../api/payments';
import { useTheme } from '../context/ThemeContext';

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

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
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshGroupData = useCallback(async () => {
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
  }, [groupId]);

  useEffect(() => {
    void refreshGroupData();
  }, [refreshGroupData]);

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    if (!description.trim() || !amount) return;

    setSubmitting(true);
    try {
      await createExpense(description, parseFloat(amount), groupId, selectedMembers);
      setDescription('');
      setAmount('');
      setSelectedMembers([]);
      setShowExpenseModal(false);
      void refreshGroupData();
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
      void refreshGroupData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (settlement) => {
    try {
      const res = await createOrder(settlement.amount, settlement.toUserId, groupId);

      const options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: res.data.currency,
        order_id: res.data.orderId,
        name: 'Splitwise Settlement',
        description: `Payment to ${settlement.to}`,
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: res.data.paymentId,
            });
            alert('Payment successful!');
            void refreshGroupData();
          } catch {
            alert('Payment verification failed');
          }
        },
        theme: { color: '#111827' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Could not start payment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d10] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d10] transition-colors">
      {/* Navbar */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
            >
              ← Back
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {group?.name}
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 transition-colors text-sm"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Members + Add member button */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {group?.members.map((m) => (
              <span
                key={m._id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 text-xs px-3 py-1.5 rounded-full"
              >
                {m.name}
              </span>
            ))}
          </div>
          <button
            onClick={() => setShowMemberModal(true)}
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add member
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
          {['expenses', 'balances', 'settlements'].map((tab) => {
            const isActive = activeTab === tab;
            const tabClassName = isActive
              ? 'px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors text-gray-900 border-gray-900 dark:text-white dark:border-white'
              : 'px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors text-gray-400 border-transparent dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300';

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={tabClassName}
              >
                {tab}
              </button>
            );
          })}
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
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  + Add expense
                </button>
              </div>

              {expenses.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-500 text-sm text-center py-8">No expenses yet</p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div
                      key={exp._id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{exp.description}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                          Paid by {exp.paidBy.name} · Split among {exp.splitBetween.length}
                        </p>
                      </div>
                      <p className="text-gray-900 dark:text-white font-semibold">₹{exp.amount}</p>
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
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex justify-between items-center"
                >
                  <p className="text-gray-900 dark:text-white font-medium">{b.name}</p>
                  <p className={`font-semibold ${b.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                <p className="text-gray-500 dark:text-gray-500 text-sm text-center py-8">All settled up 🎉</p>
              ) : (
                settlements.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        <span className="text-gray-900 dark:text-white font-medium">{s.from}</span> owes{' '}
                        <span className="text-gray-900 dark:text-white font-medium">{s.to}</span>
                      </p>
                      <p className="text-gray-900 dark:text-white font-semibold mt-0.5">₹{s.amount}</p>
                    </div>
                    <button
                      onClick={() => handlePay(s)}
                      className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                      Pay
                    </button>
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
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowExpenseModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-full max-w-sm"
            >
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Add expense</h3>
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-3 text-sm">
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
                  className="w-full bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Split between
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {group?.members.map((m) => (
                      <label
                        key={m._id}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(m._id)}
                          onChange={() => toggleMember(m._id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 accent-gray-900 dark:accent-white"
                        />
                        {m.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {selectedMembers.length === 0
                      ? 'Nothing selected — will split equally among all members'
                      : `Splitting among ${selectedMembers.length} member(s)`}
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="flex-1 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-sm py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
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
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowMemberModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-full max-w-sm"
            >
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Add member</h3>
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-3 text-sm">
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
                  className="w-full bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                />
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(false)}
                    className="flex-1 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-sm py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
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