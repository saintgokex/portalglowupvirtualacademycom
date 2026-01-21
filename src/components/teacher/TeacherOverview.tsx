import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, FileUp, ClipboardList, CalendarOff } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

interface StudentData {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  progress: number;
  grade: string | null;
}

export function TeacherOverview() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [stats, setStats] = useState({
    studentCount: 0,
    reportCount: 0,
    assignmentCount: 0,
    pendingLeave: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch students
    const { data: studentsData, count: studentCount } = await supabase
      .from('students_teacher_view')
      .select('*', { count: 'exact' })
      .limit(5);

    // Fetch report count
    const { count: reportCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    // Fetch assignment count
    const { count: assignmentCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true });

    // Fetch pending leave count
    const { count: pendingLeave } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    setStudents(studentsData as StudentData[] || []);
    setStats({
      studentCount: studentCount || 0,
      reportCount: reportCount || 0,
      assignmentCount: assignmentCount || 0,
      pendingLeave: pendingLeave || 0
    });
    setLoading(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          <span className="text-primary">GLOWUP</span>
          <span className="text-emerald-500"> VIRTUAL ACADEMY</span>
        </h2>
        <p className="text-sm text-muted-foreground">online school management platform</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Students"
          value={stats.studentCount}
          icon={Users}
        />
        <StatsCard
          title="Reports Uploaded"
          value={stats.reportCount}
          icon={FileUp}
        />
        <StatsCard
          title="Assignments"
          value={stats.assignmentCount}
          icon={ClipboardList}
        />
        <StatsCard
          title="Pending Leave"
          value={stats.pendingLeave}
          icon={CalendarOff}
        />
      </div>

      {/* Recent Students */}
      <Card>
        <CardHeader>
          <CardTitle>My Students</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No students assigned yet</p>
          ) : (
            <div className="space-y-4">
              {students.map(student => (
                <div key={student.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-emerald-500/10 text-emerald-600">
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
                      {student.grade ? `Grade ${student.grade}` : 'No grade assigned'}
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
