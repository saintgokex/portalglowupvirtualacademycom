import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/database';
import { toast } from 'sonner';

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSuccess: () => void;
}

export function StudentForm({ open, onOpenChange, student, onSuccess }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as 'active' | 'inactive',
    progress: 0,
    grade: '',
    subjects: '',
    parent_name: '',
    parent_contact: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        status: student.status || 'active',
        progress: student.progress || 0,
        grade: student.grade || '',
        subjects: student.subjects?.join(', ') || '',
        parent_name: student.parent_name || '',
        parent_contact: student.parent_contact || '',
        enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0],
        notes: student.notes || ''
      });
    } else {
      setFormData({
        name: '',
        status: 'active',
        progress: 0,
        grade: '',
        subjects: '',
        parent_name: '',
        parent_contact: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [student, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const subjectsArray = formData.subjects
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      name: formData.name,
      status: formData.status,
      progress: formData.progress,
      grade: formData.grade || null,
      subjects: subjectsArray.length > 0 ? subjectsArray : null,
      parent_name: formData.parent_name || null,
      parent_contact: formData.parent_contact || null,
      enrollment_date: formData.enrollment_date || null,
      notes: formData.notes || null
    };

    try {
      if (student) {
        const { error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', student.id);
        
        if (error) throw error;
        toast.success('Student updated successfully');
      } else {
        const { error } = await supabase
          .from('students')
          .insert(payload);
        
        if (error) throw error;
        toast.success('Student created successfully');
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Academic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="e.g., 10th"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjects">Subjects (comma-separated)</Label>
              <Input
                id="subjects"
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                placeholder="Math, Science, English"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollment_date">Enrollment Date</Label>
              <Input
                id="enrollment_date"
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
              />
            </div>
          </div>

          {/* Parent/Guardian Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Parent/Guardian Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="parent_name">Parent Name</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_contact">Parent Contact</Label>
                <Input
                  id="parent_contact"
                  value={formData.parent_contact}
                  onChange={(e) => setFormData({ ...formData, parent_contact: e.target.value })}
                  placeholder="Phone or email"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Additional Notes</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Any additional notes about the student..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
