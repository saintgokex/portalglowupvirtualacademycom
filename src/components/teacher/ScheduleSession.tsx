import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Calendar, Clock, Video, User, Plus, Trash2, Link } from 'lucide-react';
import { format, isPast, addMinutes } from 'date-fns';

interface StudentOption {
  id: string;
  name: string;
}

interface Session {
  id: string;
  title: string;
  description: string | null;
  student_id: string;
  scheduled_at: string;
  duration_minutes: number;
  meet_link: string | null;
  status: string;
  student_name?: string;
}

export function ScheduleSession() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [meetLink, setMeetLink] = useState('');

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchSessions();
  }, [user]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students_teacher_view')
      .select('id, name')
      .order('name');
    
    if (!error && data) {
      setStudents(data);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scheduled_sessions')
      .select('*')
      .eq('teacher_id', user?.id)
      .order('scheduled_at', { ascending: true });

    if (error) {
      toast.error('Failed to load sessions');
    } else if (data) {
      // Fetch student names
      const studentIds = [...new Set(data.map(s => s.student_id))];
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, name')
          .in('id', studentIds);

        const studentMap: Record<string, string> = {};
        studentsData?.forEach(s => { studentMap[s.id] = s.name; });

        setSessions(data.map(s => ({
          ...s,
          student_name: studentMap[s.student_id] || 'Unknown Student'
        })));
      } else {
        setSessions(data);
      }
    }
    setLoading(false);
  };

  const handleSchedule = async () => {
    if (!title || !selectedStudent || !scheduledDate || !scheduledTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      const { error } = await supabase
        .from('scheduled_sessions')
        .insert({
          title,
          description: description || null,
          teacher_id: user?.id,
          student_id: selectedStudent,
          scheduled_at: scheduledAt,
          duration_minutes: parseInt(duration),
          meet_link: meetLink || null,
          created_by: user?.id
        });

      if (error) throw error;

      // Send notification to student
      const { data: studentData } = await supabase
        .from('students')
        .select('user_id, name')
        .eq('id', selectedStudent)
        .single();

      if (studentData?.user_id) {
        const formattedDate = new Date(scheduledAt).toLocaleString();
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              user_id: studentData.user_id,
              type: 'session',
              title: 'Session Scheduled',
              message: `A new session "${title}" has been scheduled for ${formattedDate}.${meetLink ? ' Google Meet link is available.' : ''}`,
              data: { sessionTitle: title, scheduledAt, meetLink }
            }
          });
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }
      }

      toast.success('Session scheduled successfully');
      
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedStudent('');
      setScheduledDate('');
      setScheduledTime('');
      setDuration('60');
      setMeetLink('');
      
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule session');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (session: Session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const { error } = await supabase
        .from('scheduled_sessions')
        .delete()
        .eq('id', sessionToDelete.id);

      if (error) throw error;

      toast.success('Session deleted');
      setDeleteDialogOpen(false);
      fetchSessions();
    } catch (error: any) {
      toast.error('Failed to delete session');
    }
  };

  const getStatusBadge = (session: Session) => {
    const sessionDate = new Date(session.scheduled_at);
    const endTime = addMinutes(sessionDate, session.duration_minutes);
    const now = new Date();

    if (session.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (now >= sessionDate && now <= endTime) {
      return <Badge className="bg-green-500">Live Now</Badge>;
    }
    if (isPast(endTime)) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    return <Badge variant="outline">Upcoming</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          <span className="text-primary">GLOWUP</span>
          <span className="text-emerald-500"> VIRTUAL ACADEMY</span>
        </h2>
        <p className="text-sm text-muted-foreground">Schedule live sessions with students</p>
      </div>

      {/* Schedule New Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Schedule New Session
          </CardTitle>
          <CardDescription>Create a new live session with a student</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Session Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Math Tutoring Session"
              />
            </div>
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Google Meet Link</Label>
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <Input
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Create a meeting in Google Calendar and paste the link here
            </p>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add session details..."
              rows={2}
            />
          </div>

          <Button
            onClick={handleSchedule}
            disabled={submitting || !title || !selectedStudent || !scheduledDate || !scheduledTime}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            {submitting ? 'Scheduling...' : 'Schedule Session'}
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Scheduled Sessions</CardTitle>
          <CardDescription>Manage your upcoming and past sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-4 text-center">Loading...</p>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No sessions scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{session.title}</h3>
                        {getStatusBadge(session)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {session.student_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(session.scheduled_at), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(session.scheduled_at), 'h:mm a')} ({session.duration_minutes} min)
                        </span>
                      </div>
                      {session.meet_link && (
                        <a 
                          href={session.meet_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Join Meeting
                        </a>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => confirmDelete(session)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{sessionToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
