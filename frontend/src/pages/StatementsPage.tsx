import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statementsApi } from '../api/statements.js';
import type { CreditAccount, CreditStatement, StatementAnalysis } from '../api/statements.js';
import { Plus, X, CreditCard, Upload, Loader2, AlertTriangle, Trash2 } from 'lucide-react';

function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Add Card Modal ───────────────────────────────────────────────────────────

function AddCardModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => statementsApi.createAccount(name),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['credit-accounts'] }); onSuccess(); },
    onError: (err: any) => { setError(err.response?.data?.error ?? 'Something went wrong'); },
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Add credit card</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Card name</label>
            <input type="text" required autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && mutation.mutate()}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. Visa Desjardins, TD Mastercard..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !name.trim()}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#c9922a' }}>
              {mutation.isPending ? 'Adding...' : 'Add card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Analyzer ─────────────────────────────────────────────────────────────

function PdfAnalyzer({ account }: { account: CreditAccount }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<StatementAnalysis | null>(null);
  const [amountDue, setAmountDue] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') setFile(f);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      let result;
      if (mode === 'pdf' && file) {
        result = await statementsApi.uploadAndAnalyze(account.id, file);
      } else {
        result = await statementsApi.analyzeText(account.id, text);
      }
      setAnalysis(result.analysis);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setText('');
    setAnalysis(null);
    setError(null);
  }

  const canAnalyze = mode === 'pdf' ? !!file : text.trim().length > 0;

  return (
    <div className="space-y-4">

      {/* Mode toggle */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit">
        <button onClick={() => setMode('pdf')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${mode === 'pdf' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
          📄 Upload PDF
        </button>
        <button onClick={() => setMode('text')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${mode === 'text' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
          📋 Paste text
        </button>
      </div>

      {/* PDF upload */}
      {mode === 'pdf' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !file && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            file ? 'border-amber-300 bg-amber-50' : 'border-stone-200 hover:border-amber-300 hover:bg-amber-50 cursor-pointer'
          }`}
        >
          {file ? (
            <div>
              <p className="text-sm font-medium text-amber-800">{file.name}</p>
              <p className="text-xs text-amber-600 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="mt-2 text-xs text-amber-500 hover:text-amber-700 underline">
                Remove
              </button>
            </div>
          ) : (
            <div>
              <Upload size={24} className="mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-600">Drop your PDF statement here</p>
              <p className="text-xs text-stone-400 mt-1">or click to browse · max 10MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Text paste */}
      {mode === 'text' && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
          placeholder="Paste your bank statement text here..."
        />
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {(file || text || analysis) && (
          <button onClick={handleReset} className="px-3 py-2 rounded-lg text-xs font-medium text-stone-500 border border-stone-200 hover:bg-stone-50">
            Reset
          </button>
        )}
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !canAnalyze}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition"
          style={{ backgroundColor: '#c9922a' }}
        >
          {analyzing ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : '✨ Analyze with AI'}
        </button>
      </div>

      {/* Analysis results */}
      {analysis && (
        <div className="space-y-4">

          {/* Summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-amber-800 mb-1">AI Summary</h3>
            <p className="text-sm text-amber-900">{analysis.summary}</p>
            <div className="flex gap-6 mt-3 pt-3 border-t border-amber-200">
              <div>
                <div className="text-xs text-amber-600">Total spent this period</div>
                <div className="text-lg font-bold text-amber-900">{formatCurrency(analysis.total_spent)}</div>
              </div>
              <div>
                <div className="text-xs text-amber-600">Amount due on statement</div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amountDue}
                    onChange={(e) => setAmountDue(e.target.value)}
                    className="w-28 px-2 py-1 rounded-lg border border-amber-300 text-amber-900 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="157.91"
                  />
                </div>
                <div className="text-xs text-amber-500 mt-0.5">Enter from statement header</div>
              </div>
              <div>
                <div className="text-xs text-amber-600">Transactions found</div>
                <div className="text-lg font-bold text-amber-900">{analysis.total_transactions}</div>
              </div>
            </div>
          </div>

          {/* Flagged */}
          {analysis.flagged.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <h3 className="text-xs font-semibold text-stone-700 mb-3 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-500" />
                Flagged items ({analysis.flagged.length})
              </h3>
              <div className="space-y-2">
                {analysis.flagged.map((item, i) => (
                  <div key={i} className="flex items-start justify-between text-sm">
                    <div>
                      <span className="text-stone-700 font-medium">{item.merchant}</span>
                      <p className="text-xs text-stone-400">{item.reason}</p>
                    </div>
                    <span className="font-medium text-stone-800 ml-4">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All transactions */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="text-xs font-semibold text-stone-700 mb-3">
              All transactions ({analysis.transactions.length})
            </h3>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {analysis.transactions.map((txn, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400 w-20 shrink-0">{txn.date}</span>
                    <span className="text-sm text-stone-800">{txn.merchant}</span>
                    {txn.is_subscription && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">sub</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400">{txn.category}</span>
                    <span className="text-sm font-medium text-stone-700">{formatCurrency(txn.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Statement History ────────────────────────────────────────────────────────

function StatementHistory({ account }: { account: CreditAccount }) {
  const { data: statements = [], isLoading } = useQuery({
    queryKey: ['statements', account.id],
    queryFn: () => statementsApi.getStatements(account.id),
  });

  const isActive = (s: CreditStatement) => new Date(s.due_date) >= new Date();
  const active = statements.filter(isActive);
  const past   = statements.filter(s => !isActive(s));

  if (isLoading) return <div className="text-sm text-stone-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {active.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Current</h3>
          {active.map((s) => (
            <div key={s.id} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-amber-900">{formatDate(s.statement_date)}</div>
                <div className="text-xs text-amber-600 mt-0.5">Due {formatDate(s.due_date)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-900">{formatCurrency(s.closing_balance)}</div>
                {s.minimum_payment && <div className="text-xs text-amber-600">min. {formatCurrency(s.minimum_payment)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">History</h3>
          <div className="space-y-1.5">
            {past.map((s) => (
              <div key={s.id} className="bg-white border border-stone-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-stone-700">{formatDate(s.statement_date)}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{s.ai_analyzed_at ? '✓ Analyzed' : 'Not analyzed'}</div>
                </div>
                <div className="text-sm font-semibold text-stone-700">{formatCurrency(s.closing_balance)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {statements.length === 0 && (
        <p className="text-sm text-stone-400">No statements yet for this card.</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatementsPage() {
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['credit-accounts'],
    queryFn: statementsApi.getAccounts,
  });

  const deleteMutation = useMutation({
    mutationFn: statementsApi.deleteAccount,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['credit-accounts'] }); setSelectedAccount(null); },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Statements</h1>
          <p className="text-sm text-stone-400 mt-0.5">Relevés — credit cards + AI analysis</p>
        </div>
        <button onClick={() => setShowAddCard(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#c9922a' }}>
          <Plus size={15} />
          Add card
        </button>
      </div>

      {/* Card library */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-semibold text-stone-800 mb-4">Your credit cards</h2>
        {isLoading ? (
          <div className="text-sm text-stone-400">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="text-sm text-stone-400">No credit cards added yet. Add one to get started.</div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            {accounts.map((account) => (
              <div key={account.id} onClick={() => setSelectedAccount(account)}
                className={`group relative flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                  selectedAccount?.id === account.id ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-200' : 'border-stone-200 hover:border-stone-300'
                }`}>
                <CreditCard size={16} className="text-stone-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-stone-800">{account.name}</div>
                  <div className="text-xs text-stone-400">Manual</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(account.id); }}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected card detail */}
      {selectedAccount && (
        <div className="bg-white rounded-xl border border-stone-200">
          <div className="flex items-center justify-between p-5 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-stone-400" />
              <h2 className="text-sm font-semibold text-stone-800">{selectedAccount.name}</h2>
            </div>
            <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
              <button onClick={() => setActiveTab('analyze')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === 'analyze' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                ✨ Analyze
              </button>
              <button onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === 'history' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                History
              </button>
            </div>
          </div>
          <div className="p-5">
            {activeTab === 'analyze' ? <PdfAnalyzer account={selectedAccount} /> : <StatementHistory account={selectedAccount} />}
          </div>
        </div>
      )}

      {showAddCard && <AddCardModal onClose={() => setShowAddCard(false)} onSuccess={() => setShowAddCard(false)} />}
    </div>
  );
}