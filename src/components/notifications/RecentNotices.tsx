import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Calendar, FileText, ClipboardList, StickyNote, MessageCircle } from 'lucide-react';

interface Notice {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function RecentNotices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotices();

      // Subscribe to realtime notifications
      const channel = supabase
        .channel('notices-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotices(prev => [payload.new as Notice, ...prev.slice(0, 4)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, message, read, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setNotices(data);
    }
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'session': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'assignment': return <ClipboardList className="h-4 w-4 text-amber-500" />;
      case 'note': return <StickyNote className="h-4 w-4 text-green-500" />;
      case 'report': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'submission': return <ClipboardList className="h-4 w-4 text-emerald-500" />;
      case 'feedback': return <MessageCircle className="h-4 w-4 text-cyan-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      session: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      assignment: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      note: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      report: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      submission: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      feedback: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
    };
    return variants[type] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Recent Notices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No recent notices</p>
        ) : (
          <div className="space-y-3">
            {notices.map(notice => (
              <div
                key={notice.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  !notice.read ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notice.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={`text-xs ${getTypeBadge(notice.type)}`}>
                      {notice.type}
                    </Badge>
                    {!notice.read && (
                      <Badge variant="default" className="text-xs">New</Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm">{notice.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{notice.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
