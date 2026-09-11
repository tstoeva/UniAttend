import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { StudentPage } from './pages/StudentPage';
import { LecturerPage } from './pages/LecturerPage';
import { TerminalPage } from './pages/TerminalPage';
import './styles.css';

function Guard({ role, children }: { role: string; children: React.ReactNode }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user?.role === role ? <>{children}</> : <Navigate to="/" />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><Routes>
    <Route path="/" element={<LoginPage/>}/>
    <Route path="/student" element={<Guard role="STUDENT"><StudentPage/></Guard>}/>
    <Route path="/lecturer" element={<Guard role="LECTURER"><LecturerPage/></Guard>}/>
    <Route path="/terminal" element={<Guard role="LECTURER"><TerminalPage/></Guard>}/>
  </Routes></BrowserRouter></React.StrictMode>
);
