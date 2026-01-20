import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Student } from '@/types/database';
import { format } from 'date-fns';
import { Calendar, GraduationCap, Phone, User, FileText, BookOpen } from 'lucide-react';

interface StudentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

export function StudentDetails({ open, onOpenChange, student }: StudentDetailsProps) {
  if (!student) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{student.name}</h2>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                  {student.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {student.grade ? `Grade ${student.grade}` : 'No grade assigned'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">{student.progress}%</p>
              <Progress value={student.progress} className="h-2 w-24 mt-1" />
            </div>
          </div>

          <Separator />

          {/* Academic Info */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Academic Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Grade Level</p>
                <p className="font-medium">{student.grade || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Enrollment Date
                </p>
                <p className="font-medium">
                  {student.enrollment_date 
                    ? format(new Date(student.enrollment_date), 'MMMM d, yyyy')
                    : 'Not specified'}
                </p>
              </div>
            </div>
            
            {student.subjects && student.subjects.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Subjects
                </p>
                <div className="flex flex-wrap gap-2">
                  {student.subjects.map((subject, i) => (
                    <Badge key={i} variant="outline">{subject}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Parent/Guardian Info */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Parent/Guardian Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Parent Name</p>
                <p className="font-medium">{student.parent_name || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Contact
                </p>
                <p className="font-medium">{student.parent_contact || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {student.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                  {student.notes}
                </p>
              </div>
            </>
          )}

          {/* Metadata */}
          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>Created: {format(new Date(student.created_at), 'MMM d, yyyy h:mm a')}</p>
            <p>Last Updated: {format(new Date(student.updated_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
