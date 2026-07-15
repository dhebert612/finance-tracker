import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billsApi } from '../api/bills.js';
import type { Bill, CreateBillInput } from '../api/bills.js';
import { Plus, Trash2, CheckCircle, X, Circle } from 'lucide-react';

function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CATEGORIES = ['Housing','Utilities','Internet','Insurance','Subscriptions','Transport','Healthcare','Education','Auto','Other'];

function dueDateLabel(bill: Bill): string {
  if (bill.frequency === 'yearly' && bill.due_month && bill.due_day) {
    return `${MONTHS[bill.due_month - 1]} ${bill.due_day}`;
  }
  if (bill.due_day) return `due the ${bill.due_day}`;
  return '';
}

// ─── Add Bill Modal ───────────────────────────────────────────────────────────

function AddBillModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateBillInput>({
    name: '', amount: 0, frequency: 'monthly', due_day: undefined, due_month: undefined, category: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: billsApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bills'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); onSuccess(); },
    onError: (err: any) => { setError(err.response?.data?.error ?? 'Something went wrong'); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    mutation.mutate(form);
  }

  const isYearly = form.frequency === 'yearly';

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Add a bill</h2>
            <p className="text-sm text-stone-400 mt-0.5">Ajouter une facture</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Bill name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. Netflix, Hydro-Québec..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Amount</label>
              <input type="number" step="0.01" min="0" required value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="17.99" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as any, due_month: undefined, due_day: undefined })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
              </select>
            </div>
          </div>

          {/* Due date — different for yearly vs monthly */}
          {isYearly ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Due month</label>
                <select value={form.due_month ?? ''} onChange={(e) => setForm({ ...form, due_month: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Select month...</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Due day</label>
                <input type="number" min="1" max="31" value={form.due_day || ''}
                  onChange={(e) => setForm({ ...form, due_day: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="20" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Due day <span className="text-stone-400 font-normal">(day of month)</span></label>
                <input type="number" min="1" max="31" value={form.due_day || ''}
                  onChange={(e) => setForm({ ...form, due_day: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="15" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                <select value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">No category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Category for yearly (full width) */}
          {isYearly && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
              <select value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">No category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-stone-600 border border-stone-300 hover:bg-stone-50 transition">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition" style={{ backgroundColor: mutation.isPending ? '#d6a84e' : '#c9922a' }}>
              {mutation.isPending ? 'Saving...' : 'Add bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Mark Paid Modal ──────────────────────────────────────────────────────────

function MarkPaidModal({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ paid_date: today, amount_paid: parseFloat(bill.amount) });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => billsApi.markPaid(bill.id, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bills'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Mark as paid — {bill.name}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Date paid</label>
            <input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Amount paid</label>
            <input type="number" step="0.01" min="0" value={form.amount_paid}
              onChange={(e) => setForm({ ...form, amount_paid: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#c9922a' }}>
              {mutation.isPending ? 'Saving...' : 'Mark paid'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bill Row ─────────────────────────────────────────────────────────────────

function BillRow({ bill, onMarkPaid, onUnmarkPaid, onDelete }: { bill: Bill; onMarkPaid: (bill: Bill) => void; onUnmarkPaid: (id: string) => void; onDelete: (id: string) => void }) {
  const now = new Date();
  const isPaidThisMonth = bill.last_payment
    ? new Date(bill.last_payment.paid_date).getMonth() === now.getMonth() &&
      new Date(bill.last_payment.paid_date).getFullYear() === now.getFullYear()
    : false;

  const isPaidThisYear = bill.frequency === 'yearly' && bill.last_payment
    ? new Date(bill.last_payment.paid_date).getFullYear() === now.getFullYear()
    : false;

  const isPaid = bill.frequency === 'yearly' ? isPaidThisYear : isPaidThisMonth;

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg border transition ${isPaid ? 'bg-green-50 border-green-100' : 'bg-white border-stone-200 hover:border-stone-300'}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => isPaid ? onUnmarkPaid(bill.id) : onMarkPaid(bill)}
          className={`transition-colors ${isPaid ? 'text-green-500 hover:text-red-400' : 'text-stone-300 hover:text-amber-500'}`}
          title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
        >
          {isPaid ? <CheckCircle size={16} /> : <Circle size={16} />}
        </button>
        <div>
          <div className={`text-sm font-medium ${isPaid ? 'text-green-800 line-through' : 'text-stone-800'}`}>{bill.name}</div>
          <div className="text-xs text-stone-400 mt-0.5">
            {bill.category && <span>{bill.category}</span>}
            {dueDateLabel(bill) && <span className="ml-1">· {dueDateLabel(bill)}</span>}
            {isPaid && bill.last_payment && (
              <span className="ml-1 text-green-600">
                · paid {new Date(bill.last_payment.paid_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold ${isPaid ? 'text-green-700' : 'text-stone-700'}`}>{formatCurrency(bill.amount)}</span>
        <button onClick={() => onDelete(bill.id)} className="text-stone-200 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ bills }: { bills: Bill[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  const billsByDay: Record<number, Bill[]> = {};
  bills.forEach((bill) => {
    if (!bill.due_day) return;
    if (bill.frequency === 'yearly') {
      // Only show yearly bills in their due month
      if (bill.due_month && bill.due_month !== month + 1) return;
    }
    if (!billsByDay[bill.due_day]) billsByDay[bill.due_day] = [];
    billsByDay[bill.due_day].push(bill);
  });

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = now.getDate();

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h2 className="text-sm font-semibold text-stone-800 mb-4">Calendar — {monthName}</h2>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-xs text-stone-400 font-medium text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const dayBills = day ? (billsByDay[day] ?? []) : [];
          const isToday = day === today;
          return (
            <div key={i} className={`min-h-14 p-1.5 rounded-lg border text-xs ${day ? (isToday ? 'border-amber-300 bg-amber-50' : 'border-stone-100') : 'border-transparent'}`}>
              {day && (
                <>
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-amber-700' : 'text-stone-400'}`}>{day}</div>
                  {dayBills.map((bill) => (
                    <div key={bill.id} className="text-xs bg-amber-100 text-amber-800 rounded px-1 py-0.5 mb-0.5 truncate">
                      {bill.name} <span className="opacity-60">{formatCurrency(bill.amount)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [markPaidBill, setMarkPaidBill] = useState<Bill | null>(null);
  const queryClient = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({ queryKey: ['bills'], queryFn: billsApi.getAll });

  const deleteMutation = useMutation({
    mutationFn: billsApi.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bills'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); },
  });

  const unmarkPaidMutation = useMutation({
    mutationFn: billsApi.unmarkPaid,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bills'] }); },
  });

  const monthlyBills = bills.filter((b) => b.frequency !== 'yearly');
  const yearlyBills  = bills.filter((b) => b.frequency === 'yearly');

  const monthlyTotal = monthlyBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const yearlyTotal  = yearlyBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const yearlyMonthlySetAside = Math.round((yearlyTotal / 12) * 100) / 100;

  if (isLoading) return <div className="p-8 text-sm text-stone-400">Loading...</div>;

  return (
    <div className="p-8 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Bills</h1>
          <p className="text-sm text-stone-400 mt-0.5">Factures — monthly + yearly, then calendar</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#c9922a' }}>
          <Plus size={15} />
          Add bill
        </button>
      </div>

      {/* Monthly bills */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-800">Monthly bills</h2>
          <span className="text-xs text-stone-400 font-medium">{formatCurrency(monthlyTotal)} / mo</span>
        </div>
        {monthlyBills.length === 0 ? (
          <p className="text-sm text-stone-400">No monthly bills yet.</p>
        ) : (
          <div className="space-y-2">
            {monthlyBills.map((bill) => (
              <BillRow key={bill.id} bill={bill} onMarkPaid={setMarkPaidBill} onUnmarkPaid={(id) => unmarkPaidMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      {/* Yearly bills */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-stone-800">Yearly bills</h2>
          <div className="text-right">
            <span className="text-xs text-stone-400">{formatCurrency(yearlyTotal)} / yr</span>
            {yearlyTotal > 0 && <span className="text-xs text-stone-400 ml-2">· ≈ {formatCurrency(yearlyMonthlySetAside)}/mo set aside</span>}
          </div>
        </div>
        {yearlyTotal > 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4 mt-2">
            Yearly bills show a suggested monthly set-aside so they don't surprise you.
          </p>
        )}
        {yearlyBills.length === 0 ? (
          <p className="text-sm text-stone-400">No yearly bills yet.</p>
        ) : (
          <div className="space-y-2">
            {yearlyBills.map((bill) => (
              <BillRow key={bill.id} bill={bill} onMarkPaid={setMarkPaidBill} onUnmarkPaid={(id) => unmarkPaidMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      {/* Calendar */}
      <CalendarView bills={bills} />

      {showAddModal && <AddBillModal onClose={() => setShowAddModal(false)} onSuccess={() => setShowAddModal(false)} />}
      {markPaidBill && <MarkPaidModal bill={markPaidBill} onClose={() => setMarkPaidBill(null)} />}
    </div>
  );
}