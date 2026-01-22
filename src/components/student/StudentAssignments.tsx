import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Download, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  due_date: string | null;
  created_at: string;
}

export function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    setLoading(true);

    // First get the student id
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (student) {
      const { data, error } = await supabase
        .from('assignments')
        .select('id, title, file_name, file_path, due_date, created_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load assignments');
      } else {
        setAssignments(data || []);
      }
    }

    setLoading(false);
  };

  const handleDownload = async (assignment: Assignment) => {
    setDownloading(assignment.id);
    
    try {
      const { data, error } = await supabase.storage
        .from('assignments')
        .download(assignment.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = assignment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  const getDueStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    if (due < now) return 'overdue';
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'soon';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">My Assignments</h2>
        <p className="text-sm text-muted-foreground">View and download your assignments</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No assignments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const dueStatus = getDueStatus(assignment.due_date);
            
            return (
              <Card key={assignment.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{assignment.title}</h3>
                      {dueStatus === 'overdue' && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                      {dueStatus === 'soon' && (
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">Due Soon</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {assignment.file_name}
                      </span>
                      {assignment.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(assignment)}
                    disabled={downloading === assignment.id}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading === assignment.id ? 'Downloading...' : 'Download'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}