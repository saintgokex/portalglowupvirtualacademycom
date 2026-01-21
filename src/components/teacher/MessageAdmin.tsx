import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Send, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
}

export function MessageAdmin() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user?.id}`)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setMessages(data as Message[]);
    }
    setLoadingMessages(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setLoading(true);

    try {
      // For now, messages go to admins (we'll use null recipient for broadcast to admins)
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: null, // Will be picked up by admins
          content: newMessage.trim()
        });

      if (error) throw error;

      toast.success('Message sent to admin');
      setNewMessage('');
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          <span className="text-primary">GLOWUP</span>
          <span className="text-emerald-500"> VIRTUAL ACADEMY</span>
        </h2>
        <p className="text-sm text-muted-foreground">online school management platform</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Admin
            </CardTitle>
            <CardDescription>Send a message to the school administration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !newMessage.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </CardContent>
        </Card>

        {/* Previous Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>Your previous messages</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMessages ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No messages yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {messages.map(message => (
                  <div key={message.id} className="p-3 border rounded-lg">
                    <p className="text-sm mb-2">{message.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
