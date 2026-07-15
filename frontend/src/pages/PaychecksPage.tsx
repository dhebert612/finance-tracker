import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paychecksApi } from '../api/paychecks.js';
import { allocationTemplateApi } from '../api/allocation-template.js';
import { dashboardApi } from '../api/dashboard.js';
import type { Paycheck, PaycheckWithAllocations } from '../api/paychecks.js';
import type { TemplateRule } from '../api/allocation-template.js';
import type { NextPaycheckAlert } from '../api/dashboard.js';
import { Plus, Trash2, Save, X, ChevronRight, AlertCircle } from 'lucide-react';

function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Next Paycheck Alert ──────────────────────────────────────────────────────

function NextPaycheckCard({ alert }: { alert: NextPaycheckAlert }) {
  const dismissKey = `paycheck_alert_dismissed_${alert.next_paycheck_date}`;
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(dismissKey) === 'true');

  function handleDismiss() {
    sessionStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-amber-800">Next paycheck heads up</div>
            <button onClick={handleDismiss} className="text-amber-400 hover:text-amber-600 transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="text-xs text-amber-600 mt-0.5">Next expected: {formatFullDate(alert.next_paycheck_date)}</div>
          {alert.bills_due.length === 0 ? (
            <p className="text-sm text-amber-700 mt-3">No bills due before your next paycheck.</p>
          ) : (
            <>
              <div className="mt-3 space-y-1.5">
                {alert.bills_due.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between">
                    <div className="text-sm text-amber-800">
                      {bill.name}
                      {bill.due_day && <span className="text-xs text-amber-500 ml-1.5">due the {bill.due_day}</span>}
                    </div>
                    <span className="text-sm font-semibold text-amber-800">{formatCurrency(bill.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-between">
                <span className="text-xs font-medium text-amber-600">
                  {alert.bills_due.length === 1 ? '1 bill' : `${alert.bills_due.length} bills`} to set aside before next paycheck
                </span>
                <span className="text-base font-bold text-amber-800">{formatCurrency(alert.total_due)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Bucket Modal ─────────────────────────────────────────────────────────

function AddBucketModal({ onClose, onAdd }: { onClose: () => void; onAdd: (rule: TemplateRule) => void }) {
  const [form, setForm] = useState({ bucket_name: '', split_type: 'percent' as TemplateRule['split_type'], value: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({ bucket_name: form.bucket_name, split_type: form.split_type, value: form.split_type === 'remainder' ? 0 : parseFloat(form.value) || 0, sort_order: 0 });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Add bucket</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Bucket name</label>
            <input type="text" required autoFocus value={form.bucket_name}
              onChange={(e) => setForm({ ...form, bucket_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. Rent, Savings, Fun..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Split type</label>
            <div className="flex gap-2">
              {(['percent', 'fixed', 'remainder'] as const).map((type) => (
                <button key={type} type="button" onClick={() => setForm({ ...form, split_type: type })}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${form.split_type === type ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                  {type === 'percent' ? '% Percent' : type === 'fixed' ? '$ Fixed' : '↩ Remainder'}
                </button>
              ))}
            </div>
          </div>
          {form.split_type !== 'remainder' && (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                {form.split_type === 'percent' ? 'Percentage (0–100)' : 'Fixed amount ($)'}
              </label>
              <input type="number" step="0.01" min="0" required value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder={form.split_type === 'percent' ? '15' : '1200.00'} />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50">Cancel</button>
            <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#c9922a' }}>Add bucket</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Paycheck Modal ───────────────────────────────────────────────────────

function AddPaycheckModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: sources = [] } = useQuery({ queryKey: ['income-sources'], queryFn: paychecksApi.getIncomeSources });
  const [form, setForm] = useState({ income_source_id: '', pay_date: new Date().toISOString().split('T')[0], gross_amount: '', net_amount: '', note: '' });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: paychecksApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paychecks'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); onSuccess(); },
    onError: (err: any) => { setError(err.response?.data?.error ?? 'Something went wrong'); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    mutation.mutate({ income_source_id: form.income_source_id, pay_date: form.pay_date, gross_amount: parseFloat(form.gross_amount), net_amount: parseFloat(form.net_amount), note: form.note || undefined, buckets: [] });
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Log a paycheck</h2>
            <p className="text-sm text-stone-400 mt-0.5">Enregistrer une paie</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Income source</label>
            <select required value={form.income_source_id} onChange={(e) => setForm({ ...form, income_source_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">Select a source...</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Pay date</label>
            <input type="date" required value={form.pay_date} onChange={(e) => setForm({ ...form, pay_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Gross amount</label>
              <input type="number" step="0.01" min="0" required value={form.gross_amount} onChange={(e) => setForm({ ...form, gross_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="3500.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Net amount</label>
              <input type="number" step="0.01" min="0" required value={form.net_amount} onChange={(e) => setForm({ ...form, net_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="3000.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Note <span className="text-stone-400 font-normal">(optional)</span></label>
            <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. Mid-month pay" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-stone-600 border border-stone-300 hover:bg-stone-50 transition">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition" style={{ backgroundColor: mutation.isPending ? '#d6a84e' : '#c9922a' }}>
              {mutation.isPending ? 'Saving...' : 'Save paycheck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Split Panel ──────────────────────────────────────────────────────────────

function SplitPanel({ selectedPaycheck }: { selectedPaycheck?: PaycheckWithAllocations }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'split' | 'template'>('split');
  const [showAddBucket, setShowAddBucket] = useState(false);
  const [rules, setRules] = useState<TemplateRule[]>([]);
  const [saved, setSaved] = useState(false);

  const { data: template } = useQuery({ queryKey: ['allocation-template'], queryFn: allocationTemplateApi.getMine });
  useEffect(() => { if (template?.rules) setRules(template.rules); }, [template]);

  const saveMutation = useMutation({
    mutationFn: allocationTemplateApi.saveMine,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allocation-template'] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  function addRule(rule: TemplateRule) { setRules([...rules, { ...rule, sort_order: rules.length }]); }
  function removeRule(i: number) { setRules(rules.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, sort_order: idx }))); }

  const netAmount = selectedPaycheck ? parseFloat(selectedPaycheck.net_amount) : 0;

  return (
    <div className="bg-white rounded-xl border border-stone-200">
      <div className="flex border-b border-stone-100">
        <button onClick={() => setTab('split')}
          className={`flex-1 py-3 text-xs font-medium transition ${tab === 'split' ? 'text-amber-700 border-b-2 border-amber-400' : 'text-stone-400 hover:text-stone-600'}`}>
          Paycheck split
        </button>
        <button onClick={() => setTab('template')}
          className={`flex-1 py-3 text-xs font-medium transition ${tab === 'template' ? 'text-amber-700 border-b-2 border-amber-400' : 'text-stone-400 hover:text-stone-600'}`}>
          Split template
        </button>
      </div>

      <div className="p-5">
        {tab === 'split' && (
          <>
            <p className="text-xs text-stone-400 mb-4">
              {selectedPaycheck
                ? `${formatDate(selectedPaycheck.pay_date)} · ${formatCurrency(selectedPaycheck.net_amount)} net · ${formatCurrency(selectedPaycheck.gross_amount)} gross`
                : 'Click a paycheck to see how it was split'}
            </p>
            {selectedPaycheck?.allocations.length ? (
              <div className="space-y-3">
                {selectedPaycheck.allocations.map((alloc) => {
                  const pct = netAmount > 0 ? Math.round((parseFloat(alloc.resolved_amount) / netAmount) * 100) : 0;
                  return (
                    <div key={alloc.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-stone-800">{alloc.bucket_name}</span>
                          <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                            {alloc.split_type === 'percent' ? `${parseFloat(alloc.value)}%` : alloc.split_type === 'fixed' ? `${formatCurrency(alloc.value)} fixed` : 'remainder'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-stone-700">{formatCurrency(alloc.resolved_amount)}</span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#c9922a', opacity: alloc.split_type === 'remainder' ? 0.45 : 0.85 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No split data available.</p>
            )}
          </>
        )}

        {tab === 'template' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-stone-400">Applied automatically to each new paycheck</p>
              <button onClick={() => saveMutation.mutate(rules)} disabled={saveMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition"
                style={{ backgroundColor: saved ? '#6b9e6b' : '#c9922a' }}>
                <Save size={12} />
                {saved ? 'Saved!' : 'Save'}
              </button>
            </div>
            <div className="space-y-1">
              {rules.length === 0 ? (
                <p className="text-sm text-stone-400 py-2">No buckets yet — add one below.</p>
              ) : (
                rules.map((rule, i) => (
                  <div key={i} className="group flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-800">{rule.bucket_name}</span>
                      <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                        {rule.split_type === 'percent' ? `${rule.value}%` : rule.split_type === 'fixed' ? formatCurrency(rule.value) : 'remainder'}
                      </span>
                    </div>
                    <button onClick={() => removeRule(i)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowAddBucket(true)}
              className="mt-4 flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium transition">
              <Plus size={13} />
              Add bucket
            </button>
            {showAddBucket && <AddBucketModal onClose={() => setShowAddBucket(false)} onAdd={addRule} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaychecksPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: paychecks = [], isLoading } = useQuery({ queryKey: ['paychecks'], queryFn: paychecksApi.getAll });
  const { data: dashboardData } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.getSummary });

  useEffect(() => {
    if (paychecks.length > 0 && !selectedId) setSelectedId(paychecks[0].id);
  }, [paychecks]);

  const { data: selectedPaycheck } = useQuery({
    queryKey: ['paychecks', selectedId],
    queryFn: () => paychecksApi.getOne(selectedId!),
    enabled: !!selectedId,
  });

  const deleteMutation = useMutation({
    mutationFn: paychecksApi.remove,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['paychecks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (selectedId === deletedId) setSelectedId(null);
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Paychecks</h1>
          <p className="text-sm text-stone-400 mt-0.5">Paie — log and split your income</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#c9922a' }}>
          <Plus size={15} />
          Log paycheck
        </button>
      </div>

      <div className="flex flex-col gap-6">

        {/* Paycheck history */}
        <div>
          <h2 className="text-sm font-semibold text-stone-600 mb-3">History</h2>
          {isLoading ? (
            <div className="text-sm text-stone-400">Loading...</div>
          ) : paychecks.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-6 text-sm text-stone-400">No paychecks logged yet.</div>
          ) : (
            <div className="space-y-2">
              {paychecks.map((p: Paycheck) => (
                <div key={p.id} onClick={() => setSelectedId(p.id)}
                  className={`bg-white rounded-xl border px-5 py-4 flex items-center justify-between cursor-pointer transition-all ${selectedId === p.id ? 'border-amber-300 ring-1 ring-amber-100' : 'border-stone-200 hover:border-stone-300'}`}>
                  <div>
                    <div className="text-sm font-medium text-stone-800">{formatDate(p.pay_date)}</div>
                    <div className="text-xs text-stone-400 mt-0.5">Net {formatCurrency(p.net_amount)} · Gross {formatCurrency(p.gross_amount)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(p.id); }} className="text-stone-300 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                    <ChevronRight size={15} className={`transition-colors ${selectedId === p.id ? 'text-amber-400' : 'text-stone-200'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next paycheck alert */}
        {dashboardData?.next_paycheck_alert && (
          <NextPaycheckCard alert={dashboardData.next_paycheck_alert} />
        )}

        {/* Split panel */}
        <SplitPanel selectedPaycheck={selectedPaycheck} />

      </div>

      {showModal && <AddPaycheckModal onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)} />}
    </div>
  );
}