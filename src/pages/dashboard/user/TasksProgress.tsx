import { useEffect, useState } from 'react';
import { CheckSquare, Clock, AlertCircle, CheckCircle, Plus, Upload, X, Calendar, User, ArrowLeft, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  created_at: string;
  updated_at: string;
}

interface AssistAccount {
  id: string;
  name: string;
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

export default function TasksProgress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [uploading, setUploading] = useState(false);
  const [assists, setAssists] = useState<AssistAccount[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [nextTaskNumber, setNextTaskNumber] = useState(100);
  const [businessName, setBusinessName] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    platform: '',
    assignee: '',
    deadline: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch business name for current user
      const { data: businessData } = await supabase
        .from('businesses')
        .select('business_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (businessData?.business_name) {
        setBusinessName(businessData.business_name);
      }

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksData) {
        setTasks(tasksData as Task[]);
        // Calculate next task number
        const maxNum = tasksData.reduce(
          (max, t) => Math.max(max, t.task_number || 0),
          99
        );
        setNextTaskNumber(maxNum + 1);
      }

      // Fetch assist accounts sorted by name
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'assist');

      if (roles) {
        const assistIds = roles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', assistIds)
          .order('name', { ascending: true });

        if (profiles) {
          // Sort by full name
          const sortedAssists = profiles.sort((a, b) =>
            (a.name || '').localeCompare(b.name || '')
          );
          setAssists(sortedAssists);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Real-time subscription for tasks
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
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
  }, [user]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      platform: '',
      assignee: '',
      deadline: '',
    });
    setUploadedFile(null);
    setSelectedTask(null);
    setViewMode('list');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const formatTaskId = (num: number) => `T${String(num).padStart(5, '0')}`;

  const handleSubmit = async () => {
    if (!formData.title || !user) {
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
      const filePath = `${user.id}/tasks/${Date.now()}-${uploadedFile.name}`;
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
        user_id: user.id,
        task_number: nextTaskNumber,
        title: formData.title,
        description: formData.description || null,
        type: formData.type as any || null,
        platform: formData.type === 'social_media' ? formData.platform as any : null,
        assigned_to: formData.assignee || null,
        deadline: formData.deadline || null,
        file_url: fileUrl,
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
        description: `Task "${formData.title}" (${formatTaskId(nextTaskNumber)}) has been created.`,
      });
      resetForm();
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setViewMode('view');
  };

  const getAssistName = (id: string | null) => {
    if (!id) return '-';
    const assist = assists.find(a => a.id === id);
    return assist?.name || '-';
  };

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

  // View Task Details
  if (viewMode === 'view' && selectedTask) {
    const config = statusConfig[selectedTask.status];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={resetForm}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Details</h1>
            <p className="text-muted-foreground">{formatTaskId(selectedTask.task_number || 0)}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTask.title}</CardTitle>
                <CardDescription>Created {new Date(selectedTask.created_at).toLocaleDateString()}</CardDescription>
              </div>
              <Badge variant="outline" className={config.className}>
                {config.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Task ID</Label>
                <p className="font-mono font-medium">{formatTaskId(selectedTask.task_number || 0)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p>{selectedTask.type ? typeLabels[selectedTask.type] : '-'}</p>
              </div>
              {selectedTask.platform && (
                <div>
                  <Label className="text-muted-foreground">Platform</Label>
                  <p>{platformLabels[selectedTask.platform]}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Assignee</Label>
                <p>{getAssistName(selectedTask.assigned_to)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Deadline</Label>
                <p>{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : '-'}</p>
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
                  className="text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <Upload className="h-4 w-4" />
                  View File
                </a>
              </div>
            )}
            {selectedTask.notes && (
              <div className="p-4 rounded-lg bg-muted/50">
                <Label className="text-muted-foreground">Note from Assist</Label>
                <p className="mt-1">{selectedTask.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
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
            <p className="text-muted-foreground">Add a new task to your workflow</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Fill in the details for your new task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Task ID</Label>
                <Input
                  value={formatTaskId(nextTaskNumber)}
                  disabled
                  className="bg-muted font-mono"
                />
                <p className="text-xs text-muted-foreground">Auto-generated ID</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={businessName || ''}
                  placeholder="Your business name"
                  disabled
                  className="bg-muted"
                />
              </div>
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
              <Label>Upload File</Label>
              <div className="border-2 border-dashed rounded-lg p-6">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="task-file-upload"
                />
                <label 
                  htmlFor="task-file-upload" 
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload file</span>
                </label>
              </div>
              {uploadedFile && (
                <div className="flex items-center justify-between bg-muted/50 p-2 rounded mt-2">
                  <span className="text-sm truncate">{uploadedFile.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setUploadedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Select 
                  value={formData.assignee} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignee: value }))}
                >
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {assists.map((assist) => (
                      <SelectItem key={assist.id} value={assist.id}>
                        {assist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks & Progress</h1>
          <p className="text-muted-foreground">Track the progress of your marketing tasks</p>
        </div>
        <Button onClick={() => setViewMode('create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(['pending', 'in_progress', 'completed'] as const).map((status) => {
          const config = statusConfig[status];
          const count = tasks.filter(t => t.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="py-4 text-center">
                <config.icon className={cn("h-6 w-6 mx-auto mb-2", status === 'pending' ? 'text-muted-foreground' : status === 'in_progress' ? 'text-primary' : 'text-accent')} />
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">Create your first task to get started</p>
            <Button onClick={() => setViewMode('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>Tasks created for your Marketing Assist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((task) => {
              const config = statusConfig[task.status];
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className={cn("p-2 rounded-lg", config.className)}>
                    <config.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground">{task.title}</h4>
                          <Badge variant="outline" className="text-xs font-mono">
                            {formatTaskId(task.task_number || 0)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.type && (
                            <Badge variant="secondary" className="text-xs">
                              {typeLabels[task.type] || task.type}
                            </Badge>
                          )}
                          {task.platform && (
                            <Badge variant="outline" className="text-xs">
                              {platformLabels[task.platform] || task.platform}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={config.className}>
                          {config.label}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleViewTask(task)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                      {task.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {task.assigned_to && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getAssistName(task.assigned_to)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
