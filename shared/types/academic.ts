export interface Class {
  id: string;
  name: string;
  code: string;
  description?: string;
  academicLevel: number;
  arms: Arm[];
  subjects: Subject[];
  createdAt: string;
}

export interface Arm {
  id: string;
  name: string;
  code: string;
  classId: string;
  class?: Class;
  classTeacherId?: string;
  studentCount?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  subjectType: 'CORE' | 'ELECTIVE' | 'VOCATIONAL';
  creditUnit: number;
  classId: string;
  teacherId?: string;
}

export interface Timetable {
  id: string;
  classId: string;
  armId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  room?: string;
}

export interface LessonNote {
  id: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  topic: string;
  objectives: string;
  content: string;
  materials?: string;
  week: number;
  term: string;
  session: string;
}

export interface Homework {
  id: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  armId?: string;
  title: string;
  description: string;
  dueDate: string;
  attachments?: string[];
  maxScore: number;
}

export interface Exam {
  id: string;
  title: string;
  examType: 'CA_TEST' | 'MID_TERM' | 'END_TERM' | 'MOCK' | 'FINAL';
  subjectId: string;
  classId: string;
  armId?: string;
  term: string;
  session: string;
  duration: number;
  totalMarks: number;
  isCbt: boolean;
  startDate?: string;
  endDate?: string;
}

export interface Question {
  id: string;
  examId: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'THEORY' | 'TRUE_FALSE' | 'FILL_BLANK';
  options?: string[];
  correctAnswer: string;
  marks: number;
}

export interface GradingSystem {
  id: string;
  name: string;
  grades: Grade[];
  isActive: boolean;
}

export interface Grade {
  minScore: number;
  maxScore: number;
  grade: string;
  point: number;
  remark: string;
}

export interface Result {
  id: string;
  studentId: string;
  examId: string;
  subjectId: string;
  classId: string;
  score: number;
  grade?: string;
  point?: number;
  remark?: string;
  term: string;
  session: string;
  isPublished: boolean;
}

export interface ReportCard {
  id: string;
  studentId: string;
  classId: string;
  term: string;
  session: string;
  results: Result[];
  totalScore: number;
  averageScore: number;
  gpa?: number;
  position?: number;
  classSize?: number;
  teacherComment?: string;
  principalComment?: string;
  nextTermResumes?: string;
}
