import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { api } from '../api';

export function TerminalPage(){
  const [params]=useSearchParams(); const sessionId=params.get('sessionId')||'';
  const video=useRef<HTMLVideoElement>(null); const [result,setResult]=useState('Ready to scan'); const [manual,setManual]=useState('');
  useEffect(()=>{ let controls:IScannerControls|undefined; const reader=new BrowserQRCodeReader();
    reader.decodeFromVideoDevice(undefined, video.current!, async (r)=>{ if(r){ controls?.stop(); await check(r.getText()); } }).then(c=>controls=c).catch(()=>setResult('Camera unavailable. Paste the QR credential below.'));
    return()=>controls?.stop(); },[sessionId]);
  async function check(credential:string){ try{const r=await api.post('/attendance/check-in',{sessionId,credential});setResult(`✅ ${r.data.student} (${r.data.facultyNumber}) checked in`);}catch(e:any){setResult(`❌ ${e.response?.data?.message||'Check-in failed'}`);} }
  return <main className="terminal"><div className="terminal-card"><div className="row"><h1>Attendance Terminal</h1><Link to="/lecturer">← Lecturer dashboard</Link></div><p className="muted">Session: {sessionId}</p><video ref={video} className="camera"/><div className="scan-result">{result}</div><div className="manual"><textarea placeholder="Paste credential for simulator/demo" value={manual} onChange={e=>setManual(e.target.value)}/><button onClick={()=>check(manual)}>Manual check-in</button></div></div></main>;
}
