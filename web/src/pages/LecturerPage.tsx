import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, lecturerName, logout } from '../api';

const sessionStatusLabels: Record<string, string> = { PLANNED: 'Предстояща', OPEN: 'Отворена', CLOSED: 'Приключила' };
const attendanceStatusLabels: Record<string, string> = { PRESENT: 'Присъствал', ABSENT: 'Отсъствал', LATE: 'Закъснял', EXCUSED: 'Извинен' };

export function LecturerPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [openRosters, setOpenRosters] = useState<string[]>([]); // id-та на сесиите с отворен списък

  async function load() {
    const { data } = await api.get('/lecturer/dashboard');
    setCourses(data);
  }
  useEffect(() => { load(); }, []);

  async function action(id: string, what: 'open' | 'close') {
    const { data } = await api.post(`/lecturer/sessions/${id}/${what}`);
    setMessage(what === 'close' ? `Сесията е затворена. Отсъстващи: ${data.absentCount}.` : 'Присъствието е отворено.');
    await load();
  }

  function toggleRoster(id: string) {
    setOpenRosters((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  return (
    <main className="shell">
      <header>
        <div className="brand">UniAttend · Лектор</div>
        <button className="secondary" onClick={logout}>Изход</button>
      </header>
      {message && <div className="notice">{message}</div>}
      {courses.map((course) => (
        <section key={course.id}>
          <div className="row">
            <div>
              <h1>{course.code} · {course.name}</h1>
              <p className="muted">Лекции: {lecturerName(course.lecturer)} · {course.enrollments.length} записани студенти</p>
            </div>
          </div>
          <div className="grid">
            {course.sessions.map((session: any, index: number) => (
              <SessionCard
                key={session.id}
                number={course.sessions.length - index} // сесиите идват от най-новата към най-старата
                session={session}
                enrollments={course.enrollments}
                rosterOpen={openRosters.includes(session.id)}
                onToggleRoster={() => toggleRoster(session.id)}
                onAction={action}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function SessionCard({ number, session: s, enrollments, rosterOpen, onToggleRoster, onAction }: {
  number: number;
  session: any;
  enrollments: any[];
  rosterOpen: boolean;
  onToggleRoster: () => void;
  onAction: (id: string, what: 'open' | 'close') => void;
}) {
  const presentCount = s.attendance.filter((a: any) => a.status === 'PRESENT').length;
  return (
    <article className="card session">
      <div className="row">
        <div>
          <div className="eyebrow">Лекция {number} · {sessionStatusLabels[s.status] || s.status}</div>
          <h3>{s.title}</h3>
          <p>{new Date(s.startsAt).toLocaleString('bg-BG')} · {s.room}</p>
        </div>
        <span className={`status-badge ${s.status === 'PLANNED' ? 'status-warning' : 'status-ok'}`}>
          {s.status === 'PLANNED' ? 'Все още не е започнало' : `${presentCount} присъствали`}
        </span>
      </div>
      <div className="actions">
        {s.status === 'PLANNED' && <button onClick={() => onAction(s.id, 'open')}>Отвори присъствия</button>}
        {s.status === 'OPEN' && (
          <>
            <Link className="button-link" to={`/terminal?sessionId=${s.id}`}>Отвори скенер</Link>
            <button className="danger" onClick={() => onAction(s.id, 'close')}>Затвори сесия</button>
          </>
        )}
        {s.status !== 'PLANNED' && (
          <button className="secondary" onClick={onToggleRoster}>{rosterOpen ? 'Скрий списъка' : 'Покажи списъка'}</button>
        )}
      </div>
      {rosterOpen && (
        <div className="attendance-roster">
          <h4>Списък на студентите и присъствия</h4>
          {enrollments.map((enrollment) => {
            // студент без запис за сесията се показва като отсъствал
            const status = s.attendance.find((a: any) => a.studentId === enrollment.studentId)?.status || 'ABSENT';
            return (
              <div className={`att-row ${status.toLowerCase()}`} key={enrollment.studentId}>
                <span>{enrollment.student.user.firstName} {enrollment.student.user.lastName}</span>
                <span className={`pill ${status.toLowerCase()}`}>{attendanceStatusLabels[status]}</span>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
