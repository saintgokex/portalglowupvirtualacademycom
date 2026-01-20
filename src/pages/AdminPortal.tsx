import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { StudentManagement } from '@/components/admin/StudentManagement';
import { TeacherManagement } from '@/components/admin/TeacherManagement';
import { TeacherAssignment } from '@/components/admin/TeacherAssignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPortal() {
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

  // Check if user has superadmin role
  if (!hasRole('superadmin')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have permission to access the admin portal. 
              Please contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'students':
        return <StudentManagement />;
      case 'teachers':
        return <TeacherManagement />;
      case 'assignments':
        return <TeacherAssignment />;
      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts and roles</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>User Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  User management coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">System configuration</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Settings coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
