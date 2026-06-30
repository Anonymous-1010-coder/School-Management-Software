'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, Plus, Loader2, AlertCircle, Download, FileText, Filter,
  Upload, X, File, Video, Image, Music, Archive, Globe, Lock, Calendar,
  Clock, Eye, Edit, Trash2, ToggleLeft, ToggleRight, ChevronDown,
  CheckCircle2, Play, Headphones, MoreHorizontal, PanelTop,
  Bookmark, BarChart3, FileSpreadsheet, Users, Link
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { learningResourceApi, subjectApi, classApi, armApi } from '@/lib/endpoints';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, cn, getInitials } from '@/lib/utils';
import api from '@/lib/api';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/rtf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/aac',
  'audio/ogg',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
];

const MAX_FILE_SIZE = 500 * 1024 * 1024;

const resourceTypeBadge: Record<string, 'default' | 'secondary' | 'outline' | 'success' | 'warning'> = {
  DOCUMENT: 'default',
  IMAGE: 'success',
  VIDEO: 'warning',
  AUDIO: 'secondary',
  COMPRESSED: 'outline',
  OTHER: 'outline',
};

const resourceTypeIcon: Record<string, React.ReactNode> = {
  DOCUMENT: <FileText className="h-4 w-4" />,
  IMAGE: <Image className="h-4 w-4" />,
  VIDEO: <Play className="h-4 w-4" />,
  AUDIO: <Headphones className="h-4 w-4" />,
  COMPRESSED: <Archive className="h-4 w-4" />,
  OTHER: <File className="h-4 w-4" />,
};

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function detectResourceType(file: File): string {
  const type = file.type;
  if (type.startsWith('image/')) return 'IMAGE';
  if (type.startsWith('video/')) return 'VIDEO';
  if (type.startsWith('audio/')) return 'AUDIO';
  if (
    type.includes('pdf') ||
    type.includes('document') ||
    type.includes('text') ||
    type.includes('sheet') ||
    type.includes('presentation')
  ) return 'DOCUMENT';
  if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gzip') || type.includes('compress'))
    return 'COMPRESSED';
  return 'OTHER';
}

const emptyForm = {
  title: '',
  description: '',
  classId: '',
  subjectId: '',
  armId: '',
  term: '',
  session: '',
  week: '',
  topic: '',
  resourceType: 'DOCUMENT' as string,
  allowDownload: true,
  isPublished: false,
  publishAt: '',
  expiresAt: '',
  access: 'CLASS_ONLY',
};

export default function LearningResourcesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [tab, setTab] = useState('browse');
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url: string; type: string; size: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const isTeacher =
    user?.role === 'TEACHER' ||
    user?.role === 'CLASS_TEACHER' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'PRINCIPAL' ||
    user?.role === 'VICE_PRINCIPAL';

  const { data: resourcesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['learning-resources', search, classFilter, subjectFilter, termFilter, typeFilter],
    queryFn: () =>
      learningResourceApi
        .getAll({
          search: search || undefined,
          classId: classFilter || undefined,
          subjectId: subjectFilter || undefined,
          term: termFilter || undefined,
          resourceType: typeFilter || undefined,
          limit: 100,
        })
        .then((r) => r.data.data),
  });

  const { data: myUploadsData, isLoading: myLoading } = useQuery({
    queryKey: ['my-resources', user?.id],
    queryFn: () =>
      learningResourceApi
        .getAll({ teacherId: user?.id, limit: 100 })
        .then((r) => r.data.data),
    enabled: !!user?.id && isTeacher,
  });

  const { data: statsData } = useQuery({
    queryKey: ['learning-resource-stats'],
    queryFn: () => learningResourceApi.getStats().then((r) => r.data.data),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectApi.getAll().then((r) => r.data.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then((r) => r.data.data),
  });

  const { data: armsData } = useQuery({
    queryKey: ['arms'],
    queryFn: () => armApi.getAll().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        try {
          const uploadRes = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
            },
          });
          const uploaded = uploadRes.data?.data || uploadRes.data;
          payload.fileUrl = uploaded.url || uploaded.fileUrl || uploaded.path;
          payload.fileType = selectedFiles[0].type;
          payload.fileSize = selectedFiles[0].size;
        } catch {
          const blobUrl = URL.createObjectURL(selectedFiles[0]);
          payload.fileUrl = blobUrl;
          payload.fileType = selectedFiles[0].type;
          payload.fileSize = selectedFiles[0].size;
        }
      }
      return learningResourceApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-resources'] });
      queryClient.invalidateQueries({ queryKey: ['my-resources'] });
      queryClient.invalidateQueries({ queryKey: ['learning-resource-stats'] });
      toast({ title: 'Resource uploaded', variant: 'success' });
      resetForm();
      setShowUpload(false);
      setUploadProgress(null);
    },
    onError: (err: any) => {
      toast({
        title: 'Upload failed',
        description: err?.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
      setUploadProgress(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      learningResourceApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-resources'] });
      queryClient.invalidateQueries({ queryKey: ['my-resources'] });
      toast({ title: 'Resource updated', variant: 'success' });
      resetForm();
      setEditingId(null);
      setShowUpload(false);
    },
    onError: (err: any) =>
      toast({
        title: 'Update failed',
        description: err?.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => learningResourceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-resources'] });
      queryClient.invalidateQueries({ queryKey: ['my-resources'] });
      queryClient.invalidateQueries({ queryKey: ['learning-resource-stats'] });
      toast({ title: 'Resource deleted', variant: 'success' });
    },
    onError: () => toast({ title: 'Error deleting resource', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      learningResourceApi.update(id, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-resources'] });
      queryClient.invalidateQueries({ queryKey: ['my-resources'] });
      queryClient.invalidateQueries({ queryKey: ['learning-resource-stats'] });
      toast({ title: 'Status updated', variant: 'success' });
    },
    onError: () => toast({ title: 'Error toggling status', variant: 'destructive' }),
  });

  const resources = resourcesData?.data || resourcesData || [];
  const myUploads = myUploadsData?.data || myUploadsData || [];
  const stats = statsData || {};
  const subjects = subjectsData?.subjects || subjectsData || [];
  const classes = classesData?.classes || classesData || [];
  const arms = armsData?.arms || armsData || [];

  function resetForm() {
    setForm({ ...emptyForm });
    setSelectedFiles([]);
    setFilePreviews([]);
    setEditingId(null);
    setUploadProgress(null);
  }

  function handleEdit(resource: any) {
    setForm({
      title: resource.title || '',
      description: resource.description || '',
      classId: resource.classId || '',
      subjectId: resource.subjectId || '',
      armId: resource.armId || '',
      term: resource.term || '',
      session: resource.session || '',
      week: resource.week?.toString() || '',
      topic: resource.topic || '',
      resourceType: resource.resourceType || 'DOCUMENT',
      allowDownload: resource.allowDownload ?? true,
      isPublished: resource.isPublished ?? false,
      publishAt: resource.publishAt ? resource.publishAt.slice(0, 16) : '',
      expiresAt: resource.expiresAt ? resource.expiresAt.slice(0, 16) : '',
      access: resource.access || 'CLASS_ONLY',
    });
    setEditingId(resource.id);
    setShowUpload(true);
  }

  function handleSubmit() {
    if (!form.title || !form.classId || !form.subjectId) {
      toast({ title: 'Please fill in title, class, and subject', variant: 'destructive' });
      return;
    }
    if (!editingId && selectedFiles.length === 0) {
      toast({ title: 'Please select a file to upload', variant: 'destructive' });
      return;
    }
    const payload: any = {
      title: form.title,
      description: form.description || undefined,
      classId: form.classId,
      subjectId: form.subjectId,
      armId: form.armId || undefined,
      term: form.term || undefined,
      session: form.session || undefined,
      week: form.week ? parseInt(form.week) : undefined,
      topic: form.topic || undefined,
      resourceType: form.resourceType,
      allowDownload: form.allowDownload,
      isPublished: form.isPublished,
      access: form.access,
      schoolId: user?.schoolId,
    };
    if (form.publishAt) payload.publishAt = new Date(form.publishAt).toISOString();
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleFiles(files: FileList | File[]) {
    const valid: File[] = [];
    const previews: { name: string; url: string; type: string; size: number }[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        toast({ title: `Unsupported file type: ${file.name}`, variant: 'destructive' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: `${file.name} exceeds 500MB limit`, variant: 'destructive' });
        continue;
      }
      valid.push(file);
      const url = URL.createObjectURL(file);
      previews.push({ name: file.name, url, type: file.type, size: file.size });
    }
    setSelectedFiles((prev) => [...prev, ...valid]);
    setFilePreviews((prev) => [...prev, ...previews]);
    if (valid.length > 0 && !form.title) {
      const name = valid[0].name.replace(/\.[^/.]+$/, '');
      setForm((f) => ({ ...f, title: name, resourceType: detectResourceType(valid[0]) }));
    }
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleViewDetails = (resource: any) => {
    setViewingId(resource.id);
  };

  const resourceTypeCounts: Record<string, number> = {};
  if (stats?.byType) {
    stats.byType.forEach((t: any) => {
      resourceTypeCounts[t.resourceType] = t._count;
    });
  }

  function renderResourceCard(resource: any, showActions = false) {
    const isImage = resource.fileType?.startsWith('image/');
    const isVideo = resource.fileType?.startsWith('video/');
    const isAudio = resource.fileType?.startsWith('audio/');
    const rType = resource.resourceType || 'OTHER';

    return (
      <motion.div
        key={resource.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden">
          {isImage && resource.fileUrl && (
            <div className="relative h-36 overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resource.fileUrl}
                alt={resource.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <Badge className="absolute top-2 right-2" variant={resourceTypeBadge[rType]}>
                IMAGE
              </Badge>
            </div>
          )}
          {isVideo && resource.fileUrl && (
            <div className="relative h-36 overflow-hidden bg-muted flex items-center justify-center">
              <video
                src={resource.fileUrl}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-10 w-10 text-white opacity-80" />
              </div>
              <Badge className="absolute top-2 right-2" variant={resourceTypeBadge[rType]}>
                VIDEO
              </Badge>
            </div>
          )}
          <CardContent className={cn('pt-4', (isImage || isVideo) ? '' : 'pt-6')}>
            <div className="flex items-start gap-3">
              {!isImage && !isVideo && (
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {resourceTypeIcon[rType] || <File className="h-4 w-4" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate text-sm">{resource.title}</h3>
                  {rType !== 'DOCUMENT' && !isImage && !isVideo && (
                    <Badge variant={resourceTypeBadge[rType]} className="shrink-0 text-[10px] px-1.5">
                      {rType}
                    </Badge>
                  )}
                </div>
                {resource.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{resource.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {resource.class && (
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {resource.class.name}
                    </Badge>
                  )}
                  {resource.subject && (
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {resource.subject.name}
                    </Badge>
                  )}
                  {resource.topic && (
                    <Badge variant="default" className="text-[10px] px-1.5">
                      {resource.topic}
                    </Badge>
                  )}
                </div>
                {resource.teacher?.user && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={resource.teacher.user.avatar} />
                      <AvatarFallback className="text-[8px]">
                        {getInitials(resource.teacher.user.firstName, resource.teacher.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {resource.teacher.user.firstName} {resource.teacher.user.lastName}
                    </span>
                    <span className="mx-1">·</span>
                    <span>{formatDate(resource.createdAt)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {resource.downloads || 0}
                    </span>
                    {resource.fileSize > 0 && (
                      <span className="flex items-center gap-1">
                        <File className="h-3 w-3" />
                        {formatFileSize(resource.fileSize)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {resource.allowDownload !== false && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                learningResourceApi.incrementDownload(resource.id);
                                if (resource.fileUrl) window.open(resource.fileUrl, '_blank');
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleViewDetails(resource)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {showActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleEdit(resource)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleMutation.mutate({
                                id: resource.id,
                                isPublished: !resource.isPublished,
                              })
                            }
                          >
                            {resource.isPublished ? (
                              <>
                                <ToggleLeft className="mr-2 h-4 w-4" /> Unpublish
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 h-4 w-4" /> Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Delete this resource?')) deleteMutation.mutate(resource.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Learning Resources</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
          <p className="text-muted-foreground">Upload and manage learning materials for students</p>
        </div>
        {isTeacher && (
          <Button className="gap-2" onClick={() => { resetForm(); setShowUpload(true); }}>
            <Upload className="h-4 w-4" /> Upload Resource
          </Button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{stats.total ?? stats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total Resources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Play className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-2xl font-bold">{resourceTypeCounts['VIDEO'] || 0}</p>
            <p className="text-xs text-muted-foreground">Videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold">{resourceTypeCounts['DOCUMENT'] || 0}</p>
            <p className="text-xs text-muted-foreground">Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Image className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{resourceTypeCounts['IMAGE'] || 0}</p>
            <p className="text-xs text-muted-foreground">Images & Audio</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse Resources</TabsTrigger>
          {isTeacher && <TabsTrigger value="uploads">My Uploads</TabsTrigger>}
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or topic..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {(Array.isArray(classes) ? classes : []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Subjects</SelectItem>
                    {(Array.isArray(subjects) ? subjects : []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={termFilter} onValueChange={setTermFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Terms</SelectItem>
                    <SelectItem value="First">First Term</SelectItem>
                    <SelectItem value="Second">Second Term</SelectItem>
                    <SelectItem value="Third">Third Term</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="AUDIO">Audio</SelectItem>
                    <SelectItem value="COMPRESSED">Compressed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-44" />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-muted-foreground">Failed to load resources</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Retry
                  </Button>
                </div>
              ) : !resources.length ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground font-medium">No resources available</p>
                  <p className="text-xs text-muted-foreground">
                    {isTeacher ? 'Click "Upload Resource" to share learning materials.' : 'Check back later for new materials.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {resources.map((r: any) => renderResourceCard(r, isTeacher))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isTeacher && (
          <TabsContent value="uploads" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Uploads</CardTitle>
                <Button size="sm" className="gap-1" onClick={() => { resetForm(); setShowUpload(true); }}>
                  <Plus className="h-4 w-4" /> New
                </Button>
              </CardHeader>
              <CardContent>
                {myLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !myUploads.length ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">You haven&apos;t uploaded any resources yet</p>
                    <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowUpload(true); }}>
                      Upload your first resource
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myUploads.map((r: any) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {resourceTypeIcon[r.resourceType || 'OTHER'] || <File className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{r.title}</span>
                            <Badge
                              variant={r.isPublished ? 'success' : 'secondary'}
                              className="text-[10px] px-1.5"
                            >
                              {r.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                            <Badge
                              variant={resourceTypeBadge[r.resourceType || 'OTHER'] || 'outline'}
                              className="text-[10px] px-1.5"
                            >
                              {r.resourceType || 'OTHER'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {r.class && <span>{r.class.name}</span>}
                            {r.subject && <span>{r.subject.name}</span>}
                            {r.topic && <span>{r.topic}</span>}
                            <span>{r.downloads || 0} downloads</span>
                            <span>{formatFileSize(r.fileSize)}</span>
                            <span>{formatDate(r.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    toggleMutation.mutate({
                                      id: r.id,
                                      isPublished: !r.isPublished,
                                    })
                                  }
                                >
                                  {r.isPublished ? (
                                    <ToggleRight className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{r.isPublished ? 'Unpublish' : 'Publish'}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(r)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => {
                                    if (confirm('Delete this resource?')) deleteMutation.mutate(r.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showUpload} onOpenChange={(o) => { if (!o) resetForm(); setShowUpload(o); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Resource' : 'Upload Learning Resource'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update resource details' : 'Share learning materials with students'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {!editingId && (
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium text-sm">
                  {dragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, RTF, PNG, JPG, WEBP, SVG, MP4, MOV, AVI, MKV, WEBM, MP3, WAV, AAC, ZIP, RAR, 7Z (max 500MB)
                </p>
              </div>
            )}

            {filePreviews.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({filePreviews.length})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filePreviews.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2 text-sm"
                    >
                      {f.type.startsWith('image/') ? (
                        <div className="shrink-0 w-10 h-10 rounded overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : f.type.startsWith('video/') ? (
                        <div className="shrink-0 w-10 h-10 rounded bg-purple-100 flex items-center justify-center text-purple-600">
                          <Play className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="shrink-0 w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                          <FileText className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFile(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. First Term Mathematics Notes"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the resource..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Class <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.classId}
                  onValueChange={(v) => setForm({ ...form, classId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(classes) ? classes : []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.subjectId}
                  onValueChange={(v) => setForm({ ...form, subjectId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(subjects) ? subjects : []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Arm</Label>
                <Select
                  value={form.armId}
                  onValueChange={(v) => setForm({ ...form, armId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select arm (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {(Array.isArray(arms) ? arms : []).map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resource Type</Label>
                <Select
                  value={form.resourceType}
                  onValueChange={(v) => setForm({ ...form, resourceType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="AUDIO">Audio</SelectItem>
                    <SelectItem value="COMPRESSED">Compressed</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Term</Label>
                <Input
                  value={form.term}
                  onChange={(e) => setForm({ ...form, term: e.target.value })}
                  placeholder="e.g. First"
                />
              </div>
              <div className="space-y-2">
                <Label>Session</Label>
                <Input
                  value={form.session}
                  onChange={(e) => setForm({ ...form, session: e.target.value })}
                  placeholder="e.g. 2024/2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Week</Label>
                <Input
                  type="number"
                  min={1}
                  max={16}
                  value={form.week}
                  onChange={(e) => setForm({ ...form, week: e.target.value })}
                  placeholder="Week #"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="e.g. Algebra Basics"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base font-semibold">Access & Permissions</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select
                    value={form.access}
                    onValueChange={(v) => setForm({ ...form, access: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_STUDENTS">All Students</SelectItem>
                      <SelectItem value="CLASS_ONLY">Class Only</SelectItem>
                      <SelectItem value="ARM_ONLY">Arm Only</SelectItem>
                      <SelectItem value="SPECIFIC">Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.allowDownload}
                      onCheckedChange={(v) => setForm({ ...form, allowDownload: v })}
                    />
                    <Label className="cursor-pointer">Allow Download</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Schedule Publication</Label>
                  <Input
                    type="datetime-local"
                    value={form.publishAt}
                    onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <Input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(v) => setForm({ ...form, isPublished: v })}
                />
                <Label className="cursor-pointer">
                  {form.isPublished ? 'Published (visible to students)' : 'Draft (not visible yet)'}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { resetForm(); setShowUpload(false); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  {uploadProgress !== null ? (
                    <span className="mr-2">{uploadProgress}%</span>
                  ) : (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingId ? 'Saving...' : 'Uploading...'}
                </>
              ) : editingId ? (
                'Update Resource'
              ) : (
                'Upload Resource'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingId} onOpenChange={(o) => { if (!o) setViewingId(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resource Details</DialogTitle>
            <DialogDescription>Full information about this learning resource</DialogDescription>
          </DialogHeader>
          {viewingId &&
            (() => {
              const resource = [...resources, ...myUploads].find((r: any) => r.id === viewingId);
              if (!resource) return <p className="text-muted-foreground">Resource not found</p>;
              const rType = resource.resourceType || 'OTHER';
              const isVideo = resource.fileType?.startsWith('video/');
              const isImage = resource.fileType?.startsWith('image/');
              const isAudio = resource.fileType?.startsWith('audio/');
              return (
                <div className="space-y-4">
                  {isVideo && resource.fileUrl && (
                    <div className="rounded-lg overflow-hidden bg-black">
                      <video
                        src={resource.fileUrl}
                        controls
                        className="w-full max-h-64"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  {isImage && resource.fileUrl && (
                    <div className="rounded-lg overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resource.fileUrl}
                        alt={resource.title}
                        className="w-full max-h-64 object-contain"
                      />
                    </div>
                  )}
                  {isAudio && resource.fileUrl && (
                    <div className="rounded-lg bg-muted p-4 flex items-center justify-center">
                      <audio src={resource.fileUrl} controls className="w-full" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>{' '}
                      <span className="font-medium">{resource.title}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>{' '}
                      <Badge variant={resourceTypeBadge[rType] || 'outline'} className="ml-1">
                        {rType}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class:</span>{' '}
                      {resource.class?.name || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Subject:</span>{' '}
                      {resource.subject?.name || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Term:</span>{' '}
                      {resource.term || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Session:</span>{' '}
                      {resource.session || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Week:</span>{' '}
                      {resource.week ?? '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Topic:</span>{' '}
                      {resource.topic || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">File Size:</span>{' '}
                      {formatFileSize(resource.fileSize)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Downloads:</span>{' '}
                      {resource.downloads || 0}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Access:</span>{' '}
                      {resource.access || 'CLASS_ONLY'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Allow Download:</span>{' '}
                      {resource.allowDownload !== false ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Published:</span>{' '}
                      <Badge variant={resource.isPublished ? 'success' : 'secondary'}>
                        {resource.isPublished ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      {formatDate(resource.createdAt)}
                    </div>
                    {resource.publishAt && (
                      <div>
                        <span className="text-muted-foreground">Scheduled:</span>{' '}
                        {formatDate(resource.publishAt)}
                      </div>
                    )}
                    {resource.expiresAt && (
                      <div>
                        <span className="text-muted-foreground">Expires:</span>{' '}
                        {formatDate(resource.expiresAt)}
                      </div>
                    )}
                  </div>
                  {resource.description && (
                    <div>
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <p className="text-sm mt-1">{resource.description}</p>
                    </div>
                  )}
                  {resource.teacher?.user && (
                    <div className="flex items-center gap-3 pt-2 border-t">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={resource.teacher.user.avatar} />
                        <AvatarFallback>
                          {getInitials(resource.teacher.user.firstName, resource.teacher.user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {resource.teacher.user.firstName} {resource.teacher.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">Teacher</p>
                      </div>
                    </div>
                  )}
                  {resource.fileUrl && (
                    <div className="flex gap-2 pt-2">
                      {resource.allowDownload !== false && (
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            learningResourceApi.incrementDownload(resource.id);
                            window.open(resource.fileUrl, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" /> Download File
                        </Button>
                      )}
                      {isTeacher && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => { handleEdit(resource); setViewingId(null); }}
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive"
                            onClick={() => {
                              if (confirm('Delete this resource?')) {
                                deleteMutation.mutate(resource.id);
                                setViewingId(null);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
