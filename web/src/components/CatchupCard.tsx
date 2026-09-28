import { useState } from 'react';
import { api } from '../api';

// Демо пакетите (isDemo) не се изпращат към сървъра
export function CatchupCard({ item, onDone }: { item: any; onDone: () => void }) {
  const quiz = item.quiz || [];
  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1)); // -1 = без отговор
  const [open, setOpen] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const completed = item.isDemo ? demoCompleted : item.status === 'COMPLETED';

  async function submit() {
    if (item.isDemo) {
      setDemoCompleted(true);
      return;
    }
    await api.post(`/student/catchups/${item.id}/submit`, { answers });
    onDone();
  }

  function choose(question: number, option: number) {
    setAnswers((current) => current.map((value, i) => (i === question ? option : value)));
  }

  return (
    <div className="card catchup">
      <div className="row">
        <div>
          <b>{item.title}</b>
          <div className="muted">{completed ? 'COMPLETED' : item.status}</div>
        </div>
        <button className="secondary" onClick={() => setOpen(!open)}>{open ? 'Скрий' : 'Отвори'}</button>
      </div>
      {open && (
        <div>
          <p>{item.summary}</p>
          <div className="chips">{(item.keyConcepts || []).map((x: string) => <span key={x}>{x}</span>)}</div>
          {quiz.map((q: any, qi: number) => (
            <div className="question" key={qi}>
              <b>{qi + 1}. {q.question}</b>
              {q.options.map((option: string, oi: number) => (
                <label className="option" key={oi}>
                  <input type="radio" name={`${item.id}-${qi}`} checked={answers[qi] === oi} onChange={() => choose(qi, oi)} />
                  {option}
                </label>
              ))}
            </div>
          ))}
          {!completed && <button disabled={answers.some((a) => a < 0)} onClick={submit}>Изпрати теста</button>}
          {completed && <p className="success">Завършено: {item.isDemo ? quiz.length : `${item.score}/${item.maxScore}`}</p>}
        </div>
      )}
    </div>
  );
}
