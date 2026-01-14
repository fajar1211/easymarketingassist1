import { useEffect, useState, useRef } from 'react';
import { CheckSquare, Clock, AlertCircle, CheckCircle, Plus, Upload, X, ArrowLeft, Eye, FileText, Link as LinkIcon, Image, Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  task_number: number | null;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  type: 'blog' | 'social_media' | 'email_marketing' | 'ads' | 'others' | null;
  platform: 'facebook' | 'instagram' | 'x' | 'threads' | 'linkedin' | null;
  file_url: string | null;
  notes: string | null;
  assigned_to: string | null;
  deadline: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface WorkLog {
  id: string;
  task_id: string;
  user_id: string;
  time_spent: number | null;
  work_description: string | null;
  shared_url: string | null;
  file_url: string | null;
  screenshot_url: string | null;
  status: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  business_name: string | null;
}

interface AssistUser {
  id: string;
  name: string;
  email: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-muted text-muted-foreground',
  },
  in_progress: {
    label: 'In Progress',
    icon: AlertCircle,
    className: 'bg-primary/10 text-primary',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-accent/10 text-accent',
  },
};

const workLogStatusOptions = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready_for_review', label: 'Ready for Review' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'waiting_on_client', label: 'Waiting on Client' },
  { value: 'completed', label: 'Completed' },
];

const typeLabels: Record<string, string> = {
  blog: 'Blog',
  social_media: 'Social Media',
  email_marketing: 'Email Marketing',
  ads: 'Ads',
  others: 'Others',
};

const platformLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X (Twitter)',
  threads: 'Threads',
  linkedin: 'LinkedIn',
};

type ViewMode = 'list' | 'create' | 'view';

export default function TaskManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workLogFileRef = useRef<HTMLInputElement>(null);
  const screenshotRef = useRef<HTMLInputElement>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assistUsers, setAssistUsers] = useState<AssistUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [uploading, setUploading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [sortByAssist, setSortByAssist] = useState('');
  const [nextTaskNumber, setNextTaskNumber] = useState(100);
  const [assistName, setAssistName] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    platform: '',
    clientId: '',
    deadline: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Work log form state
  const [workLogForm, setWorkLogForm] = useState({
    timeSpent: '',
    workDescription: '',
    sharedUrl: '',
    status: 'in_progress',
  });
  const [workLogFile, setWorkLogFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [savingWorkLog, setSavingWorkLog] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchClients();
    fetchAssistUsers();
  }, []);

const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTasks(data as Task[]);
      // Calculate next task number starting from 100
      const maxNum = data.reduce((max, t) => Math.max(max, t.task_number || 0), 99);
      setNextTaskNumber(maxNum + 1);
    }
    setLoading(false);
  };

const fetchClients = async () => {
    // Only fetch users with 'user' role (not assist)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'user');

    const userIds = userRoles?.map(r => r.user_id) || [];

    const { data: businesses } = await supabase
      .from('businesses')
      .select('user_id, business_name')
      .in('user_id', userIds);

    const filteredClients: Client[] = (businesses || [])
      .filter(b => b.business_name)
      .map(business => ({
        id: business.user_id,
        name: business.business_name || '',
        email: '',
        business_name: business.business_name,
      }))
      // Sort by business_name
      .sort((a, b) => (a.business_name || '').localeCompare(b.business_name || ''));

    setClients(filteredClients);
  };

const fetchAssistUsers = async () => {
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'assist');

    const assistIds = userRoles?.map((r) => r.user_id) || [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', assistIds)
      .order('name', { ascending: true });

    // Sort by full name
    const sorted = (profiles || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setAssistUsers(sorted);

    // Set current assist full name for disabled Assignee field
    if (user) {
      const currentAssist = (profiles || []).find((p) => p.id === user.id);
      if (currentAssist?.name) {
        setAssistName(currentAssist.name);
      }
    }
  };

  const fetchWorkLogs = async (taskId: string) => {
    const { data } = await supabase
      .from('task_work_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    setWorkLogs((data || []) as WorkLog[]);
  };

  // Real-time subscription for tasks
  useEffect(() => {
    const channel = supabase
      .channel('assist-tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      platform: '',
      clientId: '',
      deadline: '',
    });
    setUploadedFile(null);
    setViewMode('list');
  };

  const resetWorkLogForm = () => {
    setWorkLogForm({
      timeSpent: '',
      workDescription: '',
      sharedUrl: '',
      status: 'in_progress',
    });
    setWorkLogFile(null);
    setScreenshotFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.clientId || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in the required fields.',
      });
      return;
    }

    setUploading(true);
    let fileUrl: string | null = null;

    // Upload file if exists
    if (uploadedFile) {
      const filePath = `${formData.clientId}/tasks/${Date.now()}-${uploadedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, uploadedFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('user-files')
          .getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: formData.clientId,
        task_number: nextTaskNumber,
        title: formData.title,
        description: formData.description || null,
        type: formData.type as any || null,
        platform: formData.type === 'social_media' ? formData.platform as any : null,
        assigned_to: user.id,
        deadline: formData.deadline || null,
        file_url: fileUrl,
        notes: null,
        status: 'pending',
      })
      .select()
      .single();

    setUploading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create task.',
      });
      return;
    }

    if (data) {
      setNextTaskNumber(nextTaskNumber + 1);
      toast({
        title: 'Task Created',
        description: `Task "${formData.title}" has been created with ID T${String(nextTaskNumber).padStart(5, '0')}.`,
      });
      resetForm();
    }
  };

  const handleSaveWorkLog = async () => {
    if (!selectedTask || !user) return;

    setSavingWorkLog(true);
    let fileUrl: string | null = null;
    let screenshotUrl: string | null = null;

    try {
      // Upload file if exists
      if (workLogFile) {
        const filePath = `${selectedTask.user_id}/work-logs/${Date.now()}-${workLogFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, workLogFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('user-files')
            .getPublicUrl(filePath);
          fileUrl = urlData.publicUrl;
        }
      }

      // Upload screenshot if exists
      if (screenshotFile) {
        const filePath = `${selectedTask.user_id}/work-logs/screenshots/${Date.now()}-${screenshotFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, screenshotFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('user-files')
            .getPublicUrl(filePath);
          screenshotUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('task_work_logs')
        .insert({
          task_id: selectedTask.id,
          user_id: user.id,
          time_spent: workLogForm.timeSpent ? parseInt(workLogForm.timeSpent) : null,
          work_description: workLogForm.workDescription || null,
          shared_url: workLogForm.sharedUrl || null,
          file_url: fileUrl,
          screenshot_url: screenshotUrl,
          status: workLogForm.status,
        });

      if (error) throw error;

      toast({
        title: 'Work Log Added',
        description: 'Your work log has been saved.',
      });

      resetWorkLogForm();
      fetchWorkLogs(selectedTask.id);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save work log.',
      });
    } finally {
      setSavingWorkLog(false);
    }
  };

  const getClientName = (userId: string) => {
    const client = clients.find(c => c.id === userId);
    return client?.business_name || client?.name || 'Unknown';
  };

  const getAssigneeName = (assigneeId: string | null) => {
    if (!assigneeId) return '-';
    const assist = assistUsers.find(a => a.id === assigneeId);
    return assist?.name || 'Unknown';
  };

  const getTaskId = (task: Task) => {
    return task.task_number ? `T${String(task.task_number).padStart(5, '0')}` : '-';
  };

  // Sort and filter tasks
  const filteredTasks = tasks
    .filter(task => !sortByAssist || task.assigned_to === sortByAssist)
    .sort((a, b) => {
      if (sortByAssist) {
        return getAssigneeName(a.assigned_to).localeCompare(getAssigneeName(b.assigned_to));
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Task View Mode with Work Log
  if (viewMode === 'view' && selectedTask) {
    const config = statusConfig[selectedTask.status];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setViewMode('list'); setSelectedTask(null); setWorkLogs([]); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Details</h1>
            <p className="text-muted-foreground">{getTaskId(selectedTask)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedTask.title}</CardTitle>
                <Badge variant="outline" className={config.className}>
                  {config.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Task ID</Label>
                <Input value={getTaskId(selectedTask)} disabled className="bg-muted font-mono" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <p className="font-medium">{getClientName(selectedTask.user_id)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assignee</Label>
                  <p className="font-medium">{getAssigneeName(selectedTask.assigned_to)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedTask.type ? typeLabels[selectedTask.type] : '-'}</p>
                </div>
                {selectedTask.platform && (
                  <div>
                    <Label className="text-muted-foreground">Platform</Label>
                    <p className="font-medium">{platformLabels[selectedTask.platform]}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Deadline</Label>
                  <p className="font-medium">
                    {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
              {selectedTask.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{selectedTask.description}</p>
                </div>
              )}
              {selectedTask.file_url && (
                <div>
                  <Label className="text-muted-foreground">Attachment</Label>
                  <a 
                    href={selectedTask.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block mt-1 text-primary hover:underline"
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Log Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Work Log
              </CardTitle>
              <CardDescription>Track your progress on this task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Time Spent (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={workLogForm.timeSpent}
                    onChange={(e) => setWorkLogForm(prev => ({ ...prev, timeSpent: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={workLogForm.status} 
                    onValueChange={(value) => setWorkLogForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {workLogStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Work Description</Label>
                <Textarea
                  placeholder="Describe what you worked on..."
                  value={workLogForm.workDescription}
                  onChange={(e) => setWorkLogForm(prev => ({ ...prev, workDescription: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Shared URL
                </Label>
                <Input
                  placeholder="https://..."
                  value={workLogForm.sharedUrl}
                  onChange={(e) => setWorkLogForm(prev => ({ ...prev, sharedUrl: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50"
                    onClick={() => workLogFileRef.current?.click()}
                  >
                    {workLogFile ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate">{workLogFile.name}</span>
                        <X className="h-4 w-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); setWorkLogFile(null); }} />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                    )}
                  </div>
                  <input
                    ref={workLogFileRef}
                    type="file"
                    onChange={(e) => e.target.files?.[0] && setWorkLogFile(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Screenshot
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50"
                    onClick={() => screenshotRef.current?.click()}
                  >
                    {screenshotFile ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate">{screenshotFile.name}</span>
                        <X className="h-4 w-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); setScreenshotFile(null); }} />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                    )}
                  </div>
                  <input
                    ref={screenshotRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setScreenshotFile(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              </div>

              <Button onClick={handleSaveWorkLog} disabled={savingWorkLog} className="w-full">
                {savingWorkLog ? 'Saving...' : 'Add Work Log'}
              </Button>

              {/* Work Log History */}
              {workLogs.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium">Work Log History</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {workLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-muted rounded-lg text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">{log.status.replace(/_/g, ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        {log.time_spent && <p className="text-muted-foreground">Time: {log.time_spent} min</p>}
                        {log.work_description && <p className="mt-1">{log.work_description}</p>}
                        <div className="flex gap-2 mt-2">
                          {log.shared_url && (
                            <a href={log.shared_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                              View URL
                            </a>
                          )}
                          {log.file_url && (
                            <a href={log.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                              View File
                            </a>
                          )}
                          {log.screenshot_url && (
                            <a href={log.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                              View Screenshot
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Full Page Create Task Form
  if (viewMode === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={resetForm}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
            <p className="text-muted-foreground">Add a new task for a client</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Fill in the details for the new task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Task ID</Label>
                <Input value={`T${String(nextTaskNumber).padStart(5, '0')}`} disabled className="bg-muted font-mono" />
                <p className="text-xs text-muted-foreground">Auto-generated task ID starting from T00100</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client * (Business Name)</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, platform: '' }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email_marketing">Email Marketing</SelectItem>
                    <SelectItem value="ads">Ads</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'social_media' && (
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select 
                    value={formData.platform} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger id="platform">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="x">X (Twitter)</SelectItem>
                      <SelectItem value="threads">Threads</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedFile ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{uploadedFile.name}</span>
                    <X
                      className="h-4 w-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Click to upload file</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="task-file-upload"
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Input
                  id="assignee"
                  value={assistName || (user?.email ?? '')}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Automatically assigned to you</p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Task List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Manager</h1>
          <p className="text-muted-foreground">Manage client tasks and assignments.</p>
        </div>
        <Button onClick={() => setViewMode('create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Task
        </Button>
      </div>

      {/* Filter by Assist */}
      <div className="flex items-center gap-4">
        <Label>Filter by Assignee:</Label>
        <Select value={sortByAssist || "all"} onValueChange={(value) => setSortByAssist(value === "all" ? "" : value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {assistUsers.map((assist) => (
              <SelectItem key={assist.id} value={assist.id}>
                {assist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-4">Create your first task to get started</p>
              <Button onClick={() => setViewMode('create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Task
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const config = statusConfig[task.status];
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono">{getTaskId(task)}</TableCell>
                      <TableCell className="font-medium">{getClientName(task.user_id)}</TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{getAssigneeName(task.assigned_to)}</TableCell>
                      <TableCell>
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task);
                            setViewMode('view');
                            fetchWorkLogs(task.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
