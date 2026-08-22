import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroupById, addMember } from '../api/groups';
import { getGroupExpenses, createExpense, getBalances, getSettlements } from '../api/expenses';
import { createOrder, verifyPayment, getGroupPayments } from '../api/payments';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['#a78bfa', '#f472b6', '#fb923c', '#34d399', '#38bdf8', '#c084fc'];
const getAvatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [searchQuery, setSearchQuery] = useState('');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      const [groupRes, expensesRes, balancesRes, settlementsRes, paymentsRes] = await Promise.all([
        getGroupById(groupId),
        getGroupExpenses(groupId),
        getBalances(groupId),
        getSettlements(groupId),
        getGroupPayments(groupId),
      ]);
      setGroup(groupRes);
      setExpenses(expensesRes.data);
      setBalances(balancesRes.data);
      setSettlements(settlementsRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [groupId]);

  useEffect(() => {
    if (user && !paidBy) setPaidBy(user.id);
  }, [user]);

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
      await createExpense(description, parseFloat(amount), groupId, selectedMembers, paidBy);
      setDescription('');
      setAmount('');
      setSelectedMembers([]);
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
    if (!memberIdentifier.trim()) return;

    setSubmitting(true);
    try {
      await addMember(groupId, memberIdentifier);
      setMemberIdentifier('');
      setShowMemberModal(false);
      fetchAll();
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
        name: 'SplitSmart Settlement',
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
            fetchAll();
          } catch (err) {
            alert('Payment verification failed');
          }
        },
        theme: { color: '#006b56' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Could not start payment');
    }
  };

  const filteredExpenses = expenses.filter((exp) =>
    exp.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F3F4] dark:bg-[#151618] flex items-center justify-center">
        <p className="text-[#575766] dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F3F4] dark:bg-[#151618] transition-colors pb-10">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#F3F3F4] dark:bg-[#151618] px-5 pt-4 pb-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-full neu neu-btn flex items-center justify-center text-[#575766] dark:text-gray-300 flex-shrink-0"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            </button>
            <h1 className="text-base font-semibold text-[#1a1c1d] dark:text-white truncate">{group?.name}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowMemberModal(true)}
              className="w-9 h-9 rounded-full neu neu-btn flex items-center justify-center text-[#006b56] dark:text-[#49ddb9]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group_add</span>
            </button>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full neu neu-btn flex items-center justify-center text-[#006b56] dark:text-[#49ddb9]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5">
        {/* Members */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          {group?.members.map((m) => (
            <span key={m._id} className="neu-sm text-[#575766] dark:text-gray-300 text-xs px-3 py-1.5 rounded-full">
              {m.name}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto neu-inset rounded-xl p-1">
          {['expenses', 'balances', 'settlements', 'payments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium capitalize rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'neu text-[#006b56] dark:text-[#49ddb9]'
                  : 'text-[#575766] dark:text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'expenses' && (
            <motion.div key="expenses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#575766] dark:text-gray-500" style={{ fontSize: 18 }}>
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search expenses..."
                    className="w-full neu-inset rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1a1c1d] dark:text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006b56]/40"
                  />
                </div>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="bg-[#006b56] text-white text-sm font-medium px-4 py-2.5 rounded-xl neu-btn flex-shrink-0"
                >
                  + Add
                </button>
              </div>

              {filteredExpenses.length === 0 ? (
                <p className="text-[#575766] dark:text-gray-500 text-sm text-center py-8">
                  {searchQuery ? 'No matching expenses' : 'No expenses yet'}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((exp) => (
                    <div key={exp._id} className="neu rounded-xl p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg neu-inset flex items-center justify-center text-[#006b56] dark:text-[#49ddb9] flex-shrink-0">
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#1a1c1d] dark:text-white font-medium truncate">{exp.description}</p>
                          <p className="text-[#575766] dark:text-gray-400 text-xs mt-0.5">
                            Paid by {exp.paidBy.name} · Split among {exp.splitBetween.length}
                          </p>
                        </div>
                      </div>
                      <p className="text-[#1a1c1d] dark:text-white font-semibold flex-shrink-0 ml-2">₹{exp.amount}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'balances' && (
            <motion.div key="balances" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {balances.map((b) => (
                <div key={b.email} className="neu rounded-xl p-4 flex justify-between items-center">
                  <p className="text-[#1a1c1d] dark:text-white font-medium">{b.name}</p>
                  <p className={`font-semibold ${b.balance >= 0 ? 'text-[#1cc29f]' : 'text-[#EA4C89]'}`}>
                    {b.balance >= 0 ? '+' : ''}₹{b.balance.toFixed(2)}
                  </p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'settlements' && (
            <motion.div key="settlements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {settlements.length === 0 ? (
                <p className="text-[#575766] dark:text-gray-500 text-sm text-center py-8">All settled up 🎉</p>
              ) : (
                settlements.map((s, i) => (
                  <div key={i} className="neu rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[#575766] dark:text-gray-300 text-sm">
                        <span className="text-[#1a1c1d] dark:text-white font-medium">{s.from}</span> owes{' '}
                        <span className="text-[#1a1c1d] dark:text-white font-medium">{s.to}</span>
                      </p>
                      <p className="text-[#1a1c1d] dark:text-white font-semibold mt-0.5">₹{s.amount}</p>
                    </div>
                    <button
                      onClick={() => handlePay(s)}
                      className="bg-[#006b56] text-white text-xs font-medium px-3 py-2 rounded-xl neu-btn"
                    >
                      Pay
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-[#575766] dark:text-gray-500 text-sm text-center py-8">No payments yet</p>
              ) : (
                payments.map((p) => (
                  <div key={p._id} className="neu rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                        style={{ backgroundColor: getAvatarColor(p.from.name) }}
                      >
                        {p.from.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1a1c1d] dark:text-white text-sm font-medium truncate">
                          {p.from.name} → {p.to.name}
                        </p>
                        <p className="text-[#575766] dark:text-gray-400 text-xs">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}
                          {new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-[#1a1c1d] dark:text-white font-semibold">₹{p.amount}</p>
                      <span
                        className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                          p.status === 'paid'
                            ? 'bg-[#d4f5ec] text-[#006b56]'
                            : p.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-[#ffdad6] text-[#93000a]'
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </div>
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowExpenseModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="neu rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#F3F3F4] dark:bg-[#1e1f22]"
            >
              <h3 className="text-[#1a1c1d] dark:text-white font-semibold mb-4">Add expense</h3>
              {error && <div className="bg-[#ffdad6] text-[#93000a] px-3 py-2 rounded-xl mb-3 text-sm">{error}</div>}
              <form onSubmit={handleAddExpense} className="space-y-3">
                <input
                  type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Hotel booking" autoFocus
                  className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm text-[#1a1c1d] dark:text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006b56]/40"
                />
                <input
                  type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount" min="0.01" step="0.01"
                  className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm text-[#1a1c1d] dark:text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006b56]/40"
                />
                <div>
                  <label className="block text-xs font-medium text-[#575766] dark:text-gray-400 mb-2 uppercase tracking-wide">Paid by</label>
                  <select
                    value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm text-[#1a1c1d] dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-[#006b56]/40"
                  >
                    {group?.members.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#575766] dark:text-gray-400 mb-2 uppercase tracking-wide">Split between</label>
                  <div className="neu-inset rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto">
                    {group?.members.map((m) => (
                      <label key={m._id} className="flex items-center gap-2 text-sm text-[#1a1c1d] dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox" checked={selectedMembers.includes(m._id)}
                          onChange={() => toggleMember(m._id)}
                          className="w-4 h-4 rounded accent-[#006b56]"
                        />
                        {m.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-[#575766] dark:text-gray-500 mt-1">
                    {selectedMembers.length === 0 ? 'Splits equally among all members' : `Splitting among ${selectedMembers.length} member(s)`}
                  </p>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 neu neu-btn text-[#575766] dark:text-gray-300 text-sm py-2.5 rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 bg-[#006b56] text-white text-sm font-medium py-2.5 rounded-xl neu-btn disabled:opacity-50">
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
            onClick={() => setShowMemberModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="neu rounded-2xl p-6 w-full max-w-sm bg-[#F3F3F4] dark:bg-[#1e1f22]"
            >
              <h3 className="text-[#1a1c1d] dark:text-white font-semibold mb-4">Add member</h3>
              {error && <div className="bg-[#ffdad6] text-[#93000a] px-3 py-2 rounded-xl mb-3 text-sm">{error}</div>}
              <form onSubmit={handleAddMember} className="space-y-3">
                <input
                  type="text" value={memberIdentifier} onChange={(e) => setMemberIdentifier(e.target.value)}
                  placeholder="Email address" autoFocus
                  className="w-full neu-inset rounded-xl px-4 py-2.5 text-sm text-[#1a1c1d] dark:text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006b56]/40"
                />
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 neu neu-btn text-[#575766] dark:text-gray-300 text-sm py-2.5 rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 bg-[#006b56] text-white text-sm font-medium py-2.5 rounded-xl neu-btn disabled:opacity-50">
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