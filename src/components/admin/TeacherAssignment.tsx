import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/database';
import { toast } from 'sonner';
import { Link2, Save, Users } from 'lucide-react';

interface TeacherOption {
  user_id: string;
  display_name: string | null;
}

export function TeacherAssignment() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      setSelectedStudents(assignments[selectedTeacher] || []);
    }
  }, [selectedTeacher, assignments]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch students
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .order('name');

    // Fetch teachers (users with teacher role)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'teacher');

    if (roleData && roleData.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', roleData.map(r => r.user_id));

      setTeachers(profileData as TeacherOption[] || []);
    }

    // Fetch existing assignments
    const { data: assignmentsData } = await supabase
      .from('teacher_students')
      .select('teacher_id, student_id');

    // Group assignments by teacher
    const groupedAssignments: Record<string, string[]> = {};
    assignmentsData?.forEach(a => {
      if (!groupedAssignments[a.teacher_id]) {
        groupedAssignments[a.teacher_id] = [];
      }
      groupedAssignments[a.teacher_id].push(a.student_id);
    });

    setStudents(studentsData as Student[] || []);
    setAssignments(groupedAssignments);
    setLoading(false);
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedTeacher) {
      toast.error('Please select a teacher');
      return;
    }

    setSaving(true);

    // Delete existing assignments for this teacher
    await supabase
      .from('teacher_students')
      .delete()
      .eq('teacher_id', selectedTeacher);

    // Insert new assignments
    if (selectedStudents.length > 0) {
      const newAssignments = selectedStudents.map(studentId => ({
        teacher_id: selectedTeacher,
        student_id: studentId
      }));

      const { error } = await supabase
        .from('teacher_students')
        .insert(newAssignments);

      if (error) {
        toast.error('Failed to save assignments');
        setSaving(false);
        return;
      }
    }

    // Update local state
    setAssignments(prev => ({
      ...prev,
      [selectedTeacher]: selectedStudents
    }));

    toast.success('Assignments saved successfully');
    setSaving(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getTeacherName = (userId: string) => {
    const teacher = teachers.find(t => t.user_id === userId);
    return teacher?.display_name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teacher-Student Assignments</h1>
        <p className="text-muted-foreground">Assign students to teachers for management</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Teacher Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Teacher
            </CardTitle>
            <CardDescription>Choose a teacher to manage their assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : teachers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No teachers available. Teachers need to sign up and be assigned the teacher role.
              </p>
            ) : (
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.user_id} value={teacher.user_id}>
                      {teacher.display_name || 'Unnamed Teacher'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedTeacher && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{getTeacherName(selectedTeacher)}</p>
                <p className="text-xs text-muted-foreground">
                  Currently assigned: {selectedStudents.length} students
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Assign Students
                </CardTitle>
                <CardDescription>
                  {selectedTeacher 
                    ? `Select students to assign to ${getTeacherName(selectedTeacher)}`
                    : 'Select a teacher first'}
                </CardDescription>
              </div>
              {selectedTeacher && (
                <Button onClick={handleSaveAssignments} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Assignments'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTeacher ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Please select a teacher to manage assignments
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No students available</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map(student => {
                  const isSelected = selectedStudents.includes(student.id);
                  
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleStudentToggle(student.id)}
                    >
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => handleStudentToggle(student.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.grade ? `Grade ${student.grade}` : 'No grade'}
                        </p>
                      </div>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {student.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Assignments Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Assignments Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(assignments).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No assignments yet. Select a teacher and assign students above.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(assignments).map(([teacherId, studentIds]) => (
                <div key={teacherId} className="p-4 border rounded-lg">
                  <p className="font-medium">{getTeacherName(teacherId)}</p>
                  <p className="text-sm text-muted-foreground">
                    {studentIds.length} student{studentIds.length !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
