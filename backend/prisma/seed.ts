import { PrismaClient, Role, SessionStatus, AttendanceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  await prisma.studentBadge.deleteMany();
  await prisma.badgeRule.deleteMany();
  await prisma.catchupPackage.deleteMany();
  await prisma.material.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.lecturerProfile.deleteMany();
  await prisma.user.deleteMany();

  const studentHash = await bcrypt.hash('Student123!', 10);
  const lecturerHash = await bcrypt.hash('Lecturer123!', 10);

  const annaUser = await prisma.user.create({
    data: { email: 'anna@uni.demo', passwordHash: studentHash, firstName: 'Anna', lastName: 'Petrova', role: Role.STUDENT,
      student: { create: { facultyNumber: 'F12345', program: 'Software Engineering', year: 4 } } }
  });
  const borisUser = await prisma.user.create({
    data: { email: 'boris@uni.demo', passwordHash: studentHash, firstName: 'Boris', lastName: 'Ivanov', role: Role.STUDENT,
      student: { create: { facultyNumber: 'F12346', program: 'Software Engineering', year: 4 } } }
  });
  const additionalStudents = [
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
  ];
  const additionalStudentUsers = await Promise.all(additionalStudents.map(([firstName, lastName, email, facultyNumber]) =>
    prisma.user.create({
      data: {
        email: `${email}@uni.demo`, passwordHash: studentHash, firstName, lastName, role: Role.STUDENT,
        student: { create: { facultyNumber, program: 'Софтуерно инженерство', year: 1 } },
      },
    })
  ));
  const lecturerUser = await prisma.user.create({
    data: { email: 'lecturer@uni.demo', passwordHash: lecturerHash, firstName: 'Elena', lastName: 'Ivanova', role: Role.LECTURER,
      lecturer: { create: { title: 'Assoc. Prof.' } } }
  });

  const anna = await prisma.studentProfile.findUniqueOrThrow({ where: { userId: annaUser.id } });
  const boris = await prisma.studentProfile.findUniqueOrThrow({ where: { userId: borisUser.id } });
  const additionalStudentProfiles = await Promise.all(additionalStudentUsers.map((student) =>
    prisma.studentProfile.findUniqueOrThrow({ where: { userId: student.id } })
  ));
  const allStudents = [anna, boris, ...additionalStudentProfiles];
  const lecturer = await prisma.lecturerProfile.findUniqueOrThrow({ where: { userId: lecturerUser.id } });

  const course = await prisma.course.create({
    data: {
      code: 'SA101', name: 'Софтуерна архитектура', description: 'Архитектурни шаблони, слоеве, MVC/MVVM, услуги и компромиси.',
      lecturerId: lecturer.id, requiredSessions: 5,
      badgeRules: { create: { name: 'Perfect Attendance', description: 'Attended all five required exercises.', benefit: 'One optional exam question may be skipped.', requiredPresent: 5 } }
    }
  });
  await prisma.enrollment.createMany({
    data: [
      { studentId: anna.id, courseId: course.id },
      { studentId: boris.id, courseId: course.id },
      ...additionalStudentProfiles.map((student) => ({ studentId: student.id, courseId: course.id })),
    ],
  });

  const titles = ['Layered Architecture', 'MVC', 'MVVM', 'Repository Pattern', 'Microservices Basics'];
  const sessions = [];
  for (let i = 0; i < 5; i++) {
    const start = i < 4 ? days(-28 + i * 7) : new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    sessions.push(await prisma.classSession.create({
      data: { courseId: course.id, title: titles[i], startsAt: start, endsAt: end, room: 'Lab 301', status: i < 4 ? SessionStatus.CLOSED : SessionStatus.PLANNED }
    }));
  }

  for (let i = 0; i < 4; i++) {
    for (let studentIndex = 0; studentIndex < allStudents.length; studentIndex++) {
      const student = allStudents[studentIndex];
      const absent = student === boris ? i === 3 : studentIndex > 1 && (studentIndex + i) % 5 === 0;
      await prisma.attendanceRecord.create({
        data: {
          studentId: student.id,
          sessionId: sessions[i].id,
          status: absent ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT,
          checkedAt: absent ? null : sessions[i].startsAt,
        },
      });
    }
  }

  const uploadDir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const material4 = path.join(uploadDir, 'repository-pattern.md');
  const material5 = path.join(uploadDir, 'microservices-basics.md');
  fs.writeFileSync(material4, '# Repository Pattern\nThe Repository pattern separates domain logic from persistence details. A repository exposes collection-like operations while hiding database-specific queries. Benefits include testability and separation of concerns; drawbacks include unnecessary abstraction in very simple systems.');
  fs.writeFileSync(material5, '# Microservices Basics\nA microservice architecture structures an application as independently deployable services around business capabilities. Each service owns its data and communicates through explicit APIs or messaging. Benefits include independent deployment and scaling. Costs include distributed-system complexity, observability, network failures, data consistency and operational overhead.');
  await prisma.material.create({ data: { sessionId: sessions[3].id, title: 'Repository Pattern Notes', fileName: 'repository-pattern.md', mimeType: 'text/markdown', localPath: material4 } });
  await prisma.material.create({ data: { sessionId: sessions[4].id, title: 'Microservices Basics Notes', fileName: 'microservices-basics.md', mimeType: 'text/markdown', localPath: material5 } });

  await prisma.catchupPackage.create({ data: {
    studentId: boris.id, sessionId: sessions[3].id, title: 'Smart Catch-up: Repository Pattern',
    summary: 'The Repository pattern separates domain logic from persistence. It gives the application a collection-like interface and hides database-specific details, which can improve testability and separation of concerns.',
    keyConcepts: ['Repository abstraction', 'Persistence isolation', 'Testability', 'Separation of concerns'],
    quiz: [
      { question: 'What does a Repository primarily hide?', options: ['Persistence details', 'UI colors', 'HTTP status codes', 'Passwords'], correctIndex: 0, explanation: 'It abstracts the data-access implementation.' },
      { question: 'A common benefit is?', options: ['Testability', 'More coupling', 'No database', 'No domain model'], correctIndex: 0, explanation: 'Repositories can make domain code easier to test.' },
      { question: 'Repository exposes an interface similar to?', options: ['A collection', 'A CSS file', 'A DNS server', 'A compiler'], correctIndex: 0, explanation: 'Collection-like methods are typical.' },
      { question: 'Which concern is separated?', options: ['Domain and persistence', 'Keyboard and mouse', 'CPU and RAM', 'Email and calendar'], correctIndex: 0, explanation: 'The pattern separates domain logic from persistence details.' },
      { question: 'Possible drawback?', options: ['Unnecessary abstraction', 'Guaranteed data loss', 'No testing', 'No API'], correctIndex: 0, explanation: 'Simple systems may not need the extra abstraction.' }
    ]
  }});

  console.log('Seed complete.');
  console.log('Student: anna@uni.demo / Student123!');
  console.log('Student: boris@uni.demo / Student123!');
  console.log('Lecturer: lecturer@uni.demo / Lecturer123!');
  console.log(`Final demo session ID: ${sessions[4].id}`);
}

main().finally(() => prisma.$disconnect());
