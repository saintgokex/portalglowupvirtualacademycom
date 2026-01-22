import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, File, X } from 'lucide-react';
import { validateFile, getFileExtension, getAcceptString, MAX_FILE_SIZE_MB } from '@/lib/fileValidation';

interface StudentOption {
  id: string;
  name: string;
}

export function UploadAssignment() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    const { data, error } = await supabase
      .from('students_teacher_view')
      .select('id, name')
      .order('name');
    
    if (!error && data) {
      setStudents(data);
    }
    setLoadingStudents(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file before accepting
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!title) {
      toast.error('Please enter an assignment title');
      return;
    }
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setLoading(true);

    try {
      // Upload file to storage with sanitized extension
      const fileExt = getFileExtension(selectedFile.name);
      if (!fileExt) {
        toast.error('Invalid file extension');
        setLoading(false);
        return;
      }
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Save assignment record
      const { error: dbError } = await supabase
        .from('assignments')
        .insert({
          teacher_id: user.id,
          student_id: selectedStudent || null,
          file_path: fileName,
          file_name: selectedFile.name,
          title: title,
          due_date: dueDate || null
        });

      if (dbError) throw dbError;

      // Send notification to student if one is selected
      if (selectedStudent) {
        const { data: studentData } = await supabase
          .from('students')
          .select('user_id, name')
          .eq('id', selectedStudent)
          .single();

        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        if (studentData?.user_id) {
          try {
            await supabase.functions.invoke('send-notification', {
              body: {
                user_id: studentData.user_id,
                type: 'assignment',
                title: 'New Assignment',
                message: `You have a new assignment "${title}" from ${profile?.display_name || 'your teacher'}.${dueDate ? ` Due: ${new Date(dueDate).toLocaleDateString()}` : ''}`,
                data: { assignmentTitle: title, dueDate }
              }
            });
          } catch (notifError) {
            console.error('Notification error:', notifError);
          }
        }
      }

      toast.success('Assignment uploaded successfully');
      
      // Reset form
      setSelectedStudent('');
      setTitle('');
      setDueDate('');
      clearFile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload assignment');
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

      <Card>
        <CardHeader>
          <CardTitle>Upload Assignment</CardTitle>
          <CardDescription>Create and upload assignments for students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label>Assignment Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter assignment title..."
              required
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Choose File *</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept={getAcceptString()}
              />
              {selectedFile ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-48">{selectedFile.name}</span>
                  <button onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">no file selected</span>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Student Selection (optional) */}
          <div className="space-y-2">
            <Label>Student (optional - leave empty for all students)</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder={loadingStudents ? 'Loading...' : 'Select a student (optional)'} />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={loading || !selectedFile || !title}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            {loading ? 'Uploading...' : 'Upload Assignment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
