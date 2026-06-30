'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, Download, FileText, Filter, Loader2, AlertCircle,
  Play, Image, Headphones, Archive, File, Clock, Calendar, ChevronDown,
  Star, CheckCircle2, Circle, Bookmark, Eye, X, Video, Music,
  User, ArrowLeft, PanelTop, CheckCheck
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { learningResourceApi, subjectApi, classApi } from '@/lib/endpoints';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, cn, getInitials } from '@/lib/utils';

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const resourceTypeIcon: Record<string, React.ReactNode> = {
  DOCUMENT: <FileText className="h-4 w-4" />,
  IMAGE: <Image className="h-4 w-4" />,
  VIDEO: <Play className="h-4 w-4" />,
  AUDIO: <Headphones className="h-4 w-4" />,
  COMPRESSED: <Archive className="h-4 w-4" />,
  OTHER: <File className="h-4 w-4" />,
};

const resourceTypeBadge: Record<string, 'default' | 'secondary' | 'outline' | 'success' | 'warning'> = {
  DOCUMENT: 'default',
  IMAGE: 'success',
  VIDEO: 'warning',
  AUDIO: 'secondary',
  COMPRESSED: 'outline',
  OTHER: 'outline',
};

const STORAGE_KEY_BOOKMARKS = 'lr_bookmarks';
const STORAGE_KEY_COMPLETED = 'lr_completed';

function loadBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBookmarks(ids: string[]) {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(ids));
}

function loadCompleted(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPLETED);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCompleted(ids: string[]) {
  localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(ids));
}

export default function StudentLearningPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [tab, setTab] = useState('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks());
  const [completed, setCompleted] = useState<string[]>(loadCompleted());
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const studentClassId = useMemo(() => {
    const profile = (user as any)?.studentProfile;
    return profile?.currentClassId || profile?.currentClass?.id || null;
  }, [user]);

  const { data: resourcesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-resources', search, subjectFilter, termFilter, typeFilter, topicFilter],
    queryFn: () =>
      learningResourceApi
        .getAll({
          search: search || undefined,
          classId: studentClassId || undefined,
          subjectId: subjectFilter || undefined,
          term: termFilter || undefined,
          resourceType: typeFilter || undefined,
          topic: topicFilter || undefined,
          isPublished: true,
          limit: 100,
        })
        .then((r) => r.data.data),
    enabled: true,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectApi.getAll().then((r) => r.data.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classApi.getAll().then((r) => r.data.data),
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => learningResourceApi.incrementDownload(id),
    onError: () => {},
  });

  const resources = resourcesData?.data || resourcesData || [];
  const subjects = subjectsData?.subjects || subjectsData || [];
  const classes = classesData?.classes || classesData || [];

  const filteredResources = useMemo(() => {
    let list = Array.isArray(resources) ? resources : [];
    if (tab === 'bookmarks') list = list.filter((r: any) => bookmarks.includes(r.id));
    if (tab === 'completed') list = list.filter((r: any) => completed.includes(r.id));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (r: any) =>
          r.title?.toLowerCase().includes(s) ||
          r.description?.toLowerCase().includes(s) ||
          r.topic?.toLowerCase().includes(s)
      );
    }
    if (subjectFilter) list = list.filter((r: any) => r.subjectId === subjectFilter);
    if (termFilter) list = list.filter((r: any) => r.term?.toLowerCase() === termFilter.toLowerCase());
    if (typeFilter) list = list.filter((r: any) => r.resourceType === typeFilter);
    if (topicFilter) list = list.filter((r: any) => r.topic?.toLowerCase().includes(topicFilter.toLowerCase()));
    return list;
  }, [resources, tab, bookmarks, completed, search, subjectFilter, termFilter, typeFilter, topicFilter]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    (Array.isArray(resources) ? resources : []).forEach((r: any) => {
      if (r.topic) set.add(r.topic);
    });
    return Array.from(set).sort();
  }, [resources]);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    saveCompleted(completed);
  }, [completed]);

  function toggleBookmark(id: string) {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }

  function toggleCompleted(id: string) {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleDownload(resource: any) {
    downloadMutation.mutate(resource.id);
    if (resource.fileUrl) window.open(resource.fileUrl, '_blank');
  }

  function handlePreview(resource: any) {
    setPreviewId(resource.id);
    const type = resource.fileType || '';
    if (type.startsWith('video/')) {
      setPreviewType('video');
      setShowVideoPlayer(true);
      setVideoUrl(resource.fileUrl);
    } else if (type.startsWith('image/')) {
      setPreviewType('image');
    } else if (type.startsWith('audio/')) {
      setPreviewType('audio');
    } else {
      setPreviewType('other');
    }
  }

  const previewResource = previewId
    ? (Array.isArray(resources) ? resources : []).find((r: any) => r.id === previewId)
    : null;

  function renderResourceCard(resource: any) {
    const isBookmarked = bookmarks.includes(resource.id);
    const isCompleted = completed.includes(resource.id);
    const rType = resource.resourceType || 'OTHER';
    const isImage = resource.fileType?.startsWith('image/');
    const isVideo = resource.fileType?.startsWith('video/');
    const isAudio = resource.fileType?.startsWith('audio/');

    return (
      <motion.div
        key={resource.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            'group hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer',
            isCompleted && 'ring-1 ring-green-500/30'
          )}
          onClick={() => handlePreview(resource)}
        >
          {isImage && resource.fileUrl && (
            <div className="relative h-40 overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resource.fileUrl}
                alt={resource.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <Badge className="absolute top-2 right-2" variant="secondary">Preview</Badge>
              {isCompleted && (
                <div className="absolute top-2 left-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow" />
                </div>
              )}
            </div>
          )}
          {isVideo && resource.fileUrl && (
            <div className="relative h-40 overflow-hidden bg-muted flex items-center justify-center">
              <video
                src={resource.fileUrl}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary ml-0.5" />
                </div>
              </div>
              {isCompleted && (
                <div className="absolute top-2 left-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow" />
                </div>
              )}
            </div>
          )}
          <CardContent className={cn('pt-4', (isImage || isVideo) ? '' : 'pt-5')}>
            <div className="flex items-start gap-3">
              {!isImage && !isVideo && (
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {resourceTypeIcon[rType] || <File className="h-4 w-4" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">{resource.title}</h3>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {isCompleted && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </TooltipTrigger>
                          <TooltipContent>Completed</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn('h-7 w-7', isBookmarked && 'text-yellow-500')}
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(resource.id); }}
                          >
                            <Bookmark
                              className={cn('h-3.5 w-3.5', isBookmarked && 'fill-current')}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isBookmarked ? 'Remove bookmark' : 'Bookmark'}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                {resource.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{resource.description}</p>
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
                  {rType !== 'DOCUMENT' && (
                    <Badge variant={resourceTypeBadge[rType]} className="text-[10px] px-1.5">
                      {rType}
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
                    {resource.week && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Week {resource.week}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(resource);
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn('h-7 w-7', isCompleted && 'text-green-500')}
                            onClick={(e) => { e.stopPropagation(); toggleCompleted(resource.id); }}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isCompleted ? 'Mark incomplete' : 'Mark completed'}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const progressPercent = (Array.isArray(resources) ? resources : []).length > 0
    ? Math.round((completed.length / (Array.isArray(resources) ? resources : []).length) * 100)
    : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Learning Portal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Portal</h1>
          <p className="text-muted-foreground">Access learning materials for your classes</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">
              {Array.isArray(resources) ? resources.length : 0}
            </p>
            <p className="text-xs text-muted-foreground">Available Resources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bookmark className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
            <p className="text-2xl font-bold">{bookmarks.length}</p>
            <p className="text-xs text-muted-foreground">Bookmarked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Download className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-2xl font-bold">
              {(Array.isArray(resources) ? resources : []).reduce(
                (sum: number, r: any) => sum + (r.downloads || 0),
                0
              )}
            </p>
            <p className="text-xs text-muted-foreground">Total Downloads</p>
          </CardContent>
        </Card>
      </div>

      {studentClassId && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm">
              Showing resources for{' '}
              <span className="font-semibold">
                {(Array.isArray(classes) ? classes : []).find((c: any) => c.id === studentClassId)?.name ||
                  'your class'}
              </span>
            </p>
            {progressPercent > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground shrink-0">{progressPercent}% complete</span>
                <Progress value={progressPercent} className="w-24 h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="bookmarks">
              Bookmarks
              {bookmarks.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
                  {bookmarks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              {completed.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
                  {completed.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, topic..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Subject" />
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
                {topics.length > 0 && (
                  <Select value={topicFilter} onValueChange={setTopicFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Topics</SelectItem>
                      {topics.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-52" />
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
              ) : !filteredResources.length ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground font-medium">No resources available</p>
                  <p className="text-xs text-muted-foreground">
                    {search || subjectFilter || termFilter || typeFilter
                      ? 'Try adjusting your filters'
                      : 'Your teachers have not uploaded any resources yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.map((r: any) => renderResourceCard(r))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookmarks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-yellow-500" /> Bookmarked Resources
              </CardTitle>
              <CardDescription>Resources you have bookmarked for later</CardDescription>
            </CardHeader>
            <CardContent>
              {!bookmarks.length ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Bookmark className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No bookmarked resources yet</p>
                  <p className="text-xs text-muted-foreground">
                    Click the bookmark icon on any resource to save it here.
                  </p>
                </div>
              ) : !filteredResources.length ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Bookmark className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No bookmarks match your filters</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.map((r: any) => renderResourceCard(r))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" /> Completed Resources
              </CardTitle>
              <CardDescription>Resources you have marked as completed</CardDescription>
            </CardHeader>
            <CardContent>
              {!completed.length ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No completed resources yet</p>
                  <p className="text-xs text-muted-foreground">
                    Click the circle icon on any resource to mark it as completed.
                  </p>
                </div>
              ) : !filteredResources.length ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No completed resources match your filters</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.map((r: any) => renderResourceCard(r))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!previewId && previewType !== 'video'}
        onOpenChange={(o) => { if (!o) { setPreviewId(null); setPreviewType(null); } }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewResource?.title || 'Resource Preview'}</DialogTitle>
            <DialogDescription>
              {previewResource?.subject?.name && `${previewResource.subject.name}`}
              {previewResource?.class?.name && ` · ${previewResource.class.name}`}
            </DialogDescription>
          </DialogHeader>
          {previewResource && (
            <div className="space-y-4">
              {previewType === 'image' && previewResource.fileUrl && (
                <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewResource.fileUrl}
                    alt={previewResource.title}
                    className="max-w-full max-h-96 object-contain"
                  />
                </div>
              )}
              {previewType === 'audio' && previewResource.fileUrl && (
                <div className="rounded-lg bg-muted p-6 flex items-center justify-center">
                  <audio src={previewResource.fileUrl} controls className="w-full max-w-md" />
                </div>
              )}
              {previewType === 'other' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">Preview not available for this file type</p>
                  <Button
                    className="gap-2"
                    onClick={() => handleDownload(previewResource)}
                  >
                    <Download className="h-4 w-4" /> Download to View
                  </Button>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Subject:</span>{' '}
                  <span className="font-medium">{previewResource.subject?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Topic:</span>{' '}
                  <span className="font-medium">{previewResource.topic || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Term:</span>{' '}
                  {previewResource.term || '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Week:</span>{' '}
                  {previewResource.week ?? '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">File Size:</span>{' '}
                  {formatFileSize(previewResource.fileSize)}
                </div>
                <div>
                  <span className="text-muted-foreground">Downloads:</span>{' '}
                  {previewResource.downloads || 0}
                </div>
              </div>
              {previewResource.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="text-sm mt-1">{previewResource.description}</p>
                </div>
              )}
              {previewResource.teacher?.user && (
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={previewResource.teacher.user.avatar} />
                    <AvatarFallback>
                      {getInitials(previewResource.teacher.user.firstName, previewResource.teacher.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {previewResource.teacher.user.firstName} {previewResource.teacher.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Teacher · Uploaded {formatDate(previewResource.createdAt)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {previewResource.allowDownload !== false && (
                  <Button
                    className="gap-2"
                    onClick={() => handleDownload(previewResource)}
                  >
                    <Download className="h-4 w-4" /> Download
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => toggleBookmark(previewResource.id)}
                >
                  <Bookmark
                    className={cn(
                      'h-4 w-4',
                      bookmarks.includes(previewResource.id) && 'fill-yellow-500 text-yellow-500'
                    )}
                  />
                  {bookmarks.includes(previewResource.id) ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => toggleCompleted(previewResource.id)}
                >
                  {completed.includes(previewResource.id) ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Completed
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4" /> Mark Complete
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreviewId(null); setPreviewType(null); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVideoPlayer} onOpenChange={(o) => { if (!o) { setShowVideoPlayer(false); setVideoUrl(''); setPreviewId(null); } }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewResource?.title || 'Video Player'}</DialogTitle>
          </DialogHeader>
          {videoUrl && (
            <div className="rounded-lg overflow-hidden bg-black">
              <video
                src={videoUrl}
                controls
                className="w-full max-h-[70vh]"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          {previewResource && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {previewResource.subject?.name && `${previewResource.subject.name} `}
                {previewResource.topic && `· ${previewResource.topic}`}
              </span>
              <div className="flex items-center gap-3">
                <span>{previewResource.downloads || 0} downloads</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-1',
                    bookmarks.includes(previewResource.id) && 'text-yellow-500'
                  )}
                  onClick={() => toggleBookmark(previewResource.id)}
                >
                  <Bookmark
                    className={cn(
                      'h-4 w-4',
                      bookmarks.includes(previewResource.id) && 'fill-current'
                    )}
                  />
                  {bookmarks.includes(previewResource.id) ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-1',
                    completed.includes(previewResource.id) && 'text-green-500'
                  )}
                  onClick={() => toggleCompleted(previewResource.id)}
                >
                  {completed.includes(previewResource.id) ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  {completed.includes(previewResource.id) ? 'Done' : 'Mark'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowVideoPlayer(false); setVideoUrl(''); setPreviewId(null); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
