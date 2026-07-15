import { pool } from '../db/pool.js';

export interface DashboardSummary {
  income_this_month:       number;
  spending_this_month:     number;
  savings_rate:            number;
  upcoming_bills:          UpcomingBill[];
  recent_paychecks:        RecentPaycheck[];
  next_paycheck_alert:     NextPaycheckAlert | null;
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: string;
  frequency: string;
  due_day: number | null;
  category: string | null;
  last_paid_date: string | null;
}

export interface RecentPaycheck {
  id: string;
  pay_date: string;
  gross_amount: string;
  net_amount: string;
  income_source_name: string;
  allocations: {
    bucket_name: string;
    split_type: string;
    resolved_amount: string;
  }[];
}

export interface NextPaycheckAlert {
  next_paycheck_date: string;
  bills_due: UpcomingBill[];
  total_due: number;
}

function getNextPaycheckDate(lastPayDate: Date, frequency: string): Date {
  const next = new Date(lastPayDate);
  switch (frequency) {
    case 'weekly':      next.setDate(next.getDate() + 7);  break;
    case 'biweekly':   next.setDate(next.getDate() + 14); break;
    case 'monthly':    next.setMonth(next.getMonth() + 1); break;
    case 'semi_monthly':
      // If paid on 1st-15th, next is the 15th or 1st of next month
      if (next.getDate() <= 15) {
        next.setDate(15);
      } else {
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
      }
      break;
  }
  return next;
}

export const dashboardRepository = {

  async getSummary(userId: string): Promise<DashboardSummary> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Income this month
    const incomeResult = await pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(net_amount), 0) as total
       FROM paychecks
       WHERE user_id = $1 AND deleted_at IS NULL
         AND pay_date >= $2 AND pay_date <= $3`,
      [userId, firstOfMonth, lastOfMonth]
    );
    const incomeThisMonth = parseFloat(incomeResult.rows[0].total);

    // Spending this month
    const spendingResult = await pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(ABS(t.amount)), 0) as total
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN account_members am ON am.account_id = a.id
       WHERE am.user_id = $1 AND t.deleted_at IS NULL
         AND t.amount < 0
         AND t.transaction_date >= $2 AND t.transaction_date <= $3`,
      [userId, firstOfMonth, lastOfMonth]
    );
    const spendingThisMonth = parseFloat(spendingResult.rows[0].total);

    const savingsRate = incomeThisMonth > 0
      ? Math.round(((incomeThisMonth - spendingThisMonth) / incomeThisMonth) * 100)
      : 0;

    // All bills with last payment
    const billsResult = await pool.query<UpcomingBill>(
      `SELECT b.id, b.name, b.amount, b.frequency, b.due_day, b.category,
              MAX(bp.paid_date::text) as last_paid_date
       FROM bills b
       LEFT JOIN bill_payments bp ON bp.bill_id = b.id
       WHERE b.user_id = $1 AND b.deleted_at IS NULL AND b.due_day IS NOT NULL
       GROUP BY b.id, b.name, b.amount, b.frequency, b.due_day, b.category
       ORDER BY b.due_day ASC`,
      [userId]
    );

    // Upcoming bills — due in next 14 days
    const today = now.getDate();
    const in14Days = today + 14;
    const upcomingBills = billsResult.rows.filter(bill =>
      bill.due_day !== null && bill.due_day >= today && bill.due_day <= in14Days
    );

    // Recent paychecks
    const paychecksResult = await pool.query<{
      id: string; pay_date: string; gross_amount: string;
      net_amount: string; income_source_name: string;
    }>(
      `SELECT p.id, p.pay_date, p.gross_amount, p.net_amount,
              COALESCE(i.name, 'Unknown') as income_source_name
       FROM paychecks p
       LEFT JOIN income_sources i ON i.id = p.income_source_id
       WHERE p.user_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.pay_date DESC LIMIT 3`,
      [userId]
    );

    const recentPaychecks: RecentPaycheck[] = [];
    for (const paycheck of paychecksResult.rows) {
      const allocationsResult = await pool.query<{ bucket_name: string; split_type: string; resolved_amount: string }>(
        `SELECT bucket_name, split_type, resolved_amount
         FROM paycheck_allocations WHERE paycheck_id = $1 ORDER BY sort_order ASC`,
        [paycheck.id]
      );
      recentPaychecks.push({ ...paycheck, allocations: allocationsResult.rows });
    }

    // Next paycheck alert — find most recent paycheck with income source frequency
    let nextPaycheckAlert: NextPaycheckAlert | null = null;

    const latestPaycheckResult = await pool.query<{
      pay_date: string; pay_frequency: string;
    }>(
      `SELECT p.pay_date, i.pay_frequency
       FROM paychecks p
       JOIN income_sources i ON i.id = p.income_source_id
       WHERE p.user_id = $1 AND p.deleted_at IS NULL AND i.deleted_at IS NULL
       ORDER BY p.pay_date DESC LIMIT 1`,
      [userId]
    );

    if (latestPaycheckResult.rows.length > 0) {
      const { pay_date, pay_frequency } = latestPaycheckResult.rows[0];
      const lastPayDate    = new Date(pay_date);
      const nextPayDate    = getNextPaycheckDate(lastPayDate, pay_frequency);
      const todayDay       = now.getDate();
      const nextPayDay     = nextPayDate.getDate();

      // Bills due between today and next paycheck
      const billsDue = billsResult.rows.filter(bill => {
        if (!bill.due_day) return false;
        return bill.due_day >= todayDay && bill.due_day <= nextPayDay;
      });

      const totalDue = billsDue.reduce((sum, b) => sum + parseFloat(b.amount), 0);

      nextPaycheckAlert = {
        next_paycheck_date: nextPayDate.toISOString().split('T')[0],
        bills_due:          billsDue,
        total_due:          Math.round(totalDue * 100) / 100,
      };
    }

    return {
      income_this_month:   incomeThisMonth,
      spending_this_month: spendingThisMonth,
      savings_rate:        savingsRate,
      upcoming_bills:      upcomingBills,
      recent_paychecks:    recentPaychecks,
      next_paycheck_alert: nextPaycheckAlert,
    };
  },

};