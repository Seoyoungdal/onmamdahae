"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {deleteDeviceScore,deleteServiceScores,getDeviceScores,saveDeviceScore} from "../lib/device-scores";
type Assignment={part:string;name:string};
type Service={id:number;date:string;time:string;title:string;type:string;leader?:string;tone:string;location:string;playlist:string;assignments:Assignment[];printName?:string};
type Song={id:number;serviceId?:number;title:string;artist:string;key:string;bpm:number;file:string;version:string;updated:string;ref:string;note:string;server?:boolean;annotated?:boolean};
type ScoreKind="original"|"annotated"|"personal";
const defaultAssignments:Assignment[]=[{part:"인도",name:"박은찬"},{part:"드럼",name:"최도윤"},{part:"베이스",name:"한예준"},{part:"메인건반",name:"김소망"},{part:"세컨건반",name:"오하린"},{part:"일렉기타",name:"이주원"}];
const initialServices:Service[]=[{id:1,date:"2026-08-02",time:"오후 7:30",title:"수요예배",type:"수요",leader:"박은찬",tone:"blue",location:"본당",playlist:"",assignments:defaultAssignments},{id:2,date:"2026-08-06",time:"오후 2:00",title:"청년예배",type:"청년",leader:"김소망",tone:"orange",location:"본당",playlist:"",assignments:defaultAssignments},{id:3,date:"2026-08-09",time:"오전 11:00",title:"주일 2부예배",type:"주일",leader:"박은찬",tone:"navy",location:"본당",playlist:"",assignments:defaultAssignments}];
const initialSongs:Song[]=[
{id:1,title:"주님 큰 영광 받으소서",artist:"마커스워십",key:"A",bpm:132,file:"주님_큰_영광_받으소서_A.png",version:"v3",updated:"8월 21일 수정",ref:"https://youtube.com",note:"2절 후 후렴 2번, 마지막은 rit."},
{id:2,title:"예수 열방의 소망",artist:"어노인팅",key:"D",bpm:76,file:"예수_열방의_소망_D.jpg",version:"v1",updated:"8월 18일",ref:"https://youtube.com",note:"원곡과 동일하게 진행합니다."},
{id:3,title:"내 삶을 깨뜨립니다",artist:"WELOVE",key:"E",bpm:68,file:"내_삶을_깨뜨립니다_E.png",version:"v2",updated:"8월 20일 수정",ref:"https://youtube.com",note:"간주 4마디 후 브릿지로 진입"},
{id:4,title:"나는 주만 높이리",artist:"제이어스",key:"G",bpm:128,file:"나는_주만_높이리_G.jpg",version:"v1",updated:"8월 17일",ref:"https://youtube.com",note:"엔딩은 후렴 첫 마디에서 컷"}];
const holidays2026:Record<string,string>={"2026-01-01":"신정","2026-02-16":"설날 연휴","2026-02-17":"설날","2026-02-18":"설날 연휴","2026-03-01":"삼일절","2026-03-02":"대체공휴일","2026-05-05":"어린이날","2026-05-24":"부처님오신날","2026-05-25":"대체공휴일","2026-06-03":"지방선거일","2026-06-06":"현충일","2026-08-15":"광복절","2026-08-17":"대체공휴일","2026-09-24":"추석 연휴","2026-09-25":"추석","2026-09-26":"추석 연휴","2026-10-03":"개천절","2026-10-05":"대체공휴일","2026-10-09":"한글날","2026-12-25":"성탄절"};
export default function Home(){
 const[selected,setSelected]=useState<Service|null>(null),[services,setServices]=useState(initialServices),[songs,setSongs]=useState(initialSongs),[notice,setNotice]=useState(""),[role,setRole]=useState<"leader"|"member"|"admin">("member"),[memoSong,setMemoSong]=useState<number|null>(null),[calendarMonth,setCalendarMonth]=useState(()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),1)}),[dragged,setDragged]=useState<number|null>(null),[dayPicker,setDayPicker]=useState<Service[]|null>(null),[viewer,setViewer]=useState<Array<{songId:number;title:string;url:string;kind:string}>|null>(null),[viewerIndex,setViewerIndex]=useState(0),[scorePicker,setScorePicker]=useState<"download"|"view"|null>(null),[scoreChecks,setScoreChecks]=useState<Record<number,boolean>>({}),[scoreKinds,setScoreKinds]=useState<Record<number,ScoreKind>>({}),uploadRef=useRef<HTMLInputElement>(null),printRef=useRef<HTMLInputElement>(null),songsRef=useRef(songs);
 const monthLabel=useMemo(()=>`${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth()+1}월`,[calendarMonth]);
 useEffect(()=>{fetch("/api/bootstrap").then(async r=>{if(!r.ok)return;const d=await r.json();setRole(d.user.role);const assignments=d.assignments||[];const loadedServices=(d.services||[]).map((s:any,i:number)=>({id:s.id,date:s.service_date,time:s.service_time,title:s.title,type:s.title.replace("예배",""),leader:s.leader_name||undefined,tone:["navy","orange","mint","violet","blue"][i%5],location:s.location||"본당",playlist:s.playlist_url||"",printName:s.print_name||undefined,assignments:assignments.filter((a:any)=>a.service_id===s.id).map((a:any)=>({part:a.part,name:a.member_name}))}));if(loadedServices.length)setServices(loadedServices);const uploaded=(d.songs||[]).map((s:any)=>({id:s.id,serviceId:s.service_id,title:s.title,artist:"",key:s.song_key,bpm:s.bpm,file:s.original_name,version:`v${s.version}`,updated:new Date(s.updated_at).toLocaleDateString("ko-KR"),ref:s.reference_url,note:"",server:true,annotated:!!s.annotated_name}));if(uploaded.length)setSongs(uploaded)})},[]);
 useEffect(()=>{songsRef.current=songs},[songs]);
 function flash(m:string){setNotice(m);setTimeout(()=>setNotice(""),2400)}
 function download(song:Song){const blob=new Blob([`${song.title}\n키 ${song.key} · ${song.bpm} BPM\n\n인도자 메모: ${song.note}`],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${song.file}_${song.version}.txt`;a.click();URL.revokeObjectURL(url);flash("내 장치에 악보 사본을 저장했습니다.")}
 function reorder(target:number){if(dragged===null||dragged===target)return;setSongs(current=>{const next=[...current],from=next.findIndex(s=>s.id===dragged),to=next.findIndex(s=>s.id===target);if(from<0||to<0)return current;const[item]=next.splice(from,1);next.splice(to,0,item);songsRef.current=next;return next})}
 async function finishReorder(){if(dragged===null)return;setDragged(null);if(!selected)return;const ids=songsRef.current.filter(s=>s.server&&s.serviceId===selected.id).map(s=>s.id);const res=await fetch(`/api/services/${selected.id}/songs/order`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({songIds:ids})});flash(res.ok?"찬양 순서를 저장했습니다.":await res.text())}
 function dragByTouch(e:React.PointerEvent){if(dragged===null)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>("[data-song-id]");if(target)reorder(Number(target.dataset.songId))}
 function moveSong(songId:number,direction:-1|1){if(!selected)return;const visible=songs.filter(s=>!s.server||s.serviceId===selected.id),at=visible.findIndex(s=>s.id===songId),other=visible[at+direction];if(at<0||!other)return;const next=[...songs],from=next.findIndex(s=>s.id===songId),to=next.findIndex(s=>s.id===other.id);[next[from],next[to]]=[next[to],next[from]];setSongs(next);flash("찬양 순서를 변경했습니다.")}
 async function deleteSong(song:Song){if(!confirm(`‘${song.title}’ 악보를 삭제할까요?`))return;if(song.server){const res=await fetch(`/api/songs/${song.id}`,{method:"DELETE"});if(!res.ok){flash(await res.text());return}}await deleteDeviceScore(song.id);for(const key of [`draw-${song.id}`,`draw-size-${song.id}`,`draw-format-${song.id}`,`note-${song.id}`])localStorage.removeItem(key);setSongs(v=>v.filter(s=>s.id!==song.id));flash("악보를 삭제했습니다.")}
 async function deleteService(){if(!selected||!confirm(`‘${selected.title}’ 예배를 삭제할까요?\n포함된 모든 곡과 악보도 함께 삭제되며 되돌릴 수 없습니다.`))return;const id=selected.id,res=await fetch(`/api/services/${id}`,{method:"DELETE"});if(!res.ok){flash(await res.text());return}await deleteServiceScores(id);setServices(v=>v.filter(s=>s.id!==id));setSongs(v=>v.filter(s=>s.serviceId!==id));setSelected(null);flash("예배와 포함된 악보를 삭제했습니다.")}
 async function changeRole(next:"leader"|"member"|"admin"){if(next==="member"){const res=await fetch("/api/role",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({role:next})});if(res.ok)setRole(next);return}while(true){const password=prompt(`${next==="admin"?"관리자":"인도자"} 비밀번호를 입력해 주세요.`);if(password===null)return;const res=await fetch("/api/role",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({role:next,password})});if(res.ok){setRole(next);flash(`${next==="admin"?"관리자":"인도자"}로 전환했습니다.`);return}alert(await res.text())}}
 async function fitForTablet(file:File){const img=new Image(),url=URL.createObjectURL(file);await new Promise<void>((ok,fail)=>{img.onload=()=>ok();img.onerror=()=>fail();img.src=url});const max=2400;if(Math.max(img.width,img.height)<=max){URL.revokeObjectURL(url);return file}const ratio=max/Math.max(img.width,img.height),canvas=document.createElement("canvas");canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);canvas.getContext("2d")!.drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,file.type,file.type==="image/jpeg"?.9:undefined));return blob?new File([blob],file.name,{type:file.type}):file}
 async function uploadScores(files:FileList|File[]){if(!selected)return;const list=Array.from(files);if(!list.length)return;flash(`${list.length}개 악보를 준비하고 있습니다.`);let added=0;for(const file of list){const fitted=await fitForTablet(file),title=file.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim();const form=new FormData();form.set("serviceId",String(selected.id));form.set("title",title);form.set("referenceUrl","");form.set("file",fitted);const res=await fetch("/api/songs",{method:"POST",body:form});if(!res.ok){flash(`${file.name}: ${await res.text()}`);continue}const s=await res.json();setSongs(v=>[...v,{id:s.id,serviceId:s.service_id,title:s.title,artist:"",key:s.song_key,bpm:s.bpm,file:s.original_name,version:`v${s.version}`,updated:"방금 업로드",ref:"",note:"",server:true,annotated:false}]);added++}flash(`${added}개 악보를 업로드했습니다. 파일명이 곡 제목으로 입력되었습니다.`)}
 async function createService(datePreset?:string){const title=prompt("예배 이름을 입력해 주세요.","주일예배");if(!title)return;const date=datePreset||prompt("예배 날짜를 입력해 주세요. (YYYY-MM-DD)",`${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,"0")}-01`);if(!date)return;const location=prompt("예배 장소를 입력해 주세요.","본당")||"본당";const playlistUrl=prompt("전체곡 유튜브 플레이리스트 주소가 있으면 입력해 주세요.","")||"";const res=await fetch("/api/services",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title,date,time:"",location,playlistUrl})});if(!res.ok){flash(await res.text());return}const s=await res.json();const made:Service={id:s.id,date:s.service_date,time:"",title:s.title,type:s.title.replace("예배",""),tone:["navy","orange","mint","violet","blue"][services.filter(v=>v.date===date).length%5],location:s.location,playlist:s.playlist_url||"",assignments:[]};setServices(v=>[...v,made].sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,"ko")));setCalendarMonth(new Date(`${date}T00:00:00`));flash("새 예배를 달력에 저장했습니다.")}
 async function editService(){if(!selected)return;const title=prompt("예배 이름",selected.title);if(!title)return;const date=prompt("예배 날짜 (YYYY-MM-DD)",selected.date);if(!date)return;const time=prompt("예배 시간",selected.time);if(!time)return;const location=prompt("예배 장소",selected.location)||selected.location;const leaderName=prompt("인도자 이름",selected.leader||"")||"";const playlistUrl=prompt("전체곡 유튜브 플레이리스트 주소",selected.playlist)||"";const assignments:Assignment[]=[];for(const part of ["드럼","베이스","메인건반","세컨건반","일렉기타"]){const old=selected.assignments.find(a=>a.part===part)?.name||"";const name=prompt(`${part} 담당자`,old);if(name?.trim())assignments.push({part,name:name.trim()})}if(leaderName)assignments.unshift({part:"인도",name:leaderName});const res=await fetch(`/api/services/${selected.id}`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({title,date,time,location,leaderName,playlistUrl,assignments})});if(!res.ok){flash(await res.text());return}const next={...selected,title,date,time,location,leader:leaderName||undefined,playlist:playlistUrl,assignments};setServices(v=>v.map(s=>s.id===next.id?next:s));setSelected(next);flash("예배 정보와 담당자를 저장했습니다.")}
 async function editSong(song:Song){if(!song.server)return;const title=prompt("곡 제목",song.title);if(!title)return;const referenceUrl=prompt("유튜브 영상 주소",song.ref||"https://youtu.be/")||"";const res=await fetch(`/api/songs/${song.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({title,referenceUrl})});if(!res.ok){flash(await res.text());return}setSongs(v=>v.map(s=>s.id===song.id&&s.server?{...s,title,ref:referenceUrl}:s));flash("곡 제목과 유튜브 링크를 저장했습니다.")}
 async function saveSelected(next:Service){const res=await fetch(`/api/services/${next.id}`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({title:next.title,date:next.date,time:next.time,location:next.location,leaderName:next.leader||"",playlistUrl:next.playlist,assignments:next.assignments})});if(!res.ok){flash(await res.text());return false}setServices(v=>v.map(s=>s.id===next.id?next:s));setSelected(next);flash("변경 내용을 저장했습니다.");return true}
 async function editField(field:"title"|"date"|"time"|"location"|"leader"|"playlist",label:string){if(!selected||role==="member")return;const old=field==="leader"?(selected.leader||""):selected[field],value=prompt(label,old);if(value===null||!value.trim())return;await saveSelected({...selected,[field]:value.trim()})}
 async function editAssignment(part:string){if(!selected||role==="member")return;const old=selected.assignments.find(a=>a.part===part)?.name||"",name=prompt(`${part} 담당자 이름`,old);if(name===null)return;const assignments=selected.assignments.filter(a=>a.part!==part);if(name.trim())assignments.push({part,name:name.trim()});const next={...selected,assignments,...(part==="인도"?{leader:name.trim()||undefined}:{})};await saveSelected(next)}
 async function uploadPrint(file:File){if(!selected)return;const form=new FormData();form.set("file",file);const res=await fetch(`/api/services/${selected.id}/print`,{method:"POST",body:form});if(!res.ok){flash(await res.text());return}const d=await res.json(),next={...selected,printName:d.print_name};setSelected(next);setServices(v=>v.map(s=>s.id===next.id?next:s));flash("출력용 악보를 원본 크기로 저장했습니다.")}
 async function downloadToDevice(song:Song,kind:"original"|"annotated"){if(!song.server||!song.serviceId)return;let blob:Blob;try{blob=await fetchChosen(song,kind)}catch(e){flash(e instanceof Error?e.message:"악보를 받지 못했습니다.");return}await saveDeviceScore({songId:song.id,serviceId:song.serviceId,title:song.title,kind,blob,savedAt:Date.now(),version:song.version,renderVersion:"layer-v3"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${song.title}-${kind==="annotated"?"표시본":"원본"}.${blob.type.includes("png")?"png":"jpg"}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);flash("악보를 이 기기에 저장했습니다.")}
 async function fetchChosen(song:Song,kind:ScoreKind){const serverKind=kind!=="original"&&song.annotated?"annotated":"original",res=await fetch(`/api/songs/${song.id}/file?kind=${serverKind}&v=${song.version}&t=${Date.now()}`,{cache:"no-store",headers:{"cache-control":"no-cache"}});if(!res.ok)throw new Error(await res.text());const blob=await res.blob();return kind==="personal"?mergePersonalDrawing(blob,song.id):blob}
 function showScorePicker(mode:"download"|"view"){if(!selected)return;const list=songs.filter(s=>s.server&&s.serviceId===selected.id);if(!list.length){flash("악보가 없습니다.");return}setScoreChecks(Object.fromEntries(list.map(s=>[s.id,true])));setScoreKinds(Object.fromEntries(list.map(s=>[s.id,s.annotated?"annotated":localStorage.getItem(`draw-format-${s.id}`)==="layer-v2"?"personal":"original"])));setScorePicker(mode)}
 async function runScorePicker(){if(!selected||!scorePicker)return;const list=songs.filter(s=>s.server&&s.serviceId===selected.id&&scoreChecks[s.id]);if(!list.length){flash("한 곡 이상 선택해 주세요.");return}const cached=await getDeviceScores(selected.id),out=[] as Array<{songId:number;title:string;url:string;kind:string}>,wanted=(song:Song,kind:ScoreKind)=>kind==="annotated"?"annotated":"original",stale=list.filter(song=>{const kind=scoreKinds[song.id]||"original",saved=cached.find(c=>c.songId===song.id&&c.kind===wanted(song,kind));return kind==="personal"||!saved||saved.version!==song.version||saved.renderVersion!=="viewer-fill-v1"});if(scorePicker==="view"&&stale.length&&!confirm(`${stale.length}곡만 새로 받으면 됩니다. 다운로드할까요?`))return;for(const song of list){const kind=scoreKinds[song.id]||"original";try{const saved=cached.find(c=>c.songId===song.id&&c.kind===wanted(song,kind)&&c.version===song.version&&c.renderVersion==="viewer-fill-v1");let blob=scorePicker==="view"&&saved&&kind!=="personal"?saved.blob:await fetchChosen(song,kind);await saveDeviceScore({songId:song.id,serviceId:selected.id,title:song.title,kind:wanted(song,kind),blob,savedAt:Date.now(),version:song.version,renderVersion:"viewer-fill-v1"});if(scorePicker==="download"){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${String(list.indexOf(song)+1).padStart(2,"0")}-${song.title}-${kind==="personal"?"내표시본":kind==="annotated"?"인도자표시본":"원본"}.${blob.type.includes("png")?"png":"jpg"}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}else out.push({songId:song.id,title:song.title,url:URL.createObjectURL(blob),kind:kind==="personal"?"내 필기":kind})}catch(e){flash(e instanceof Error?e.message:"악보를 불러오지 못했습니다.")}}const mode=scorePicker;setScorePicker(null);if(mode==="view"&&out.length){setViewer(out);setViewerIndex(0)}else flash("선택한 악보를 저장했습니다.")}
 const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth(),firstDay=new Date(year,month,1).getDay(),daysInMonth=new Date(year,month+1,0).getDate(),prevMonthDays=new Date(year,month,0).getDate();
 return <main className="app-shell">
  <header className="topbar">
<button className="brand" onClick={()=>setSelected(null)}>
<span className="brand-mark">온</span>
<span>
<b>온맘다해</b>
<small>WORSHIP TOGETHER</small>
</span>
</button>
<span className="app-version">v2.0.0</span>
<nav><button className="nav-active">캘린더</button></nav>
<div className="user-area">
<select value={role} onChange={e=>changeRole(e.target.value as typeof role)}>
<option value="leader">인도자</option>
<option value="member">팀원</option>
<option value="admin">관리자</option>
</select>
<div className="avatar" title={role==="admin"?"관리자":role==="leader"?"인도자":"단원"}>{role==="admin"?"관":role==="leader"?"인":"단"}</div>
</div>
</header>
  <section className="hero">
<div>
<span className="eyebrow">WORSHIP CALENDAR</span>
<h1>함께 준비하는 예배,<br/>
<em>한눈에 모아보세요.</em>
</h1>
<p>콘티부터 악보, 팀 편성까지. 예배의 모든 준비를 한곳에서 나눕니다.</p>
</div>
<div className="verse">
<span>✦</span>
<p>“모든 것을 품위 있게 하고<br/>질서 있게 하라”</p>
<small>고린도전서 14:40</small>
</div>
</section>
  <section className="calendar-card">
<div className="calendar-head">
<div className="month-nav">
<button onClick={()=>setCalendarMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}>‹</button>
<h2>{monthLabel}</h2>
<button onClick={()=>setCalendarMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}>›</button>
<button className="today" onClick={()=>{const n=new Date();setCalendarMonth(new Date(n.getFullYear(),n.getMonth(),1))}}>오늘</button>
</div>{role!=="member"&&<button className="primary" onClick={()=>createService()}>＋ 새 예배 만들기</button>}</div>
<div className="weekdays">{["주일","월","화","수","목","금","토"].map((d,i)=>
<span className={i===0?"sun":""} key={d}>{d}</span>)}</div>
<div className="calendar-grid">{Array.from({length:42},(_,i)=>{const current=i-firstDay+1,inMonth=current>=1&&current<=daysInMonth,day=inMonth?current:current<1?prevMonthDays+current:current-daysInMonth,dateKey=`${year}-${String(month+1).padStart(2,"0")}-${String(current).padStart(2,"0")}`,dayServices=inMonth?services.filter(s=>s.date===dateKey).sort((a,b)=>a.title.localeCompare(b.title,"ko")):[],holiday=inMonth?holidays2026[dateKey]:undefined,today=new Date(),isToday=inMonth&&year===today.getFullYear()&&month===today.getMonth()&&day===today.getDate();return <div className={`day ${!inMonth?"muted":""} ${holiday?"holiday-day":""} ${isToday?"current":""}`} onDoubleClick={()=>inMonth&&role!=="member"&&createService(dateKey)} title={inMonth&&role!=="member"?"더블클릭하여 이 날짜에 예배 만들기":undefined} key={i}>
<button className="date date-button" onClick={()=>dayServices.length&&setDayPicker(dayServices)} disabled={!dayServices.length}>{day}</button>{holiday&&<span className="holiday-name" title={holiday}>{holiday}</span>}{dayServices.slice(0,2).map(svc=>
<button className={`event ${svc.tone}`} onClick={()=>setSelected(svc)} key={svc.id}>
<strong>{svc.title}</strong>
</button>)}{dayServices.length>2&&<button className="more-events" onClick={()=>setDayPicker(dayServices)}>… 외 {dayServices.length-2}개</button>}</div>})}</div>
</section>
  <footer>
<span>© 2026 온맘다해 예배팀</span>
<span>이번 달 예배 <b>8</b>회 · 함께하는 팀원 <b>24</b>명</span>
</footer>
  {dayPicker&&<div className="modal-back" onClick={()=>setDayPicker(null)}>
<div className="day-modal" onClick={e=>e.stopPropagation()}>
<span className="eyebrow">WORSHIP ON THIS DAY</span>
<h2>{new Date(`${dayPicker[0].date}T00:00:00`).toLocaleDateString("ko-KR")}</h2>{dayPicker.map(s=>
<button key={s.id} className={`day-modal-event ${s.tone}`} onClick={()=>{setDayPicker(null);setSelected(s)}}>
<b>{s.title}</b>
<span>{s.location}{s.leader?` · 인도 ${s.leader}`:""}</span>
</button>)}<button className="outline close-day" onClick={()=>setDayPicker(null)}>닫기</button>
</div>
</div>}
  {selected&&<div className="detail-layer">
<div className="detail-top">
<button className="back" onClick={()=>setSelected(null)}>← 캘린더로 돌아가기</button>
<div className="detail-actions">
<span className="lock">● {selected.leader?`${selected.leader} 인도자 편집 중`:"인도자 미지정 · 공동 편집 가능"}</span>{selected.playlist?<a className="outline playlist-link" href={selected.playlist} target="_blank" rel="noreferrer">▶ 플레이리스트 재생</a>:<span className="playlist-empty">플레이리스트 미등록</span>}{role!=="member"&&<><button className="outline" onClick={()=>editField("playlist","유튜브 플레이리스트 주소")}>✎ 플레이리스트 수정</button><button className="outline service-delete" onClick={deleteService}>예배 삭제</button></>}<button className="primary" onClick={()=>{navigator.clipboard?.writeText(location.href);flash("팀 공유 링크를 복사했습니다.")}}>팀에 공유</button>
</div>
</div>
<div className="detail-wrap">
   <div className="service-title">
<button className="date-block editable" onClick={()=>editField("date","예배 날짜 (YYYY-MM-DD)")}>
<b>{Number(selected.date.slice(-2))}</b>
<span>{selected.date.slice(5,7)}월<br/>{new Date(`${selected.date}T00:00:00`).toLocaleDateString("ko-KR",{weekday:"short"})}</span>
</button>
<div>
<span className="eyebrow">{selected.type.toUpperCase()} WORSHIP</span>
<button className="inline-title editable" onClick={()=>editField("title","예배 이름")}>{selected.title}</button>
<p>
<button className="inline-edit editable" onClick={()=>editField("location","예배 장소")}>{selected.location}</button>
</p>
</div>
</div>
   <section className="crew-section">
<div className="section-label">
<span>01</span>
<div>
<h2>함께 섬기는 사람들</h2>
<p>{role!=="member"?"담당자 카드를 누르면 바로 수정할 수 있습니다.":"각자의 자리에서 한 마음으로 준비합니다."}</p>
</div>
</div>
<div className="crew-grid">{[{part:"인도",label:"인도",icon:"🎤"},{part:"드럼",label:"드럼",icon:"🥁"},{part:"베이스",label:"베이스기타",icon:"🎸"},{part:"메인건반",label:"메인건반",icon:"🎹"},{part:"세컨건반",label:"세컨건반",icon:"🎹"},{part:"일렉기타",label:"일렉기타",icon:"🎸"}].map(({part,label,icon},i)=>{const name=(selected.assignments.length?selected.assignments:defaultAssignments).find(a=>a.part===part)?.name||"미정";return <button className="crew-card editable" key={part} onClick={()=>editAssignment(part)}>
<div className="crew-avatar part-icon" aria-hidden="true">{icon}</div>
<div>
<span>{label}</span>
<b>{name}</b>
</div>{i===0&&<small>LEADER</small>}</button>})}</div>
</section>
   <section className="songs-section">
<div className="section-label">
<span>02</span>
<div>
<h2>찬양 콘티</h2>
<p>다운로드한 악보는 예배 순서대로 쓸어 넘겨 볼 수 있습니다.</p>
</div>
<div className="score-controls"><button className="outline download-all" onClick={()=>showScorePicker("download")}>↓ 전체 다운로드</button><button className="primary score-view-button" onClick={()=>showScorePicker("view")}>▣ 악보 보기</button>{role!=="member"&&<>
<input ref={uploadRef} className="hidden-file" type="file" accept="image/jpeg,image/png" multiple onChange={e=>{if(e.target.files?.length)uploadScores(e.target.files);e.target.value=""}}/>
<button className="outline upload" onClick={()=>uploadRef.current?.click()}>↑ 악보 한꺼번에 업로드</button>
</>}</div></div>
<div className="song-list">{songs.filter(song=>!song.server||song.serviceId===selected.id).map((song,index)=>
<article className={`song compact-song ${dragged===song.id?"song-dragging":""}`} data-song-id={song.id} key={`${song.server?"s":"d"}-${song.id}`} onDoubleClick={()=>role!=="member"&&editSong(song)} draggable={role!=="member"} onDragStart={()=>setDragged(song.id)} onDragEnd={finishReorder} onDragOver={e=>e.preventDefault()} onDrop={()=>reorder(song.id)}>
<button className="grip" aria-label={`${song.title} 순서 이동`} onPointerDown={e=>{if(role==="member")return;e.currentTarget.setPointerCapture(e.pointerId);setDragged(song.id);navigator.vibrate?.(25)}} onPointerMove={dragByTouch} onPointerUp={finishReorder} onPointerCancel={finishReorder}>☰</button>
<span className="order">{String(index+1).padStart(2,"0")}</span>
<div className="song-main">
<h3>{song.title} <em className="version-badge">{song.version}</em></h3>
<p>{song.server?"다운로드하면 내 악보함에 저장됩니다":"샘플 악보"}</p>
</div>
<div className="file-box">
<div className="pdf">IMG</div>
<div>
<b>{song.file}</b>
<span>
<em>{song.version}</em> · {song.updated}</span>
</div>
</div>
<div className="song-actions">{song.ref?<a href={song.ref} target="_blank" rel="noreferrer" title="유튜브 영상 재생">▶</a>:<button disabled title="유튜브 링크 없음">▶</button>}<button onClick={()=>setMemoSong(song.id)} title="악보 위에 그리기">✎</button>{song.server?<>
<button className="download" onClick={()=>downloadToDevice(song,"original")} title="원본 다운로드 및 내 악보함 저장">원</button>{song.annotated&&<button className="download marked" onClick={()=>downloadToDevice(song,"annotated")} title="표시본 다운로드 및 내 악보함 저장">표</button>}</>:<button className="download" onClick={()=>download(song)}>↓</button>}{role!=="member"&&<button className="score-delete" onClick={()=>deleteSong(song)} title="이 곡과 악보 삭제">삭제</button>}</div>
</article>)}</div>
<div className="print-score">
<div>
<b>출력용 악보</b>
<p>축소하지 않은 원본 크기로 보관하고 다운로드합니다.</p>{selected.printName&&<span>✓ {selected.printName}</span>}</div>
<input ref={printRef} className="hidden-file" type="file" accept="image/jpeg,image/png,application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)uploadPrint(f);e.target.value=""}}/>{role!=="member"&&<button className="outline" onClick={()=>printRef.current?.click()}>출력용 원본 업로드</button>}{selected.printName&&<a className="primary print-download" href={`/api/services/${selected.id}/print`}>출력용 악보 다운로드</a>}</div>
<div className="tip">
<b>악보 종류 선택</b>
<p>전체 다운로드와 악보 보기에서 곡마다 원본·인도자 표시본·내 표시본을 선택할 수 있습니다.</p>
</div>
</section>
  </div>
</div>}
  {scorePicker&&selected&&<ScorePicker mode={scorePicker} songs={songs.filter(s=>s.server&&s.serviceId===selected.id)} checks={scoreChecks} kinds={scoreKinds} setChecks={setScoreChecks} setKinds={setScoreKinds} onCancel={()=>setScorePicker(null)} onConfirm={runScorePicker}/>} {memoSong&&<DrawingSheet key={memoSong} song={songs.find(s=>s.id===memoSong)!} canShare={role!=="member"} onNavigate={direction=>{const current=songs.find(s=>s.id===memoSong),list=songs.filter(s=>s.server&&s.serviceId===current?.serviceId),at=list.findIndex(s=>s.id===memoSong),next=list[at+direction];if(next)setMemoSong(next.id)}} onShared={async version=>{await deleteDeviceScore(memoSong);setSongs(v=>v.map(s=>s.id===memoSong&&s.server?{...s,annotated:true,version:`v${version}`} :s));flash("최신 표시본을 팀에 공유했습니다.")}} onClose={()=>setMemoSong(null)} onSave={()=>{setMemoSong(null);flash("드로잉을 이 장치에 저장했습니다.")}}/>}{viewer&&<ScoreViewer items={viewer} index={viewerIndex} setIndex={setViewerIndex} onEdit={songId=>{viewer.forEach(v=>URL.revokeObjectURL(v.url));setViewer(null);setMemoSong(songId)}} onClose={()=>{viewer.forEach(v=>URL.revokeObjectURL(v.url));setViewer(null)}}/>}{notice&&<div className="toast">✓ {notice}</div>}
 </main>
}

function ScorePicker({mode,songs,checks,kinds,setChecks,setKinds,onCancel,onConfirm}:{mode:"download"|"view";songs:Song[];checks:Record<number,boolean>;kinds:Record<number,ScoreKind>;setChecks:(v:Record<number,boolean>)=>void;setKinds:(v:Record<number,ScoreKind>)=>void;onCancel:()=>void;onConfirm:()=>void}){
 return <div className="modal-back score-picker-back" onClick={onCancel}><div className="score-picker" onClick={e=>e.stopPropagation()}><header><div><span className="eyebrow">WORSHIP SETLIST</span><h2>{mode==="download"?"다운로드할 악보 선택":"볼 악보 선택"}</h2></div><button className="back" onClick={onCancel}>✕</button></header><div className="picker-all"><label><input type="checkbox" checked={songs.every(s=>checks[s.id])} onChange={e=>setChecks(Object.fromEntries(songs.map(s=>[s.id,e.target.checked])))}/> 콘티 전체 선택</label><span>{songs.filter(s=>checks[s.id]).length} / {songs.length}곡</span></div><div className="picker-list">{songs.map((song,i)=>{const personal=localStorage.getItem(`draw-format-${song.id}`)==="layer-v2";return <label className={`picker-row ${checks[song.id]?"checked":""}`} key={song.id}><input type="checkbox" checked={!!checks[song.id]} onChange={e=>setChecks({...checks,[song.id]:e.target.checked})}/><b>{String(i+1).padStart(2,"0")}</b><span><strong>{song.title}</strong><small>{song.version}{song.annotated?" · 인도자 표시본 있음":""}{personal?" · 내 표시본 있음":""}</small></span><select value={kinds[song.id]||"original"} disabled={!checks[song.id]} onChange={e=>setKinds({...kinds,[song.id]:e.target.value as ScoreKind})}><option value="original">원본</option>{song.annotated&&<option value="annotated">인도자 표시본</option>}{personal&&<option value="personal">내 표시본</option>}</select></label>})}</div><footer><button className="outline" onClick={onCancel}>취소</button><button className="primary" onClick={onConfirm}>{mode==="download"?"선택 악보 다운로드":"선택 악보 보기"}</button></footer></div></div>
}

function DrawingSheet({song,canShare,onNavigate,onShared,onClose,onSave}:{song:Song;canShare:boolean;onNavigate:(direction:-1|1)=>void;onShared:(version:number)=>Promise<void>;onClose:()=>void;onSave:()=>void}){
 const canvasRef=useRef<HTMLCanvasElement>(null),pinchRef=useRef(0),drawingRef=useRef(false),undoRef=useRef<ImageData|null>(null),[color,setColor]=useState("#e45f3d"),[size,setSize]=useState(4),[tool,setTool]=useState<"pen"|"eraser">("pen"),[note,setNote]=useState(""),[zoom,setZoom]=useState(100),[imageSize,setImageSize]=useState({width:900,height:1200}),[imageReady,setImageReady]=useState(false),[hasUndo,setHasUndo]=useState(false),[backgroundKind,setBackgroundKind]=useState<"original"|"annotated">(song.annotated?"annotated":"original"),[legacyMarks,setLegacyMarks]=useState(false),[legacyReset,setLegacyReset]=useState(false);
 useEffect(()=>{if(!imageReady)return;let cancelled=false;const c=canvasRef.current;if(!c)return;c.width=imageSize.width;c.height=imageSize.height;const ctx=c.getContext("2d")!,saved=localStorage.getItem(`draw-${song.id}`),savedSize=localStorage.getItem(`draw-size-${song.id}`),savedFormat=localStorage.getItem(`draw-format-${song.id}`),savedNote=localStorage.getItem(`note-${song.id}`);ctx.clearRect(0,0,c.width,c.height);const drawSource=(source:string)=>{const img=new Image();img.onload=()=>{if(!cancelled)ctx.drawImage(img,0,0,c.width,c.height)};img.src=source};if(canShare&&song.annotated&&!legacyReset){fetch(`/api/songs/${song.id}/annotate?v=${song.version}`,{cache:"no-store"}).then(async r=>{if(cancelled)return;if(r.ok){const url=URL.createObjectURL(await r.blob());setBackgroundKind("original");setLegacyMarks(false);drawSource(url);setTimeout(()=>URL.revokeObjectURL(url),2000)}else{setBackgroundKind("annotated");setLegacyMarks(true)}})}else if(!canShare&&saved&&savedFormat==="layer-v2"&&savedSize===`${imageSize.width}x${imageSize.height}`)drawSource(saved);if(savedNote)setNote(savedNote);return()=>{cancelled=true}},[song.id,song.version,song.annotated,canShare,legacyReset,imageReady,imageSize.width,imageSize.height]);
 function point(e:React.PointerEvent<HTMLCanvasElement>){const c=canvasRef.current!,r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*(c.width/r.width),y:(e.clientY-r.top)*(c.height/r.height)}}
 function start(e:React.PointerEvent<HTMLCanvasElement>){if(e.pointerType==="touch"&&!e.isPrimary)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);const ctx=e.currentTarget.getContext("2d")!,p=point(e);undoRef.current=ctx.getImageData(0,0,e.currentTarget.width,e.currentTarget.height);setHasUndo(true);ctx.beginPath();ctx.moveTo(p.x,p.y);drawingRef.current=true}
 function move(e:React.PointerEvent<HTMLCanvasElement>){if(!drawingRef.current)return;e.preventDefault();const ctx=e.currentTarget.getContext("2d")!,p=point(e);ctx.lineTo(p.x,p.y);ctx.globalCompositeOperation=tool==="eraser"?"destination-out":"source-over";ctx.strokeStyle=color;ctx.lineWidth=(tool==="eraser"?size*4:size)*(imageSize.width/900);ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();ctx.globalCompositeOperation="source-over"}
 function save(){const c=canvasRef.current!;localStorage.setItem(`draw-${song.id}`,c.toDataURL());localStorage.setItem(`draw-size-${song.id}`,`${c.width}x${c.height}`);localStorage.setItem(`draw-format-${song.id}`,"layer-v2");localStorage.setItem(`note-${song.id}`,note);onSave()}
 function clear(){const c=canvasRef.current;if(!c)return;const ctx=c.getContext("2d")!;undoRef.current=ctx.getImageData(0,0,c.width,c.height);setHasUndo(true);ctx.clearRect(0,0,c.width,c.height)}
 function undo(){const c=canvasRef.current;if(!c||!undoRef.current)return;c.getContext("2d")!.putImageData(undoRef.current,0,0);undoRef.current=null;setHasUndo(false)}
async function share(){if(!song.server)return;const c=canvasRef.current!,out=document.createElement("canvas");out.width=c.width;out.height=c.height;const ctx=out.getContext("2d")!;ctx.fillStyle="#fffdf7";ctx.fillRect(0,0,out.width,out.height);const img=document.querySelector<HTMLImageElement>(`.score-image[data-song="${song.id}"]`);if(img?.complete)ctx.drawImage(img,0,0,out.width,out.height);ctx.drawImage(c,0,0);const [blob,layerBlob]=await Promise.all([new Promise<Blob|null>(r=>out.toBlob(r,"image/png")),new Promise<Blob|null>(r=>c.toBlob(r,"image/png"))]);if(!blob)return;const form=new FormData();form.set("file",new File([blob],`${song.title}-표시본.png`,{type:"image/png"}));if(backgroundKind==="original"&&layerBlob)form.set("layer",new File([layerBlob],`${song.title}-표시레이어.png`,{type:"image/png"}));const res=await fetch(`/api/songs/${song.id}/annotate`,{method:"POST",body:form});if(!res.ok){alert(await res.text());return}const data=await res.json() as {version:number};await onShared(data.version);onClose()}
 function resetLegacy(){if(!confirm("기존 표시를 모두 지우고 깨끗한 원본에서 다시 시작할까요?"))return;setLegacyReset(true);setBackgroundKind("original");setLegacyMarks(false);clear()}
 return <div className="draw-layer">
<header>
<button className="back" onClick={onClose}>← 악보 목록</button>
<div className="draw-song-nav"><button onClick={()=>onNavigate(-1)}>‹ 이전 곡</button><span>{song.title}</span><button onClick={()=>onNavigate(1)}>다음 곡 ›</button></div>
<div className="draw-save-actions">{canShare&&song.server&&<button className="outline" onClick={share}>팀에 표시본 공유</button>}<button className="primary" onClick={save}>내 장치에 저장</button>
</div>
</header>
<div className="draw-body">
<aside>
<span className="eyebrow">DRAWING TOOLS</span>
<h2>악보에 표시하기</h2>
<p>애플펜슬, 스타일러스, 손가락과 마우스를 모두 사용할 수 있습니다.</p>
<label>펜 색상</label>
<div className="colors">{["#e45f3d","#243a5e","#e6b934","#2d9664"].map(c=>
<button key={c} onClick={()=>setColor(c)} className={color===c?"chosen":""} style={{background:c}} aria-label={`${c} 색상`}/>)}</div>
<label>펜 굵기</label>
<input type="range" min="2" max="16" value={size} onChange={e=>setSize(+e.target.value)}/>
<div className="drawing-tools"><button className={tool==="pen"?"active":""} onClick={()=>setTool("pen")}>✎ 펜</button><button className={tool==="eraser"?"active":""} onClick={()=>setTool("eraser")}>⌫ 지우개</button><button onClick={undo} disabled={!hasUndo}>↶ 실행 취소</button></div>
{legacyMarks&&<button className="legacy-reset" onClick={resetLegacy}>기존 표시 초기화</button>}
<button className="clear-draw" onClick={clear}>필기 모두 지우기</button>
<div className="zoom-tools"><button onClick={()=>setZoom(z=>Math.max(50,z-25))} aria-label="축소">−</button><b>{zoom}%</b><button onClick={()=>setZoom(z=>Math.min(200,z+25))} aria-label="확대">＋</button><button onClick={()=>setZoom(100)}>화면 맞춤</button></div>
<label>글 메모</label>
<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="연주할 때 기억할 내용을 적어주세요."/>
</aside>
<div className="sheet-scroll" onTouchStart={e=>{if(e.touches.length===2)pinchRef.current=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)}} onTouchMove={e=>{if(e.touches.length!==2||!pinchRef.current)return;const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),ratio=d/pinchRef.current;if(ratio>1.08){setZoom(z=>Math.min(250,z+10));pinchRef.current=d}else if(ratio<.92){setZoom(z=>Math.max(50,z-10));pinchRef.current=d}}}>
<div className={`music-sheet ${song.server?"server-sheet":""}`} style={song.server?{width:`${zoom}%`,height:`${zoom}%`,maxWidth:"none",aspectRatio:"auto"}:{width:`${zoom}%`,maxWidth:zoom===100?"760px":"none",aspectRatio:`${imageSize.width}/${imageSize.height}`}}>{song.server&&<img className="score-image" data-song={song.id} src={`/api/songs/${song.id}/file?kind=${canShare?backgroundKind:song.annotated?"annotated":"original"}&v=${song.version}`} alt={`${song.title} 악보`} onLoad={e=>{const img=e.currentTarget;if(img.naturalWidth&&img.naturalHeight){setImageSize({width:img.naturalWidth,height:img.naturalHeight});setImageReady(true)}}}/>} {!song.server&&<div className="sheet-title">
<small>ONMAMDAHAE WORSHIP · KEY {song.key}</small>
<h1>{song.title}</h1>
<p>{song.artist} · {song.bpm} BPM</p>
</div>}<div className="staffs">{!song.server&&Array.from({length:9},(_,i)=>
<div className="staff" key={i}>
<b>{i%3===0?"G":i%3===1?"Em7":"C2"}</b>
<span>♪ ♩ ♫　♩ ♪　♫ ♩　♪ ♩</span>
<small>{i%2===0?"주 님 의　사 랑 을　노 래 합 니 다":"마 음 을　다 하 여　주 를 높 이 리"}</small>
</div>)}</div>
<canvas ref={canvasRef} width={imageSize.width} height={imageSize.height} onPointerDown={start} onPointerMove={move} onPointerUp={()=>drawingRef.current=false} onPointerCancel={()=>drawingRef.current=false}/>
</div>
</div>
</div>
</div>
}

function ScoreViewer({items,index,setIndex,onEdit,onClose}:{items:Array<{songId:number;title:string;url:string;kind:string}>;index:number;setIndex:(n:number)=>void;onEdit:(songId:number)=>void;onClose:()=>void}){
 const startX=useRef(0),touchStartX=useRef(0),pinch=useRef(0),[zoom,setZoom]=useState(100),next=()=>{setZoom(100);setIndex(Math.min(items.length-1,index+1))},prev=()=>{setZoom(100);setIndex(Math.max(0,index-1))};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="ArrowRight"||e.key===" ")next();if(e.key==="ArrowLeft")prev();if(e.key==="Escape")onClose()};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)});
 return <div className="score-viewer" onPointerDown={e=>{if(e.pointerType!=="touch")startX.current=e.clientX}} onPointerUp={e=>{if(e.pointerType==="touch")return;const dx=e.clientX-startX.current;if(dx<-45)next();if(dx>45)prev()}} onTouchStart={e=>{touchStartX.current=e.changedTouches[0].clientX;if(e.touches.length===2)pinch.current=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)}} onTouchMove={e=>{if(e.touches.length!==2||!pinch.current)return;const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),ratio=d/pinch.current;if(ratio>1.06){setZoom(z=>Math.min(300,z+10));pinch.current=d}else if(ratio<.94){setZoom(z=>Math.max(50,z-10));pinch.current=d}}} onTouchEnd={e=>{if(e.touches.length) return;pinch.current=0;if(zoom!==100)return;const dx=e.changedTouches[0].clientX-touchStartX.current;if(dx<-35)next();if(dx>35)prev()}}>
<header>
<button onClick={onClose}>✕ 닫기</button>
<div>
<b>{index+1} / {items.length}</b>
<span>{items[index].title} · {items[index].kind==="annotated"?"표시본":items[index].kind==="내 필기"?"내 필기":"원본"}</span>
</div>
<span>쓸어 넘기기 · 더블클릭하여 수정</span>
<div className="viewer-zoom"><button onClick={()=>setZoom(z=>Math.max(50,z-25))} aria-label="악보 축소">−</button><b>{zoom}%</b><button onClick={()=>setZoom(z=>Math.min(250,z+25))} aria-label="악보 확대">＋</button></div>
</header>
<div className="score-stage" style={{touchAction:zoom===100?"pan-y":"pan-x pan-y"}}>
<button className="viewer-arrow left" onClick={prev} disabled={index===0}>‹</button>
<img src={items[index].url} alt={items[index].title} draggable={false} onDoubleClick={()=>onEdit(items[index].songId)} style={{transform:`scale(${zoom/100})`}}/>
<button className="viewer-arrow right" onClick={next} disabled={index===items.length-1}>›</button>
</div>
<footer>{items.map((item,i)=>
<button key={item.title+i} className={i===index?"active":""} onClick={()=>setIndex(i)}>{i+1}</button>)}</footer>
</div>
}

async function mergePersonalDrawing(base:Blob,songId:number){
 const drawing=localStorage.getItem(`draw-${songId}`),savedSize=localStorage.getItem(`draw-size-${songId}`),format=localStorage.getItem(`draw-format-${songId}`);if(!drawing||format!=="layer-v2")return base;
 const load=(src:string)=>new Promise<HTMLImageElement>((ok,fail)=>{const img=new Image();img.onload=()=>ok(img);img.onerror=()=>fail(new Error("악보 이미지를 불러오지 못했습니다."));img.src=src}),baseUrl=URL.createObjectURL(base);
 try{const [score,marks]=await Promise.all([load(baseUrl),load(drawing)]);if(savedSize!==`${score.naturalWidth}x${score.naturalHeight}`||marks.naturalWidth!==score.naturalWidth||marks.naturalHeight!==score.naturalHeight)return base;const out=document.createElement("canvas");out.width=score.naturalWidth;out.height=score.naturalHeight;const ctx=out.getContext("2d")!;ctx.fillStyle="#fff";ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(score,0,0);ctx.drawImage(marks,0,0);return await new Promise<Blob>(resolve=>out.toBlob(blob=>resolve(blob||base),"image/png"))}finally{URL.revokeObjectURL(baseUrl)}
}

async function mergeLayerBlobs(base:Blob,layer:Blob){
 const load=(src:string)=>new Promise<HTMLImageElement>((ok,fail)=>{const img=new Image();img.onload=()=>ok(img);img.onerror=()=>fail(new Error("악보 이미지를 불러오지 못했습니다."));img.src=src}),baseUrl=URL.createObjectURL(base),layerUrl=URL.createObjectURL(layer);
 try{const [score,marks]=await Promise.all([load(baseUrl),load(layerUrl)]);if(score.naturalWidth!==marks.naturalWidth||score.naturalHeight!==marks.naturalHeight)throw new Error("원본과 표시 레이어의 크기가 달라 다시 공유해야 합니다.");const out=document.createElement("canvas");out.width=score.naturalWidth;out.height=score.naturalHeight;const ctx=out.getContext("2d")!;ctx.fillStyle="#fff";ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(score,0,0);ctx.drawImage(marks,0,0);return await new Promise<Blob>(resolve=>out.toBlob(blob=>resolve(blob||base),"image/png"))}finally{URL.revokeObjectURL(baseUrl);URL.revokeObjectURL(layerUrl)}
}

