import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TeacherSidebar } from '@/components/layout/TeacherSidebar';
import { TeacherOverview } from '@/components/teacher/TeacherOverview';
import { UploadReport } from '@/components/teacher/UploadReport';
import { UploadNote } from '@/components/teacher/UploadNote';
import { UploadAssignment } from '@/components/teacher/UploadAssignment';
import { LeaveApply } from '@/components/teacher/LeaveApply';
import { MessageAdmin } from '@/components/teacher/MessageAdmin';
import { ReviewSubmissions } from '@/components/teacher/ReviewSubmissions';

export default function Dashboard() {
  const { user, loading, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect students to their portal
  if (hasRole('student')) {
    return <Navigate to="/student" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TeacherOverview />;
      case 'review-submissions':
        return <ReviewSubmissions />;
      case 'upload-report':
        return <UploadReport />;
      case 'upload-note':
        return <UploadNote />;
      case 'upload-assignment':
        return <UploadAssignment />;
      case 'leave-apply':
        return <LeaveApply />;
      case 'message-admin':
        return <MessageAdmin />;
      default:
        return <TeacherOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <TeacherSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-4xl p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}