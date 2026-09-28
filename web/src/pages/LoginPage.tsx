import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

// Страница за вход
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('anna@uni.demo');
  const [password, setPassword] = useState('Student123!');
  const [error, setError] = useState('');

  // Вход: пази токена и потребителя и пренасочва според ролята
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(data.user.role === 'STUDENT' ? '/student' : '/lecturer');
    } catch {
      setError('Невалидни данни или бекендът не работи.');
    }
  }

  // Попълва демо акаунт
  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <main className="center">
      <section className="card login">
        <div className="brand">UniAttend</div>
        <h1>Оценки, статус на присъствие и учебни материали на едно място</h1>
        {/* Форма за вход */}
        <form onSubmit={submit}>
          <label>Имейл<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Парола<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="error">{error}</p>}
          <button>Вход</button>
        </form>
        {/* Бутони за демо акаунтите */}
        <div className="demo-buttons">
          <button className="secondary" onClick={() => fillDemo('anna@uni.demo', 'Student123!')}>Демо студент</button>
          <button className="secondary" onClick={() => fillDemo('lecturer@uni.demo', 'Lecturer123!')}>Демо лектор</button>
        </div>
      </section>
    </main>
  );
}
