import { pool } from '../db/pool.js';

export interface DashboardSummary {
  income_this_month: number;
  spending_this_month: number;
  savings_rate: number;
  upcoming_bills: UpcomingBill[];
  recent_paychecks: RecentPaycheck[];
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

export const dashboardRepository = {

  async getSummary(userId: string): Promise<DashboardSummary> {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Income this month — sum of net paychecks
    const incomeResult = await pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(net_amount), 0) as total
       FROM paychecks
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND pay_date >= $2
         AND pay_date <= $3`,
      [userId, firstOfMonth, lastOfMonth]
    );
    const incomeThisMonth = parseFloat(incomeResult.rows[0].total);

    // Spending this month — sum of transaction amounts (expenses only, negative amounts)
    const spendingResult = await pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(ABS(t.amount)), 0) as total
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       JOIN account_members am ON am.account_id = a.id
       WHERE am.user_id = $1
         AND t.deleted_at IS NULL
         AND t.amount < 0
         AND t.transaction_date >= $2
         AND t.transaction_date <= $3`,
      [userId, firstOfMonth, lastOfMonth]
    );
    const spendingThisMonth = parseFloat(spendingResult.rows[0].total);

    // Savings rate
    const savingsRate = incomeThisMonth > 0
      ? Math.round(((incomeThisMonth - spendingThisMonth) / incomeThisMonth) * 100)
      : 0;

    // Upcoming bills — due within next 14 days based on due_day
    const upcomingBillsResult = await pool.query<UpcomingBill>(
      `SELECT
         b.id, b.name, b.amount, b.frequency, b.due_day, b.category,
         MAX(bp.paid_date::text) as last_paid_date
       FROM bills b
       LEFT JOIN bill_payments bp ON bp.bill_id = b.id
       WHERE b.user_id = $1
         AND b.deleted_at IS NULL
         AND b.due_day IS NOT NULL
       GROUP BY b.id, b.name, b.amount, b.frequency, b.due_day, b.category
       ORDER BY b.due_day ASC`,
      [userId]
    );

    // Filter to bills due in next 14 days
    const today = now.getDate();
    const in14Days = today + 14;
    const upcomingBills = upcomingBillsResult.rows.filter(bill => {
      if (!bill.due_day) return false;
      const dueDay = bill.due_day;
      // Handle month wrap (e.g. today is 25, due day is 5 next month)
      return dueDay >= today && dueDay <= in14Days;
    });

    // Recent paychecks — last 3 with allocations
    const paychecksResult = await pool.query<{
      id: string;
      pay_date: string;
      gross_amount: string;
      net_amount: string;
      income_source_name: string;
    }>(
      `SELECT
         p.id, p.pay_date, p.gross_amount, p.net_amount,
         COALESCE(i.name, 'Unknown') as income_source_name
       FROM paychecks p
       LEFT JOIN income_sources i ON i.id = p.income_source_id
       WHERE p.user_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.pay_date DESC
       LIMIT 3`,
      [userId]
    );

    // Fetch allocations for each paycheck
    const recentPaychecks: RecentPaycheck[] = [];
    for (const paycheck of paychecksResult.rows) {
      const allocationsResult = await pool.query<{
        bucket_name: string;
        split_type: string;
        resolved_amount: string;
      }>(
        `SELECT bucket_name, split_type, resolved_amount
         FROM paycheck_allocations
         WHERE paycheck_id = $1
         ORDER BY sort_order ASC`,
        [paycheck.id]
      );

      recentPaychecks.push({
        ...paycheck,
        allocations: allocationsResult.rows,
      });
    }

    return {
      income_this_month:   incomeThisMonth,
      spending_this_month: spendingThisMonth,
      savings_rate:        savingsRate,
      upcoming_bills:      upcomingBills,
      recent_paychecks:    recentPaychecks,
    };
  },

};