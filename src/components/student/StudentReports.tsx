import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Download, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Report {
  id: string;
  description: string | null;
  file_name: string;
  file_path: string;
  created_at: string;
}

export function StudentReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (student) {
      const { data, error } = await supabase
        .from('reports')
        .select('id, description, file_name, file_path, created_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load reports');
      } else {
        setReports(data || []);
      }
    }

    setLoading(false);
  };

  const handleDownload = async (report: Report) => {
    setDownloading(report.id);
    
    try {
      const { data, error } = await supabase.storage
        .from('reports')
        .download(report.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">My Reports</h2>
        <p className="text-sm text-muted-foreground">Progress reports from your teachers</p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No reports available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium">{report.description || 'Progress Report'}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {report.file_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(report)}
                  disabled={downloading === report.id}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading === report.id ? 'Downloading...' : 'Download'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}