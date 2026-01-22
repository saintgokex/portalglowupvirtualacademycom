import { supabase } from '@/integrations/supabase/client';

interface SendNotificationParams {
  userId: string;
  type: 'assignment' | 'session' | 'note' | 'report' | 'submission' | 'feedback';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function sendNotification(params: SendNotificationParams) {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data,
      },
    });

    if (error) {
      console.error('Failed to send notification:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
}

// Helper to send notifications for common events
export const notifyStudent = {
  newAssignment: async (studentUserId: string, assignmentTitle: string, teacherName: string) => {
    return sendNotification({
      userId: studentUserId,
      type: 'assignment',
      title: 'New Assignment',
      message: `You have a new assignment "${assignmentTitle}" from ${teacherName}.`,
    });
  },

  newNote: async (studentUserId: string, noteTitle: string, teacherName: string) => {
    return sendNotification({
      userId: studentUserId,
      type: 'note',
      title: 'New Note Added',
      message: `${teacherName} has shared a new note: "${noteTitle}".`,
    });
  },

  newReport: async (studentUserId: string, teacherName: string) => {
    return sendNotification({
      userId: studentUserId,
      type: 'report',
      title: 'New Report Available',
      message: `${teacherName} has uploaded a new report for you.`,
    });
  },

  newSession: async (studentUserId: string, sessionTitle: string, scheduledAt: string) => {
    const formattedDate = new Date(scheduledAt).toLocaleString();
    return sendNotification({
      userId: studentUserId,
      type: 'session',
      title: 'Session Scheduled',
      message: `A new session "${sessionTitle}" has been scheduled for ${formattedDate}.`,
    });
  },

  submissionFeedback: async (studentUserId: string, assignmentTitle: string, feedback: string) => {
    return sendNotification({
      userId: studentUserId,
      type: 'feedback',
      title: 'Feedback Received',
      message: `Your submission for "${assignmentTitle}" has been reviewed: ${feedback.substring(0, 100)}...`,
    });
  },
};

export const notifyTeacher = {
  newSubmission: async (teacherUserId: string, studentName: string, assignmentTitle: string) => {
    return sendNotification({
      userId: teacherUserId,
      type: 'submission',
      title: 'New Submission',
      message: `${studentName} has submitted their work for "${assignmentTitle}".`,
    });
  },

  sessionReminder: async (teacherUserId: string, studentName: string, sessionTitle: string, scheduledAt: string) => {
    const formattedDate = new Date(scheduledAt).toLocaleString();
    return sendNotification({
      userId: teacherUserId,
      type: 'session',
      title: 'Upcoming Session',
      message: `Reminder: You have a session "${sessionTitle}" with ${studentName} at ${formattedDate}.`,
    });
  },
};
