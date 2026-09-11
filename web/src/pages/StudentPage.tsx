import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api, logout } from '../api';
import { CatchupCard } from '../components/CatchupCard';

type TabKey = 'personal' | 'subjects' | 'attendance' | 'card';

type AttendanceState = 'present' | 'missed' | 'upcoming';

type AttendanceSlot = {
  id: string;
  title: string;
  status: AttendanceState;
  aiSummary: string;
};

type AttendanceSubject = {
  id: string;
  courseName: string;
  courseCode: string;
  lecturer: string;
  semester: string;
  exercisePresent: number;
  exerciseRequired: number;
  exerciseStatus: string;
  catchupInfo: string;
  exerciseSlots: AttendanceState[];
  slots: AttendanceSlot[];
};

const demoAttendanceSubjects: AttendanceSubject[] = [
  {
    id: 'sa101',
    courseName: 'Софтуерна архитектура',
    courseCode: 'SA101',
    lecturer: 'Проф. д-р Мария Петрова',
    semester: 'Семестър 1',
    exercisePresent: 4,
    exerciseRequired: 5,
    exerciseStatus: 'Без заверка',
    catchupInfo: 'Отработка: 12.09.2026, 14:00, зала 301 или 19.09.2026, 10:00, зала 204',
    exerciseSlots: ['present', 'present', 'present', 'present', 'missed'],
    slots: [
      { id: 'sa-1', title: 'Въведение в архитектурата', status: 'present', aiSummary: 'Лекцията въвежда основните архитектурни принципи, разделяне на отговорности и изграждане на мащабируеми системи.' },
      { id: 'sa-2', title: 'Многослойна архитектура', status: 'present', aiSummary: 'Структурният модел разделя приложението на презентационен, бизнес и данни слой за по-добра поддръжка и тестируемост.' },
      { id: 'sa-3', title: 'Архитектурни шаблони', status: 'missed', aiSummary: 'AI резюме: Архитектурните шаблони помагат за стандартизиране на логиката и намаляване на зависимостите между компоненти. Важно е да се познават MVC, MVVM и Repository моделите.' },
      { id: 'sa-4', title: 'Платформа и интеграция', status: 'upcoming', aiSummary: 'Предстоящата тема ще разглежда взаимодействието между системни компоненти и API слоевете.' },
      { id: 'sa-5', title: 'Микросервизни модели', status: 'upcoming', aiSummary: 'Темата ще обясни как микросервисите организират логиката и как се управлява комуникацията между услуги.' },
    ],
  },
  {
    id: 'db201',
    courseName: 'Разширени бази от данни',
    courseCode: 'DB201',
    lecturer: 'Доц. Иван Иванов',
    semester: 'Семестър 1',
    exercisePresent: 5,
    exerciseRequired: 5,
    exerciseStatus: 'Заверена',
    catchupInfo: 'Няма нужда от отработка',
    exerciseSlots: ['present', 'present', 'present', 'present', 'present'],
    slots: [
      { id: 'db-1', title: 'Нормални форми', status: 'present', aiSummary: 'Нормализацията намалява дублирането и повишава консистентността на данните в релационните системи.' },
      { id: 'db-2', title: 'Индекси и оптимизация', status: 'present', aiSummary: 'Индексите ускоряват търсенето, но изискват балансиране между скорост и разход на дисково пространство.' },
      { id: 'db-3', title: 'Транзакции', status: 'present', aiSummary: 'Транзакциите гарантират атомност и последователност при операции, които трябва да се изпълнят изцяло или неуспешно.' },
      { id: 'db-4', title: 'Транзакционна логика', status: 'present', aiSummary: 'Логиката на транзакциите включва фиксиране, rollback и управление на състоянието при грешки в базата данни.' },
      { id: 'db-5', title: 'Скалируемост', status: 'present', aiSummary: 'Следващата лекция обяснява как се разпределят данните и как се избягва bottleneck при големи натоварвания.' },
    ],
  },
  {
    id: 'hci301',
    courseName: 'Човешко-компютърно взаимодействие',
    courseCode: 'HCI301',
    lecturer: 'Гл. ас. Христо Симеонов',
    semester: 'Семестър 1',
    exercisePresent: 3,
    exerciseRequired: 5,
    exerciseStatus: 'Без заверка',
    catchupInfo: 'Отработка: 14.09.2026, 16:00, зала 112 или 21.09.2026, 12:00, зала 208',
    exerciseSlots: ['present', 'present', 'present', 'missed', 'upcoming'],
    slots: [
      { id: 'hci-1', title: 'Основи на UX', status: 'present', aiSummary: 'UX акцентът е върху яснотата, удобството и последователността на потребителското взаимодействие.' },
      { id: 'hci-2', title: 'Потребителски изследвания', status: 'missed', aiSummary: 'AI резюме: Изследването на потребителите анализира нуждите, сценарии и бариери, за да се проектира по-подходящ интерфейс.' },
      { id: 'hci-3', title: 'Визуална йерархия', status: 'upcoming', aiSummary: 'Темата ще разгледа подреждането на контента, контрастността и логическата структура на интерфейса.' },
      { id: 'hci-4', title: 'Достъпност', status: 'upcoming', aiSummary: 'Ще се обсъжда как интерфейсът да е разбираем и използваем за широк кръг потребители.' },
      { id: 'hci-5', title: 'Тестване на интерфейс', status: 'upcoming', aiSummary: 'Следващото занятие ще разгледа тестови сценарии и методи за оценяване на потребителския опит.' },
    ],
  },
  {
    id: 'ml401',
    courseName: 'Машинно обучение',
    courseCode: 'ML401',
    lecturer: 'Доц. Анна Димитрова',
    semester: 'Семестър 1',
    exercisePresent: 4,
    exerciseRequired: 5,
    exerciseStatus: 'Без заверка',
    catchupInfo: 'Отработка: 16.09.2026, 14:00, зала 305 или 23.09.2026, 10:00, зала 210',
    exerciseSlots: ['present', 'present', 'present', 'present', 'missed'],
    slots: [
      { id: 'ml-1', title: 'Supervised learning', status: 'present', aiSummary: 'Изучават се модели, които се обучават върху маркирани данни и оптимизират грешката чрез повтарящи се итерации.' },
      { id: 'ml-2', title: 'Класификация', status: 'present', aiSummary: 'Класификационните модели предсказват категория на наблюдението според неговите признаци и обучаващи примери.' },
      { id: 'ml-3', title: 'Регресия', status: 'present', aiSummary: 'Регресията предсказва числена стойност и се използва в модели за оценка, прогнози и анализ.' },
      { id: 'ml-4', title: 'Метрики и оценка', status: 'missed', aiSummary: 'AI резюме: За оценка на моделите се използват точност, прецизност, recall и F1 метрика, за да се сравняват резултатите обективно.' },
      { id: 'ml-5', title: 'Трансферно обучение', status: 'upcoming', aiSummary: 'Следващата лекция описва как знанията от едно обучение се използват за ускоряване на ново обучение.' },
    ],
  },
];

export function StudentPage() {
  const [data, setData] = useState<any>(null);
  const [credential, setCredential] = useState('');
  const [walletAvailable, setWalletAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [selectedLecture, setSelectedLecture] = useState<{ subjectId: string; slotId: string } | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<{ subjectId: string; index: number } | null>(null);
  const [fullAttendanceSubjectId, setFullAttendanceSubjectId] = useState<string | null>(null);

  async function load() {
    const [d, c, w] = await Promise.all([
      api.get('/student/dashboard'),
      api.get('/attendance/credential'),
      api.get('/wallet/status'),
    ]);
    setData(d.data);
    setCredential(c.data.credential);
    setWalletAvailable(w.data.available);
  }

  useEffect(() => { load(); }, []);

  async function addWallet() {
    const response = await api.get('/wallet/pass', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    window.location.href = url;
  }

  if (!data) return <main className="shell"><div className="card loading-card">Зареждане на студентския портал…</div></main>;

  const student = data.student || {};
  const studentName = 'Анна Петрова';
  const personalInfo = [
    { label: 'Име', value: studentName },
    { label: 'Факултетен номер', value: student.facultyNumber || 'F12345' },
    { label: 'Група', value: 'ИС-1 / 2026' },
    { label: 'Курс', value: '1. курс' },
    { label: 'Форма на обучение', value: 'Редовно' },
    { label: 'Специалност', value: 'Софтуерно инженерство' },
  ];

  const subjectRows = [
    { title: 'Софтуерна архитектура', semester: 'Семестър 1 (Текущ)', grade: '6', lecturer: 'Проф. д-р Мария Петрова' },
    { title: 'Разширени бази от данни', semester: 'Семестър 1 (Текущ)', grade: '5', lecturer: 'Доц. Иван Иванов' },
    { title: 'Човешко-компютърно взаимодействие', semester: 'Семестър 1 (Текущ)', grade: '4', lecturer: 'Гл. ас. Христо Симеонов' },
    { title: 'Машинно обучение', semester: 'Семестър 1 (Текущ)', grade: '5', lecturer: 'Доц. Анна Димитрова' },
    { title: 'Сигурност и мрежи', semester: 'Семестър 1 (Текущ)', grade: '3', lecturer: 'Гл. ас. Николай Георгиев' },
    { title: 'Операционни системи', semester: 'Семестър 1 (Текущ)', grade: '2', lecturer: 'Проф. д-р Георги Тодоров' },
  ];

  const courseRows = (data.courses || []).map((course: any, index: number) => {
    const lectureRequired = 5;
    const sessionCount = course.sessions?.length || 0;
    const lecturePresent = Math.min(lectureRequired, Math.max(3, sessionCount));
    const exercisePresent = Math.min(5, Math.max(2, sessionCount - 1));
    const exerciseStatus = exercisePresent >= 5 ? 'Заверена' : 'Без заверка';
    const lectureBadge = lecturePresent >= lectureRequired ? '✓' : '•';
    const catchupInfo = exercisePresent < 5 ? 'Отработка: 12.09.2026, 14:00, зала 301' : 'Няма нужда от отработка';

    return {
      courseName: course.name || `Course ${index + 1}`,
      courseCode: course.code || 'CODE',
      lecturePresent,
      lectureRequired,
      exercisePresent,
      exerciseRequired: 5,
      exerciseStatus,
      lectureBadge,
      lectureText: lecturePresent >= lectureRequired ? 'Всички лекции са покрити' : `${lectureRequired - lecturePresent} липсващи лекции`,
      catchupInfo,
    };
  });

  const attendanceRows = courseRows.length > 0 ? courseRows : [
    {
      courseName: 'Software Architecture',
      courseCode: 'SA101',
      lecturePresent: 5,
      lectureRequired: 5,
      exercisePresent: 4,
      exerciseRequired: 5,
      exerciseStatus: 'Без заверка',
      lectureBadge: '✓',
      lectureText: 'Бонус за изпит',
      catchupInfo: 'Отработка: 12.09.2026, 14:00, зала 301',
    },
  ];

  const renderTabContent = () => {
    if (activeTab === 'personal') {
      return (
        <section className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Лична информация</p>
              <h2>Профил на студента</h2>
            </div>
            <span className="status-badge status-ok">Активен</span>
          </div>
          <div className="info-grid">
            {personalInfo.map((row) => (
              <div key={row.label} className="info-item">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeTab === 'subjects') {
      return (
        <section className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Предмети</p>
              <h2>Предмети и оценки</h2>
            </div>
            <span className="status-badge status-neutral">Демо режим</span>
          </div>
          <div className="subject-list">
            {subjectRows.map((subject) => (
              <div key={subject.title} className="subject-card">
                <div>
                  <h3>{subject.title}</h3>
                  <small>{subject.semester}</small>
                </div>
                <div className="grade-box">{subject.grade}</div>
                <div className="subject-meta">
                  <span>Лектор: {subject.lecturer}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeTab === 'attendance') {
      return (
        <section className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Присъствия</p>
              <h2>Текущ семестър</h2>
            </div>
            <span className="status-badge status-warning">Само текущи предмети</span>
          </div>

          <div className="attendance-list">
            {demoAttendanceSubjects.map((subject) => {
              const selectedSlot = subject.slots.find((slot) =>
                slot.status === 'missed' &&
                selectedLecture?.subjectId === subject.id &&
                selectedLecture?.slotId === slot.id
              );
              const lecturePresentCount = subject.slots.filter((slot) => slot.status === 'present').length;
              const hasFullLectureAttendance = lecturePresentCount === 5;
              const isFullAttendanceOpen = fullAttendanceSubjectId === subject.id;

              return (
                <div key={subject.id} className="attendance-item">
                <div className="attendance-heading">
                  <div>
                    <h3>{subject.courseName}</h3>
                    <small>{subject.courseCode} · {subject.semester}</small>
                  </div>
                  <div className="lecture-status-top">
                    {hasFullLectureAttendance && (
                      <button
                        type="button"
                        className="full-attendance-check"
                        aria-label="Пълно присъствие"
                        onClick={() => setFullAttendanceSubjectId(subject.id)}
                      >
                        ✓
                      </button>
                    )}
                    <div className="attendance-badge-row">
                      <span className="mini-badge success">{lecturePresentCount}/5 лекции</span>
                      <span className="mini-badge danger">{subject.slots.filter((slot) => slot.status === 'missed').length} липсващи</span>
                    </div>
                  </div>
                </div>

                {isFullAttendanceOpen && (
                  <div className="attendance-modal-backdrop" onClick={() => setFullAttendanceSubjectId(null)}>
                    <div className="attendance-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
                      <button type="button" className="attendance-modal-close" onClick={() => setFullAttendanceSubjectId(null)} aria-label="Затвори">
                        ×
                      </button>
                      <div className="attendance-modal-icon">✓</div>
                      <h3>Пълно присъствие на лекции</h3>
                      <p>{subject.courseName}</p>
                    </div>
                  </div>
                )}

                <div className="session-grid" aria-label={`Лекции за ${subject.courseName}`}>
                  {subject.slots.map((slot, index) => {
                    const isSelected = selectedLecture?.subjectId === subject.id && selectedLecture?.slotId === slot.id;
                    const toneClass = slot.status === 'present' ? 'session-box present' : slot.status === 'missed' ? 'session-box missed' : 'session-box upcoming';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        className={`${toneClass} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedLecture({ subjectId: subject.id, slotId: slot.id })}
                        title={`${index + 1}. ${slot.title}`}
                      >
                        <span>{index + 1}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="attendance-meta-row">
                  <span>Лектор: {subject.lecturer}</span>
                  <span>5 занятия</span>
                </div>

                <div className="attendance-row exercise-row">
                  <div>
                    <strong>Упражнения</strong>
                    <small className={subject.exerciseStatus === 'Заверена' ? 'exercise-complete' : 'exercise-warning'}>{subject.exerciseStatus}</small>
                  </div>
                  <strong>{subject.exercisePresent}/{subject.exerciseRequired}</strong>
                  <div>
                    <div className="session-grid exercise-session-grid" aria-label={`Упражнения за ${subject.courseName}`}>
                      {subject.exerciseSlots.map((status, index) => {
                        const isSelected = selectedExercise?.subjectId === subject.id && selectedExercise.index === index;
                        const toneClass = status === 'present' ? 'session-box present' : status === 'missed' ? 'session-box missed' : 'session-box upcoming';

                        return (
                          <button
                            key={`${subject.id}-exercise-${index + 1}`}
                            type="button"
                            className={`${toneClass} ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedExercise(status === 'missed' ? { subjectId: subject.id, index } : null)}
                            title={`${index + 1}. упражнение`}
                          >
                            <span>{index + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedExercise?.subjectId === subject.id && subject.exerciseSlots[selectedExercise.index] === 'missed' && (
                      <div className="exercise-catchup">
                        <strong>Възможност за отработване</strong>
                        <p>{subject.catchupInfo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedSlot && (
                  <div className="summary-box">
                    <div className="summary-header">
                      <div>
                        <p className="eyebrow">AI резюме</p>
                        <h3>{selectedSlot.title}</h3>
                      </div>
                      <span className="summary-status missed">Пропусната лекция</span>
                    </div>
                    <p>{selectedSlot.aiSummary}</p>
                  </div>
                )}
                </div>
              );
            })}
          </div>

          {data.catchups && data.catchups.length > 0 && (
            <div className="catchup-wrap">
              <h3>Smart Catch-up</h3>
              {data.catchups.map((item: any) => (
                <CatchupCard key={item.id} item={item} onDone={load} />
              ))}
            </div>
          )}
        </section>
      );
    }

    return (
      <section className="card panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Карта за присъствие</p>
            <h2>Дигитална карта за присъствие</h2>
          </div>
          <span className="status-badge status-neutral">Prototype</span>
        </div>
        <div className="card-layout">
          <div className="wallet-card">
            <div className="wallet-top">
              <span>UniAttend</span>
              <span>Студентска карта</span>
            </div>
            <div className="wallet-body">
              <div>
                <strong>{studentName}</strong>
                <small>{student.facultyNumber || 'F12345'}</small>
              </div>
              <div className="wallet-chip" />
            </div>
            <div className="wallet-footer">
                <span>Софтуерно инженерство</span>
              <span>2026</span>
            </div>
          </div>
          <div className="qr-block">
            {credential && <QRCodeSVG value={credential} size={180} />}
            <p>Сканира се на RFID/NFC четеца в залата за присъствие.</p>
            <button className="secondary" onClick={addWallet} disabled={!walletAvailable}>
              {walletAvailable ? 'Добави в Apple Wallet' : 'Картата не е конфигурирана'}
            </button>
          </div>
        </div>
      </section>
    );
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">UniAttend</div>
        <button className="secondary" onClick={logout}>Изход</button>
      </header>

      <section className="hero student-hero">
        <div>
          <div className="eyebrow">ДОБЪР ДЕН</div>
          <h1>{studentName}</h1>
          <p>Софтуерно инженерство · {student.facultyNumber || 'F12345'}</p>
        </div>
        <div className="score">
          <strong>{data.badges?.length || 0}</strong>
          <span>активни значки</span>
        </div>
      </section>

      <nav className="tab-bar" aria-label="Секции на студентския портал">
        {[
          { id: 'personal', label: 'Лична информация' },
          { id: 'subjects', label: 'Предмети и оценки' },
          { id: 'attendance', label: 'Присъствия' },
          { id: 'card', label: 'Карта за присъствие' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab(tab.id as TabKey)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {renderTabContent()}
    </main>
  );
}
