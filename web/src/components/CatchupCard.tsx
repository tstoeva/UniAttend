import { useState } from 'react';
import { api } from '../api';

export function CatchupCard({ item, onDone }: { item: any; onDone: () => void }) {
  const quiz = item.quiz || [];
  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1));
  const [open, setOpen] = useState(false);
  async function submit() { await api.post(`/student/catchups/${item.id}/submit`, { answers }); onDone(); }
  return <div className="card catchup">
    <div className="row"><div><b>{item.title}</b><div className="muted">{item.status}</div></div><button className="secondary" onClick={()=>setOpen(!open)}>{open ? 'Скрий' : 'Отвори'}</button></div>
    {open && <div><p>{item.summary}</p><div className="chips">{(item.keyConcepts||[]).map((x:string)=><span key={x}>{x}</span>)}</div>
      {quiz.map((q:any, qi:number)=><div className="question" key={qi}><b>{qi+1}. {q.question}</b>{q.options.map((o:string,oi:number)=><label className="option" key={oi}><input type="radio" name={`${item.id}-${qi}`} checked={answers[qi]===oi} onChange={()=>setAnswers(a=>a.map((v,i)=>i===qi?oi:v))}/>{o}</label>)}</div>)}
      {item.status !== 'COMPLETED' && <button disabled={answers.some(a=>a<0)} onClick={submit}>Изпрати теста</button>}
      {item.status === 'COMPLETED' && <p className="success">Завършено: {item.score}/{item.maxScore}</p>}
    </div>}
  </div>;
}
