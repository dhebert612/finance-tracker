import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.js';
import type { RecentPaycheck, UpcomingBill } from '../api/dashboard.js';

function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
}

function StatCard({ label, labelFr, value, sub }: {
  label: string;
  labelFr: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <div className="text-xs font-medium text-stone-400 uppercase tracking-wide">{label}</div>
      <div className="text-xs text-stone-300 mb-2">{labelFr}</div>
      <div className="text-2xl font-semibold text-stone-800">{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
    </div>
  );
}

function PaycheckCard({ paycheck }: { paycheck: RecentPaycheck }) {
  const total = parseFloat(paycheck.net_amount);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-stone-800">{paycheck.income_source_name}</div>
          <div className="text-xs text-stone-400">{formatDate(paycheck.pay_date)}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-stone-800">{formatCurrency(paycheck.net_amount)}</div>
          <div className="text-xs text-stone-400">net · {formatCurrency(paycheck.gross_amount)} gross</div>
        </div>
      </div>

      {/* Allocation bars */}
      <div className="space-y-1.5">
        {paycheck.allocations.map((alloc) => {
          const pct = Math.round((parseFloat(alloc.resolved_amount) / total) * 100);
          return (
            <div key={alloc.bucket_name}>
              <div className="flex justify-between text-xs text-stone-500 mb-0.5">
                <span>{alloc.bucket_name}</span>
                <span>{formatCurrency(alloc.resolved_amount)} · {pct}%</span>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: '#c9922a',
                    opacity: alloc.split_type === 'remainder' ? 0.4 : 0.8,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BillRow({ bill }: { bill: UpcomingBill }) {
  const today = new Date().getDate();
  const daysUntil = bill.due_day ? bill.due_day - today : null;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-stone-100 last:border-0">
      <div>
        <div className="text-sm font-medium text-stone-800">{bill.name}</div>
        <div className="text-xs text-stone-400">
          {bill.category && <span>{bill.category} · </span>}
          {daysUntil !== null && (
            <span className={daysUntil <= 3 ? 'text-red-500 font-medium' : ''}>
              due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="text-sm font-semibold text-stone-700">{formatCurrency(bill.amount)}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getSummary,
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-sm text-stone-400">Loading dashboard...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <div className="text-sm text-red-500">Failed to load dashboard.</div>
      </div>
    );
  }

  const monthName = new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  return (
    <div className="p-8 space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-semibold text-stone-800">Dashboard</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Household · snapshot + upcoming + activity · {monthName}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Household Income"
          labelFr="Revenu du ménage"
          value={formatCurrency(data.income_this_month)}
          sub="sum of logged paychecks"
        />
        <StatCard
          label="Household Spending"
          labelFr="Dépenses du ménage"
          value={formatCurrency(data.spending_this_month)}
          sub="from transaction feed"
        />
        <StatCard
          label="Savings Rate"
          labelFr="Taux d'épargne"
          value={`${data.savings_rate}%`}
          sub="(income − spending) / income"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-2 gap-6">

        {/* Recent paychecks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-700">
              Last paycheck split
              <span className="text-stone-400 font-normal ml-1">— per person</span>
            </h2>
          </div>
          <div className="space-y-3">
            {data.recent_paychecks.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-5 text-sm text-stone-400">
                No paychecks logged yet.
              </div>
            ) : (
              data.recent_paychecks.map((p) => (
                <PaycheckCard key={p.id} paycheck={p} />
              ))
            )}
          </div>
        </div>

        {/* Upcoming bills */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-700">
              Upcoming bills
              <span className="text-stone-400 font-normal ml-1">— next 14 days</span>
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 px-5 py-1">
            {data.upcoming_bills.length === 0 ? (
              <div className="py-4 text-sm text-stone-400">No bills due in the next 14 days.</div>
            ) : (
              data.upcoming_bills.map((bill) => (
                <BillRow key={bill.id} bill={bill} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}