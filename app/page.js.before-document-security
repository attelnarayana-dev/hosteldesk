 "use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Tesseract from "tesseract.js";

function Mic({label,value,onChange,area=false}){const [on,setOn]=useState(false),ref=useRef();function go(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return alert("Mic speech recognition works best in Chrome/Edge.");if(on){ref.current?.stop();return}const r=new SR();ref.current=r;r.lang="en-IN";r.onstart=()=>setOn(true);r.onend=()=>setOn(false);r.onresult=e=>onChange((value?value+" ":"")+e.results[0][0].transcript);r.start()}return <div className="field"><label>{label}</label><div className="inputrow">{area?<textarea value={value} onChange={e=>onChange(e.target.value)}/>:<input value={value} onChange={e=>onChange(e.target.value)}/>}<button type="button" className={"mic "+(on?"listening":"")} onClick={go}>{on?"🔴":"🎙️"}</button></div></div>}


function StayDaysInput({value,onChange,label="Stay Days"}){
  const n=Number(value||0);
  function set(v){
    const clean=String(v).replace(/[^0-9]/g,"");
    onChange(clean);
  }
  return <div className="field">
    <label>{label}</label>
    <div className="daysInput">
      <button type="button" className="dayBtn" onClick={()=>set(Math.max(1,n-1))} disabled={!n||n<=1}>−</button>
      <input type="number" min="1" step="1" value={value} onChange={e=>set(e.target.value)} placeholder="Enter days"/>
      <button type="button" className="dayBtn" onClick={()=>set(Math.max(1,n+1))}>+</button>
      <button type="button" className="dayClear" onClick={()=>onChange("")} title="Clear stay days" aria-label="Clear stay days">×</button>
    </div>
    <div className="small" style={{marginTop:6}}>Enter 1, 2, 3... days. Use + / − to change.</div>
  </div>
}

function Camera({capture,close}){const v=useRef(),stream=useRef(),[err,setErr]=useState("");useEffect(()=>{let live=true;(async()=>{try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});if(!live)return s.getTracks().forEach(t=>t.stop());stream.current=s;v.current.srcObject=s;await v.current.play()}catch(e){setErr("Camera permission denied or camera unavailable. Click Allow and try again.")}})();return()=>{live=false;stream.current?.getTracks().forEach(t=>t.stop())}},[]);function shot(){const x=v.current,c=document.createElement("canvas");c.width=x.videoWidth;c.height=x.videoHeight;c.getContext("2d").drawImage(x,0,0,c.width,c.height);c.toBlob(b=>capture(new File([b],"camera.jpg",{type:"image/jpeg"})),"image/jpeg",.95)}return <div style={{position:"fixed",inset:0,zIndex:10,background:"#000b",display:"grid",placeItems:"center",padding:20}}><div className="card" style={{width:"min(850px,100%)"}}><div className="top"><h2>📷 Live Camera</h2><button className="secondary" onClick={close}>Close</button></div>{err?<div className="error">{err}</div>:<video ref={v} autoPlay playsInline muted style={{width:"100%",maxHeight:"65vh",background:"#111",borderRadius:10}}/>}<div className="actions" style={{marginTop:12}}>{!err&&<button className="primary" onClick={shot}>📸 Capture Photo</button>}<button className="secondary" onClick={close}>Cancel</button></div></div></div>}

function OCR({fill}){
  const [frontCam,setFrontCam]=useState(false),[backCam,setBackCam]=useState(false);
  const [frontImg,setFrontImg]=useState(""),[backImg,setBackImg]=useState("");
  const [frontStatus,setFrontStatus]=useState(""),[backStatus,setBackStatus]=useState("");

  function cleanLines(text){
    return (text||"").split(/\r?\n/)
      .map(x=>x.replace(/[|¦]+/g," ").replace(/\s+/g," ").trim())
      .filter(x=>x.length>=2);
  }
  function normalizeOCR(text){
    return (text||"")
      .replace(/[“”‘’]/g,'"')
      .replace(/[|¦]/g,"I")
      .replace(/\b([0-9OIlS]{4})[\s-]+([0-9OIlS]{4})[\s-]+([0-9OIlS]{4})\b/g,"$1 $2 $3");
  }
  function parseName(text){
    const lines=cleanLines(text);
    const labelled=lines.findIndex(x=>/^(name|nam[e3]|नाम)\s*[:.-]/i.test(x));
    if(labelled>=0){
      const same=lines[labelled].replace(/^(name|nam[e3]|नाम)\s*[:.-]?\s*/i,"").replace(/[^A-Za-z .'-]/g," ").replace(/\s+/g," ").trim();
      if(same.length>=3)return same;
      if(lines[labelled+1])return lines[labelled+1].replace(/[^A-Za-z .'-]/g," ").replace(/\s+/g," ").trim();
    }
    const dobIndex=lines.findIndex(x=>/\b(?:dob|d\.o\.b|date of birth)\b/i.test(x)||/\b\d{1,2}[\/-]\d{1,2}[\/-](?:19|20)\d{2}\b/.test(x));
    const candidates=(dobIndex>0?lines.slice(Math.max(0,dobIndex-5),dobIndex):lines.slice(0,10))
      .map(x=>x.replace(/[^A-Za-z .'-]/g," ").replace(/\s+/g," ").trim())
      .filter(x=>x.length>=3 && x.length<=50 && /[A-Za-z]{3}/.test(x))
      .filter(x=>!/(government|india|unique|identification|aadhaar|male|female|dob|date of birth|year|address|vid|uidai|father|husband|son|daughter)/i.test(x));
    return candidates.sort((a,b)=>b.length-a.length)[0]||"";
  }
  function parseDOB(text){
    return (normalizeOCR(text).match(/\b\d{1,2}[\/.\-]\d{1,2}[\/.\-](?:19|20)\d{2}\b/)||[])[0]||"";
  }
  function parseDocumentNumber(text){
    const n=normalizeOCR(text).replace(/[Oo]/g,"0").replace(/[Il|]/g,"1").replace(/[Ss]/g,"5");
    const m=n.match(/(?<!\d)(\d{4})[\s-]+(\d{4})[\s-]+(\d{4})(?!\d)/);
    return m?`${m[1]} ${m[2]} ${m[3]}`:"";
  }
  function isAddressLabel(line){
    return /\bA(?:D|D|D)RESS\b/i.test(line.replace(/[^A-Za-z]/g,"")) ||
      /\bADDRESS\b/i.test(line) || /\bAD+RESS\b/i.test(line) || /\bADDR(?:ESS)?\b/i.test(line);
  }
  function cleanAddressLine(line){
    return line
      .replace(/^[^A-Za-z0-9\u0C00-\u0C7F]+/,"")
      .replace(/[|¦]+/g," ")
      .replace(/\s+/g," ")
      .trim();
  }
  function looksLikeNoise(line){
    return /^(government|govt|india|unique identification|uidai|aadhaar|help|www\.|www|mobile|phone|dob|date of birth|male|female|year of birth)\b/i.test(line.trim());
  }
  function addressTokenScore(token){
    const t=token.replace(/[^A-Za-z0-9\u0C00-\u0C7F.-]/g,"");
    if(!t)return 0;
    if(/^(s\/o|w\/o|d\/o|c\/o|po|p\.o|dist|district|state|pin|andhra|pradesh|india)$/i.test(t))return 3;
    if(/^\d+[A-Za-z-]*$/.test(t))return 3;
    if(/[A-Za-z]{3,}/.test(t))return 2;
    if(/[A-Za-z]{1,2}$/.test(t))return 0.5;
    return 0;
  }
  function cleanAddressText(s){
    let x=cleanAddressLine(s)
      .replace(/\b(?:a+d+r+e+s+s|ad+ress|addr(?:ess)?)\b\s*[:.-]?/ig,"")
      .replace(/\s*[-–—]\s*/g," - ")
      .replace(/\s*,\s*/g,", ")
      .replace(/(?:,\s*){2,}/g,", ");
    // Remove obvious OCR fragments while preserving meaningful address initials.
    const bad=/^(?:as|se|oe|o|ty|va|nail|lets|sep|rs|dh|wie|ane|als|frr|go|lime|sk|ane|brera|sera|lee)$/i;
    x=x.split(/\s+/).filter(tok=>!bad.test(tok)).join(" ");
    // Tesseract often turns printed artefacts into isolated characters/digits
    // such as "1 I 8" or a lone "i". Keep a person's initial (e.g. "Rosayya P")
    // but drop isolated OCR noise when it is not part of S/O/W/O/C/O text.
    const parts=x.split(/\s+/).filter(Boolean), cleaned=[];
    for(let i=0;i<parts.length;i++){
      const tok=parts[i].replace(/[,.:;]+$/g,"");
      const prev=parts.slice(Math.max(0,i-3),i).join(" ");
      if(/^[0-9Il|]$/.test(tok) && !/\b(?:S\/O|W\/O|D\/O|C\/O)\s*:/i.test(prev)) continue;
      if(/^[A-Za-z]{1,2}$/.test(tok) && /^(?:i|l|ii|iii|iv|v|vi|sk|ane)$/i.test(tok)) continue;
      cleaned.push(parts[i]);
    }
    x=cleaned.join(" ");
    // Collapse repeated OCR words/phrases such as "Darsigunta Peta ... Darsigunta Peta".
    const words=x.split(/\s+/).filter(Boolean), out=[];
    for(const w of words){
      if(out.length && w.replace(/[^A-Za-z0-9]/g,"").toLowerCase()===out[out.length-1].replace(/[^A-Za-z0-9]/g,"").toLowerCase())continue;
      out.push(w);
    }
    x=out.join(" ").replace(/\s+([,.-])/g,"$1").replace(/([,.-])\s*/g,"$1 ").trim();
    return x;
  }
  function looksLikeNoise(line){
    return /^(government|govt|india|unique identification|uidai|aadhaar|help|www\.|www|mobile|phone|dob|date of birth|male|female|year of birth)\b/i.test(line.trim());
  }
  function isAddressLabel(line){
    const compact=line.replace(/[^A-Za-z]/g,"");
    return /^(ADDRESS|ADRESS|ADDR?ESS)$/i.test(compact) || /\bAD+RESS\b/i.test(line);
  }
  function parseAddress(text){
    const raw=normalizeOCR(text);
    const lines=cleanLines(raw).map(cleanAddressLine).filter(Boolean);
    const label=lines.findIndex(isAddressLabel);
    let out=[];
    if(label>=0){
      // If OCR put "Address:" and unrelated OCR fragments on the same line,
      // start at the strongest address marker (S/O, house number, PO, DIST, PIN).
      let first=lines[label].replace(/^.*?\bAD+RESS\b\s*[:.-]?/i,"").trim();
      if(first){
        const marker=first.search(/\b(?:S\/O|W\/O|D\/O|C\/O)\s*:/i);
        if(marker>=0)first=first.slice(marker);
        else {
          const house=first.search(/\b\d{1,5}[-\/]\d{1,5}\b/);
          if(house>=0)first=first.slice(house);
        }
      }
      if(first)out.push(first);
      for(const line of lines.slice(label+1)){
        if(looksLikeNoise(line))break;
        out.push(line);
        if(/\b\d{6}\b/.test(line))break;
        if(out.length>=8)break;
      }
    }else{
      const pinIndex=lines.findIndex(x=>/\b\d{6}\b/.test(x));
      if(pinIndex>=0)out=lines.slice(Math.max(0,pinIndex-6),pinIndex+1);
    }
    let result=out.map(cleanAddressText).filter(Boolean).join(", ");
    // Remove duplicated adjacent phrases caused by two OCR passes.
    result=result.replace(/\b([^,]{4,60})\s*,\s*\1\b/ig,"$1");
    // Keep the address portion ending at the PIN code; anything after it is usually OCR spill.
    const pin=result.match(/\b\d{6}\b/);
    if(pin)result=result.slice(0,pin.index+6);
    return result.replace(/\s*,\s*,+/g,", ").replace(/\s{2,}/g," ").trim();
  }
  async function preprocess(file,mode){
    return await new Promise(resolve=>{
      const img=new Image(),url=URL.createObjectURL(file);
      img.onload=()=>{
        const max=2200,scale=Math.min(2.2,max/Math.max(img.naturalWidth,img.naturalHeight));
        const c=document.createElement("canvas");
        c.width=Math.max(1,Math.round(img.naturalWidth*scale));
        c.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=c.getContext("2d",{willReadFrequently:true});
        ctx.drawImage(img,0,0,c.width,c.height);
        const im=ctx.getImageData(0,0,c.width,c.height),d=im.data;
        for(let i=0;i<d.length;i+=4){
          const g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
          const v=mode==="threshold"?(g>165?255:0):Math.min(255,Math.max(0,(g-128)*1.55+128));
          d[i]=d[i+1]=d[i+2]=v;
        }
        ctx.putImageData(im,0,0);
        c.toBlob(b=>{URL.revokeObjectURL(url);resolve(b||file)},"image/jpeg",0.95);
      };
      img.onerror=()=>{URL.revokeObjectURL(url);resolve(file)};
      img.src=url;
    });
  }
  async function runOCR(file){
    // Two passes help when the ID photo has shadows/low contrast.
    const a=await preprocess(file,"contrast");
    const b=await preprocess(file,"threshold");
    const r1=await Tesseract.recognize(a,"eng",{config:{tessedit_pageseg_mode:"6"}});
    const r2=await Tesseract.recognize(b,"eng",{config:{tessedit_pageseg_mode:"11"}});
    return [r1?.data?.text||"",r2?.data?.text||""].join("\n");
  }
  async function proofDataURL(file){
    return await new Promise(resolve=>{
      const img=new Image(),url=URL.createObjectURL(file);
      img.onload=()=>{
        const max=1400,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
        const c=document.createElement("canvas");
        c.width=Math.max(1,Math.round(img.naturalWidth*scale));
        c.height=Math.max(1,Math.round(img.naturalHeight*scale));
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg",0.82));
      };
      img.onerror=()=>{URL.revokeObjectURL(url);resolve("")};
      img.src=url;
    });
  }
  async function process(file,side){
    if(!file)return;
    const url=URL.createObjectURL(file);
    if(side==="front"){setFrontImg(url);setFrontStatus("Improving image and reading front side…")}
    else {setBackImg(url);setBackStatus("Improving image and reading back side…")}
    const savedProof=await proofDataURL(file);
    if(savedProof) fill(side==="front"?{frontProof:savedProof}:{backProof:savedProof});
    try{
      const t=await runOCR(file);
      if(side==="front"){
        const name=parseName(t),dob=parseDOB(t),documentNumber=parseDocumentNumber(t);
        const gender=/\bFEMALE\b/i.test(t)?"Female":/\bMALE\b/i.test(t)?"Male":"";
        fill({fullName:name,dob,documentNumber,gender});
        setFrontStatus(name||dob||documentNumber?`Front OCR complete${name?" — Name detected":""}${dob?" — DOB detected":""}${documentNumber?" — Document number detected":""}. Please verify.`:"Front OCR completed. Please enter/verify the fields.");
      }else{
        const address=parseAddress(t);
        fill({address});
        setBackStatus(address
          ?"Back OCR complete — Address auto-filled from the address/PIN area. Please verify before saving."
          :"Back OCR read the document but could not confidently isolate the Address. Please type it manually.");
      }
    }catch(e){
      if(side==="front")setFrontStatus("Front OCR failed; enter details manually.");
      else setBackStatus("Back OCR failed; enter Address manually.");
    }
  }
  return <div className="card"><h2>🪪 Identity Proof — Front & Back</h2><div className="small">Capture or upload both sides. OCR runs automatically and fills the Student Details fields.</div>
    <div className="grid" style={{marginTop:14}}>
      <div className="proofBox"><b>Front side</b><div className="actions" style={{marginTop:8}}><button type="button" className="primary" onClick={()=>setFrontCam(true)}>📷 Capture Front</button><label className="secondary">📁 Upload Front<input hidden type="file" accept="image/*" onChange={e=>process(e.target.files?.[0],"front")}/></label></div>{frontStatus&&<div className="success" style={{marginTop:10}}>🔎 {frontStatus}</div>}{frontImg&&<img src={frontImg} className="docpreview" style={{marginTop:10}}/>}</div>
      <div className="proofBox"><b>Back side</b><div className="actions" style={{marginTop:8}}><button type="button" className="primary" onClick={()=>setBackCam(true)}>📷 Capture Back</button><label className="secondary">📁 Upload Back<input hidden type="file" accept="image/*" onChange={e=>process(e.target.files?.[0],"back")}/></label></div>{backStatus&&<div className="success" style={{marginTop:10}}>🔎 {backStatus}</div>}{backImg&&<img src={backImg} className="docpreview" style={{marginTop:10}}/>}</div>
    </div>
    {frontCam&&<Camera close={()=>setFrontCam(false)} capture={f=>{setFrontCam(false);process(f,"front")}}/>}
    {backCam&&<Camera close={()=>setBackCam(false)} capture={f=>{setBackCam(false);process(f,"back")}}/>}
  </div>
}
function WhatsApp({s}){const [amt,setAmt]=useState(s.monthlyRent||""),[due,setDue]=useState("");function send(){const n=String(s.mobile||"").replace(/\D/g,"");if(!n)return alert("Mobile number missing.");const phone=n.length===10?"91"+n:n;const msg=`Hello ${s.fullName},\n\nPayment reminder from HostelDesk.\nRoom: ${s.room||"-"} / Bed ${s.bed||"-"}\nMonthly Rent: ₹${amt||"0"}${due?"\nDue Date: "+due:""}\n\nPlease make the payment at the earliest.\nThank you.`;window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank")}return <div className="card whatsappPrintBlock"><h2>📲 WhatsApp Payment Reminder</h2><div className="grid"><Mic label="Amount" value={amt} onChange={setAmt}/><Mic label="Due Date" value={due} onChange={setDue}/></div><button className="primary" style={{marginTop:12}} onClick={send}>💬 Send Reminder on WhatsApp</button><div className="small" style={{marginTop:8}}>WhatsApp opens with the message ready; press Send there.</div></div>}

function EditStudentModal({student,onClose,onSaved}){
  const [f,setF]=useState({fullName:student.fullName||"",mobile:student.mobile||"",gender:student.gender||"Male",dob:student.dob||"",documentNumber:student.documentNumber||"",advance:student.advance||"",monthlyRent:student.monthlyRent||"",emergency:student.emergency||"",address:student.address||""});
  const [msg,setMsg]=useState("");
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  async function save(e){e.preventDefault();const r=await fetch("/api/students",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:student.id,...f})});const d=await r.json();if(!r.ok){setMsg(d.error||"Update failed");return}onSaved(d.student)}
  return <div className="modal"><div className="modalbox card"><div className="top"><div><h2>✏️ Edit Student</h2><div className="small">{student.fullName} · {student.room}/{student.bed}</div></div><button className="secondary" onClick={onClose}>Close</button></div><form onSubmit={save}><div className="grid"><Mic label="Full Name" value={f.fullName} onChange={v=>set("fullName",v)}/><Mic label="Mobile Number" value={f.mobile} onChange={v=>set("mobile",v)}/><div className="field"><label>Gender</label><select value={f.gender} onChange={e=>set("gender",e.target.value)}><option>Male</option><option>Female</option></select></div><Mic label="Date of Birth" value={f.dob} onChange={v=>set("dob",v)}/><Mic label="Document Number" value={f.documentNumber} onChange={v=>set("documentNumber",v)}/><Mic label="Emergency Contact" value={f.emergency} onChange={v=>set("emergency",v)}/><Mic label="Advance / Deposit" value={f.advance} onChange={v=>set("advance",v)}/><Mic label="Monthly Rent" value={f.monthlyRent} onChange={v=>set("monthlyRent",v)}/><Mic label="Address" value={f.address} onChange={v=>set("address",v)} area/></div>{msg&&<div className="error" style={{marginTop:12}}>{msg}</div>}<div className="actions" style={{marginTop:14}}><button className="primary">Save Changes</button><button type="button" className="secondary" onClick={onClose}>Cancel</button></div></form></div></div>
}

function PaymentModal({student,onClose,onSaved}){
  const now=new Date();
  const [f,setF]=useState({month:now.toISOString().slice(0,7),amount:student.monthlyRent||"",paidAt:new Date().toISOString().slice(0,10),note:""});
  const [msg,setMsg]=useState("");
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  async function save(e){e.preventDefault();const r=await fetch("/api/payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId:student.id,...f,paidAt:new Date(f.paidAt+"T12:00:00").toISOString()})});const d=await r.json();if(!r.ok){setMsg(d.error||"Payment save failed");return}onSaved(d.payment)}
  return <div className="modal"><div className="modalbox card"><div className="top"><div><h2>💰 Add Monthly Payment</h2><div className="small">{student.fullName} · Room {student.room}/{student.bed}</div></div><button className="secondary" onClick={onClose}>Close</button></div><form onSubmit={save}><div className="grid"><div className="field"><label>Month</label><input type="month" value={f.month} onChange={e=>set("month",e.target.value)}/></div><Mic label="Amount Paid" value={f.amount} onChange={v=>set("amount",v)}/><div className="field"><label>Payment Date</label><input type="date" value={f.paidAt} onChange={e=>set("paidAt",e.target.value)}/></div><Mic label="Note (optional)" value={f.note} onChange={v=>set("note",v)}/></div>{msg&&<div className="error" style={{marginTop:12}}>{msg}</div>}<div className="actions" style={{marginTop:14}}><button className="primary">Save Payment</button><button type="button" className="secondary" onClick={onClose}>Cancel</button></div></form></div></div>
}


function StudentPaymentHistoryInline({student}){
  const [rows,setRows]=useState([]),[loading,setLoading]=useState(true);
  useEffect(()=>{let live=true;(async()=>{try{const r=await fetch("/api/payments?studentId="+encodeURIComponent(student.id));const d=await r.json();if(live)setRows(d.payments||[])}finally{if(live)setLoading(false)}})();return()=>{live=false}},[student.id]);
  const total=rows.reduce((a,x)=>a+Number(x.amount||0),0);
  return <div className="card" style={{marginTop:16}}><div className="top"><div><h3>📜 Payment History</h3><div className="small">Every recorded payment for this student</div></div><div className="historySummary"><b>₹{total.toLocaleString("en-IN")}</b><span>{rows.length} payment{rows.length===1?"":"s"}</span></div></div>{loading?<p className="muted">Loading payment history...</p>:rows.length===0?<div className="warning">No payment history recorded yet.</div>:<div style={{overflowX:"auto"}}><table className="table"><thead><tr><th>Date</th><th>Month</th><th>Amount</th><th>Note</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.paidAt?new Date(x.paidAt).toLocaleDateString("en-IN"):"-"}</td><td>{x.month||"-"}</td><td><b>₹{Number(x.amount||0).toLocaleString("en-IN")}</b></td><td>{x.note||"-"}</td></tr>)}</tbody></table></div>}</div>
}

function ShareStudentModal({student,onClose}){
  const [number,setNumber]=useState(""),[rows,setRows]=useState([]),[loading,setLoading]=useState(true),[msg,setMsg]=useState("");
  useEffect(()=>{(async()=>{try{const r=await fetch("/api/payments?studentId="+encodeURIComponent(student.id));const d=await r.json();setRows(d.payments||[])}finally{setLoading(false)}})()},[student.id]);
  const total=rows.reduce((a,x)=>a+Number(x.amount||0),0);
  function send(){
    const digits=String(number).replace(/\D/g,"");
    if(!digits){setMsg("Enter WhatsApp number.");return}
    const phone=digits.length===10?"91"+digits:digits;
    const payments=rows.length?rows.map(x=>`${x.paidAt?new Date(x.paidAt).toLocaleDateString("en-IN"):"-"} | ${x.month||"-"} | ₹${Number(x.amount||0).toLocaleString("en-IN")}`).join("\n"):"No payment history recorded";
    const text=`HostelDesk Student Details\n\nName: ${student.fullName||"-"}\nMobile: ${student.mobile||"-"}\nGender: ${student.gender||"-"}\nDOB: ${student.dob||"-"}\nRoom / Bed: ${student.room||"-"} / ${student.bed||"-"}\nFloor: ${student.floor||"-"}\nDocument Number: ${student.documentNumber||"-"}\nAdvance: ₹${student.advance||"0"}\nMonthly Rent: ₹${student.monthlyRent||"0"}\nEmergency Contact: ${student.emergency||"-"}\nAddress: ${student.address||"-"}\n\nPayment History:\n${payments}\nTotal Paid: ₹${total.toLocaleString("en-IN")}\n\nIdentity proof: ${student.frontProof||student.backProof?"Front/Back proof is saved in the HostelDesk profile.":"No proof image saved."}`;
    window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(text),"_blank");
  }
  return <div className="modal"><div className="modalbox card"><div className="top"><div><h2>📲 Share Student Details</h2><div className="small">Send the student's details and payment history to any WhatsApp number.</div></div><button className="secondary" onClick={onClose}>Close</button></div><div className="field" style={{marginTop:14}}><label>WhatsApp Number</label><input value={number} onChange={e=>setNumber(e.target.value)} placeholder="Enter 10-digit number" inputMode="tel"/></div><div className="card" style={{marginTop:14}}><b>Will include</b><ul className="small"><li>Student personal details</li><li>Room / bed and payment details</li><li>Document number / proof status</li><li>Complete payment history{loading?" (loading...)":""}</li></ul><div className="small">Browser WhatsApp sharing opens a pre-filled message. Proof image files themselves cannot be automatically attached by a normal wa.me link; the profile still keeps the saved front/back proofs for viewing or download.</div></div>{msg&&<div className="error" style={{marginTop:12}}>{msg}</div>}<div className="actions" style={{marginTop:14}}><button className="primary" onClick={send}>💬 Open WhatsApp</button><button className="secondary" onClick={onClose}>Cancel</button></div></div></div>
}

function HistoryModal({student,onClose}){
  const [rows,setRows]=useState([]),[loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{const r=await fetch("/api/payments?studentId="+encodeURIComponent(student.id));const d=await r.json();setRows(d.payments||[]);setLoading(false)})()},[student.id]);
  const total=rows.reduce((a,x)=>a+Number(x.amount||0),0);
  return <div className="modal"><div className="modalbox card"><div className="top"><div><h2>📜 Student Payment History</h2><div className="small">{student.fullName} · {student.room}/{student.bed}</div></div><button className="secondary" onClick={onClose}>Close</button></div><div className="historySummary"><b>Total Paid: ₹{total.toLocaleString("en-IN")}</b><span>{rows.length} payment{rows.length===1?"":"s"}</span></div>{loading?<p className="muted">Loading history...</p>:rows.length===0?<div className="warning">No payment history recorded yet.</div>:<div style={{overflowX:"auto"}}><table className="table"><thead><tr><th>Date</th><th>Month</th><th>Amount</th><th>Note</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{new Date(x.paidAt).toLocaleDateString("en-IN")}</td><td>{x.month||"-"}</td><td><b>₹{Number(x.amount).toLocaleString("en-IN")}</b></td><td>{x.note||"-"}</td></tr>)}</tbody></table></div>}</div></div>
}



function GuestEditModal({guest,onClose,onSaved}){
  const [f,setF]=useState({fullName:guest.fullName||"",mobile:guest.mobile||"",gender:guest.gender||"Male",dob:guest.dob||"",documentNumber:guest.documentNumber||"",emergency:guest.emergency||"",address:guest.address||"",amount:guest.amount||"",stayDays:guest.stayDays||1,checkInDate:guest.checkInDate||new Date().toISOString().slice(0,10),checkOutDate:guest.checkOutDate||""});
  const [msg,setMsg]=useState("");
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  function updateDays(v){
    if(v===""){setF(x=>({...x,stayDays:"",checkOutDate:""}));return}
    const days=Math.max(1,Number(v));
    const d=new Date((f.checkInDate||new Date().toISOString().slice(0,10))+"T12:00:00");
    d.setDate(d.getDate()+days);
    setF(x=>({...x,stayDays:days,checkOutDate:d.toISOString().slice(0,10)}));
  }
  async function save(e){e.preventDefault();if(!Number(f.stayDays)){setMsg("Please enter Stay Days (for example 1 or 3)." );return}const r=await fetch("/api/guests",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:guest.id,...f})});const d=await r.json();if(!r.ok){setMsg(d.error||"Update failed");return}onSaved(d.guest)}
  return <div className="modal"><div className="modalbox card"><div className="top"><div><h2>✏️ Edit Guest</h2><div className="small">{guest.fullName} · Room {guest.room}/{guest.bed}</div></div><button className="secondary" onClick={onClose}>Close</button></div><form onSubmit={save}><div className="grid"><Mic label="Full Name" value={f.fullName} onChange={v=>set("fullName",v)}/><Mic label="Mobile Number" value={f.mobile} onChange={v=>set("mobile",v)}/><div className="field"><label>Gender</label><select value={f.gender} onChange={e=>set("gender",e.target.value)}><option>Male</option><option>Female</option></select></div><Mic label="Date of Birth" value={f.dob} onChange={v=>set("dob",v)}/><Mic label="Document Number" value={f.documentNumber} onChange={v=>set("documentNumber",v)}/><Mic label="Emergency Contact" value={f.emergency} onChange={v=>set("emergency",v)}/><Mic label="Address" value={f.address} onChange={v=>set("address",v)} area/><Mic label="Stay Amount" value={f.amount} onChange={v=>set("amount",v)}/><StayDaysInput value={String(f.stayDays||"")} onChange={updateDays}/><div className="field"><label>Check-in Date</label><input type="date" value={f.checkInDate} onChange={e=>{const date=e.target.value;const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+Math.max(1,Number(f.stayDays||1)));setF(x=>({...x,checkInDate:date,checkOutDate:d.toISOString().slice(0,10)}))}}/></div><div className="field"><label>Expected Check-out</label><input value={f.checkOutDate} readOnly/></div></div>{msg&&<div className="error" style={{marginTop:12}}>{msg}</div>}<div className="actions" style={{marginTop:14}}><button className="primary">Save Changes</button><button type="button" className="secondary" onClick={onClose}>Cancel</button></div></form></div></div>
}
function GuestProfileModal({guest,onClose,onEdit,onCheckout,archived=false}){
  return <div className="modal"><div className="modalbox card guestProfile"><div className="top"><div><h2>{guest.fullName}</h2><div className="small">Guest Profile · {guest.id} · {archived?"Checked Out":"Active"}</div></div><div className="actions">{!archived&&<><button className="secondary" onClick={onEdit}>✏️ Edit</button><button className="danger" onClick={onCheckout}>🗑️ Check-out</button></>}<button className="secondary" onClick={onClose}>Close</button></div></div><div className="grid"><div><b>Full Name</b><p>{guest.fullName||"-"}</p></div><div><b>Mobile</b><p>{guest.mobile||"-"}</p></div><div><b>Gender</b><p>{guest.gender||"-"}</p></div><div><b>DOB</b><p>{guest.dob||"-"}</p></div><div><b>Room / Bed</b><p>{guest.room||"-"} / {guest.bed||"-"}</p></div><div><b>Floor</b><p>{guest.floor||"-"}</p></div><div><b>Document Number</b><p>{guest.documentNumber||"-"}</p></div><div><b>Stay Amount</b><p>₹{guest.amount||"0"}</p></div><div><b>Stay Days</b><p>{guest.stayDays||1} day{Number(guest.stayDays)===1?"":"s"}</p></div><div><b>Check-in</b><p>{guest.checkInDate||"-"}</p></div><div><b>Expected Check-out</b><p>{guest.checkOutDate||"-"}</p></div><div><b>Emergency Contact</b><p>{guest.emergency||"-"}</p></div></div><div className="card" style={{marginTop:16}}><h3>Address</h3><p style={{whiteSpace:"pre-wrap"}}>{guest.address||"-"}</p></div><div className="card" style={{marginTop:16}}><h3>🪪 Identity Proof</h3><div className="grid"><div className="proofBox"><b>Front Side</b>{guest.frontProof?<img src={guest.frontProof} className="docpreview" style={{marginTop:10,maxHeight:300}}/>:<p className="muted">Front proof not saved.</p>}</div><div className="proofBox"><b>Back Side</b>{guest.backProof?<img src={guest.backProof} className="docpreview" style={{marginTop:10,maxHeight:300}}/>:<p className="muted">Back proof not saved.</p>}</div></div></div></div></div>
}
function GuestHistory({onOpen,onBack}){
  const [rows,setRows]=useState([]),[q,setQ]=useState("");
  useEffect(()=>{fetch("/api/guest-history").then(r=>r.json()).then(d=>setRows(d.guests||[]))},[]);
  const filtered=rows.filter(g=>(g.fullName+" "+g.mobile+" "+g.room+" "+g.documentNumber).toLowerCase().includes(q.toLowerCase()));
  return <div className="card"><div className="top"><div><h2>🗂️ Guest History</h2><div className="small">Short-stay guests who have checked out remain here for records.</div></div><button className="secondary" onClick={onBack}>Back to Guests</button></div><div className="search"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search guest..."/></div>{filtered.length===0?<div className="warning">No checked-out guests found.</div>:<table className="table"><thead><tr><th>Name</th><th>Room / Bed</th><th>Stay</th><th>Amount</th><th>Checked Out</th></tr></thead><tbody>{filtered.map(g=><tr key={g.id}><td><button className="linkbtn" onClick={()=>onOpen(g)}>{g.fullName}</button></td><td>{g.room||"-"} / {g.bed||"-"}</td><td>{g.stayDays||1} day{Number(g.stayDays)===1?"":"s"}</td><td>₹{g.amount||"0"}</td><td>{g.checkedOutAt?new Date(g.checkedOutAt).toLocaleDateString("en-IN"):"-"}</td></tr>)}</tbody></table>}</div>
}

function DashboardView({students,rooms,available,onNavigate}){
  const totalBeds=rooms.reduce((n,r)=>n+(r.beds||[]).length,0);
  const occupiedBeds=Math.max(0,totalBeds-available.length);
  const occupancy=totalBeds?Math.round((occupiedBeds/totalBeds)*100):0;
  const recent=[...students].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5);
  const paymentDue=students.filter(s=>Number(s.monthlyRent||0)>0).reduce((n,s)=>n+Number(s.monthlyRent||0),0);
  return <div className="dashboardV2">
    <section className="heroGrid">
      <div className="heroWelcome"><div className="eyebrow">HOSTEL OVERVIEW</div><h2>Good evening, Admin</h2><p>Here&apos;s what&apos;s happening in your hostel today.</p></div>
      <div className="heroActions"><button className="dashAction primary" onClick={()=>onNavigate("New Student")}>＋ Add Student</button><button className="dashAction secondary" onClick={()=>onNavigate("Rooms")}>＋ Add Room</button></div>
    </section>
    <section className="dashStats">
      <button className="dashStatCard" onClick={()=>onNavigate("Students")}><span className="dashStatIcon blue">♙</span><span><small>Students</small><strong>{students.length}</strong><em>Click to view all profiles</em></span></button>
      <button className="dashStatCard" onClick={()=>onNavigate("Rooms")}><span className="dashStatIcon purple">▦</span><span><small>Rooms</small><strong>{rooms.length}</strong><em>Total rooms</em></span></button>
      <button className="dashStatCard" onClick={()=>onNavigate("Rooms")}><span className="dashStatIcon green">⌂</span><span><small>Bed Occupancy</small><strong>{occupancy}%</strong><em>{occupiedBeds} / {totalBeds||0} beds occupied</em></span></button>
      <button className="dashStatCard" onClick={()=>onNavigate("Payments")}><span className="dashStatIcon orange">₹</span><span><small>Monthly Due</small><strong>₹{paymentDue.toLocaleString("en-IN")}</strong><em>{students.filter(s=>Number(s.monthlyRent||0)>0).length} students</em></span></button>
    </section>
    <section className="dashColumns">
      <div className="dashPanel occupancyPanel"><div className="panelHead"><div><h3>Occupancy</h3><p>Current bed utilization</p></div><b>{occupancy}%</b></div><div className="occupancyTrack"><span style={{width:`${occupancy}%`}}></span></div><div className="occupancyNumbers"><strong>{occupiedBeds}</strong><span>occupied</span><i>/</i><strong>{totalBeds||0}</strong><span>total beds</span></div><div className="occupancyFoot"><span><i className="dot occupied"></i>Occupied</span><span><i className="dot available"></i>Available {available.length}</span></div></div>
      <div className="dashPanel"><div className="panelHead"><div><h3>Recent Admissions</h3><p>Latest students added</p></div><button className="panelLink" onClick={()=>onNavigate("Students")}>View all →</button></div><div className="recentList">{recent.length?recent.map((s,i)=><button className="recentRow" key={s.id} onClick={()=>onNavigate("Students")}><span className="recentAvatar">{(s.fullName||"?").trim().charAt(0).toUpperCase()}</span><span className="recentName"><b>{s.fullName}</b><small>{s.createdAt?new Date(s.createdAt).toLocaleDateString("en-IN"):"Recently"}</small></span><span className="recentRoom">Room {s.room||"-"}<small>Bed {s.bed||"-"}</small></span><span className="chev">›</span></button>):<div className="emptyDash">No admissions yet.</div>}</div></div>
    </section>
    <section className="dashColumns lowerDash">
      <div className="dashPanel"><div className="panelHead"><div><h3>Payment Due</h3><p>Monthly rent overview</p></div><button className="panelLink" onClick={()=>onNavigate("Payments")}>Payments →</button></div><div className="dueBig">₹{paymentDue.toLocaleString("en-IN")}</div><div className="dueSub">{students.filter(s=>Number(s.monthlyRent||0)>0).length} students with monthly rent configured</div><div className="dueActions"><button className="primary" onClick={()=>onNavigate("Payments")}>View Payments</button><button className="secondary" onClick={()=>onNavigate("Reminders")}>Send Reminders</button></div></div>
      <div className="dashPanel"><div className="panelHead"><div><h3>Quick Actions</h3><p>Common hostel tasks</p></div></div><div className="quickGrid"><button onClick={()=>onNavigate("New Student")}><span>＋</span><b>Add Student</b><small>Register a new resident</small></button><button onClick={()=>onNavigate("Rooms")}><span>▦</span><b>Manage Rooms</b><small>Rooms and bed availability</small></button><button onClick={()=>onNavigate("Verification")}><span>⌕</span><b>Verify Student</b><small>Search resident records</small></button><button onClick={()=>onNavigate("Student History")}><span>◷</span><b>Student History</b><small>Checked-out records</small></button><button onClick={()=>onNavigate("Add Guest")}><span>🧳</span><b>Add Guest</b><small>Short-stay guest</small></button></div></div>
    </section>
  </div>
}

function ArchivedStudents({onOpen,onBack}){
  const [rows,setRows]=useState([]),[q,setQ]=useState("");
  useEffect(()=>{fetch("/api/student-history").then(r=>r.json()).then(d=>setRows(d.students||[]))},[]);
  const filtered=rows.filter(s=>(s.fullName+" "+s.mobile+" "+s.room+" "+s.documentNumber).toLowerCase().includes(q.toLowerCase()));
  return <div className="card"><div className="top"><div><h2>🗂️ Student History</h2><div className="small">Checked-out students remain here for records.</div></div><button className="secondary" onClick={onBack}>Back to Students</button></div><div className="search"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search checked-out student..."/></div>{filtered.length===0?<div className="warning">No checked-out students found.</div>:<table className="table"><thead><tr><th>Name</th><th>Room / Bed</th><th>Checked Out</th><th>Status</th></tr></thead><tbody>{filtered.map(s=><tr key={s.id}><td><button className="linkbtn" onClick={()=>onOpen(s)}>{s.fullName}</button></td><td>{s.room||"-"} / {s.bed||"-"}</td><td>{s.checkedOutAt?new Date(s.checkedOutAt).toLocaleDateString("en-IN"):"-"}</td><td><span className="badge">Checked Out</span></td></tr>)}</tbody></table>}</div>
}


function SuperAdminPanel({user,onLogout}){
  const [rows,setRows]=useState([]),[form,setForm]=useState({hostelName:"",ownerName:"",mobile:"",email:"",password:""}),[msg,setMsg]=useState("");
  async function load(){const r=await fetch("/api/customers");const d=await r.json();setRows(d.customers||[])}
  useEffect(()=>{load()},[]);
  async function create(e){e.preventDefault();setMsg("");const r=await fetch("/api/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok){setMsg(d.error||"Could not create customer");return}setMsg("Customer created successfully. Give these login details to the customer.");setForm({hostelName:"",ownerName:"",mobile:"",email:"",password:""});load()}
  return <div className="login" style={{alignItems:"start",paddingTop:40}}><div style={{width:"min(1100px,94vw)"}}><div className="card"><div className="top"><div><div className="logo">HostelDesk · Super Admin</div><p className="muted">Create and manage separate customer accounts.</p></div><button className="secondary" onClick={onLogout}>Logout</button></div><div className="grid" style={{marginTop:16}}><div className="dashStatCard"><small>Customers</small><strong>{rows.length}</strong><em>Separate hostel accounts</em></div><div className="dashStatCard"><small>Data isolation</small><strong>ON</strong><em>Tenant based</em></div><div className="dashStatCard"><small>Access</small><strong>Private</strong><em>Customer only</em></div></div></div><div className="card"><h2>＋ Create Customer</h2><form onSubmit={create}><div className="grid"><Mic label="Hostel Name" value={form.hostelName} onChange={v=>setForm(x=>({...x,hostelName:v}))}/><Mic label="Owner Name" value={form.ownerName} onChange={v=>setForm(x=>({...x,ownerName:v}))}/><Mic label="Mobile" value={form.mobile} onChange={v=>setForm(x=>({...x,mobile:v}))}/><Mic label="Login Email" value={form.email} onChange={v=>setForm(x=>({...x,email:v}))}/><div className="field"><label>Temporary Password</label><input type="password" value={form.password} onChange={e=>setForm(x=>({...x,password:e.target.value}))} placeholder="Create password"/></div></div><button className="primary" style={{marginTop:12}}>Create Customer Account</button></form>{msg&&<div className="success" style={{marginTop:12}}>{msg}</div>}</div><div className="card"><div className="top"><div><h2>Customers</h2><div className="small">Each customer has an independent tenant and sees only their own records.</div></div></div><table className="table"><thead><tr><th>Hostel</th><th>Owner</th><th>Login Email</th><th>Customer ID</th><th>Status</th></tr></thead><tbody>{rows.map(c=><tr key={c.id}><td><b>{c.hostelName}</b></td><td>{c.ownerName||"-"}</td><td>{c.email}</td><td>{c.id}</td><td><span className="badge">{c.status}</span></td></tr>)}</tbody></table></div></div></div>
}

export default function Home(){
  const [login,setLogin]=useState(false),[authLoading,setAuthLoading]=useState(true),[authUser,setAuthUser]=useState(null),[loginForm,setLoginForm]=useState({email:"",password:""}),[loginMsg,setLoginMsg]=useState(""),[page,setPage]=useState("Dashboard"),[rooms,setRooms]=useState([]),[students,setStudents]=useState([]),[guests,setGuests]=useState([]),[q,setQ]=useState(""),[sel,setSel]=useState(null),[gsel,setGsel]=useState(null),[msg,setMsg]=useState("");
  const [shareOpen,setShareOpen]=useState(false);
  const [rf,setRf]=useState({floor:"1",roomNumber:"",bedCount:"2"});
  const [f,setF]=useState({fullName:"",mobile:"",gender:"Male",dob:"",documentNumber:"",roomNumber:"",bed:"",advance:"",monthlyRent:"",emergency:"",address:"",frontProof:"",backProof:""});
  const [gf,setGf]=useState({fullName:"",mobile:"",gender:"Male",dob:"",documentNumber:"",roomNumber:"",floor:"",bed:"",amount:"",stayDays:"1",checkInDate:new Date().toISOString().slice(0,10),checkOutDate:"",emergency:"",address:"",frontProof:"",backProof:""});
  const [editOpen,setEditOpen]=useState(false),[paymentOpen,setPaymentOpen]=useState(false),[historyOpen,setHistoryOpen]=useState(false),[archivedOpen,setArchivedOpen]=useState(false),[profileArchived,setProfileArchived]=useState(false),[guestEditOpen,setGuestEditOpen]=useState(false),[guestHistoryOpen,setGuestHistoryOpen]=useState(false),[guestArchivedOpen,setGuestArchivedOpen]=useState(false),[guestProfileArchived,setGuestProfileArchived]=useState(false);
  async function load(){const [a,b,c]=await Promise.all([fetch("/api/rooms"),fetch("/api/students"),fetch("/api/guests")]);const ar=await a.json(),bs=await b.json(),gs=await c.json();setRooms(ar.rooms||[]);setStudents(bs.students||[]);setGuests(gs.guests||[])}
  useEffect(()=>{(async()=>{const r=await fetch("/api/auth/me");const d=await r.json();if(d.user){setAuthUser(d.user);setLogin(true)}setAuthLoading(false)})()},[]);
  useEffect(()=>{if(login&&authUser?.role!=="SUPER_ADMIN")load()},[login,authUser]);
  async function doLogin(e){e.preventDefault();setLoginMsg("");const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(loginForm)});const d=await r.json();if(!r.ok){setLoginMsg(d.error||"Login failed");return}setAuthUser(d.user);setLogin(true)}
  async function doLogout(){await fetch("/api/auth/logout",{method:"POST"});setAuthUser(null);setLogin(false);setLoginForm({email:"",password:""})}
  const available=rooms.flatMap(r=>r.beds.filter(b=>b.status==="Available").map(b=>({room:r.roomNumber,floor:r.floor,bed:b.label,label:`Room ${r.roomNumber} · Floor ${r.floor} · Bed ${b.label}`})));
  const filtered=useMemo(()=>students.filter(s=>(s.fullName+" "+s.mobile+" "+s.room+" "+s.documentNumber).toLowerCase().includes(q.toLowerCase())),[students,q]);
  if(authLoading)return <div className="login"><div className="loginbox"><div className="logo">HostelDesk V5</div><p className="muted">Loading secure login...</p></div></div>;
  if(!login)return <div className="login"><form className="loginbox" onSubmit={doLogin}><div className="logo">HostelDesk V5</div><p className="muted">Secure customer login · Your data is isolated from other hostels.</p><div className="field"><label>Email</label><input type="email" value={loginForm.email} onChange={e=>setLoginForm(x=>({...x,email:e.target.value}))} placeholder="your@email.com" required/></div><div className="field" style={{marginTop:10}}><label>Password</label><input type="password" value={loginForm.password} onChange={e=>setLoginForm(x=>({...x,password:e.target.value}))} placeholder="Password" required/></div>{loginMsg&&<div className="error" style={{marginTop:10}}>{loginMsg}</div>}<button className="primary" style={{width:"100%",marginTop:15}}>Login</button></form></div>;
  if(authUser?.role==="SUPER_ADMIN")return <SuperAdminPanel user={authUser} onLogout={doLogout}/>;
  function field(k,v){setF(x=>({...x,[k]:v}))}
  async function addRoom(e){e.preventDefault();const r=await fetch("/api/rooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(rf)});const d=await r.json();setMsg(r.ok?"Room added successfully":d.error);if(r.ok){setRf({floor:"1",roomNumber:"",bedCount:"2"});load()}}
  async function save(e){e.preventDefault();const r=await fetch("/api/students",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(f)});const d=await r.json();setMsg(r.ok?"Student saved successfully":d.error);if(r.ok){setF({fullName:"",mobile:"",gender:"Male",dob:"",documentNumber:"",roomNumber:"",bed:"",advance:"",monthlyRent:"",emergency:"",address:"",frontProof:"",backProof:""});await load();setPage("Students")}}
  function guestField(k,v){setGf(x=>({...x,[k]:v}))}
  function updateGuestDays(v){
    if(v===""){setGf(x=>({...x,stayDays:"",checkOutDate:""}));return}
    const days=Math.max(1,Number(v));
    const d=new Date((gf.checkInDate||new Date().toISOString().slice(0,10))+"T12:00:00");
    d.setDate(d.getDate()+days);
    setGf(x=>({...x,stayDays:String(days),checkOutDate:d.toISOString().slice(0,10)}));
  }
  function updateGuestCheckIn(v){
    const days=Number(gf.stayDays||0);
    if(!days){setGf(x=>({...x,checkInDate:v,checkOutDate:""}));return}
    const d=new Date(v+"T12:00:00");
    d.setDate(d.getDate()+days);
    setGf(x=>({...x,checkInDate:v,checkOutDate:d.toISOString().slice(0,10)}));
  }
  async function saveGuest(e){e.preventDefault();if(!Number(gf.stayDays)){setMsg("Please enter Stay Days (for example 1 or 3)." );return}const r=await fetch("/api/guests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(gf)});const d=await r.json();setMsg(r.ok?"Guest added successfully":d.error);if(r.ok){setGf({fullName:"",mobile:"",gender:"Male",dob:"",documentNumber:"",roomNumber:"",floor:"",bed:"",amount:"",stayDays:"",checkInDate:new Date().toISOString().slice(0,10),checkOutDate:"",emergency:"",address:"",frontProof:"",backProof:""});await load();setPage("Guests")}}
  async function checkoutGuest(){if(!gsel)return;if(!confirm(`Guest ${gsel.fullName} will be checked out. The guest room/bed details are only informational. Continue?`))return;const r=await fetch("/api/guests",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:gsel.id})});const d=await r.json();if(!r.ok){setMsg(d.error||"Guest checkout failed");return}setGsel(null);setMsg("Guest checked out. Guest record moved to Guest History.");await load()}
  function openGuestArchived(g){setGsel(g);setGuestProfileArchived(true);setGuestArchivedOpen(false)}
  async function checkoutStudent(){if(!sel)return;if(!confirm(`Student ${sel.fullName} will be checked out and ${sel.room}/${sel.bed} will become available. Continue?`))return;const r=await fetch("/api/students",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:sel.id})});const d=await r.json();if(!r.ok){setMsg(d.error||"Checkout failed");return}setSel(null);setProfileArchived(false);setMsg("Student checked out. Bed is available again.");await load()}
  function openArchived(s){setSel(s);setProfileArchived(true);setArchivedOpen(false);setHistoryOpen(false)}
  return <div className="shell"><aside className="sidebar"><div className="brandWrap"><div className="brandMark">HD</div><div><div className="brand">HostelDesk</div><div className="brandSub">Hostel Management</div></div></div><div className="nav">{["Dashboard","Rooms","New Student","Students","Guests","Add Guest","Payments","Verification","Reminders"].map(x=><button key={x} className={page===x?"active":""} onClick={()=>{setPage(x);setArchivedOpen(false);setQ("")}}><span className="navIcon">{({Dashboard:"⌂",Rooms:"▦","New Student":"＋",Students:"◉",Guests:"♙","Add Guest":"＋",Payments:"₹",Verification:"⌕",Reminders:"◔"})[x]}</span><span>{x}</span></button>)}<button className={archivedOpen?"active":""} onClick={()=>{setArchivedOpen(true);setPage("Students");setSel(null)}}><span className="navIcon">🗂️</span><span>Student History</span></button><button className={guestArchivedOpen?"active":""} onClick={()=>{setGuestArchivedOpen(true);setPage("Guests");setGsel(null)}}><span className="navIcon">🧳</span><span>Guest History</span></button></div><div className="sideFooter"><div className="statusDot"></div><div><b>System Online</b><span>Local workspace</span></div></div></aside><main className="main"><header className="topbar dashboardTopbar"><div className="topSearch"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search students..."/><button title="Notifications">🔔</button></div><div className="topAdmin"><span className="avatar">{(authUser?.hostelName||"A").charAt(0).toUpperCase()}</span><span><b>{authUser?.hostelName||"Admin"}</b><small>{authUser?.email||"Hostel Manager"}</small></span><button className="secondary" onClick={doLogout}>Logout</button></div></header>
{page==="Dashboard"&&<DashboardView students={students} rooms={rooms} available={available} onNavigate={x=>{if(x==="Student History"){setArchivedOpen(true);setPage("Students")}else{setArchivedOpen(false);setPage(x)}}}/>}
{page==="Rooms"&&<><div className="card"><h2>➕ Add Room</h2><form onSubmit={addRoom}><div className="grid"><Mic label="Floor" value={rf.floor} onChange={v=>setRf({...rf,floor:v})}/><Mic label="Room Number" value={rf.roomNumber} onChange={v=>setRf({...rf,roomNumber:v})}/><Mic label="Number of Beds" value={rf.bedCount} onChange={v=>setRf({...rf,bedCount:v})}/></div><button className="primary" style={{marginTop:12}}>Add Room</button></form>{msg&&<div className="success" style={{marginTop:12}}>{msg}</div>}</div><div className="card"><h2>🏠 Rooms & Beds</h2><table className="table"><thead><tr><th>Floor</th><th>Room</th><th>Bed</th><th>Status</th><th>Student</th></tr></thead><tbody>{rooms.flatMap(r=>r.beds.map(b=><tr key={b.id}><td>{r.floor}</td><td>{r.roomNumber}</td><td>{b.label}</td><td><span className="badge">{b.status}</span></td><td>{students.find(s=>s.id===b.studentId)?.fullName||guests.find(g=>g.id===b.guestId)?.fullName||"-"}</td></tr>))}</tbody></table></div></>}
{page==="New Student"&&<form onSubmit={save}><div className="card"><h2>Student Details</h2><div className="grid"><Mic label="Full Name" value={f.fullName} onChange={v=>field("fullName",v)}/><Mic label="Mobile Number" value={f.mobile} onChange={v=>field("mobile",v)}/><div className="field"><label>Gender</label><select value={f.gender} onChange={e=>field("gender",e.target.value)}><option>Male</option><option>Female</option></select></div><Mic label="Date of Birth" value={f.dob} onChange={v=>field("dob",v)}/><Mic label="Emergency Contact" value={f.emergency} onChange={v=>field("emergency",v)}/><Mic label="Address" value={f.address} onChange={v=>field("address",v)} area/></div></div><OCR fill={d=>setF(x=>({...x,...d}))}/><div className="card"><h2>Identity Details</h2><Mic label="Document Number" value={f.documentNumber} onChange={v=>field("documentNumber",v)}/></div><div className="card"><h2>Room & Payment</h2><div className="grid"><div className="field"><label>Available Room & Bed</label><select value={f.roomNumber&&f.bed?f.roomNumber+"|"+f.bed:""} onChange={e=>{const [r,b]=e.target.value.split("|");setF(x=>({...x,roomNumber:r,bed:b}))}}><option value="">Select available bed</option>{available.map(x=><option key={x.room+"|"+x.bed} value={x.room+"|"+x.bed}>{x.label}</option>)}</select></div><Mic label="Advance / Deposit" value={f.advance} onChange={v=>field("advance",v)}/><Mic label="Monthly Rent" value={f.monthlyRent} onChange={v=>field("monthlyRent",v)}/></div></div>{msg&&<div className="success">{msg}</div>}<button className="primary">Save Student</button></form>}
{page==="Students"&&!archivedOpen&&<div className="card"><div className="top"><div><h2>👤 Students</h2><div className="small">Edit details, record monthly payments, view history or check out a student.</div></div><button className="secondary" onClick={()=>setArchivedOpen(true)}>🗂️ Student History</button></div><div className="search"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search student, mobile, room or document"/></div><table className="table"><thead><tr><th>Name</th><th>Mobile</th><th>Room / Bed</th><th>Monthly Rent</th><th>Actions</th></tr></thead><tbody>{filtered.map(s=><tr key={s.id}><td><button className="linkbtn" onClick={()=>{setSel(s);setProfileArchived(false)}}>{s.fullName}</button></td><td>{s.mobile||"-"}</td><td>{s.room||"-"} / {s.bed||"-"}</td><td>₹{s.monthlyRent||"0"}</td><td><div className="actions"><button className="secondary" onClick={()=>{setSel(s);setProfileArchived(false);setEditOpen(true)}}>Edit</button><button className="secondary" onClick={()=>{setSel(s);setProfileArchived(false);setPaymentOpen(true)}}>+ Payment</button><button className="secondary" onClick={()=>{setSel(s);setProfileArchived(false);setHistoryOpen(true)}}>History</button></div></td></tr>)}</tbody></table></div>}
{archivedOpen&&<ArchivedStudents onOpen={openArchived} onBack={()=>setArchivedOpen(false)}/>}
{page==="Verification"&&<div className="card"><h2>🔎 Authorized Verification</h2><div className="search"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name / mobile / room / document"/></div><table className="table"><tbody>{filtered.map(s=><tr key={s.id}><td><button className="linkbtn" onClick={()=>{setSel(s);setProfileArchived(false)}}>{s.fullName}</button></td><td>{s.mobile}</td><td>{s.room}/{s.bed}</td></tr>)}</tbody></table></div>}
{page==="Add Guest"&&<form onSubmit={saveGuest}><div className="card"><h2>🧳 Add Guest</h2><div className="small">Same KYC details as a student, designed for short stays such as 1–3 days.</div><div className="grid" style={{marginTop:14}}><Mic label="Full Name" value={gf.fullName} onChange={v=>guestField("fullName",v)}/><Mic label="Mobile Number" value={gf.mobile} onChange={v=>guestField("mobile",v)}/><div className="field"><label>Gender</label><select value={gf.gender} onChange={e=>guestField("gender",e.target.value)}><option>Male</option><option>Female</option></select></div><Mic label="Date of Birth" value={gf.dob} onChange={v=>guestField("dob",v)}/><Mic label="Emergency Contact" value={gf.emergency} onChange={v=>guestField("emergency",v)}/><Mic label="Address" value={gf.address} onChange={v=>guestField("address",v)} area/></div></div><OCR fill={d=>setGf(x=>({...x,...d}))}/><div className="card"><h2>Identity Details</h2><Mic label="Document Number" value={gf.documentNumber} onChange={v=>guestField("documentNumber",v)}/></div><div className="card"><h2>🛏️ Short Stay / Room Details</h2><div className="grid"><Mic label="Room Number" value={gf.roomNumber} onChange={v=>guestField("roomNumber",v)}/><Mic label="Floor" value={gf.floor} onChange={v=>guestField("floor",v)}/><Mic label="Bed" value={gf.bed} onChange={v=>guestField("bed",v)}/><Mic label="Stay Amount" value={gf.amount} onChange={v=>guestField("amount",v)}/><StayDaysInput value={String(gf.stayDays||"")} onChange={updateGuestDays}/><div className="field"><label>Check-in Date</label><input type="date" value={gf.checkInDate} onChange={e=>updateGuestCheckIn(e.target.value)}/></div><div className="field"><label>Expected Check-out</label><input value={gf.checkOutDate||"Auto calculated"} readOnly/></div></div><div className="small" style={{marginTop:10}}>Example: Stay Days = 3 and Amount = ₹1,500. The expected check-out date is calculated automatically.</div></div>{msg&&<div className="success">{msg}</div>}<button className="primary">Save Guest</button></form>}
{page==="Guests"&&!guestArchivedOpen&&<div className="card"><div className="top"><div><h2>🧳 Guests</h2><div className="small">Short-stay guests with the same KYC, room, bed, amount and stay-day details.</div></div><div className="actions"><button className="secondary" onClick={()=>setPage("Add Guest")}>＋ Add Guest</button><button className="secondary" onClick={()=>setGuestArchivedOpen(true)}>🗂️ Guest History</button></div></div><div className="search"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search guest, mobile, room or document"/></div><table className="table"><thead><tr><th>Name</th><th>Mobile</th><th>Room / Bed</th><th>Stay</th><th>Amount</th><th>Check-out</th></tr></thead><tbody>{guests.filter(g=>(g.fullName+" "+g.mobile+" "+g.room+" "+g.documentNumber).toLowerCase().includes(q.toLowerCase())).map(g=><tr key={g.id}><td><button className="linkbtn" onClick={()=>{setGsel(g);setGuestProfileArchived(false)}}>{g.fullName}</button></td><td>{g.mobile||"-"}</td><td>{g.room||"-"} / {g.bed||"-"}</td><td>{g.stayDays||1} day{Number(g.stayDays)===1?"":"s"}</td><td>₹{g.amount||"0"}</td><td>{g.checkOutDate||"-"}</td></tr>)}</tbody></table></div>}
{guestArchivedOpen&&<GuestHistory onOpen={openGuestArchived} onBack={()=>setGuestArchivedOpen(false)}/>} 
{page==="Payments"&&<div className="card"><h2>💰 Payments</h2><p>Open a student from Students and click <b>+ Payment</b> to record the amount paid for a month.</p></div>}
{page==="Reminders"&&<div className="card"><h2>📲 Reminders</h2><p>Open a student profile and click WhatsApp Payment Reminder.</p></div>}
{sel&&<div className="profilePrintOverlay" style={{position:"fixed",inset:0,zIndex:9,background:"#0009",display:"grid",placeItems:"center",padding:20}}><div className="profilePrintCard card" style={{width:"min(1050px,100%)",maxHeight:"92vh",overflow:"auto"}}><div className="top"><div><h2>{sel.fullName}</h2><div className="small">Student Profile · {sel.id} · {profileArchived?"Checked Out":"Active"}</div></div><div className="actions"><button className="secondary" onClick={()=>window.print()}>🖨️ Print</button>{!profileArchived&&<><button className="secondary" onClick={()=>setEditOpen(true)}>✏️ Edit</button><button className="secondary" onClick={()=>setPaymentOpen(true)}>💰 Add Payment</button></>}<button className="secondary" onClick={()=>setHistoryOpen(true)}>📜 History</button><button className="secondary" onClick={()=>setShareOpen(true)}>📲 Share</button>{sel.frontProof&&<a className="secondary" href={sel.frontProof} download={`${sel.fullName}-proof-front.jpg`}>⬇️ Front</a>}{sel.backProof&&<a className="secondary" href={sel.backProof} download={`${sel.fullName}-proof-back.jpg`}>⬇️ Back</a>}{!profileArchived&&<button className="danger" onClick={checkoutStudent}>🗑️ Delete / Check-out</button>}<button className="secondary" onClick={()=>setSel(null)}>Close</button></div></div><div className="grid"><div><b>Full Name</b><p>{sel.fullName||"-"}</p></div><div><b>Mobile</b><p>{sel.mobile||"-"}</p></div><div><b>Gender</b><p>{sel.gender||"-"}</p></div><div><b>DOB</b><p>{sel.dob||"-"}</p></div><div><b>Room / Bed</b><p>{sel.room||"-"} / {sel.bed||"-"}</p></div><div><b>Floor</b><p>{sel.floor||"-"}</p></div><div><b>Document Number</b><p>{sel.documentNumber||"-"}</p></div><div><b>Advance</b><p>₹{sel.advance||"0"}</p></div><div><b>Monthly Rent</b><p>₹{sel.monthlyRent||"0"}</p></div><div><b>Emergency Contact</b><p>{sel.emergency||"-"}</p></div></div><div className="card" style={{marginTop:16}}><h3>Address</h3><p style={{whiteSpace:"pre-wrap"}}>{sel.address||"-"}</p></div><StudentPaymentHistoryInline student={sel}/><div className="card printProofSection" style={{marginTop:16}}><h3>🪪 Identity Proofs</h3><div className="grid"><div className="proofBox printProof"><b>Front Side</b>{sel.frontProof?<img src={sel.frontProof} className="docpreview printProofImage" style={{marginTop:10,maxHeight:380}}/>:<p className="muted">Front proof not saved.</p>}{sel.frontProof&&<a className="secondary" style={{display:"inline-block",marginTop:10}} href={sel.frontProof} target="_blank">🔍 View Full Size</a>}</div><div className="proofBox printProof"><b>Back Side</b>{sel.backProof?<img src={sel.backProof} className="docpreview printProofImage" style={{marginTop:10,maxHeight:380}}/>:<p className="muted">Back proof not saved.</p>}{sel.backProof&&<a className="secondary" style={{display:"inline-block",marginTop:10}} href={sel.backProof} target="_blank">🔍 View Full Size</a>}</div></div></div><WhatsApp s={sel}/></div></div>}
{gsel&&<GuestProfileModal guest={gsel} archived={guestProfileArchived} onClose={()=>setGsel(null)} onEdit={()=>setGuestEditOpen(true)} onCheckout={checkoutGuest}/>}
{guestEditOpen&&gsel&&!guestProfileArchived&&<GuestEditModal guest={gsel} onClose={()=>setGuestEditOpen(false)} onSaved={guest=>{setGsel(guest);setGuestEditOpen(false);load();setMsg("Guest details updated.")}}/>}
{editOpen&&sel&&!profileArchived&&<EditStudentModal student={sel} onClose={()=>setEditOpen(false)} onSaved={student=>{setSel(student);setEditOpen(false);load();setMsg("Student details updated.")}}/>}
{paymentOpen&&sel&&<PaymentModal student={sel} onClose={()=>setPaymentOpen(false)} onSaved={()=>{setPaymentOpen(false);setHistoryOpen(true);setMsg("Payment recorded successfully.")}}/>}
{historyOpen&&sel&&<HistoryModal student={sel} onClose={()=>setHistoryOpen(false)}/>} 
{shareOpen&&sel&&<ShareStudentModal student={sel} onClose={()=>setShareOpen(false)}/>} 
</main></div>
}
