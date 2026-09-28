import { ReactNode, useEffect, useState } from 'react';
import { api, lecturerName, logout } from '../api';
import { CatchupCard } from '../components/CatchupCard';
import { DemoSubject, LessonStatus, demoCatchups, demoGrades, demoSubjects } from '../demoData';

// Табове на портала
const tabs = [
  { id: 'personal', label: 'Лична информация' },
  { id: 'subjects', label: 'Предмети и оценки' },
  { id: 'attendance', label: 'Присъствия' },
  { id: 'card', label: 'Карта за присъствие' },
];

// От API: профил, лекции и присъствия по SA101 и Smart Catch-up; останалото е демо (demoData.ts)
export function StudentPage() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null); // id на натиснатата лекция
  const [selectedExercise, setSelectedExercise] = useState<{ subjectId: string; index: number } | null>(null); // натиснато пропуснато упражнение
  const [modalSubjectId, setModalSubjectId] = useState<string | null>(null); // отворен прозорец „Пълно присъствие“

  // Зарежда данните от API
  async function load() {
    const response = await api.get('/student/dashboard');
    setData(response.data);
  }
  useEffect(() => { load(); }, []);

  // Докато се зареждат данните
  if (!data) return <main className="shell"><div className="card loading-card">Зареждане на студентския портал…</div></main>;

  // Профил и предмети (демо предмети + реалните лекции по SA101)
  const student = data.student;
  const name = `${student.user.firstName} ${student.user.lastName}`;
  const subjects = demoSubjects.map((subject) => withLiveSessions(subject, data.courses || [], data.catchups || []));
  const badgeCount = subjects.filter(hasFullAttendance).length; // по една значка за всеки предмет с ✓

  // Избор на лекция (повторно натискане отменя избора)
  function toggleLecture(slotId: string) {
    setSelectedLecture((current) => (current === slotId ? null : slotId));
  }

  // Отварят се само пропуснатите упражнения; повторно натискане затваря
  function toggleExercise(subjectId: string, index: number, status: LessonStatus) {
    setSelectedExercise((current) =>
      status !== 'missed' || (current?.subjectId === subjectId && current.index === index) ? null : { subjectId, index });
  }

  // Карта на един предмет в таб „Присъствия“
  function renderSubject(subject: DemoSubject) {
    // Smart Catch-up пакети за предмета
    const catchups = [
      ...(data.catchups || []).filter((item: any) => item.session?.course?.code === subject.courseCode), // от сървъра
      ...demoCatchups.filter((item) => item.courseCode === subject.courseCode), // демо
    ];
    // Броячи за лекциите и упражненията
    const presentCount = subject.slots.filter((slot) => slot.status === 'present').length;
    const missedCount = subject.slots.filter((slot) => slot.status === 'missed').length;
    const summarySlot = subject.slots.find((slot) => slot.id === selectedLecture && slot.status === 'missed' && slot.aiSummary); // резюме само за пропусната лекция
    const exercisesDone = subject.exerciseSlots.filter((status) => status === 'present').length;
    const certified = subject.exerciseSlots.every((status) => status !== 'missed'); // заверка = без пропуснато упражнение (предстоящите не се броят)

    return (
      <div key={subject.id} className="attendance-item">
        {/* Заглавие на предмета и брой лекции */}
        <div className="attendance-heading">
          <div>
            <h3>{subject.courseName}</h3>
            <small>{subject.courseCode} · {subject.semester}</small>
          </div>
          <div className="lecture-status-top">
            {hasFullAttendance(subject) && (
              <button type="button" className="full-attendance-check" aria-label="Пълно присъствие" onClick={() => setModalSubjectId(subject.id)}>✓</button>
            )}
            <div className="attendance-badge-row">
              <span className="mini-badge success">{presentCount}/{subject.slots.length} лекции</span>
              <span className="mini-badge danger">{missedCount} липсващи</span>
            </div>
          </div>
        </div>

        {/* Прозорец „Пълно присъствие“ */}
        {modalSubjectId === subject.id && (
          <div className="attendance-modal-backdrop" onClick={() => setModalSubjectId(null)}>
            <div className="attendance-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
              <button type="button" className="attendance-modal-close" onClick={() => setModalSubjectId(null)} aria-label="Затвори">×</button>
              <div className="attendance-modal-icon">✓</div>
              <h3>Пълно присъствие на лекции</h3>
              <p>{subject.courseName}</p>
            </div>
          </div>
        )}

        {/* Лекции */}
        <div className="session-grid" aria-label={`Лекции за ${subject.courseName}`}>
          {subject.slots.map((slot, index) => (
            <SessionBox key={slot.id} number={index + 1} status={slot.status} title={`${index + 1}. ${slot.title}`}
              selected={selectedLecture === slot.id} onClick={() => toggleLecture(slot.id)} />
          ))}
        </div>

        {/* Кой води лекциите */}
        <div className="attendance-meta-row">
          <span>Лекции: {subject.lecturer}</span>
          <span>{subject.slots.length} лекции</span>
        </div>

        {/* Упражнения и отработване */}
        <div className="attendance-row exercise-row">
          <div>
            <strong>Упражнения</strong>
            <small className={certified ? 'exercise-complete' : 'exercise-warning'}>{certified ? 'Заверена' : 'Без заверка'}</small>
          </div>
          <strong>{exercisesDone}/{subject.exerciseSlots.length}</strong>
          <div>
            <div className="session-grid exercise-session-grid" aria-label={`Упражнения за ${subject.courseName}`}>
              {subject.exerciseSlots.map((status, index) => (
                <SessionBox key={`${subject.id}-exercise-${index + 1}`} number={index + 1} status={status} title={`${index + 1}. упражнение`}
                  selected={selectedExercise?.subjectId === subject.id && selectedExercise.index === index}
                  onClick={() => toggleExercise(subject.id, index, status)} />
              ))}
            </div>
            {selectedExercise?.subjectId === subject.id && (
              <div className="exercise-catchup">
                <strong>Възможност за отработване</strong>
                <p>{subject.catchupInfo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Кой води упражненията */}
        <div className="attendance-meta-row">
          <span>Упражнения: {subject.assistant}</span>
          <span>{subject.exerciseSlots.length} упражнения</span>
        </div>

        {/* AI резюме на пропусната лекция */}
        {summarySlot && (
          <div className="summary-box">
            <div className="summary-header">
              <div>
                <p className="eyebrow">AI резюме</p>
                <h3>{summarySlot.title}</h3>
              </div>
              <span className="summary-status missed">Пропусната лекция</span>
            </div>
            <p>{summarySlot.aiSummary}</p>
          </div>
        )}
        {/* Smart Catch-up пакети */}
        {catchups.length > 0 && (
          <div className="catchup-wrap">
            <h3>Smart Catch-up</h3>
            {catchups.map((item: any) => <CatchupCard key={item.id} item={item} onDone={load} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="shell">
      {/* Горна лента */}
      <header className="topbar">
        <div className="brand">UniAttend</div>
        <button className="secondary" onClick={logout}>Изход</button>
      </header>

      {/* Име, специалност и значки */}
      <section className="hero student-hero">
        <div>
          <div className="eyebrow">ДОБЪР ДЕН</div>
          <h1>{name}</h1>
          <p>{student.program} · {student.facultyNumber}</p>
        </div>
        <div className="score">
          <strong>{badgeCount}</strong>
          <span>активни значки</span>
        </div>
      </section>

      {/* Табове */}
      <nav className="tab-bar" aria-label="Секции на студентския портал">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? 'tab-button active' : 'tab-button'} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Съдържание на избрания таб */}
      {activeTab === 'personal' && <PersonalTab student={student} name={name} />}
      {activeTab === 'subjects' && <SubjectsTab />}
      {activeTab === 'attendance' && (
        <Panel eyebrow="Присъствия" title="Текущ семестър" badge="Само текущи предмети" badgeClass="status-warning">
          <div className="attendance-list">{subjects.map(renderSubject)}</div>
        </Panel>
      )}
      {activeTab === 'card' && <CardTab student={student} name={name} />}
    </main>
  );
}

// Лекциите и лекторът на курса със същия код (SA101) идват от API:
// присъствал → present, PLANNED → upcoming, иначе → missed; резюмето е от Smart Catch-up пакета на лекцията
function withLiveSessions(subject: DemoSubject, courses: any[], catchups: any[]): DemoSubject {
  const course = courses.find((item) => item.code === subject.courseCode);
  if (!course) return subject;
  const sessions = [...(course.sessions || [])].sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const slots = subject.slots.map((slot, index) => {
    const session = sessions[index];
    if (!session) return slot;
    const status: LessonStatus = session.attendance?.[0]?.status === 'PRESENT' ? 'present' : session.status === 'PLANNED' ? 'upcoming' : 'missed';
    const catchup = catchups.find((item) => item.sessionId === session.id);
    return { ...slot, title: session.title, status, aiSummary: catchup?.summary ?? '' };
  });
  return { ...subject, slots, lecturer: course.lecturer ? lecturerName(course.lecturer) : subject.lecturer };
}

// Пълно присъствие = без пропусната лекция по предмета, предстоящите не се броят (за ✓ и за броя значки)
function hasFullAttendance(subject: DemoSubject) {
  return subject.slots.every((slot) => slot.status !== 'missed');
}

// Обща рамка на таб (note е по избор – ред текст над етикета вдясно)
function Panel({ eyebrow, title, badge, badgeClass, note, children }: { eyebrow: string; title: string; badge: string; badgeClass: string; note?: string; children: ReactNode }) {
  return (
    <section className="card panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <div className="panel-aside">
          {note && <p className="panel-note">{note}</p>}
          <span className={`status-badge ${badgeClass}`}>{badge}</span>
        </div>
      </div>
      {children}
    </section>
  );
}

// Квадратче за лекция или упражнение
function SessionBox({ number, status, title, selected, onClick }: { number: number; status: LessonStatus; title: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`session-box ${status} ${selected ? 'selected' : ''}`} onClick={onClick} title={title}>
      <span>{number}</span>
    </button>
  );
}

// Таб „Лична информация“ (групата и формата на обучение са демо)
function PersonalTab({ student, name }: { student: any; name: string }) {
  const rows = [
    ['Име', name],
    ['Факултетен номер', student.facultyNumber],
    ['Група', 'ИС-1 / 2026'],
    ['Курс', `${student.year}. курс`],
    ['Форма на обучение', 'Редовно'],
    ['Специалност', student.program],
  ];
  return (
    <Panel eyebrow="Лична информация" title="Профил на студента" badge="Активен" badgeClass="status-ok">
      <div className="info-grid">
        {rows.map(([label, value]) => (
          <div key={label} className="info-item">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// Таб „Предмети и оценки“
function SubjectsTab() {
  return (
    <Panel eyebrow="Предмети" title="Предмети и оценки" badge="Демо режим" badgeClass="status-neutral">
      <div className="subject-list">
        {demoGrades.map((subject) => (
          <div key={subject.title} className="subject-card">
            <div>
              <h3>{subject.title}</h3>
              <small>{subject.semester}</small>
            </div>
            <div className="grade-box">{subject.grade}</div>
            <div className="subject-meta">
              <span>Лекции: {subject.lecturer}</span>
              <span>Упражнения: {subject.assistant}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// Таб „Карта за присъствие“
function CardTab({ student, name }: { student: any; name: string }) {
  return (
    <Panel eyebrow="Карта за присъствие" title="Дигитална карта за присъствие" note="Сканира се физическа карта на RFID/NFC четеца в залата."
      badge="Apple Wallet · бъдеща функционалност" badgeClass="status-neutral">
      <div className="card-layout">
        <div className="wallet-card">
          <div className="wallet-top">
            <span>UniAttend</span>
            <span>Студентска карта</span>
          </div>
          <div className="wallet-body">
            <div>
              <strong>{name}</strong>
              <small>{student.facultyNumber}</small>
            </div>
            <div className="wallet-chip" />
          </div>
          <div className="wallet-footer">
            <span>{student.program}</span>
            <span>2026</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
