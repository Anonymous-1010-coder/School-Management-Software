import { PrismaClient, Role, Gender, SubjectType, ExamType, QuestionType, AttendanceStatus, PaymentStatus, FeeCategory, ExpenseCategory, BookStatus, LeaveStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.cBTSubmission.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.result.deleteMany();
  await prisma.homeworkSubmission.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.lessonNote.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.feePayment.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.bookBorrow.deleteMany();
  await prisma.book.deleteMany();
  await prisma.hostelAllocation.deleteMany();
  await prisma.hostelRoom.deleteMany();
  await prisma.hostel.deleteMany();
  await prisma.transportAllocation.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.studentDocument.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.arm.deleteMany();
  await prisma.class.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  const password = await bcrypt.hash('Password123!', 12);

  // Create School
  const school = await prisma.school.create({
    data: {
      name: 'Excel International School',
      code: 'EIS001',
      address: '42 Education Avenue, Lagos',
      phone: '+234-800-SCHOOL',
      email: 'info@excelinternational.edu.ng',
      motto: 'Excellence in Education',
      session: '2024/2025',
      term: 'First',
    },
  });
  console.log('School created:', school.name);

  // Create Users with different roles
  const superAdmin = await prisma.user.create({
    data: { email: 'admin@sms.com', password, firstName: 'Super', lastName: 'Admin', role: 'SUPER_ADMIN', isVerified: true },
  });

  const owner = await prisma.user.create({
    data: { email: 'owner@excel.com', password, firstName: 'John', lastName: 'Owner', role: 'SCHOOL_OWNER', isVerified: true, schoolId: school.id },
  });

  const principal = await prisma.user.create({
    data: { email: 'principal@excel.com', password, firstName: 'Sarah', lastName: 'Johnson', role: 'PRINCIPAL', isVerified: true, schoolId: school.id, gender: 'FEMALE' },
  });

  const vicePrincipal = await prisma.user.create({
    data: { email: 'vp@excel.com', password, firstName: 'Michael', lastName: 'Williams', role: 'VICE_PRINCIPAL', isVerified: true, schoolId: school.id, gender: 'MALE' },
  });

  const accountant = await prisma.user.create({
    data: { email: 'accountant@excel.com', password, firstName: 'Grace', lastName: 'Anderson', role: 'ACCOUNTANT', isVerified: true, schoolId: school.id, gender: 'FEMALE' },
  });

  const librarian = await prisma.user.create({
    data: { email: 'librarian@excel.com', password, firstName: 'David', lastName: 'Brown', role: 'LIBRARIAN', isVerified: true, schoolId: school.id, gender: 'MALE' },
  });

  const nurse = await prisma.user.create({
    data: { email: 'nurse@excel.com', password, firstName: 'Patricia', lastName: 'Davis', role: 'NURSE', isVerified: true, schoolId: school.id, gender: 'FEMALE' },
  });

  const hostelManager = await prisma.user.create({
    data: { email: 'hostel@excel.com', password, firstName: 'James', lastName: 'Wilson', role: 'HOSTEL_MANAGER', isVerified: true, schoolId: school.id, gender: 'MALE' },
  });

  const receptionist = await prisma.user.create({
    data: { email: 'reception@excel.com', password, firstName: 'Mary', lastName: 'Taylor', role: 'RECEPTIONIST', isVerified: true, schoolId: school.id, gender: 'FEMALE' },
  });

  const teacher1User = await prisma.user.create({
    data: { email: 'teacher1@excel.com', password, firstName: 'Robert', lastName: 'Clark', role: 'TEACHER', isVerified: true, schoolId: school.id, gender: 'MALE' },
  });

  const teacher2User = await prisma.user.create({
    data: { email: 'teacher2@excel.com', password, firstName: 'Emily', lastName: 'Martinez', role: 'TEACHER', isVerified: true, schoolId: school.id, gender: 'FEMALE' },
  });

  const classTeacherUser = await prisma.user.create({
    data: { email: 'classteacher@excel.com', password, firstName: 'Daniel', lastName: 'Thompson', role: 'CLASS_TEACHER', isVerified: true, schoolId: school.id, gender: 'MALE' },
  });

  // Create Staff Profiles
  const principalStaff = await prisma.staffProfile.create({
    data: { userId: principal.id, staffNumber: 'STF001', department: 'Administration', qualification: 'PhD Education', dateEmployed: new Date('2020-01-15'), employmentType: 'FULL_TIME', basicSalary: 500000 },
  });

  const vpStaff = await prisma.staffProfile.create({
    data: { userId: vicePrincipal.id, staffNumber: 'STF002', department: 'Administration', qualification: 'M.Ed', dateEmployed: new Date('2020-02-01'), employmentType: 'FULL_TIME', basicSalary: 400000 },
  });

  await prisma.staffProfile.create({
    data: { userId: accountant.id, staffNumber: 'STF003', department: 'Finance', qualification: 'BSc Accounting', dateEmployed: new Date('2021-03-01'), employmentType: 'FULL_TIME', basicSalary: 250000 },
  });

  await prisma.staffProfile.create({
    data: { userId: librarian.id, staffNumber: 'STF004', department: 'Library', qualification: 'BLIS', dateEmployed: new Date('2021-04-01'), employmentType: 'FULL_TIME', basicSalary: 200000 },
  });

  await prisma.staffProfile.create({
    data: { userId: nurse.id, staffNumber: 'STF005', department: 'Clinic', qualification: 'BNSc', dateEmployed: new Date('2022-01-01'), employmentType: 'FULL_TIME', basicSalary: 220000 },
  });

  await prisma.staffProfile.create({
    data: { userId: hostelManager.id, staffNumber: 'STF006', department: 'Hostel', dateEmployed: new Date('2022-02-01'), employmentType: 'FULL_TIME', basicSalary: 180000 },
  });

  await prisma.staffProfile.create({
    data: { userId: receptionist.id, staffNumber: 'STF007', department: 'Front Office', dateEmployed: new Date('2023-01-01'), employmentType: 'FULL_TIME', basicSalary: 150000 },
  });

  const teacher1Staff = await prisma.staffProfile.create({
    data: { userId: teacher1User.id, staffNumber: 'STF008', department: 'Science', qualification: 'BSc Mathematics', specialization: 'Mathematics', dateEmployed: new Date('2021-09-01'), employmentType: 'FULL_TIME', basicSalary: 180000 },
  });

  const teacher2Staff = await prisma.staffProfile.create({
    data: { userId: teacher2User.id, staffNumber: 'STF009', department: 'English', qualification: 'BA English', specialization: 'English', dateEmployed: new Date('2021-09-01'), employmentType: 'FULL_TIME', basicSalary: 180000 },
  });

  const classTeacherStaff = await prisma.staffProfile.create({
    data: { userId: classTeacherUser.id, staffNumber: 'STF010', department: 'Science', qualification: 'BSc Biology', specialization: 'Biology', dateEmployed: new Date('2021-09-01'), employmentType: 'FULL_TIME', basicSalary: 180000, isClassTeacher: true },
  });

  // Create Classes
  const jss1 = await prisma.class.create({
    data: { name: 'JSS 1', code: 'JSS1', academicLevel: 1, schoolId: school.id },
  });

  const jss2 = await prisma.class.create({
    data: { name: 'JSS 2', code: 'JSS2', academicLevel: 2, schoolId: school.id },
  });

  const jss3 = await prisma.class.create({
    data: { name: 'JSS 3', code: 'JSS3', academicLevel: 3, schoolId: school.id },
  });

  const ss1 = await prisma.class.create({
    data: { name: 'SS 1', code: 'SS1', academicLevel: 4, schoolId: school.id },
  });

  const ss2 = await prisma.class.create({
    data: { name: 'SS 2', code: 'SS2', academicLevel: 5, schoolId: school.id },
  });

  const ss3 = await prisma.class.create({
    data: { name: 'SS 3', code: 'SS3', academicLevel: 6, schoolId: school.id },
  });

  // Create Arms
  const jss1A = await prisma.arm.create({ data: { name: 'A', code: 'JSS1A', classId: jss1.id } });
  const jss1B = await prisma.arm.create({ data: { name: 'B', code: 'JSS1B', classId: jss1.id } });
  const jss2A = await prisma.arm.create({ data: { name: 'A', code: 'JSS2A', classId: jss2.id } });
  const ss1A = await prisma.arm.create({ data: { name: 'A', code: 'SS1A', classId: ss1.id } });
  const ss2A = await prisma.arm.create({ data: { name: 'A', code: 'SS2A', classId: ss2.id } });
  const ss3A = await prisma.arm.create({ data: { name: 'A', code: 'SS3A', classId: ss3.id } });

  // Update class teacher arm
  await prisma.arm.update({ where: { id: jss1A.id }, data: { classTeacherId: classTeacherStaff.id } });

  // Create Subjects
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH', subjectType: 'CORE', creditUnit: 3, classId: jss1.id, teacherId: teacher1Staff.id, schoolId: school.id } }),
    prisma.subject.create({ data: { name: 'English Language', code: 'ENG', subjectType: 'CORE', creditUnit: 3, classId: jss1.id, teacherId: teacher2Staff.id, schoolId: school.id } }),
    prisma.subject.create({ data: { name: 'Basic Science', code: 'BSC', subjectType: 'CORE', creditUnit: 2, classId: jss1.id, teacherId: classTeacherStaff.id, schoolId: school.id } }),
    prisma.subject.create({ data: { name: 'Social Studies', code: 'SOS', subjectType: 'CORE', creditUnit: 2, classId: jss1.id, schoolId: school.id } }),
    prisma.subject.create({ data: { name: 'Civic Education', code: 'CIV', subjectType: 'CORE', creditUnit: 1, classId: jss1.id, schoolId: school.id } }),
    prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH2', subjectType: 'CORE', creditUnit: 3, classId: ss1.id, teacherId: teacher1Staff.id, schoolId: school.id } }),
    prisma.subject.create({ data: { name: 'English Language', code: 'ENG2', subjectType: 'CORE', creditUnit: 3, classId: ss1.id, teacherId: teacher2Staff.id, schoolId: school.id } }),
    prisma.subject.create({ data: { name: 'Physics', code: 'PHY', subjectType: 'CORE', creditUnit: 3, classId: ss1.id, schoolId: school.id } }),
    prisma.subject.create({ data: { name: 'Chemistry', code: 'CHM', subjectType: 'CORE', creditUnit: 3, classId: ss1.id, schoolId: school.id } }),
    prisma.subject.create({ data: { name: 'Biology', code: 'BIO', subjectType: 'CORE', creditUnit: 3, classId: ss1.id, teacherId: classTeacherStaff.id, schoolId: school.id } }),
  ]);

  // Create Students
  const studentData = [
    { firstName: 'Alice', lastName: 'Johnson', gender: 'FEMALE' as Gender, armId: jss1A.id, classId: jss1.id },
    { firstName: 'Bob', lastName: 'Smith', gender: 'MALE' as Gender, armId: jss1A.id, classId: jss1.id },
    { firstName: 'Carol', lastName: 'Williams', gender: 'FEMALE' as Gender, armId: jss1B.id, classId: jss1.id },
    { firstName: 'David', lastName: 'Brown', gender: 'MALE' as Gender, armId: jss1A.id, classId: jss1.id },
    { firstName: 'Eve', lastName: 'Davis', gender: 'FEMALE' as Gender, armId: jss2A.id, classId: jss2.id },
    { firstName: 'Frank', lastName: 'Miller', gender: 'MALE' as Gender, armId: jss2A.id, classId: jss2.id },
    { firstName: 'Grace', lastName: 'Wilson', gender: 'FEMALE' as Gender, armId: ss1A.id, classId: ss1.id },
    { firstName: 'Henry', lastName: 'Moore', gender: 'MALE' as Gender, armId: ss1A.id, classId: ss1.id },
    { firstName: 'Ivy', lastName: 'Taylor', gender: 'FEMALE' as Gender, armId: ss2A.id, classId: ss2.id },
    { firstName: 'Jack', lastName: 'Anderson', gender: 'MALE' as Gender, armId: ss3A.id, classId: ss3.id },
  ];

  const students = [];
  for (let i = 0; i < studentData.length; i++) {
    const s = studentData[i];
    const user = await prisma.user.create({
      data: {
        email: `student${i + 1}@excel.com`,
        password,
        firstName: s.firstName,
        lastName: s.lastName,
        role: 'STUDENT',
        gender: s.gender,
        isVerified: true,
        schoolId: school.id,
      },
    });

    const student = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        admissionNumber: `STU${String(i + 1).padStart(5, '0')}`,
        currentClassId: s.classId,
        currentArmId: s.armId,
        enrollmentStatus: 'ACTIVE',
        session: '2024/2025',
        nationality: 'Nigerian',
      },
    });

    students.push(student);
  }

  console.log(`Created ${students.length} students`);

  // Create Parent
  const parentUser = await prisma.user.create({
    data: { email: 'parent@excel.com', password, firstName: 'Parent', lastName: 'Johnson', role: 'PARENT', isVerified: true, schoolId: school.id },
  });

  const parent = await prisma.parentProfile.create({
    data: { userId: parentUser.id, occupation: 'Engineer', relationship: 'Father' },
  });

  // Link parent to first student
  await prisma.studentProfile.update({
    where: { id: students[0].id },
    data: { guardianId: parent.id },
  });

  // Create Timetables
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    { start: '08:00', end: '08:45' },
    { start: '08:45', end: '09:30' },
    { start: '09:30', end: '10:15' },
    { start: '10:30', end: '11:15' },
    { start: '11:15', end: '12:00' },
    { start: '12:45', end: '13:30' },
    { start: '13:30', end: '14:15' },
  ];

  const jss1Subjects = await prisma.subject.findMany({ where: { classId: jss1.id } });
  for (let day = 0; day < 5; day++) {
    for (let p = 0; p < 5; p++) {
      const subjectIndex = (day * 5 + p) % jss1Subjects.length;
      await prisma.timetable.create({
        data: {
          classId: jss1.id,
          armId: jss1A.id,
          dayOfWeek: day + 1,
          startTime: periods[p].start,
          endTime: periods[p].end,
          subjectId: jss1Subjects[subjectIndex].id,
          teacherId: jss1Subjects[subjectIndex].teacherId || teacher1Staff.id,
          room: `Room ${101 + p}`,
        },
      });
    }
  }

  // Create Lesson Notes
  await prisma.lessonNote.create({
    data: {
      subjectId: subjects[0].id,
      teacherId: teacher1Staff.id,
      classId: jss1.id,
      topic: 'Introduction to Algebra',
      objectives: 'Understand variables, expressions, and equations',
      content: '<p>Algebra is a branch of mathematics that uses symbols to represent numbers.</p><p>Variables are symbols that represent unknown values.</p>',
      week: 1,
      term: 'First',
      session: '2024/2025',
    },
  });

  // Create Homework
  const homework = await prisma.homework.create({
    data: {
      subjectId: subjects[0].id,
      teacherId: teacher1Staff.id,
      classId: jss1.id,
      armId: jss1A.id,
      title: 'Algebra Practice Problems',
      description: 'Solve the following algebraic equations: 1) 2x + 5 = 15, 2) 3y - 7 = 14, 3) 4z + 2 = 22',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 30,
    },
  });

  // Create Homework Submissions
  await prisma.homeworkSubmission.create({
    data: {
      homeworkId: homework.id,
      studentId: students[0].id,
      content: '1) x = 5, 2) y = 7, 3) z = 5',
      submittedAt: new Date(),
    },
  });

  // Create Exams
  const exam = await prisma.exam.create({
    data: {
      title: 'First Term Examination',
      examType: 'END_TERM',
      subjectId: subjects[0].id,
      classId: jss1.id,
      armId: jss1A.id,
      term: 'First',
      session: '2024/2025',
      duration: 120,
      totalMarks: 100,
      isCbt: true,
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-15'),
    },
  });

  // Create Exam Questions (CBT)
  const questions = [
    { text: 'What is the value of x in 2x + 5 = 15?', options: ['5', '10', '7.5', '20'], answer: '5' },
    { text: 'What is the square root of 144?', options: ['10', '11', '12', '13'], answer: '12' },
    { text: 'Which of these is a prime number?', options: ['4', '9', '11', '15'], answer: '11' },
    { text: 'What is 15% of 200?', options: ['20', '25', '30', '35'], answer: '30' },
    { text: 'What is the area of a rectangle with length 5 and width 3?', options: ['8', '15', '16', '10'], answer: '15' },
  ];

  for (const q of questions) {
    await prisma.examQuestion.create({
      data: {
        examId: exam.id,
        teacherId: teacher1Staff.id,
        questionText: q.text,
        questionType: 'MULTIPLE_CHOICE',
        options: q.options,
        correctAnswer: q.answer,
        marks: 5,
      },
    });
  }

  // Create Results
  for (let i = 0; i < students.length; i++) {
    const score = Math.floor(Math.random() * 30) + 70;
    await prisma.result.create({
      data: {
        studentId: students[i].id,
        examId: exam.id,
        subjectId: subjects[0].id,
        classId: jss1.id,
        score,
        grade: score >= 70 ? 'A' : score >= 60 ? 'B' : 'C',
        point: score >= 70 ? 5 : score >= 60 ? 4 : 3,
        term: 'First',
        session: '2024/2025',
        isPublished: true,
      },
    });
  }

  // Create Attendance records
  const today = new Date();
  for (let day = 0; day < 20; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const student of students.slice(0, 4)) {
      const status: AttendanceStatus = Math.random() > 0.85 ? 'ABSENT' : Math.random() > 0.7 ? 'LATE' : 'PRESENT';
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          date,
          status,
          markedBy: teacher1Staff.id,
          classId: jss1.id,
          armId: jss1A.id,
        },
      });
    }
  }

  // Create Fee Structures
  const feeStructure = await prisma.feeStructure.create({
    data: {
      name: 'First Term Tuition',
      classId: jss1.id,
      amount: 150000,
      term: 'First',
      session: '2024/2025',
      dueDate: new Date('2024-09-30'),
      category: 'TUITION',
      isCompulsory: true,
      schoolId: school.id,
    },
  });

  // Create Fee Payments
  for (const student of students.slice(0, 3)) {
    await prisma.feePayment.create({
      data: {
        studentId: student.id,
        feeStructureId: feeStructure.id,
        amount: 150000,
        paidAmount: 150000,
        balance: 0,
        status: 'PAID',
        paymentMethod: 'TRANSFER',
        transactionRef: `TXN${Date.now()}`,
        paidAt: new Date('2024-09-15'),
        receiptNo: `RCPT${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
      },
    });
  }

  // Create partial payment
  await prisma.feePayment.create({
    data: {
      studentId: students[3].id,
      feeStructureId: feeStructure.id,
      amount: 150000,
      paidAmount: 75000,
      balance: 75000,
      status: 'PARTIAL',
      paymentMethod: 'CASH',
      paidAt: new Date(),
    },
  });

  // Create Expenses
  await prisma.expense.create({
    data: {
      title: 'Electricity Bill',
      amount: 250000,
      category: 'UTILITIES',
      paymentMethod: 'TRANSFER',
      paidTo: 'PHCN',
      approvedBy: principalStaff.id,
      date: new Date('2024-09-01'),
      schoolId: school.id,
    },
  });

  await prisma.expense.create({
    data: {
      title: 'Office Supplies',
      amount: 85000,
      category: 'SUPPLIES',
      paymentMethod: 'CASH',
      paidTo: 'Staples Ltd',
      approvedBy: vpStaff.id,
      date: new Date('2024-09-05'),
      schoolId: school.id,
    },
  });

  // Create Books
  const books = [
    { title: 'Mathematics for JSS 1', author: 'John Smith', isbn: '978-0-1234-5678-1', quantity: 50, category: 'Textbook' },
    { title: 'English Language for JSS 1', author: 'Jane Doe', isbn: '978-0-1234-5678-2', quantity: 45, category: 'Textbook' },
    { title: 'Basic Science for JSS 1', author: 'Dr. Brown', isbn: '978-0-1234-5678-3', quantity: 40, category: 'Textbook' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-0611-2008-4', quantity: 10, category: 'Fiction' },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5', quantity: 8, category: 'Fiction' },
  ];

  for (const book of books) {
    await prisma.book.create({
      data: { ...book, available: book.quantity, schoolId: school.id },
    });
  }

  // Create Book Borrows
  const mathBook = await prisma.book.findFirst({ where: { isbn: '978-0-1234-5678-1' } });
  if (mathBook) {
    await prisma.bookBorrow.create({
      data: {
        bookId: mathBook.id,
        studentId: students[0].id,
        borrowDate: new Date('2024-09-10'),
        dueDate: new Date('2024-09-24'),
        isReturned: false,
      },
    });
  }

  // Create Hostel
  const boysHostel = await prisma.hostel.create({
    data: { name: 'Boys Hostel', gender: 'MALE', capacity: 100, schoolId: school.id },
  });

  const girlsHostel = await prisma.hostel.create({
    data: { name: 'Girls Hostel', gender: 'FEMALE', capacity: 80, schoolId: school.id },
  });

  const room1 = await prisma.hostelRoom.create({
    data: { hostelId: boysHostel.id, roomNo: 'B101', capacity: 4, bedCount: 4, price: 50000 },
  });

  const room2 = await prisma.hostelRoom.create({
    data: { hostelId: boysHostel.id, roomNo: 'B102', capacity: 4, bedCount: 4, price: 50000 },
  });

  // Hostel Allocations
  await prisma.hostelAllocation.create({
    data: { studentId: students[1].id, hostelId: boysHostel.id, roomId: room1.id, bedNo: 'B101-1', isActive: true },
  });

  await prisma.hostelAllocation.create({
    data: { studentId: students[3].id, hostelId: boysHostel.id, roomId: room1.id, bedNo: 'B101-2', isActive: true },
  });

  // Create Vehicle
  await prisma.vehicle.create({
    data: { registrationNo: 'LAG-123-XYZ', model: 'Toyota Hiace', capacity: 18, driverName: 'Musa Ibrahim', driverPhone: '+234-802-123-4567', route: 'Lekki Phase 1', schoolId: school.id },
  });

  // Create Inventory
  await prisma.inventory.create({
    data: { name: 'Whiteboard Markers', quantity: 200, unitPrice: 500, category: 'Stationery', schoolId: school.id, minStock: 50 },
  });

  await prisma.inventory.create({
    data: { name: 'Exercise Books (80 leaves)', quantity: 1000, unitPrice: 300, category: 'Stationery', schoolId: school.id, minStock: 200 },
  });

  // Create Supplier
  await prisma.supplier.create({
    data: { name: 'EduSupplies Ltd', contact: 'Mr. Ade', phone: '+234-803-456-7890', email: 'ade@edusupplies.com', address: 'Ikeja, Lagos', schoolId: school.id },
  });

  // Create Messages
  await prisma.message.create({
    data: { senderId: principal.id, receiverId: teacher1User.id, subject: 'Staff Meeting', body: 'There will be a staff meeting on Friday at 2pm in the conference room.' },
  });

  // Create Notifications
  await prisma.notification.create({
    data: { userId: principal.id, title: 'New Admission', message: 'A new student has been admitted.', type: 'INFO' },
  });

  await prisma.notification.create({
    data: { userId: teacher1User.id, title: 'Homework Due', message: 'Homework submissions are due tomorrow.', type: 'REMINDER' },
  });

  // Create Leave Requests
  await prisma.leaveRequest.create({
    data: { staffId: teacher1Staff.id, userId: teacher1User.id, leaveType: 'ANNUAL', startDate: new Date('2024-12-20'), endDate: new Date('2024-12-31'), reason: 'Christmas break', status: 'APPROVED', approvedBy: principalStaff.id },
  });

  // Create Payroll for current month
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const staffMembers = await prisma.staffProfile.findMany({ where: { basicSalary: { not: null } } });
  for (const staff of staffMembers) {
    const user = await prisma.user.findUnique({ where: { id: staff.userId } });
    if (user) {
      await prisma.payroll.create({
        data: {
          staffId: staff.id,
          userId: user.id,
          basicSalary: staff.basicSalary || 0,
          allowances: staff.basicSalary ? Math.round(staff.basicSalary * 0.2) : 0,
          deductions: staff.basicSalary ? Math.round(staff.basicSalary * 0.1) : 0,
          netSalary: staff.basicSalary ? Math.round(staff.basicSalary * 1.1) : 0,
          month: currentMonth,
          year: currentYear,
          status: 'PAID',
          paidAt: new Date(),
          schoolId: school.id,
        },
      });
    }
  }

  // Create Medical Record
  await prisma.medicalRecord.create({
    data: { studentId: students[0].id, diagnosis: 'Malaria', treatment: 'Artemether-Lumefantrine', medication: 'ACT 80/480', treatedBy: 'Nurse Davis', notes: 'Patient responding well to treatment' },
  });

  // Create Student Document
  await prisma.studentDocument.create({
    data: { studentId: students[0].id, name: 'Birth Certificate', type: 'application/pdf', url: '/uploads/sample-birth-cert.pdf', fileSize: 245760 },
  });

  console.log('Seed completed successfully!');
  console.log('\nLogin Credentials:');
  console.log('  Super Admin: admin@sms.com / Password123!');
  console.log('  Principal: principal@excel.com / Password123!');
  console.log('  Teacher: teacher1@excel.com / Password123!');
  console.log('  Student: student1@excel.com / Password123!');
  console.log('  Parent: parent@excel.com / Password123!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
