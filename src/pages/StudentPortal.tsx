import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentOverview } from '@/components/student/StudentOverview';
import { StudentAssignments } from '@/components/student/StudentAssignments';
import { StudentNotes } from '@/components/student/StudentNotes';
import { StudentReports } from '@/components/student/StudentReports';
import { StudentTimetable } from '@/components/student/StudentTimetable';
import { StudentTeachers } from '@/components/student/StudentTeachers';
export default function StudentPortal() {
  const { user, loading, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

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

  // Redirect non-students
  if (!hasRole('student')) {
    if (hasRole('superadmin')) {
      return <Navigate to="/admin" replace />;
    }
    if (hasRole('teacher')) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StudentOverview />;
      case 'assignments':
        return <StudentAssignments />;
      case 'notes':
        return <StudentNotes />;
      case 'reports':
        return <StudentReports />;
      case 'timetable':
        return <StudentTimetable />;
      case 'teachers':
        return <StudentTeachers />;
      default:
        return <StudentOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-4xl p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}