import { useState, useEffect } from 'react';
import { Users, CheckSquare, TrendingUp, Clock } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { StudentList } from './StudentList';
import { TasksList } from './TasksList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeTasks: 0,
    avgProgress: 0,
    pendingReviews: 0
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    // Fetch student count
    const { count: studentCount } = await supabase
      .from('students_teacher_view')
      .select('*', { count: 'exact', head: true });

    // Fetch active tasks count
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'completed');

    // Fetch average progress
    const { data: progressData } = await supabase
      .from('students_teacher_view')
      .select('progress');

    const avgProgress = progressData && progressData.length > 0
      ? Math.round(progressData.reduce((acc, s) => acc + s.progress, 0) / progressData.length)
      : 0;

    // Fetch pending reviews (tasks that are in_progress)
    const { count: pendingCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    setStats({
      totalStudents: studentCount || 0,
      activeTasks: taskCount || 0,
      avgProgress,
      pendingReviews: pendingCount || 0
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your students.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Tasks"
          value={stats.activeTasks}
          icon={CheckSquare}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Avg. Progress"
          value={`${stats.avgProgress}%`}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={Clock}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StudentList />
        </div>
        <div>
          <TasksList />
        </div>
      </div>
    </div>
  );
}
