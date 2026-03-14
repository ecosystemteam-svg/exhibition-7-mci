'use client'
import { useState } from 'react'
import { LOGO_SRC } from '@/lib/images'

const APPS_URL = '/api/proxy'

const QUESTIONS = [
  { id: 1, category: 'ด้านความจำ', question: 'ลองสังเกตอาการด้านความจำ แล้วเลือกข้อที่ตรงกับภาวะก่อนอัลไซเมอร์ (MCI)', correctAnswer: 'ข. ลืมบ่อยจนกังวล และต้องเริ่มใช้ตัวช่วยจด', options: ['ก. ลืมบ้าง แต่นึกออกเองภายหลัง', 'ข. ลืมบ่อยจนกังวล และต้องเริ่มใช้ตัวช่วยจด', 'ค. ลืมเหตุการณ์สำคัญ และจำไม่ได้ว่าลืม'], displayWord: 'ลืมบ่อยจนกังวล' },
  { id: 2, category: 'เวลาและสถานที่', question: 'ลองสังเกตอาการด้านเวลาและสถานที่ แล้วเลือกข้อที่ตรงกับภาวะก่อนอัลไซเมอร์ (MCI)', correctAnswer: 'ข. เริ่มสับสนวันที่หรือเดือน แต่ยังรู้ว่าตัวเองอยู่ที่ไหน', options: ['ก. รู้ วัน/เวลา/สถานที่ แม่นยำเสมอ', 'ข. เริ่มสับสนวันที่หรือเดือน แต่ยังรู้ว่าตัวเองอยู่ที่ไหน', 'ค. หลงทิศทางในที่คุ้นเคย หรือสับสนช่วงเวลา'], displayWord: 'สับสนวันที่' },
  { id: 3, category: 'การแก้ปัญหา', question: 'ลองสังเกตอาการด้านการแก้ปัญหา แล้วเลือกข้อที่ตรงกับภาวะก่อนอัลไซเมอร์ (MCI)', correctAnswer: 'ข. เริ่มจัดการเรื่องเงินหรือแผนซับซ้อนได้ยากขึ้น', options: ['ก. ตัดสินใจเรื่องยากๆ ได้ตามปกติ', 'ข. เริ่มจัดการเรื่องเงินหรือแผนซับซ้อนได้ยากขึ้น', 'ค. สูญเสียวิจารณญาณ แยกแยะผิดถูกลำบาก'], displayWord: 'จัดการเงินยากขึ้น' },
  { id: 4, category: 'กิจกรรมนอกบ้าน', question: 'ลองสังเกตอาการด้านกิจกรรมนอกบ้าน แล้วเลือกข้อที่ตรงกับภาวะก่อนอัลไซเมอร์ (MCI)', correctAnswer: 'ข. เริ่มเลี่ยงงานที่ซับซ้อน หรือไม่อยากเข้าสังคม', options: ['ก. ทำงานและเข้าสังคมได้คล่องแคล่ว', 'ข. เริ่มเลี่ยงงานที่ซับซ้อน หรือไม่อยากเข้าสังคม', 'ค. ไม่สามารถทำงานหรือเข้าสังคมได้ตามปกติ'], displayWord: 'เลี่ยงสังคม' },
  { id: 5, category: 'งานบ้าน / งานอดิเรก', question: 'ลองสังเกตอาการด้านงานบ้านและงานอดิเรก แล้วเลือกข้อที่ตรงกับภาวะก่อนอัลไซเมอร์ (MCI)', correctAnswer: 'ข. งานอดิเรกเริ่มมีข้อผิดพลาด หรือทำช้าลงมาก', options: ['ก. ทำงานบ้านและงานอดิเรกได้ปกติ', 'ข. งานอดิเรกเริ่มมีข้อผิดพลาด หรือทำช้าลงมาก', 'ค. ลืมวิธีทำงานบ้านพื้นฐาน หรือทิ้งงานที่เคยชอบ'], displayWord: 'ทำช้าลงผิดบ่อย' },
  { id: 6, category: 'การดูแลตัวเอง', question: 'ลองสังเกตอาการด้านการดูแลตัวเอง แล้วเลือกข้อที่ตรงกับภาวะก่อนอัลไซเมอร์ (MCI)', correctAnswer: 'ข. ยังดูแลตัวเองได้ แต่เริ่มช้าลงหรือต้องใช้ความพยายามมากขึ้น', options: ['ก. ดูแลความสะอาดร่างกายได้เรียบร้อยคล่องแคล่ว', 'ข. ยังดูแลตัวเองได้ แต่เริ่มช้าลงหรือต้องใช้ความพยายามมากขึ้น', 'ค. ต้องมีคนช่วยดูแล หรือคอยเตือนให้ทำกิจวัตร'], displayWord: 'ดูแลตัวเองช้าลง' },
]

type Phase = 'intro' | 'quiz' | 'result'

export default function PlayPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionId] = useState(() => Math.random().toString(36).slice(2))
  const [sending, setSending] = useState(false)

  const question = QUESTIONS[currentIndex]
  const isCorrect = selected === question?.correctAnswer
  const isLast = currentIndex === QUESTIONS.length - 1

  async function handleSubmit() {
    if (!selected || submitted || sending) return
    setSending(true)
    if (isCorrect) {
      try { await fetch(`${APPS_URL}?action=write&question_id=${question.id}&word=${encodeURIComponent(question.displayWord)}&session_id=${sessionId}`) } catch {}
      setCorrectCount(c => c + 1)
    }
    setSubmitted(true)
    setSending(false)
  }

  function handleNext() {
    if (isLast) { setPhase('result') }
    else { setCurrentIndex(i => i + 1); setSelected(null); setSubmitted(false) }
  }

  function handleRestart() {
    setPhase('intro'); setCurrentIndex(0); setSelected(null); setSubmitted(false); setCorrectCount(0)
  }

  if (phase === 'intro') return (
    <div style={S.screen}>
      <div style={S.card}>
        <img src={LOGO_SRC} alt="Understand MCI" style={{ width: 90, borderRadius: 8, marginBottom: 20 }} />
        <div style={{ fontSize: 20, fontWeight: 800, color: '#4a3060', textAlign: 'center', lineHeight: 1.4, marginBottom: 12 }}>ลองสังเกตอาการ 6 ด้าน</div>
        <div style={{ fontSize: 13, color: '#6a5a7a', textAlign: 'center', marginBottom: 20, lineHeight: 1.75 }}>
          เลือกข้อที่ตรงกับ<strong>ภาวะก่อนอัลไซเมอร์ (MCI)</strong><br />
          หากคุณเลือกถูก แปลว่าเวลาเจอผู้มีอาการเหล่านี้<br />
          คุณจะ<em style={{ color: '#7a3fb8' }}> เอ๊ะ </em>และช่วยคัดกรองได้
        </div>
        <div style={{ background: '#f5f0ff', borderRadius: 12, padding: '12px 16px', marginBottom: 20, width: '100%' }}>
          {QUESTIONS.map((q, i) => (
            <div key={i} style={{ fontSize: 12, color: '#6a3fa0', padding: '3px 0', display: 'flex', gap: 8 }}>
              <span style={{ opacity: 0.5, minWidth: 16 }}>{i + 1}.</span>{q.category}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#a090b0', textAlign: 'center', marginBottom: 20 }}>✨ ตอบถูก — คำตอบของคุณจะลอยขึ้นจอใหญ่!</div>
        <button onClick={() => setPhase('quiz')} style={S.btnPrimary}>เริ่มสังเกต →</button>
      </div>
    </div>
  )

  if (phase === 'result') {
    const pct = Math.round((correctCount / QUESTIONS.length) * 100)
    return (
      <div style={S.screen}>
        <div style={S.card}>
          <img src={LOGO_SRC} alt="Understand MCI" style={{ width: 70, borderRadius: 8, marginBottom: 16 }} />
          <div style={{ fontSize: 44, marginBottom: 8 }}>{pct >= 80 ? '🧠' : pct >= 50 ? '👀' : '💡'}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#4a3060', marginBottom: 4 }}>{correctCount} / {QUESTIONS.length} ด้าน</div>
          <div style={{ fontSize: 13, color: '#7a5fa8', marginBottom: 20, fontWeight: 600 }}>
            {pct >= 80 ? 'คุณสังเกตเห็น MCI ได้ดีมาก!' : pct >= 50 ? 'คุณเริ่มเห็นสัญญาณ MCI แล้ว' : 'MCI ซ่อนเร้นกว่าที่คิด'}
          </div>
          <div style={{ background: '#f5f0ff', borderRadius: 14, padding: '16px 18px', marginBottom: 24, fontSize: 13, color: '#5a3090', lineHeight: 1.75, textAlign: 'center', width: '100%' }}>
            MCI คือ <strong>เส้นแบ่งบางๆ</strong><br />ระหว่างการลืมตามปกติ กับอัลไซเมอร์<br />
            <span style={{ fontSize: 12, color: '#8a6ab0' }}>การสังเกตเร็ว = โอกาสดูแลได้ทัน</span>
          </div>
          <button onClick={handleRestart} style={S.btnSecondary}>ลองใหม่อีกครั้ง</button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.screen}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <img src={LOGO_SRC} alt="logo" style={{ width: 50, borderRadius: 6 }} />
          <div style={{ fontSize: 12, color: '#9a8fa0', fontWeight: 600 }}>{currentIndex + 1} / {QUESTIONS.length}</div>
        </div>
        <div style={{ height: 4, background: '#e8e0f0', borderRadius: 2, marginBottom: 22, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#7a3fb8,#a855d4)', borderRadius: 2, width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%`, transition: 'width .4s ease' }} />
        </div>
        <div style={{ display: 'inline-block', background: '#f0e8ff', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#7a3fb8', marginBottom: 12 }}>{question.category}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1520', lineHeight: 1.6, marginBottom: 22 }}>{question.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {question.options.map((opt) => {
            const isSelected = selected === opt
            const isOptCorrect = opt === question.correctAnswer
            let bg = 'white', border = '1.5px solid #e0d8f0', color = '#1a1520', dotBg = '#f0eaff', icon = ''
            if (submitted) {
              if (isOptCorrect) { bg = '#f0fdf4'; border = '1.5px solid #4ade80'; color = '#166534'; dotBg = '#4ade80'; icon = '✓' }
              else if (isSelected) { bg = '#fff1f2'; border = '1.5px solid #f87171'; color = '#991b1b'; dotBg = '#f87171'; icon = '✗' }
            } else if (isSelected) { bg = '#f5f0ff'; border = '1.5px solid #7a3fb8'; color = '#4a1090'; dotBg = '#7a3fb8'; icon = '●' }
            return (
              <button key={opt} onClick={() => !submitted && setSelected(opt)} style={{ background: bg, border, borderRadius: 14, padding: '13px 15px', textAlign: 'left', fontSize: 13.5, color, fontFamily: 'inherit', cursor: submitted ? 'default' : 'pointer', lineHeight: 1.55, transition: 'all .15s ease', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', marginTop: 1, background: dotBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: icon ? 'white' : 'transparent', fontWeight: 700 }}>{icon}</span>
                {opt}
              </button>
            )
          })}
        </div>
        {submitted && (
          <div style={{ background: isCorrect ? '#f0fdf4' : '#fff7ed', border: `1px solid ${isCorrect ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 14, padding: '13px 16px', marginBottom: 18, fontSize: 13, color: isCorrect ? '#166534' : '#9a3412', lineHeight: 1.65 }}>
            {isCorrect ? '✨ ถูกต้อง! คำตอบของคุณกำลังลอยขึ้นจอใหญ่' : <><span>💡 คำตอบที่ถูกคือ:</span><br /><strong style={{ marginTop: 4, display: 'block' }}>{question.correctAnswer}</strong></>}
          </div>
        )}
        {!submitted ? (
          <button onClick={handleSubmit} disabled={!selected || sending} style={{ ...S.btnPrimary, opacity: !selected || sending ? 0.45 : 1, cursor: !selected || sending ? 'not-allowed' : 'pointer' }}>
            {sending ? 'กำลังส่ง...' : 'ยืนยันคำตอบ'}
          </button>
        ) : (
          <button onClick={handleNext} style={S.btnPrimary}>{isLast ? 'ดูผลลัพธ์ →' : 'ด้านถัดไป →'}</button>
        )}
        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  screen: { minHeight: '100vh', background: '#f4f1ee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0' },
  card: { background: 'white', borderRadius: 24, padding: '30px 24px', width: '100%', maxWidth: 360, margin: '0 18px', boxShadow: '0 4px 24px rgba(100,60,140,.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  btnPrimary: { width: '100%', background: 'linear-gradient(135deg,#7a3fb8,#a855d4)', color: 'white', border: 'none', borderRadius: 14, padding: '15px 20px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' },
  btnSecondary: { width: '100%', background: '#f5f0ff', color: '#6a3fa0', border: '1.5px solid #d8c8f0', borderRadius: 14, padding: '14px 20px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' },
}
