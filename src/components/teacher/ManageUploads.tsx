import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FileText, Trash2, Download, Calendar, User, BookOpen, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

interface UploadItem {
  id: string;
  title?: string;
  description?: string;
  file_name: string;
  file_path: string;
  created_at: string;
  student_name?: string;
}

export function ManageUploads() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<UploadItem[]>([]);
  const [assignments, setAssignments] = useState<UploadItem[]>([]);
  const [reports, setReports] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ item: UploadItem; type: 'note' | 'assignment' | 'report' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchUploads();
    }
  }, [user]);

  const fetchUploads = async () => {
    setLoading(true);

    // Fetch all uploads in parallel
    const [notesRes, assignmentsRes, reportsRes] = await Promise.all([
      supabase.from('notes').select('id, title, file_name, file_path, created_at, student_id').eq('teacher_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('assignments').select('id, title, file_name, file_path, created_at, student_id, due_date').eq('teacher_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('reports').select('id, description, file_name, file_path, created_at, student_id').eq('teacher_id', user?.id).order('created_at', { ascending: false })
    ]);

    // Collect all student IDs
    const allStudentIds = new Set<string>();
    notesRes.data?.forEach(n => n.student_id && allStudentIds.add(n.student_id));
    assignmentsRes.data?.forEach(a => a.student_id && allStudentIds.add(a.student_id));
    reportsRes.data?.forEach(r => r.student_id && allStudentIds.add(r.student_id));

    // Fetch student names
    let studentMap: Record<string, string> = {};
    if (allStudentIds.size > 0) {
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name')
        .in('id', Array.from(allStudentIds));
      studentsData?.forEach(s => { studentMap[s.id] = s.name; });
    }

    // Map data with student names
    setNotes((notesRes.data || []).map(n => ({
      ...n,
      student_name: n.student_id ? studentMap[n.student_id] : 'All Students'
    })));

    setAssignments((assignmentsRes.data || []).map(a => ({
      ...a,
      student_name: a.student_id ? studentMap[a.student_id] : 'All Students'
    })));

    setReports((reportsRes.data || []).map(r => ({
      ...r,
      title: r.description || 'Report',
      student_name: r.student_id ? studentMap[r.student_id] : undefined
    })));

    setLoading(false);
  };

  const confirmDelete = (item: UploadItem, type: 'note' | 'assignment' | 'report') => {
    setItemToDelete({ item, type });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(itemToDelete.item.id);

    try {
      const { item, type } = itemToDelete;
      const bucketName = type === 'note' ? 'notes' : type === 'assignment' ? 'assignments' : 'reports';
      const tableName = type === 'note' ? 'notes' : type === 'assignment' ? 'assignments' : 'reports';

      // Delete from storage
      await supabase.storage.from(bucketName).remove([item.file_path]);

      // Delete from database
      const { error } = await supabase.from(tableName).delete().eq('id', item.id);
      if (error) throw error;

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      setDeleteDialogOpen(false);
      fetchUploads();
    } catch (error: any) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (item: UploadItem, bucketName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(item.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const renderUploadList = (items: UploadItem[], type: 'note' | 'assignment' | 'report', bucketName: string) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No {type}s uploaded yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="font-medium">{item.title || item.file_name}</h4>
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {item.file_name}
                  </span>
                  {item.student_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {item.student_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(item, bucketName)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => confirmDelete(item, type)}
                  disabled={deleting === item.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          <span className="text-primary">GLOWUP</span>
          <span className="text-emerald-500"> VIRTUAL ACADEMY</span>
        </h2>
        <p className="text-sm text-muted-foreground">Manage your uploaded files</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Uploads</CardTitle>
          <CardDescription>View and delete your uploaded notes, assignments, and reports</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-4 text-center">Loading...</p>
          ) : (
            <Tabs defaultValue="notes">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notes" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Notes ({notes.length})
                </TabsTrigger>
                <TabsTrigger value="assignments" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Assignments ({assignments.length})
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Reports ({reports.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="notes" className="mt-4">
                {renderUploadList(notes, 'note', 'notes')}
              </TabsContent>
              <TabsContent value="assignments" className="mt-4">
                {renderUploadList(assignments, 'assignment', 'assignments')}
              </TabsContent>
              <TabsContent value="reports" className="mt-4">
                {renderUploadList(reports, 'report', 'reports')}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemToDelete?.type}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.item.title || itemToDelete?.item.file_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting !== null}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
