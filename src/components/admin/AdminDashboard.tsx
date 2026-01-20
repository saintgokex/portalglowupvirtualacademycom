import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, TrendingUp, Link2 } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/database';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    avgProgress: 0,
    totalAssignments: 0
  });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    // Fetch student count
    const { count: studentCount, data: studentsData } = await supabase
      .from('students')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch teacher count
    const { count: teacherCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    // Fetch all students for avg progress
    const { data: progressData } = await supabase
      .from('students')
      .select('progress');

    const avgProgress = progressData && progressData.length > 0
      ? Math.round(progressData.reduce((acc, s) => acc + s.progress, 0) / progressData.length)
      : 0;

    // Fetch assignment count
    const { count: assignmentCount } = await supabase
      .from('teacher_students')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalStudents: studentCount || 0,
      totalTeachers: teacherCount || 0,
      avgProgress,
      totalAssignments: assignmentCount || 0
    });

    setRecentStudents(studentsData as Student[] || []);
    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your educational platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon={GraduationCap}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={Users}
        />
        <StatsCard
          title="Avg. Progress"
          value={`${stats.avgProgress}%`}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Active Assignments"
          value={stats.totalAssignments}
          icon={Link2}
        />
      </div>

      {/* Recent Students */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Added Students</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : recentStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No students yet</p>
          ) : (
            <div className="space-y-4">
              {recentStudents.map(student => (
                <div key={student.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{student.name}</p>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {student.grade ? `Grade ${student.grade}` : 'No grade'} 
                      {student.parent_name && ` • Parent: ${student.parent_name}`}
                    </p>
                  </div>
                  <div className="w-24">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{student.progress}%</span>
                    </div>
                    <Progress value={student.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
