import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/Sidebar';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import { StudentList } from '@/components/dashboard/StudentList';
import { TasksList } from '@/components/dashboard/TasksList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { user, loading } = useAuth();
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TeacherDashboard />;
      case 'students':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Students</h1>
              <p className="text-muted-foreground">Manage your assigned students</p>
            </div>
            <StudentList />
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Tasks</h1>
              <p className="text-muted-foreground">Manage your tasks and assignments</p>
            </div>
            <TasksList />
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-muted-foreground">Communicate with students and parents</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Inbox</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">No messages yet</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Settings coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <TeacherDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
