import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Download, Calendar, FileText, Upload, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateFile, sanitizeFilename, getAcceptString } from '@/lib/fileValidation';

interface Assignment {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  due_date: string | null;
  created_at: string;
  teacher_id: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  status: string;
  feedback: string | null;
  submitted_at: string;
  file_name: string;
  file_path: string;
}

export function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<{ submission: Submission; assignmentTitle: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setStudentId(student.id);

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, title, file_name, file_path, due_date, created_at, teacher_id')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        toast.error('Failed to load assignments');
      } else {
        setAssignments(assignmentsData || []);

        // Fetch existing submissions for these assignments
        if (assignmentsData && assignmentsData.length > 0) {
          const assignmentIds = assignmentsData.map(a => a.id);
          const { data: submissionsData } = await supabase
            .from('submissions')
            .select('id, assignment_id, status, feedback, submitted_at, file_name, file_path')
            .eq('student_id', student.id)
            .in('assignment_id', assignmentIds);

          if (submissionsData) {
            const submissionsMap: Record<string, Submission> = {};
            submissionsData.forEach(sub => {
              submissionsMap[sub.assignment_id] = sub;
            });
            setSubmissions(submissionsMap);
          }
        }
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

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmitDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAssignment || !studentId) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(selectedAssignment.id);

    try {
      // Sanitize filename and create unique path
      const sanitizedName = sanitizeFilename(file.name);
      const timestamp = Date.now();
      const filePath = `${studentId}/${selectedAssignment.id}/${timestamp}_${sanitizedName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create submission record
      const { data: submissionData, error: insertError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: selectedAssignment.id,
          student_id: studentId,
          teacher_id: selectedAssignment.teacher_id,
          file_name: sanitizedName,
          file_path: filePath,
          status: 'submitted'
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Get student name for notification
      const { data: student } = await supabase
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();

      // Send notification to teacher
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'submission',
            submissionId: submissionData.id,
            assignmentTitle: selectedAssignment.title,
            studentName: student?.name || 'A student'
          }
        });
      } catch (notifError) {
        console.error('Notification error:', notifError);
        // Don't fail submission if notification fails
      }

      toast.success('Assignment submitted successfully!');
      setSubmitDialogOpen(false);
      fetchAssignments(); // Refresh to show submission status
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setUploading(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const confirmDeleteSubmission = (submission: Submission, assignmentTitle: string) => {
    setSubmissionToDelete({ submission, assignmentTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    setDeleting(true);

    try {
      // Delete file from storage
      await supabase.storage.from('submissions').remove([submissionToDelete.submission.file_path]);

      // Delete submission record
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionToDelete.submission.id);

      if (error) throw error;

      toast.success('Submission deleted');
      setDeleteDialogOpen(false);
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to delete submission');
    } finally {
      setDeleting(false);
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

  const getSubmissionBadge = (submission: Submission | undefined) => {
    if (!submission) return null;

    switch (submission.status) {
      case 'submitted':
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case 'reviewed':
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Reviewed
          </Badge>
        );
      case 'needs_revision':
        return (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs Revision
          </Badge>
        );
      default:
        return null;
    }
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
        <p className="text-sm text-muted-foreground">View, download, and submit your assignments</p>
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
            const submission = submissions[assignment.id];
            
            return (
              <Card key={assignment.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{assignment.title}</h3>
                        {dueStatus === 'overdue' && !submission && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                        {dueStatus === 'soon' && !submission && (
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">Due Soon</Badge>
                        )}
                        {getSubmissionBadge(submission)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
                      {submission?.feedback && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <p className="text-sm">
                            <span className="font-medium">Feedback:</span> {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(assignment)}
                        disabled={downloading === assignment.id}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading === assignment.id ? 'Downloading...' : 'Download'}
                      </Button>
                      {!submission && (
                        <Button
                          size="sm"
                          onClick={() => openSubmitDialog(assignment)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit
                        </Button>
                      )}
                      {submission?.status === 'submitted' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDeleteSubmission(submission, assignment.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {submission?.status === 'needs_revision' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openSubmitDialog(assignment)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Resubmit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              Upload your completed work for "{selectedAssignment?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Click to select a file or drag and drop
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptString()}
                onChange={handleFileSelect}
                className="hidden"
                id="submission-file"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading !== null}
              >
                {uploading ? 'Uploading...' : 'Select File'}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Max file size: 10MB. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your submission for "{submissionToDelete?.assignmentTitle}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmission} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}