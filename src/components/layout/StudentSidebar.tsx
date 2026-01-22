import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  StickyNote, 
  ClipboardList,
  Users,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface StudentSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'teachers', label: 'My Teachers', icon: Users },
];

export function StudentSidebar({ activeTab, onTabChange }: StudentSidebarProps) {
  const { signOut } = useAuth();

  return (
    <aside className="flex h-screen w-20 md:w-56 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo + Notifications */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            GU
          </div>
          <span className="hidden md:block text-lg font-semibold text-sidebar-foreground">STUDENT</span>
        </div>
        <div className="hidden md:block">
          <NotificationBell />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 md:px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex w-full flex-col md:flex-row items-center gap-1 md:gap-3 rounded-lg px-2 md:px-3 py-3 md:py-2.5 text-xs md:text-sm font-medium transition-colors border-l-4',
                isActive 
                  ? 'bg-sidebar-foreground text-sidebar border-primary' 
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground border-transparent'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-center md:text-left leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-center md:justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>
    </aside>
  );
}