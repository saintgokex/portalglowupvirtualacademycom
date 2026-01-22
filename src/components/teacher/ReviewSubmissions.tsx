import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Download, Clock, CheckCircle, AlertCircle, MessageSquare, FileText, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_name: string;
  file_path: string;
  status: string;
  feedback: string | null;
  submitted_at: string;
  assignment: {
    title: string;
  };
  student: {
    name: string;
  };
}

export function ReviewSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    setLoading(true);

    // Fetch submissions for this teacher with assignment and student info
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        assignment_id,
        student_id,
        file_name,
        file_path,
        status,
        feedback,
        submitted_at
      `)
      .eq('teacher_id', user?.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      toast.error('Failed to load submissions');
      setLoading(false);
      return;
    }

    // Fetch assignment titles and student names
    if (data && data.length > 0) {
      const assignmentIds = [...new Set(data.map(s => s.assignment_id))];
      const studentIds = [...new Set(data.map(s => s.student_id))];

      const [assignmentsResult, studentsResult] = await Promise.all([
        supabase.from('assignments').select('id, title').in('id', assignmentIds),
        supabase.from('students').select('id, name').in('id', studentIds)
      ]);

      const assignmentsMap: Record<string, string> = {};
      const studentsMap: Record<string, string> = {};

      assignmentsResult.data?.forEach(a => { assignmentsMap[a.id] = a.title; });
      studentsResult.data?.forEach(s => { studentsMap[s.id] = s.name; });

      const enrichedSubmissions = data.map(sub => ({
        ...sub,
        assignment: { title: assignmentsMap[sub.assignment_id] || 'Unknown Assignment' },
        student: { name: studentsMap[sub.student_id] || 'Unknown Student' }
      }));

      setSubmissions(enrichedSubmissions);
    } else {
      setSubmissions([]);
    }

    setLoading(false);
  };

  const handleDownload = async (submission: Submission) => {
    setDownloading(submission.id);
    
    try {
      const { data, error } = await supabase.storage
        .from('submissions')
        .download(submission.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.file_name;
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

  const openReviewDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setFeedback(submission.feedback || '');
    setReviewDialogOpen(true);
  };

  const handleReview = async (newStatus: 'reviewed' | 'needs_revision') => {
    if (!selectedSubmission) return;
    setSubmitting(true);

    try {
      // Update submission status and feedback
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: newStatus,
          feedback: feedback || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id);

      if (updateError) throw updateError;

      // Get teacher's display name for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user?.id)
        .single();

      // Send notification
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'feedback',
            submissionId: selectedSubmission.id,
            assignmentTitle: selectedSubmission.assignment.title,
            teacherName: profile?.display_name || 'Your teacher',
            feedback: feedback || undefined,
            status: newStatus
          }
        });
      } catch (notifError) {
        console.error('Notification error:', notifError);
        // Don't fail the review if notification fails
      }

      toast.success(`Submission marked as ${newStatus === 'reviewed' ? 'reviewed' : 'needs revision'}`);
      setReviewDialogOpen(false);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Review error:', error);
      toast.error('Failed to update submission');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
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
        <p className="text-muted-foreground">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          <span className="text-primary">GLOWUP</span>
          <span className="text-emerald-500"> VIRTUAL ACADEMY</span>
        </h2>
        <p className="text-sm text-muted-foreground">Review student submissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
          <CardDescription>Review and provide feedback on submitted assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No submissions to review yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{submission.assignment.title}</h3>
                        {getStatusBadge(submission.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {submission.student.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {submission.file_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      {submission.feedback && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <p className="text-sm">
                            <span className="font-medium">Your feedback:</span> {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(submission)}
                        disabled={downloading === submission.id}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading === submission.id ? 'Downloading...' : 'Download'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openReviewDialog(submission)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {submission.status === 'submitted' ? 'Review' : 'Update'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.student.name}'s submission for "{selectedSubmission?.assignment.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback (optional)</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add feedback for the student..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleReview('needs_revision')}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Needs Revision
            </Button>
            <Button
              onClick={() => handleReview('reviewed')}
              disabled={submitting}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Reviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}