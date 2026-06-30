import api from './api';

// Students
export const studentApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  promote: (id: string, data: any) => api.post(`/students/${id}/promote`, data),
  getStats: () => api.get('/students/stats'),
};

// Staff
export const staffApi = {
  getAll: (params?: any) => api.get('/staff', { params }),
  getById: (id: string) => api.get(`/staff/${id}`),
  create: (data: any) => api.post('/staff', data),
  update: (id: string, data: any) => api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

// Classes
export const classApi = {
  getAll: () => api.get('/classes'),
  getById: (id: string) => api.get(`/classes/${id}`),
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.put(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
  getStats: () => api.get('/classes/stats'),
};

// Subjects
export const subjectApi = {
  getAll: (params?: any) => api.get('/subjects', { params }),
  getById: (id: string) => api.get(`/subjects/${id}`),
  create: (data: any) => api.post('/subjects', data),
  update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
  assignTeacher: (id: string, teacherId: string) => api.post(`/subjects/${id}/assign-teacher`, { teacherId }),
  getStats: () => api.get('/subjects/stats'),
};

// Attendance
export const attendanceApi = {
  getAll: (params?: any) => api.get('/attendance', { params }),
  mark: (data: any) => api.post('/attendance/mark', data),
  markBulk: (records: any[]) => api.post('/attendance/bulk', { records }),
  getStats: (params?: any) => api.get('/attendance/stats', { params }),
};

// Exams
export const examApi = {
  getAll: (params?: any) => api.get('/exams', { params }),
  getById: (id: string) => api.get(`/exams/${id}`),
  create: (data: any) => api.post('/exams', data),
  update: (id: string, data: any) => api.put(`/exams/${id}`, data),
  delete: (id: string) => api.delete(`/exams/${id}`),
  getQuestions: (id: string) => api.get(`/exams/${id}/questions`),
  addQuestion: (id: string, data: any) => api.post(`/exams/${id}/questions`, data),
  saveAnswers: (id: string, data: any) => api.post(`/exams/${id}/save-answers`, data),
  submit: (id: string, data: any) => api.post(`/exams/${id}/submit`, data),
  getSubmissions: (id: string) => api.get(`/exams/${id}/submissions`),
  getStats: () => api.get('/exams/stats'),
};

// Results
export const resultApi = {
  getAll: (params?: any) => api.get('/results', { params }),
  getById: (id: string) => api.get(`/results/${id}`),
  create: (data: any) => api.post('/results', data),
  update: (id: string, data: any) => api.put(`/results/${id}`, data),
  delete: (id: string) => api.delete(`/results/${id}`),
  createBulk: (results: any[]) => api.post('/results/bulk', { results }),
  publish: (data: any) => api.post('/results/publish', data),
  getReportCard: (studentId: string, term: string, session: string) => api.get(`/results/report-card/${studentId}/${term}/${session}`),
  getStats: () => api.get('/results/stats'),
};

// Finance
export const financeApi = {
  getFeeStructures: (params?: any) => api.get('/finance/fee-structures', { params }),
  createFeeStructure: (data: any) => api.post('/finance/fee-structures', data),
  updateFeeStructure: (id: string, data: any) => api.put(`/finance/fee-structures/${id}`, data),
  deleteFeeStructure: (id: string) => api.delete(`/finance/fee-structures/${id}`),
  getPayments: (params?: any) => api.get('/finance/payments', { params }),
  recordPayment: (data: any) => api.post('/finance/payments', data),
  getExpenses: () => api.get('/finance/expenses'),
  createExpense: (data: any) => api.post('/finance/expenses', data),
  getPayrolls: (params?: any) => api.get('/finance/payroll', { params }),
  runPayroll: (data: any) => api.post('/finance/payroll', data),
  getStats: () => api.get('/finance/stats'),
};

// Library
export const libraryApi = {
  getAll: (params?: any) => api.get('/library', { params }),
  create: (data: any) => api.post('/library', data),
  update: (id: string, data: any) => api.put(`/library/${id}`, data),
  delete: (id: string) => api.delete(`/library/${id}`),
  borrow: (data: any) => api.post('/library/borrow', data),
  return: (id: string) => api.post(`/library/return/${id}`),
  getStats: () => api.get('/library/stats'),
};

// Hostel
export const hostelApi = {
  getAll: () => api.get('/hostel'),
  create: (data: any) => api.post('/hostel', data),
  addRoom: (data: any) => api.post('/hostel/rooms', data),
  allocate: (data: any) => api.post('/hostel/allocate', data),
  deallocate: (id: string) => api.post(`/hostel/deallocate/${id}`),
  getStats: () => api.get('/hostel/stats'),
};

// Transport
export const transportApi = {
  getAll: () => api.get('/transport'),
  create: (data: any) => api.post('/transport', data),
  allocate: (data: any) => api.post('/transport/allocate', data),
  deallocate: (id: string) => api.post(`/transport/deallocate/${id}`),
};

// Clinic
export const clinicApi = {
  getAll: () => api.get('/clinic'),
  create: (data: any) => api.post('/clinic', data),
  getStats: () => api.get('/clinic/stats'),
};

// Inventory
export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  create: (data: any) => api.post('/inventory', data),
  update: (id: string, data: any) => api.put(`/inventory/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
  getStats: () => api.get('/inventory/stats'),
};

// Communication
export const communicationApi = {
  getInbox: () => api.get('/communication/inbox'),
  getSent: () => api.get('/communication/sent'),
  send: (data: any) => api.post('/communication/send', data),
  markRead: (id: string) => api.put(`/communication/read/${id}`),
  getNotifications: () => api.get('/communication/notifications'),
  createNotification: (data: any) => api.post('/communication/notifications', data),
};

// Parents
export const parentApi = {
  getAll: () => api.get('/parents'),
  getById: (id: string) => api.get(`/parents/${id}`),
  create: (data: any) => api.post('/parents', data),
  linkStudent: (id: string, studentId: string) => api.post(`/parents/${id}/link-student`, { studentId }),
};

// Arms
export const armApi = {
  getAll: (params?: any) => api.get('/arms', { params }),
  getById: (id: string) => api.get(`/arms/${id}`),
  create: (data: any) => api.post('/arms', data),
  update: (id: string, data: any) => api.put(`/arms/${id}`, data),
  delete: (id: string) => api.delete(`/arms/${id}`),
};

// Homework
export const homeworkApi = {
  getAll: (params?: any) => api.get('/homework', { params }),
  getById: (id: string) => api.get(`/homework/${id}`),
  create: (data: any) => api.post('/homework', data),
  update: (id: string, data: any) => api.put(`/homework/${id}`, data),
  delete: (id: string) => api.delete(`/homework/${id}`),
  submit: (id: string, data: any) => api.post(`/homework/${id}/submit`, data),
  grade: (id: string, data: any) => api.put(`/homework/submissions/${id}/grade`, data),
  getStats: () => api.get('/homework/stats'),
};

// Lesson Notes
export const lessonNoteApi = {
  getAll: (params?: any) => api.get('/lesson-notes', { params }),
  getById: (id: string) => api.get(`/lesson-notes/${id}`),
  create: (data: any) => api.post('/lesson-notes', data),
  update: (id: string, data: any) => api.put(`/lesson-notes/${id}`, data),
  delete: (id: string) => api.delete(`/lesson-notes/${id}`),
  getStats: () => api.get('/lesson-notes/stats'),
};

// Learning Resources
export const learningResourceApi = {
  getAll: (params?: any) => api.get('/learning-resources', { params }),
  getById: (id: string) => api.get(`/learning-resources/${id}`),
  create: (data: any) => api.post('/learning-resources', data),
  update: (id: string, data: any) => api.put(`/learning-resources/${id}`, data),
  delete: (id: string) => api.delete(`/learning-resources/${id}`),
  incrementDownload: (id: string) => api.post(`/learning-resources/${id}/download`),
  getStats: () => api.get('/learning-resources/stats'),
};

// Exam Sessions (Anti-Cheat)
export const examSessionApi = {
  create: (data: any) => api.post('/exam-sessions', data),
  logEvent: (sessionId: string, data: any) => api.post(`/exam-sessions/${sessionId}/events`, data),
  updateActivity: (sessionId: string) => api.put(`/exam-sessions/${sessionId}/activity`),
  endSession: (sessionId: string) => api.put(`/exam-sessions/${sessionId}/end`),
  getEvents: (sessionId: string) => api.get(`/exam-sessions/${sessionId}/events`),
  getExamLog: (examId: string) => api.get(`/exam-sessions/exam/${examId}/log`),
  getSuspicious: (examId: string, threshold?: number) => api.get(`/exam-sessions/exam/${examId}/suspicious`, { params: { threshold } }),
};

// Auth
export const authApi = {
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
  enable2FA: () => api.post('/auth/2fa/enable'),
  disable2FA: () => api.post('/auth/2fa/disable'),
};

// Profile
export const profileApi = {
  update: (data: { firstName?: string; lastName?: string; email?: string }) =>
    api.put('/auth/profile', data),
  getProfile: () => api.get('/auth/profile'),
};

// Settings
export const settingsApi = {
  getSchoolSettings: () => api.get('/settings/school'),
  updateSchoolSettings: (data: any) => api.put('/settings/school', data),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};
