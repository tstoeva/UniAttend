import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, logout } from '../api';

const sessionStatusLabels: Record<string, string> = {
  PLANNED: 'Предстояща',
  OPEN: 'Отворена',
  CLOSED: 'Приключила',
};

const attendanceStatusLabels: Record<string, string> = {
  PRESENT: 'Присъствал',
  ABSENT: 'Отсъствал',
  LATE: 'Закъснял',
  EXCUSED: 'Извинен',
};

export function LecturerPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  async function load(){ setCourses((await api.get('/lecturer/dashboard')).data); }
  useEffect(()=>{load()},[]);
  function toggleRoster(sessionId: string) {
    setExpandedSessions((current) => {
      const next = new Set(current);
      if (next.has(sessionId)) next.delete(sessionId); else next.add(sessionId);
      return next;
    });
  }
  async function action(id:string, what:'open'|'close') { const r=await api.post(`/lecturer/sessions/${id}/${what}`); setMessage(what==='close'?`Сесията е затворена. Създадени резюмета: ${r.data.catchupsCreated}; издадени значки: ${r.data.badgesIssued}.`:'Присъствието е отворено.'); await load(); }
  async function upload(id:string, file?:File){ if(!file)return; const f=new FormData();f.append('file',file);await api.post(`/lecturer/sessions/${id}/materials`,f);setMessage('Материалът е качен.');await load(); }
  return <main className="shell"><header><div className="brand">UniAttend · Лектор</div><button className="secondary" onClick={logout}>Изход</button></header>
    {message&&<div className="notice">{message}</div>}
    {courses.map(c=><section key={c.id}><div className="row"><div><h1>{c.code} · {c.name}</h1><p className="muted">{c.enrollments.length} записани студенти</p></div></div>
      <div className="grid">{c.sessions.map((s:any)=>{
        const attendanceByStudent = new Map<string, any>(s.attendance.map((record:any) => [record.studentId, record]));
        const rosterExpanded = expandedSessions.has(s.id);
        return <article className="card session" key={s.id}><div className="row"><div><div className="eyebrow">{sessionStatusLabels[s.status] || s.status}</div><h3>{s.title}</h3><p>{new Date(s.startsAt).toLocaleString('bg-BG')} · {s.room}</p></div><span className="status">{s.status === 'PLANNED' ? 'Все още не е започнало' : `${s.attendance.filter((a:any) => a.status === 'PRESENT').length} присъствали`}</span></div>
        <div className="actions">{s.status==='PLANNED'&&<button onClick={()=>action(s.id,'open')}>Отвори присъствия</button>}{s.status==='OPEN'&&<><Link className="button-link" to={`/terminal?sessionId=${s.id}`}>Отвори скенер</Link><button className="danger" onClick={()=>action(s.id,'close')}>Затвори сесия</button></>}
          {s.status !== 'PLANNED' && <button className="secondary" onClick={()=>toggleRoster(s.id)}>{rosterExpanded ? 'Скрий списъка' : 'Покажи списъка'}</button>}
          <label className="upload">Качи материал<input type="file" onChange={e=>upload(s.id,e.target.files?.[0])}/></label></div>
        {s.materials.length>0&&<p className="muted">Материали: {s.materials.map((m:any)=>m.title).join(', ')}</p>}
        {rosterExpanded && <div className="attendance-roster"><h4>Списък на студентите и присъствия</h4>{c.enrollments.map((enrollment:any)=>{
          const record = attendanceByStudent.get(enrollment.studentId);
          const status = record?.status || 'ABSENT';
          return <div className={`att-row ${status.toLowerCase()}`} key={enrollment.studentId}><span>{enrollment.student.user.firstName} {enrollment.student.user.lastName}</span><span className={`pill ${status.toLowerCase()}`}>{attendanceStatusLabels[status]}</span></div>;
        })}</div>}
      </article>})}</div>
    </section>)}
  </main>;
}
