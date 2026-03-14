'use client'
import { useEffect, useState, useRef } from 'react'
import { LOGO_SRC, GRANNY_SRC, QR_SRC } from '@/lib/images'

const APPS_URL = '/api/proxy'

interface FloatingWord {
  id: string; word: string; x: number
}

export default function StationPage() {
  const [words, setWords] = useState<FloatingWord[]>([])
  const [totalAnswers, setTotalAnswers] = useState(0)
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState<{ question_id: number; word: string; count: number }[]>([])
  const [soundOn, setSoundOn] = useState(false)
  const slotRef = useRef(0)
  const shownIds = useRef<Set<string>>(new Set())
  const isFirstPoll = useRef(true)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const slots = [-120, -60, 0, 60, 120]

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(APPS_URL)
        const json = await res.json()
        if (!json.answers || !Array.isArray(json.answers)) return
        setTotalAnswers(json.total || 0)
        if (isFirstPoll.current) {
          json.answers.forEach((a: any) => shownIds.current.add(a.timestamp))
          isFirstPoll.current = false
        } else {
          json.answers.forEach((a: any) => {
            if (!shownIds.current.has(a.timestamp)) {
              shownIds.current.add(a.timestamp)
              addWord(a.word)
            }
          })
        }
      } catch(e) { console.error('Poll error:', e) }
    }
    poll()
    const iv = setInterval(poll, 3000)
    return () => clearInterval(iv)
  }, [])

  function addWord(word: string) {
    const id = Math.random().toString(36).slice(2)
    const x = slots[slotRef.current % slots.length]
    slotRef.current++
    setWords(prev => [...prev, { id, word, x }])
    setTimeout(() => setWords(prev => prev.filter(w => w.id !== id)), 10000)
  }

  function playFootstep() {
    if (!soundOn || !audioCtxRef.current) return
    try {
      const ctx = audioCtxRef.current
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3) * 0.3
      const src = ctx.createBufferSource()
      src.buffer = buf
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'; filter.frequency.value = 200
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
      src.start()
    } catch {}
  }

  useEffect(() => {
    const iv = setInterval(playFootstep, 500)
    return () => clearInterval(iv)
  }, [soundOn])

  function toggleSound() {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioCtxRef.current.resume()
    setSoundOn(s => !s)
  }

  async function loadStats() {
    try {
      const res = await fetch(APPS_URL)
      const json = await res.json()
      if (json.stats) setStats(json.stats)
      setTotalAnswers(json.total || 0)
    } catch {}
  }

  return (
    <div style={{ height: '100vh', background: '#f4f1ee', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Helvetica Neue', sans-serif" }}>

      {/* TOPBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', flexShrink: 0 }}>
        <button onClick={toggleSound} style={{ background: soundOn ? '#1a1520' : '#f0ece6', border: '1px solid #d8d0c8', borderRadius: 20, padding: '5px 12px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', color: soundOn ? 'white' : '#6a5a4a', display: 'flex', alignItems: 'center', gap: 5 }}>
          {soundOn ? '🔊' : '🔇'} {soundOn ? 'เสียงเปิด' : 'เสียงปิด'}
        </button>
        <img src={LOGO_SRC} alt="Understand MCI" style={{ width: 80, borderRadius: 6, objectFit: 'contain' }} />
      </div>

      {/* MAIN 3-COLUMN */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 240px', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT — title + card */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px 20px 20px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4a3060', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.25, marginBottom: 6 }}>
            The Thin Line<br />of MCI
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#7a5fa8', marginBottom: 16, letterSpacing: '0.02em' }}>
            Experience &amp; Observe
          </div>
          <div style={{ background: 'white', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 12px rgba(100,60,140,.1)' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#1a1520', lineHeight: 1.65, textAlign: 'center' }}>
              เมื่อความทรงจำเริ่มพร่าเลือน<br />
              ด้วย<em style={{ color: '#7a3fb8' }}>ภาวะ MCI</em><br />
              คุณจะสังเกตเห็นไหม?
            </div>
          </div>
        </div>

        {/* CENTER — granny + floating words */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {words.map(w => (
            <div key={w.id} style={{ position: 'absolute', left: `calc(50% + ${w.x}px)`, bottom: '40%', transform: 'translateX(-50%)', fontSize: 14, fontWeight: 600, color: '#4a3070', background: 'rgba(235,228,250,.97)', border: '1.5px solid rgba(120,80,180,.4)', padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(100,60,180,.2)', animation: 'wf 10s ease forwards', zIndex: 20, pointerEvents: 'none' }}>
              {w.word}
            </div>
          ))}
          <svg style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }} width="200" height="140" viewBox="0 0 200 140" fill="none">
            <line x1="100" y1="0" x2="8" y2="140" stroke="#c4beb8" strokeWidth=".8" opacity=".5" />
            <line x1="100" y1="0" x2="192" y2="140" stroke="#c4beb8" strokeWidth=".8" opacity=".5" />
          </svg>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(180deg,#dedad4,#d0ccc6)', borderRadius: '50% 50% 0 0 / 10% 10% 0 0', zIndex: 2 }} />
          <div style={{ position: 'absolute', bottom: '28%', left: '50%', transform: 'translateX(-50%)', animation: 'gwalk 5.5s ease-in-out infinite', zIndex: 3 }}>
            <div style={{ animation: 'gbob .55s ease-in-out infinite' }}>
              <img src={GRANNY_SRC} alt="granny" style={{ height: '40vh', width: 'auto', display: 'block' }} />
            </div>
          </div>
        </div>

        {/* RIGHT — QR + scan */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px 28px 20px 16px', gap: 12 }}>
          <img src={QR_SRC} alt="QR" style={{ width: 110, height: 110, borderRadius: 10, border: '1px solid #d8c8f0' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1520', textAlign: 'center' }}>📱 Scan QR เพื่อร่วมสังเกต</div>
          <div style={{ fontSize: 11, color: '#9a8fa0', textAlign: 'center', lineHeight: 1.6 }}>
            เปิดในมือถือ → เลือกอาการ<br />ที่เข้าข่ายภาวะก่อนอัลไซเมอร์ (MCI)<br />หากเลือกถูก คำตอบจะลอยขึ้นจอนี้
          </div>
          <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#cc3333', textAlign: 'center', width: '100%' }}>🔴 กดเลือกอาการ MCI บนมือถือ</div>
          <button onClick={() => { loadStats(); setShowStats(true) }} style={{ background: '#1a1520', color: 'white', border: 'none', borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%' }}>📊 ดูผลสถิติ</button>
        </div>
      </div>

      {showStats && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowStats(false) }} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(10,5,20,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 20, width: '90%', maxWidth: 340, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>📊 ผลการร่วมสังเกต</div>
              <button onClick={() => setShowStats(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ background: '#f5f0ff', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: '#6a3fa0' }}>ผู้ร่วมตอบคำถามทั้งหมด</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#6a3fa0' }}>{totalAnswers} ครั้ง</div>
            </div>
            {stats.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', fontSize: 12, padding: '20px 0' }}>ยังไม่มีข้อมูล</div>
            ) : stats.map((s, i) => {
              const max = Math.max(...stats.map(x => x.count), 1)
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, flex: 1, paddingRight: 8, lineHeight: 1.4 }}>ข้อ {s.question_id}<br /><span style={{ color: '#888', fontSize: 10 }}>{s.word}</span></div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#6a3fa0' }}>{s.count} คน</div>
                  </div>
                  <div style={{ height: 6, background: '#f0eaff', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#7a3fb8,#a855d4)', borderRadius: 3, width: `${Math.round(s.count / max * 100)}%`, transition: 'width .6s ease' }} />
                  </div>
                  {i < stats.length - 1 && <div style={{ height: 0.5, background: '#f0eaff', marginTop: 10 }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes gwalk{0%,100%{transform:translateX(-50%);}52%{transform:translateX(calc(-50% - 14px)) rotate(-3deg);}63%{transform:translateX(calc(-50% + 14px)) rotate(3deg);}74%{transform:translateX(calc(-50% - 7px)) rotate(-1.5deg);}83%{transform:translateX(-50%) rotate(0);}}
        @keyframes gbob{0%,100%{transform:translateY(0);}50%{transform:translateY(-3px);}}
        @keyframes wf{0%{opacity:0;transform:translateX(-50%) translateY(0);}12%{opacity:1;transform:translateX(-50%) translateY(-20px);}80%{opacity:1;transform:translateX(-50%) translateY(-180px);}100%{opacity:0;transform:translateX(-50%) translateY(-220px);}}
      `}</style>
    </div>
  )
}
