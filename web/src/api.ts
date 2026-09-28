import axios from 'axios';

// HTTP клиент към API-то; JWT токенът се добавя към всяка заявка
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Пълното име на лектора с титлата, напр. „Проф. д-р Мария Петрова“
export function lecturerName(lecturer: { title?: string | null; user: { firstName: string; lastName: string } }) {
  return [lecturer.title, lecturer.user.firstName, lecturer.user.lastName].filter(Boolean).join(' ');
}

// Изход: изчиства сесията и връща към входа
export function logout() { localStorage.clear(); location.href = '/'; }
