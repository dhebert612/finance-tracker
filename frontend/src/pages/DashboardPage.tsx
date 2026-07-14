import { useAuthStore } from '../store/authStore.js';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-stone-800">
        Welcome back, {user?.display_name}
      </h1>
      <p className="text-stone-500 mt-1">Dashboard coming soon.</p>
    </div>
  );
}