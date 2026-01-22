import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, Video, User } from 'lucide-react';
import { toast } from 'sonner';
import { format, isPast, isToday, isTomorrow, addMinutes } from 'date-fns';

interface Session {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meet_link: string | null;
  status: string;
  teacher_name?: string;
}

export function StudentTimetable() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    setLoading(true);

    // First get the student id
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (student) {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .eq('student_id', student.id)
        .order('scheduled_at', { ascending: true });

      if (error) {
        toast.error('Failed to load timetable');
      } else if (data) {
        // Fetch teacher names
        const teacherIds = [...new Set(data.map(s => s.teacher_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', teacherIds);

        const teacherMap: Record<string, string> = {};
        profiles?.forEach(p => { teacherMap[p.user_id] = p.display_name || 'Teacher'; });

        setSessions(data.map(s => ({
          ...s,
          teacher_name: teacherMap[s.teacher_id] || 'Teacher'
        })));
      }
    }

    setLoading(false);
  };

  const getSessionStatus = (session: Session) => {
    const sessionDate = new Date(session.scheduled_at);
    const endTime = addMinutes(sessionDate, session.duration_minutes);
    const now = new Date();

    if (session.status === 'cancelled') return 'cancelled';
    if (now >= sessionDate && now <= endTime) return 'live';
    if (isPast(endTime)) return 'completed';
    return 'upcoming';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-green-500">Live Now</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading timetable...</p>
      </div>
    );
  }

  const upcomingSessions = sessions.filter(s => !isPast(addMinutes(new Date(s.scheduled_at), s.duration_minutes)) && s.status !== 'cancelled');
  const pastSessions = sessions.filter(s => isPast(addMinutes(new Date(s.scheduled_at), s.duration_minutes)) || s.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">My Timetable</h2>
        <p className="text-sm text-muted-foreground">View your scheduled live sessions</p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No scheduled sessions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcomingSessions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Upcoming Sessions</h3>
              <div className="grid gap-4">
                {upcomingSessions.map((session) => {
                  const status = getSessionStatus(session);
                  return (
                    <Card key={session.id} className={status === 'live' ? 'border-green-500 bg-green-500/5' : ''}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{session.title}</h3>
                              {getStatusBadge(status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {getDateLabel(session.scheduled_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(new Date(session.scheduled_at), 'h:mm a')} ({session.duration_minutes} min)
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {session.teacher_name}
                              </span>
                            </div>
                            {session.description && (
                              <p className="text-sm text-muted-foreground">{session.description}</p>
                            )}
                          </div>
                          {session.meet_link && (status === 'live' || status === 'upcoming') && (
                            <Button
                              size="sm"
                              className={status === 'live' ? 'bg-green-600 hover:bg-green-700' : ''}
                              onClick={() => window.open(session.meet_link!, '_blank')}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              {status === 'live' ? 'Join Now' : 'Join Meeting'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {pastSessions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg text-muted-foreground">Past Sessions</h3>
              <div className="grid gap-4">
                {pastSessions.slice(0, 5).map((session) => (
                  <Card key={session.id} className="opacity-60">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{session.title}</h3>
                            {getStatusBadge(getSessionStatus(session))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(session.scheduled_at), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {format(new Date(session.scheduled_at), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
