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
  const slots = [-200, -120, -40, 40, 120, 200]

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
    <div style={{ height: '100vh', background: '#f4f1ee', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px 0', flexShrink: 0 }}>
        <button onClick={toggleSound} style={{ background: soundOn ? '#1a1520' : '#f0ece6', border: '1px solid #d8d0c8', borderRadius: 20, padding: '6px 12px', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', color: soundOn ? 'white' : '#6a5a4a', display: 'flex', alignItems: 'center', gap: 5 }}>
          {soundOn ? '🔊' : '🔇'} {soundOn ? 'เสียงเปิด' : 'เสียงปิด'}
        </button>
        <img src={LOGO_SRC} alt="Understand MCI" style={{ width: 80, borderRadius: 6, objectFit: 'contain' }} />
      </div>

      <div style={{ textAlign: 'center', padding: '4px 20px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#4a3060', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.2 }}>The Thin Line of MCI</div>
        <div style={{ fontSize: 10, fontWeight: 500, color: '#7a5fa8', marginTop: 1 }}>Experience &amp; Observe</div>
      </div>

      <div style={{ textAlign: 'center', padding: '4px 20px 0', flexShrink: 0 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '6px 14px', boxShadow: '0 1px 8px rgba(100,60,140,.1)', display: 'inline-block', maxWidth: 400 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 12, color: '#1a1520', lineHeight: 1.4 }}>
            เมื่อความทรงจำเริ่มพร่าเลือน<br />ด้วย<em style={{ color: '#7a3fb8' }}>ภาวะ MCI</em><br />คุณจะสังเกตเห็นไหม?
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
          {words.map(w => (
            <div key={w.id} style={{ position: 'absolute', left: `calc(50% + ${w.x}px)`, bottom: '45%', transform: 'translateX(-50%)', fontSize: 15, fontWeight: 600, color: '#4a3070', background: 'rgba(235,228,250,.97)', border: '1.5px solid rgba(120,80,180,.4)', padding: '7px 16px', borderRadius: 24, whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(100,60,180,.2)', animation: 'wf 10s ease forwards' }}>
              {w.word}
            </div>
          ))}
        </div>
        <svg style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }} width="200" height="140" viewBox="0 0 200 140" fill="none">
          <line x1="100" y1="0" x2="8" y2="140" stroke="#c4beb8" strokeWidth=".8" opacity=".5" />
          <line x1="100" y1="0" x2="192" y2="140" stroke="#c4beb8" strokeWidth=".8" opacity=".5" />
        </svg>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%', background: 'linear-gradient(180deg,#dedad4,#d0ccc6)', borderRadius: '50% 50% 0 0 / 8% 8% 0 0', zIndex: 2 }} />
        <div style={{ position: 'absolute', bottom: '26%', left: '50%', transform: 'translateX(-50%)', animation: 'gwalk 5.5s ease-in-out infinite', zIndex: 3 }}>
          <div style={{ animation: 'gbob .55s ease-in-out infinite' }}>
            <img src={GRANNY_SRC} alt="granny" style={{ height: '35vh', width: 'auto', display: 'block' }} />
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderTop: '1px solid #e0dada', padding: '10px 20px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
          <img src={QR_SRC} alt="QR" style={{ width: 100, height: 100, borderRadius: 8, border: '1px solid #e0d8d0' }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1520', marginTop: 6, textAlign: 'center' }}>📱 Scan QR เพื่อร่วมสังเกต</div>
          <div style={{ fontSize: 10, color: '#9a8fa0', lineHeight: 1.55, textAlign: 'center', marginTop: 2 }}>
            เปิดในมือถือ → เลือกอาการที่เข้าข่ายภาวะก่อนอัลไซเมอร์ (MCI)<br />หากเลือกถูก คำตอบของคุณจะลอยขึ้นเหนือคุณยายบนจอนี้
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          <div style={{ background: '#f5f0ff', border: '1px solid #d8c8f0', borderRadius: 8, padding: '6px 14px', fontSize: 10, color: '#6a3fa0', textAlign: 'center', lineHeight: 1.5 }}>🔴 กดเลือกอาการภาวะ MCI บนมือถือของคุณ</div>
          <button onClick={() => { loadStats(); setShowStats(true) }} style={{ background: '#1a1520', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: 'inherit', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>📊 ดูผลสถิติ</button>
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
        @keyframes wf{0%{opacity:0;transform:translateX(-50%) translateY(0);}12%{opacity:1;transform:translateX(-50%) translateY(-30px);}80%{opacity:1;transform:translateX(-50%) translateY(-200px);}100%{opacity:0;transform:translateX(-50%) translateY(-250px);}}
      `}</style>
    </div>
  )
}
