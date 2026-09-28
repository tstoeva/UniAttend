// Демо данни (npm run prisma:seed). Изтрива всички съществуващи данни.
import { PrismaClient, Role, SessionStatus, AttendanceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  // Останалите таблици се изтриват каскадно
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // Потребители
  const studentHash = await bcrypt.hash('Student123!', 10);
  const lecturerHash = await bcrypt.hash('Lecturer123!', 10);
  const createStudent = (firstName: string, lastName: string, email: string, profile: { facultyNumber: string; program: string; year: number; rfidUid?: string }) =>
    prisma.user
      .create({ data: { email, passwordHash: studentHash, firstName, lastName, role: Role.STUDENT, student: { create: profile } }, include: { student: true } })
      .then((user) => user.student!);

  const anna = await createStudent('Анна', 'Петрова', 'anna@uni.demo', { facultyNumber: 'F12345', program: 'Софтуерно инженерство', year: 1, rfidUid: 'EA972406' });
  const boris = await createStudent('Борис', 'Иванов', 'boris@uni.demo', { facultyNumber: 'F12346', program: 'Софтуерно инженерство', year: 1 });
  const others = await Promise.all([
    ['Георги', 'Георгиев', 'georgi.georgiev', 'F12347'],
    ['Виктория', 'Димитрова', 'viktoria.dimitrova', 'F12348'],
    ['Николай', 'Николов', 'nikolay.nikolov', 'F12349'],
    ['Елена', 'Петрова', 'elena.petrova', 'F12350'],
    ['Мартин', 'Стоянов', 'martin.stoyanov', 'F12351'],
    ['Мария', 'Иванова', 'maria.ivanova', 'F12352'],
    ['Александър', 'Тодоров', 'aleksandar.todorov', 'F12353'],
    ['София', 'Костова', 'sofia.kostova', 'F12354'],
    ['Даниел', 'Христов', 'daniel.hristov', 'F12355'],
    ['Ива', 'Попова', 'iva.popova', 'F12356'],
    ['Калоян', 'Василев', 'kaloyan.vasilev', 'F12357'],
    ['Ралица', 'Ганева', 'ralitsa.ganeva', 'F12358'],
    ['Стефан', 'Михайлов', 'stefan.mihaylov', 'F12359'],
  ].map(([firstName, lastName, login, facultyNumber]) =>
    createStudent(firstName, lastName, `${login}@uni.demo`, { facultyNumber, program: 'Софтуерно инженерство', year: 1 })));
  const allStudents = [anna, boris, ...others];

  const lecturer = await prisma.user
    .create({
      data: { email: 'lecturer@uni.demo', passwordHash: lecturerHash, firstName: 'Мария', lastName: 'Петрова', role: Role.LECTURER, lecturer: { create: { title: 'Проф. д-р' } } },
      include: { lecturer: true },
    })
    .then((user) => user.lecturer!);

  // Курс SA101 с всички студенти
  const course = await prisma.course.create({
    data: {
      code: 'SA101', name: 'Софтуерна архитектура', description: 'Архитектурни шаблони, слоеве, MVC/MVVM, услуги и компромиси.',
      lecturerId: lecturer.id, requiredSessions: 5,
      badgeRules: { create: { name: 'Perfect Attendance', description: 'Attended all five required exercises.', benefit: 'One optional exam question may be skipped.', requiredPresent: 5 } },
    },
  });
  await prisma.enrollment.createMany({ data: allStudents.map((student) => ({ studentId: student.id, courseId: course.id })) });

  // 5 лекции по 90 мин: 3 минали (CLOSED) и 2 предстоящи (PLANNED) – днес след 1 час и след седмица
  const titles = ['Layered Architecture', 'MVC', 'MVVM', 'Repository Pattern', 'Microservices Basics'];
  const sessions = [];
  for (let i = 0; i < 5; i++) {
    const startsAt = i < 3 ? days(-28 + i * 7) : i === 3 ? new Date(Date.now() + 60 * 60 * 1000) : days(7);
    const status = i < 3 ? SessionStatus.CLOSED : SessionStatus.PLANNED;
    sessions.push(await prisma.classSession.create({
      data: { courseId: course.id, title: titles[i], startsAt, endsAt: new Date(startsAt.getTime() + 90 * 60 * 1000), room: 'Lab 301', status },
    }));
  }

  // Присъствия за миналите лекции: Борис отсъства на MVVM, част от останалите – по формула
  for (let i = 0; i < 3; i++) {
    for (const [index, student] of allStudents.entries()) {
      const absent = student === boris ? i === 2 : index > 1 && (index + i) % 5 === 0;
      await prisma.attendanceRecord.create({
        data: { studentId: student.id, sessionId: sessions[i].id, status: absent ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT, checkedAt: absent ? null : sessions[i].startsAt },
      });
    }
  }

  // Материали за лекции 4 и 5 (backend/uploads)
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const materials = [
    { session: sessions[3], title: 'Repository Pattern Notes', fileName: 'repository-pattern.md', text: '# Repository Pattern\nThe Repository pattern separates domain logic from persistence details. A repository exposes collection-like operations while hiding database-specific queries. Benefits include testability and separation of concerns; drawbacks include unnecessary abstraction in very simple systems.' },
    { session: sessions[4], title: 'Microservices Basics Notes', fileName: 'microservices-basics.md', text: '# Microservices Basics\nA microservice architecture structures an application as independently deployable services around business capabilities. Each service owns its data and communicates through explicit APIs or messaging. Benefits include independent deployment and scaling. Costs include distributed-system complexity, observability, network failures, data consistency and operational overhead.' },
  ];
  for (const material of materials) {
    const localPath = path.join(uploadDir, material.fileName);
    fs.writeFileSync(localPath, material.text);
    await prisma.material.create({ data: { sessionId: material.session.id, title: material.title, fileName: material.fileName, mimeType: 'text/markdown', localPath } });
  }

  // Готов Smart Catch-up за Борис (MVVM)
  await prisma.catchupPackage.create({ data: {
    studentId: boris.id, sessionId: sessions[2].id, title: 'Smart Catch-up: MVVM',
    summary: 'MVVM (Model–View–ViewModel) separates the user interface from the presentation logic. The View only displays data and binds to properties and commands of the ViewModel, while the Model holds the data and business rules. This makes the UI logic testable without the UI.',
    keyConcepts: ['Model', 'View', 'ViewModel', 'Data binding'],
    quiz: [
      { question: 'What does the ViewModel contain?', options: ['Presentation logic and UI state', 'Only CSS styles', 'The database schema', 'Network drivers'], correctIndex: 0, explanation: 'The ViewModel exposes the data and commands that the View needs.' },
      { question: 'How does the View usually get data from the ViewModel?', options: ['Data binding', 'Direct SQL queries', 'E-mail', 'Copying files'], correctIndex: 0, explanation: 'Bindings keep the View in sync with the ViewModel automatically.' },
      { question: 'Which part holds the business data and rules?', options: ['Model', 'View', 'Router', 'Compiler'], correctIndex: 0, explanation: 'The Model represents the data and the business rules.' },
      { question: 'A main benefit of MVVM is?', options: ['UI logic can be tested without the UI', 'No database is needed', 'A faster CPU', 'No code is needed'], correctIndex: 0, explanation: 'Logic in the ViewModel can be unit-tested without rendering the View.' },
      { question: 'MVVM is most common in?', options: ['UI frameworks with data binding', 'Operating system kernels', 'Network routers', 'Compilers'], correctIndex: 0, explanation: 'MVVM relies on the binding support of UI frameworks.' }
    ]
  }});

  console.log('Seed complete.');
  console.log('Student: anna@uni.demo / Student123!');
  console.log('Student: boris@uni.demo / Student123!');
  console.log('Lecturer: lecturer@uni.demo / Lecturer123!');
  console.log(`Lecture 4 (Repository Pattern) session ID: ${sessions[3].id}`); // за --session на RFID моста
  console.log(`Lecture 5 (Microservices Basics) session ID: ${sessions[4].id}`);
}

main().finally(() => prisma.$disconnect());
