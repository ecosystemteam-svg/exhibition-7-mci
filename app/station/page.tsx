'use client'
import { useEffect, useState, useRef } from 'react'
import { LOGO_SRC, GRANNY_SRC } from '@/lib/images'

const Qs = [
  {topic:"ด้านความจำ",q:"ข้อใดคืออาการของ MCI ด้านความจำ?",choices:["ก. ลืมสิ่งของวางไว้บ้างเป็นครั้งคราว","ข. ลืมบ่อยจนกังวล ต้องพึ่งคนอื่นช่วยจำ","ค. จำชื่อดาราไม่ค่อยได้"],correct:1,word:"ลืมบ่อยจนกังวล"},
  {topic:"ด้านเวลาและสถานที่",q:"ข้อใดบ่งชี้ความผิดปกติด้านเวลาและสถานที่?",choices:["ก. สับสนวันที่ ไม่แน่ใจว่าอยู่ที่ไหน","ข. ลืมนัดหมายบ้างเป็นครั้งคราว","ค. จำวันหยุดนักขัตฤกษ์ไม่ได้"],correct:0,word:"สับสนวันที่"},
  {topic:"ด้านการแก้ปัญหา",q:"สัญญาณ MCI ด้านการแก้ปัญหาคืออะไร?",choices:["ก. คิดเลขในใจได้ช้าลง","ข. จัดการเรื่องเงินและวางแผนยากขึ้นมาก","ค. ไม่ชอบแก้ปัญหาซับซ้อน"],correct:1,word:"จัดการเงินยากขึ้น"},
  {topic:"ด้านกิจกรรมนอกบ้าน",q:"พฤติกรรมใดสะท้อน MCI ด้านกิจกรรมนอกบ้าน?",choices:["ก. ไม่อยากเดินทางไกล","ข. หลีกเลี่ยงกิจกรรมสังคมที่เคยชอบ","ค. ชอบอยู่บ้านมากขึ้น"],correct:1,word:"เลี่ยงสังคม"},
  {topic:"ด้านงานบ้านและงานอดิเรก",q:"ข้อใดเป็นสัญญาณ MCI ด้านงานบ้าน?",choices:["ก. ทำงานบ้านช้าลง และผิดพลาดบ่อยขึ้น","ข. ไม่สนุกกับงานอดิเรกเหมือนเดิม","ค. ลืมซื้อของที่ต้องการ"],correct:0,word:"ทำช้าลงผิดบ่อย"},
  {topic:"ด้านการดูแลตัวเอง",q:"สัญญาณ MCI ด้านการดูแลตัวเองคืออะไร?",choices:["ก. ใช้เวลาแต่งตัวนานขึ้น","ข. ดูแลสุขอนามัยตัวเองได้ช้าลงผิดปกติ","ค. ไม่ค่อยสนใจรูปลักษณ์"],correct:1,word:"ดูแลตัวเองช้าลง"},
]

const SL = ["ความจำ","เวลา","ปัญหา","สังคม","งานบ้าน","ตนเอง"]

interface Q { topic:string; q:string; choices:string[]; correct:number; word:string }
interface Stat { c:number; t:number }

export default function StationPage() {
  const [cur, setCur] = useState(0)
  const [ans, setAns] = useState(0)
  const [ok, setOk] = useState(0)
  const [played, setPlayed] = useState(0)
  const [stats, setStats] = useState<Stat[]>(Array(6).fill(null).map(()=>({c:0,t:0})))
  const [feedback, setFeedback] = useState(''  )
  const [feedOk, setFeedOk] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const [words, setWords] = useState<{id:string;word:string;x:number;ok:boolean}[]>([])
  const [soundOn, setSoundOn] = useState(false)
  const [done, setDone] = useState(false)
  const audioCtxRef = useRef<AudioContext|null>(null)
  const masterGainRef = useRef<GainNode|null>(null)
  const playingRef = useRef(false)

  function addWord(word:string, good:boolean) {
    const id = Math.random().toString(36).slice(2)
    const x = 20 + Math.random()*60
    setWords(prev=>[...prev,{id,word,x,ok:good}])
    setTimeout(()=>setWords(prev=>prev.filter(w=>w.id!==id)),4500)
  }

  function pick(i:number) {
    if(disabled) return
    setDisabled(true)
    const q = Qs[cur]
    setStats(prev=>{
      const n=[...prev]; n[cur]={c:prev[cur].c+(i===q.correct?1:0),t:prev[cur].t+1}; return n
    })
    setAns(a=>a+1)
    if(i===q.correct) {
      setOk(o=>o+1)
      setFeedOk(true)
      setFeedback('ถูกต้อง! นี่คืออาการที่ควรระวัง')
      addWord(q.word, true)
    } else {
      setFeedOk(false)
      setFeedback('ยังไม่ใช่ — ดูคำตอบที่ถูกต้อง')
      addWord(q.word, false)
    }
    setTimeout(()=>{
      if(cur+1 >= Qs.length) {
        setPlayed(p=>p+1)
        setDone(true)
      } else {
        setCur(c=>c+1)
        setFeedback('')
        setDisabled(false)
      }
    }, 1900)
  }

  function reset() {
    setCur(0); setAns(0); setOk(0); setFeedback(''); setDisabled(false); setDone(false)
  }

  function buildAmbient() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.connect(ctx.destination)
    const notes = [174.61,220.00,261.63,329.63]
    notes.forEach((freq,i)=>{
      const o=ctx.createOscillator(); const g=ctx.createGain()
      o.type='sine'; o.frequency.value=freq+(i*0.3); g.gain.value=0.08
      o.connect(g); g.connect(master); o.start()
    })
    const drone=ctx.createOscillator(); const dg=ctx.createGain()
    drone.type='sine'; drone.frequency.value=87.3; dg.gain.value=0.06
    drone.connect(dg); dg.connect(master); drone.start()
    const lfo=ctx.createOscillator(); const lg=ctx.createGain()
    lfo.frequency.value=0.1; lg.gain.value=0.02
    lfo.connect(lg); lg.connect(master.gain); lfo.start()
    audioCtxRef.current=ctx; masterGainRef.current=master
  }

  function toggleSound() {
    if(!audioCtxRef.current) buildAmbient()
    const ctx=audioCtxRef.current!; const master=masterGainRef.current!
    ctx.resume()
    if(!playingRef.current) {
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
      master.gain.linearRampToValueAtTime(0.7, ctx.currentTime+2)
      playingRef.current=true; setSoundOn(true)
    } else {
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
      master.gain.linearRampToValueAtTime(0, ctx.currentTime+1.5)
      playingRef.current=false; setSoundOn(false)
    }
  }

  const q = Qs[cur] || Qs[0]

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'#f4f1ee',fontFamily:"'Helvetica Neue',Arial,sans-serif",overflow:'hidden'}}>

      {/* TOPBAR */}
      <div style={{background:'#3d2460',padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <img src={LOGO_SRC} style={{height:36,width:'auto',borderRadius:4}} alt="logo"/>
          <div>
            <div style={{fontSize:10,color:'#c4a8e8',letterSpacing:'0.12em'}}>UNDERSTAND MCI 2026</div>
            <div style={{fontSize:15,fontWeight:600,color:'#fff',letterSpacing:'0.03em'}}>The Thin Line of MCI — Experience &amp; Observe</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={toggleSound} style={{background:soundOn?'rgba(255,255,255,.3)':'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.3)',borderRadius:20,padding:'5px 14px',color:'#fff',fontSize:12,fontFamily:'inherit',cursor:'pointer'}}>
            {soundOn?'🔊 ปิดเสียง':'🔇 เปิดเสียง'}
          </button>
          <div style={{fontSize:12,color:'#c4a8e8'}}>ตอบถูก: {ok} / {ans}</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:'340px 1fr 220px',overflow:'hidden',minHeight:0}}>

        {/* LEFT */}
        <div style={{padding:'24px 20px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:16,border:'1px solid #e0d4f5',padding:'22px 20px',display:'flex',flexDirection:'column',gap:14,boxShadow:'0 4px 20px rgba(80,40,120,.08)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{background:'#3d2460',color:'#fff',fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:20}}>
                {done?'จบแล้ว!':`ข้อ ${cur+1} / 6`}
              </div>
              <div style={{fontSize:12,color:'#7a5fa8',fontWeight:500}}>{done?'':q.topic}</div>
            </div>
            <div style={{fontSize:15,fontWeight:500,color:'#1a1520',lineHeight:1.65,minHeight:52}}>
              {done?`ตอบถูก ${ok} จาก 6 ข้อ — ขอบคุณที่ร่วมสังเกต`:q.q}
            </div>
            <div style={{height:1,background:'#f0eaff'}}/>
            {done?(
              <button onClick={reset} style={{width:'100%',padding:'12px 16px',background:'#3d2460',color:'#fff',border:'none',borderRadius:12,fontSize:14,fontFamily:'inherit',cursor:'pointer',fontWeight:600}}>เล่นใหม่อีกครั้ง</button>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {q.choices.map((ch,i)=>{
                  const isCorrect = i===q.correct
                  const wasChosen = disabled && i===q.correct
                  return (
                    <button key={i} onClick={()=>pick(i)} disabled={disabled}
                      style={{width:'100%',padding:'12px 16px',border:`1.5px solid ${disabled&&isCorrect?'#1D9E75':'#d8c8f0'}`,borderRadius:12,background:disabled&&isCorrect?'#E1F5EE':'white',color:disabled&&isCorrect?'#085041':'#1a1520',fontSize:14,fontFamily:'inherit',textAlign:'left',cursor:disabled?'default':'pointer',lineHeight:1.5,transition:'background .15s'}}>
                      {ch}
                    </button>
                  )
                })}
              </div>
            )}
            <div style={{fontSize:12,fontWeight:600,minHeight:18,color:feedOk?'#0F6E56':'#A32D2D'}}>{feedback}</div>
          </div>
        </div>

        {/* CENTER */}
        <div style={{position:'relative',overflow:'hidden',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:100,background:'#dedad4',borderRadius:'50% 50% 0 0 / 12% 12% 0 0',zIndex:1}}/>
          <div style={{position:'absolute',bottom:90,left:'50%',animation:'walk 6s ease-in-out infinite',zIndex:3}}>
            <div style={{animation:'bob 0.55s ease-in-out infinite'}}>
              <img src={GRANNY_SRC} style={{height:'42vh',width:'auto',display:'block'}} alt="granny"/>
            </div>
          </div>
          {words.map(w=>(
            <div key={w.id} style={{position:'absolute',left:`${w.x}%`,bottom:110,transform:'translateX(-50%)',fontSize:14,fontWeight:600,padding:'6px 16px',borderRadius:24,whiteSpace:'nowrap',animation:'floatUp 4s ease forwards',background:w.ok?'#E1F5EE':'#FCEBEB',color:w.ok?'#085041':'#501313',border:`1.5px solid ${w.ok?'#1D9E75':'#A32D2D'}`,pointerEvents:'none',zIndex:10}}>
              {w.word}
            </div>
          ))}
          <div style={{position:'absolute',top:16,left:'50%',transform:'translateX(-50%)',background:'rgba(255,255,255,.85)',border:'1px solid #e0d4f5',borderRadius:12,padding:'8px 18px',textAlign:'center',zIndex:20}}>
            <div style={{fontSize:11,color:'#7a5fa8'}}>คำตอบจะลอยขึ้นที่นี่</div>
          </div>
        </div>

        {/* RIGHT - bar chart */}
        <div style={{background:'white',borderLeft:'1px solid #e8e2da',padding:'18px 14px',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1a1520'}}>สถิติการตอบ</div>
          <div style={{fontSize:11,color:'#9a8fa0',marginBottom:4}}>% ตอบถูกแต่ละด้าน</div>
          <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
            <div style={{display:'flex',alignItems:'flex-end',gap:5,height:200}}>
              {stats.map((s,i)=>{
                const pct=s.t?Math.round(s.c/s.t*100):0
                const bh=Math.max(4,Math.round(pct/100*200))
                const col=pct>=70?'#1D9E75':pct>=40?'#BA7517':'#A32D2D'
                const active=i===cur&&!done
                return (
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:200}}>
                    <div style={{fontSize:9,fontWeight:600,color:s.t?col:'#ccc',marginBottom:2}}>{s.t?pct+'%':''}</div>
                    <div style={{width:'80%',borderRadius:'4px 4px 0 0',height:bh,background:s.t?col:'#f0eaff',transition:'height .5s ease',outline:active?'2px solid #7a3fb8':'none',outlineOffset:2}}/>
                  </div>
                )
              })}
            </div>
            <div style={{height:1,background:'#e8e2da',marginTop:4}}/>
            <div style={{display:'flex',gap:5,marginTop:6}}>
              {SL.map((l,i)=>(
                <div key={i} style={{flex:1,fontSize:9,color:'#9a8fa0',textAlign:'center',lineHeight:1.3}}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{fontSize:11,color:'#9a8fa0',borderTop:'1px solid #e8e2da',paddingTop:8,textAlign:'center'}}>ผู้เล่น: {played} รอบ</div>
        </div>
      </div>

      <style>{`
        @keyframes floatUp{0%{opacity:0;transform:translateX(-50%) translateY(0);}12%{opacity:1;transform:translateX(-50%) translateY(-24px);}80%{opacity:1;transform:translateX(-50%) translateY(-180px);}100%{opacity:0;transform:translateX(-50%) translateY(-220px);}}
        @keyframes bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
        @keyframes walk{0%,100%{transform:translateX(-50%);}48%{transform:translateX(calc(-50% - 16px)) rotate(-2deg);}60%{transform:translateX(calc(-50% + 16px)) rotate(2deg);}72%{transform:translateX(calc(-50% - 8px)) rotate(-1deg);}84%{transform:translateX(-50%) rotate(0);}}
      `}</style>
    </div>
  )
}
