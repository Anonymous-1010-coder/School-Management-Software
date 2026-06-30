'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Settings, User, Shield, Bell, CreditCard, Palette, Save, Loader2, Check, Moon, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { settingsApi, authApi, profileApi } from '@/lib/endpoints';
import { toast } from '@/hooks/use-toast';

const NOTIFICATION_KEY = 'notification-preferences';
const COMPACT_SIDEBAR_KEY = 'compact-sidebar';

function getDefaultNotifications(): { email: boolean; sms: boolean; attendance: boolean; fees: boolean; exams: boolean } {
  if (typeof window === 'undefined') return defaultNotifs;
  try {
    const stored = localStorage.getItem(NOTIFICATION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultNotifs;
}

const defaultNotifs = {
  email: true,
  sms: false,
  attendance: true,
  fees: true,
  exams: true,
};

const sessions = ['2023/2024', '2024/2025', '2025/2026', '2026/2027'];
const terms = ['First', 'Second', 'Third'];
const currencies = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES'];
const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];
const colors = ['#2563eb', '#059669', '#7c3aed', '#dc2626', '#d97706'];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [generalLoading, setGeneralLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [currentSession, setCurrentSession] = useState('');
  const [currentTerm, setCurrentTerm] = useState('');
  const [currency, setCurrency] = useState('NGN');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [notifications, setNotifications] = useState(getDefaultNotifications);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  const [compactSidebar, setCompactSidebar] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(COMPACT_SIDEBAR_KEY) === 'true';
  });

  const [selectedColor, setSelectedColor] = useState(colors[0]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await settingsApi.getSchoolSettings();
        if (res.data?.success && res.data?.data) {
          const s = res.data.data;
          setSchoolName(s.schoolName || '');
          setSchoolCode(s.schoolCode || '');
          setSchoolEmail(s.email || '');
          setSchoolPhone(s.phone || '');
          setSchoolAddress(s.address || '');
          setCurrentSession(s.currentSession || '');
          setCurrentTerm(s.currentTerm || '');
          setCurrency(s.currency || 'NGN');
        }
      } catch {
        // Use defaults
      } finally {
        setSettingsLoading(false);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setTwoFactorEnabled(user.isTwoFactorEnabled);
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  async function handleGeneralSave() {
    setGeneralLoading(true);
    try {
      await settingsApi.updateSchoolSettings({
        schoolName, schoolCode, email: schoolEmail, phone: schoolPhone,
        address: schoolAddress, currentSession, currentTerm, currency,
      });
      toast({ title: 'Settings saved', description: 'School settings updated successfully.', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save school settings.', variant: 'destructive' });
    } finally {
      setGeneralLoading(false);
    }
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setSecurityLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast({ title: 'Password updated', description: 'Your password has been changed.', variant: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast({ title: 'Error', description: 'Failed to change password. Check your current password.', variant: 'destructive' });
    } finally {
      setSecurityLoading(false);
    }
  }

  async function handle2FAToggle() {
    try {
      if (twoFactorEnabled) {
        await authApi.disable2FA();
        setTwoFactorEnabled(false);
        toast({ title: '2FA disabled', variant: 'success' });
      } else {
        await authApi.enable2FA();
        setTwoFactorEnabled(true);
        toast({ title: '2FA enabled', variant: 'success' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle 2FA.', variant: 'destructive' });
    }
  }

  function handleNotificationSave() {
    try {
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
      toast({ title: 'Preferences saved', description: 'Notification preferences updated.', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save preferences.', variant: 'destructive' });
    }
  }

  async function handleProfileSave() {
    setProfileLoading(true);
    try {
      await profileApi.update({ firstName, lastName, email: profileEmail });
      await refreshUser();
      toast({ title: 'Profile updated', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } finally {
      setProfileLoading(false);
    }
  }

  function handleCompactToggle(val: boolean) {
    setCompactSidebar(val);
    localStorage.setItem(COMPACT_SIDEBAR_KEY, val.toString());
  }

  if (settingsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div><h1 className="text-3xl font-bold tracking-tight">Settings</h1><p className="text-muted-foreground">Manage your account and system preferences</p></div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="general"><Settings className="mr-2 h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" /> Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Update your school&apos;s general information</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>School Name</Label><Input value={schoolName} onChange={e => setSchoolName(e.target.value)} /></div>
                <div className="space-y-2"><Label>School Code</Label><Input value={schoolCode} onChange={e => setSchoolCode(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={schoolPhone} onChange={e => setSchoolPhone(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={schoolAddress} onChange={e => setSchoolAddress(e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Current Session</Label>
                  <Select value={currentSession} onValueChange={setCurrentSession}>
                    <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                    <SelectContent>{sessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Current Term</Label>
                  <Select value={currentTerm} onValueChange={setCurrentTerm}>
                    <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                    <SelectContent>{terms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="gap-2" onClick={handleGeneralSave} disabled={generalLoading}>
                {generalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle>Security Settings</CardTitle><CardDescription>Manage password and authentication settings</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>
              <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
              <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
              <Button className="gap-2" onClick={handlePasswordChange} disabled={securityLoading}>
                {securityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Password
              </Button>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label className="text-base">Two-Factor Authentication</Label><p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p></div>
                <Switch checked={twoFactorEnabled} onCheckedChange={handle2FAToggle} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Configure how you receive notifications</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label className="text-base">Email Notifications</Label><p className="text-sm text-muted-foreground">Receive updates via email</p></div>
                <Switch checked={notifications.email} onCheckedChange={v => setNotifications(p => ({ ...p, email: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="text-base">SMS Notifications</Label><p className="text-sm text-muted-foreground">Receive updates via SMS</p></div>
                <Switch checked={notifications.sms} onCheckedChange={v => setNotifications(p => ({ ...p, sms: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="text-base">Attendance Alerts</Label><p className="text-sm text-muted-foreground">Get notified when students are absent</p></div>
                <Switch checked={notifications.attendance} onCheckedChange={v => setNotifications(p => ({ ...p, attendance: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="text-base">Fee Reminders</Label><p className="text-sm text-muted-foreground">Payment due date reminders</p></div>
                <Switch checked={notifications.fees} onCheckedChange={v => setNotifications(p => ({ ...p, fees: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="text-base">Exam Notifications</Label><p className="text-sm text-muted-foreground">Exam schedule and results</p></div>
                <Switch checked={notifications.exams} onCheckedChange={v => setNotifications(p => ({ ...p, exams: v }))} />
              </div>
              <Button className="gap-2" onClick={handleNotificationSave} disabled={notificationLoading}>
                <Save className="h-4 w-4" /> Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Customize the look and feel of the application</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Theme</Label>
                <div className="flex gap-2">
                  {themeOptions.map(opt => (
                    <Button
                      key={opt.value}
                      variant={theme === opt.value ? 'default' : 'outline'}
                      className="flex-1 gap-2"
                      onClick={() => setTheme(opt.value)}
                    >
                      {opt.value === 'dark' ? <Moon className="h-4 w-4" /> : opt.value === 'light' ? <Sun className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="text-base">Compact Sidebar</Label><p className="text-sm text-muted-foreground">Use compact navigation mode</p></div>
                <Switch checked={compactSidebar} onCheckedChange={handleCompactToggle} />
              </div>
              <div className="space-y-2"><Label>Primary Color</Label>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: selectedColor === c ? 'var(--foreground)' : 'transparent',
                      }}
                      onClick={() => setSelectedColor(c)}
                    >
                      {selectedColor === c && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle><CardDescription>Update your personal information</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input value={profileEmail} onChange={e => setProfileEmail(e.target.value)} /></div>
              <Button className="gap-2" onClick={handleProfileSave} disabled={profileLoading}>
                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
