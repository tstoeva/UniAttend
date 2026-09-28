import { useState } from 'react';
import { api } from '../api';

// Smart Catch-up пакет: резюме, ключови понятия и тест (демо пакетите не се изпращат към сървъра)
export function CatchupCard({ item, onDone }: { item: any; onDone: () => void }) {
  const quiz = item.quiz || [];
  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1)); // -1 = без отговор
  const [open, setOpen] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [error, setError] = useState('');
  const completed = item.isDemo ? demoCompleted : item.status === 'COMPLETED';
  const allAnswered = answers.every((a) => a >= 0);

  // Изпраща отговорите (при демо пакет само го маркира като завършен)
  async function submit() {
    if (item.isDemo) {
      setDemoCompleted(true);
      return;
    }
    try {
      setError('');
      await api.post(`/student/catchups/${item.id}/submit`, { answers });
      onDone();
    } catch {
      // Напр. данните са презаредени (нов seed) и тестът вече не съществува
      setError('Тестът не можа да се изпрати. Излезте и влезте отново.');
    }
  }

  // Записва избрания отговор
  function choose(question: number, option: number) {
    setAnswers((current) => current.map((value, i) => (i === question ? option : value)));
  }

  return (
    <div className="card catchup">
      {/* Заглавие, статус и бутон „Отвори“/„Скрий“ */}
      <div className="row">
        <div>
          <b>{item.title}</b>
          <div className="muted">{completed ? 'COMPLETED' : item.status}</div>
        </div>
        <button className="secondary" onClick={() => setOpen(!open)}>{open ? 'Скрий' : 'Отвори'}</button>
      </div>
      {/* Резюме, ключови понятия и тест */}
      {open && (
        <div>
          <p>{item.summary}</p>
          <div className="chips">{(item.keyConcepts || []).map((x: string) => <span key={x}>{x}</span>)}</div>
          {/* Въпроси с отговори */}
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
          {/* Изпращане или резултат */}
          {!completed && <button disabled={!allAnswered} onClick={submit}>Изпрати теста</button>}
          {!completed && !allAnswered && <p className="muted">Отговорете на всички въпроси, за да изпратите теста.</p>}
          {error && <p className="error">{error}</p>}
          {completed && <p className="success">Завършено: {item.isDemo ? quiz.length : `${item.score}/${item.maxScore}`}</p>}
        </div>
      )}
    </div>
  );
}
