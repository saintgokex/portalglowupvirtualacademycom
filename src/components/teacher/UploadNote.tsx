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

interface StudentOption {
  id: string;
  name: string;
}

export function UploadNote() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
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
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Save note record
      const { error: dbError } = await supabase
        .from('notes')
        .insert({
          teacher_id: user.id,
          student_id: selectedStudent || null,
          file_path: fileName,
          file_name: selectedFile.name,
          title: title || null
        });

      if (dbError) throw dbError;

      toast.success('Note uploaded successfully');
      
      // Reset form
      setSelectedStudent('');
      setTitle('');
      clearFile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          <span className="text-primary">BRINT</span>
          <span className="text-emerald-500">ONLINE SCHOOL</span>
        </h2>
        <p className="text-sm text-muted-foreground">online school management platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Note</CardTitle>
          <CardDescription>Share notes with students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label>Note Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Choose File</Label>
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
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
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
            disabled={loading || !selectedFile}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            {loading ? 'Uploading...' : 'Upload Note'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
