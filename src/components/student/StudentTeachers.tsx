import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface TeacherAssignment {
  id: string;
  assigned_at: string;
  teacher_id: string;
  profile: {
    display_name: string | null;
  } | null;
}

export function StudentTeachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeachers();
    }
  }, [user]);

  const fetchTeachers = async () => {
    setLoading(true);

    // First get the student id
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (student) {
      // Get teacher assignments with profile info
      const { data, error } = await supabase
        .from('teacher_students')
        .select(`
          id,
          assigned_at,
          teacher_id
        `)
        .eq('student_id', student.id);

      if (error) {
        toast.error('Failed to load teachers');
        setLoading(false);
        return;
      }

      // Fetch profiles for each teacher
      if (data && data.length > 0) {
        const teacherIds = data.map(t => t.teacher_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', teacherIds);

        const teachersWithProfiles = data.map(teacher => ({
          ...teacher,
          profile: profiles?.find(p => p.user_id === teacher.teacher_id) || null
        }));

        setTeachers(teachersWithProfiles);
      } else {
        setTeachers([]);
      }
    }

    setLoading(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading teachers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">My Teachers</h2>
        <p className="text-sm text-muted-foreground">Teachers assigned to support your learning</p>
      </div>

      {teachers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No teachers assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teachers.map((teacher) => (
            <Card key={teacher.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(teacher.profile?.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium">
                    {teacher.profile?.display_name || 'Teacher'}
                  </h3>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Assigned: {new Date(teacher.assigned_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}