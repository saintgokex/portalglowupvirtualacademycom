import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TeacherWithProfile {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  student_count: number;
}

export function TeacherManagement() {
  const [teachers, setTeachers] = useState<TeacherWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    
    // Get all users with teacher role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, created_at')
      .eq('role', 'teacher');
    
    if (roleError || !roleData) {
      setLoading(false);
      return;
    }

    // Get profiles for these users
    const userIds = roleData.map(r => r.user_id);
    
    if (userIds.length === 0) {
      setTeachers([]);
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    // Get student counts per teacher
    const { data: assignmentData } = await supabase
      .from('teacher_students')
      .select('teacher_id')
      .in('teacher_id', userIds);

    const studentCounts = userIds.reduce((acc, id) => {
      acc[id] = assignmentData?.filter(a => a.teacher_id === id).length || 0;
      return acc;
    }, {} as Record<string, number>);

    // Combine data
    const teachersList: TeacherWithProfile[] = roleData.map(role => {
      const profile = profileData?.find(p => p.user_id === role.user_id);
      return {
        user_id: role.user_id,
        email: profile?.display_name || 'Unknown',
        display_name: profile?.display_name,
        created_at: role.created_at,
        student_count: studentCounts[role.user_id] || 0
      };
    });

    setTeachers(teachersList);
    setLoading(false);
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Management</h1>
          <p className="text-muted-foreground">Manage teachers and their assignments</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Teacher
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Teachers ({filteredTeachers.length})</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading teachers...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No teachers found</p>
              <p className="text-sm text-muted-foreground">
                Teachers are added when users with teacher role sign up
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Students Assigned</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(teacher.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{teacher.display_name || 'Unnamed'}</p>
                            <p className="text-xs text-muted-foreground">{teacher.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{teacher.student_count} students</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(teacher.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
