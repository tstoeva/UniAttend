import { Link, useSearchParams } from 'react-router-dom';

// Информационна страница; сканирането се обработва от terminal/rfid_terminal.py
export function TerminalPage() {
  const [params] = useSearchParams();
  return (
    <main className="terminal">
      <div className="terminal-card">
        <div className="row">
          <h1>RFID Attendance Terminal</h1>
          <Link to="/lecturer">← Lecturer dashboard</Link>
        </div>
        <p className="muted">Session: {params.get('sessionId') || ''}</p>
        <div className="scan-result">Present a registered RFID card to the reader in the room. The ESP32 terminal submits the scan automatically.</div>
        <p className="muted">RFID is the active attendance method for this prototype.</p>
      </div>
    </main>
  );
}
