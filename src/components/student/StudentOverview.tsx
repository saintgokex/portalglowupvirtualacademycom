import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClipboardList, FileText, StickyNote, Users } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

interface StudentProfile {
  id: string;
  name: string;
  status: string;
  progress: number;
  grade: string | null;
  subjects: string[] | null;
  enrollment_date: string | null;
}

export function StudentOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState({
    assignmentCount: 0,
    noteCount: 0,
    reportCount: 0,
    teacherCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch student profile
    const { data: studentData } = await supabase
      .from('students')
      .select('id, name, status, progress, grade, subjects, enrollment_date')
      .eq('user_id', user?.id)
      .single();

    if (studentData) {
      setProfile(studentData);

      // Fetch counts
      const [assignments, notes, reports, teachers] = await Promise.all([
        supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('student_id', studentData.id),
        supabase.from('notes').select('*', { count: 'exact', head: true }).eq('student_id', studentData.id),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('student_id', studentData.id),
        supabase.from('teacher_students').select('*', { count: 'exact', head: true }).eq('student_id', studentData.id)
      ]);

      setStats({
        assignmentCount: assignments.count || 0,
        noteCount: notes.count || 0,
        reportCount: reports.count || 0,
        teacherCount: teachers.count || 0
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No student profile found. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          <span className="text-primary">Welcome,</span>
          <span className="text-foreground"> {profile.name}</span>
        </h2>
        <p className="text-sm text-muted-foreground">Your student portal dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Assignments"
          value={stats.assignmentCount}
          icon={ClipboardList}
        />
        <StatsCard
          title="Notes"
          value={stats.noteCount}
          icon={StickyNote}
        />
        <StatsCard
          title="Reports"
          value={stats.reportCount}
          icon={FileText}
        />
        <StatsCard
          title="Teachers"
          value={stats.teacherCount}
          icon={Users}
        />
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                {profile.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grade</p>
              <p className="font-medium">{profile.grade || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrollment Date</p>
              <p className="font-medium">
                {profile.enrollment_date 
                  ? new Date(profile.enrollment_date).toLocaleDateString() 
                  : 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subjects</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.subjects?.length ? (
                  profile.subjects.map((subject, i) => (
                    <Badge key={i} variant="outline">{subject}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">None assigned</span>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{profile.progress}%</span>
            </div>
            <Progress value={profile.progress} className="h-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}