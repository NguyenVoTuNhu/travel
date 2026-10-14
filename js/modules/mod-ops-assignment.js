/* MODULE mod-ops-assignment — OPS-04: phân công điều hành, bàn giao, cảnh báo sẵn sàng theo ngưỡng cấu hình.
 * Dữ liệu: bookings[].operator (điều hành chính), bookings[].coOperators[] (người phối hợp, tối đa OPS_MAX_CO).
 * Lịch sử phụ trách = state.auditLogs (entity 'booking', action 'handover') — chỉ append nên không mất lịch sử.
 * Ngưỡng cảnh báo và danh sách điều hành nằm trong state.settings (record id 'ops', bảng đích travel_settings). */
const OPS_SETTINGS_DEFAULT={readinessThreshold:80,warnDays:7,upcomingDays:14};
const OPS_MAX_CO=3;
const OPS_SETTING_LABEL={readinessThreshold:'Ngưỡng sẵn sàng (%)',warnDays:'Cảnh báo trước ngày đi (ngày)',upcomingDays:'Cửa sổ "sắp khởi hành" (ngày)',operators:'Danh sách điều hành'};

function opsSettings(){
  if(!Array.isArray(state.settings))state.settings=[];
  let r=state.settings.find(x=>x.id==='ops');
  if(!r){r=Object.assign({id:'ops',operators:[...new Set(state.bookings.map(b=>b.operator).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'))},OPS_SETTINGS_DEFAULT);state.settings.push(r)}
  return r;
}
const opsOperators=()=>opsSettings().operators;
function opsAuditGeneric(entity,fields){
  if(!Array.isArray(state.auditLogs))state.auditLogs=[];
  state.auditLogs.push(Object.assign({id:'AUD-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),entity,by:opsActor(),role,at:new Date().toISOString()},fields));
}
function opsDaysUntil(d){return Math.round((Date.parse(d+'T00:00:00Z')-Date.parse(opsToday()+'T00:00:00Z'))/864e5)}

// Cảnh báo: booking đang Preparing, còn ≤ warnDays ngày (hoặc đã quá ngày đi) mà tiến độ checklist < ngưỡng. Chỉ dùng cấu hình, không có hằng số ẩn.
function opsReadinessRisk(b){
  if(b.status!=='Preparing')return null;
  const st=opsSettings(),days=opsDaysUntil(b.start),pct=progress(b);
  return days<=st.warnDays&&pct<st.readinessThreshold?{days,pct,threshold:st.readinessThreshold,warnDays:st.warnDays}:null;
}
function opsDaysText(d){return d<0?'đã quá ngày khởi hành '+(-d)+' ngày':d===0?'khởi hành hôm nay':'còn '+d+' ngày khởi hành'}
function opsRiskAlert(b){const r=opsReadinessRisk(b);return r?'<div class="alert red"><b>⚠ Nguy cơ chưa sẵn sàng</b>Tour '+opsDaysText(r.days)+', checklist mới đạt '+r.pct+'% (ngưỡng cấu hình '+r.threshold+'%, cảnh báo trong '+r.warnDays+' ngày trước ngày đi).</div>':''}

function opsAssignmentLists(){
  const st=opsSettings(),by=(a,b)=>String(a.start).localeCompare(String(b.start));
  return{
    unassigned:state.bookings.filter(b=>!['Completed','Cancelled'].includes(b.status)&&!b.operator).sort(by),
    upcoming:state.bookings.filter(b=>b.status==='Preparing'&&opsDaysUntil(b.start)<=st.upcomingDays).sort(by),
    running:state.bookings.filter(b=>b.status==='Running').sort(by)
  };
}
function opsMiniRow(b){
  const r=opsReadinessRisk(b),d=opsDaysUntil(b.start),co=(b.coOperators||[]).length;
  return '<div class="ops-lrow"><b>'+esc(b.id)+'</b> · '+esc(b.tour)+'<div class="sub">'+esc(b.operator||'Chưa phân công')+(co?' (+'+co+' phối hợp)':'')+' · '+fmt(b.start)+(b.status==='Preparing'?' ('+opsDaysText(d)+')':'')+'</div>'+(r?'<div>'+badge('Sẵn sàng '+r.pct+'% < '+r.threshold+'%','red')+'</div>':'')+'<div style="margin-top:6px">'+btn('Mở',"openBooking('"+b.id+"')",'small')+'</div></div>';
}
function renderOpsAssignment(){
  if(!OPS_EDIT_ROLES.includes(role))return '';
  const L=opsAssignmentLists(),st=opsSettings();
  const col=(t,list,empty)=>'<div><h4>'+t+' <span class="sub">('+list.length+')</span></h4>'+(list.slice(0,8).map(opsMiniRow).join('')||'<div class="empty">'+empty+'</div>')+(list.length>8?'<div class="sub">… và '+(list.length-8)+' booking khác (dùng bộ lọc để xem)</div>':'')+'</div>';
  const load=opsOperators().map(n=>{const a=state.bookings.filter(b=>!['Completed','Cancelled'].includes(b.status)&&(b.operator===n||(b.coOperators||[]).includes(n)));return esc(n)+': '+a.length+' tour ('+a.filter(b=>b.status==='Running').length+' đang chạy)'}).join(' · ');
  return card('Phân công điều hành',`<div class="ops-lists">${col('Chưa có người phụ trách',L.unassigned,'Mọi booking đang xử lý đều có người phụ trách.')}${col('Sắp khởi hành (≤ '+st.upcomingDays+' ngày)',L.upcoming,'Không có tour sắp khởi hành.')}${col('Đang chạy',L.running,'Không có tour đang chạy.')}</div><p class="sub" style="margin-top:12px">Khối lượng: ${load||'—'}</p>`);
}
function renderOpsSettings(){
  if(!OPS_EDIT_ROLES.includes(role))return '';
  const st=opsSettings();
  return card('Cấu hình điều hành',line('Ngưỡng sẵn sàng',st.readinessThreshold+'%')+line('Cảnh báo trước ngày đi',st.warnDays+' ngày')+line('Cửa sổ "sắp khởi hành"',st.upcomingDays+' ngày')+line('Danh sách điều hành',esc(st.operators.join(', ')||'—'))+'<p class="sub">Cảnh báo "Nguy cơ chưa sẵn sàng" chỉ dựa trên các ngưỡng này.</p>',role==='CEO'?btn('Chỉnh cấu hình','settingsForm()','small'):'<span class="sub">Chỉ Giám đốc chỉnh được</span>');
}

function operationForm(id){
  const b=state.bookings.find(b=>b.id===id);const gt=opsEditGate(b);if(!gt.ok)return toast(gt.msg);
  const ops=opsOperators(),withCur=n=>ops.includes(n)||!n?ops:[...ops,n],mainList=withCur(b.operator),co=b.coOperators||[];
  const coList=[...new Set([...ops,...co])];
  modal('Phân công điều hành · '+id,`<form onsubmit="saveHandover(event,'${id}')"><label>Điều hành chính<select name="operator" required>${b.operator?'':'<option value="">— Chọn điều hành —</option>'}${mainList.map(n=>'<option '+(b.operator===n?'selected':'')+'>'+esc(n)+'</option>').join('')}</select></label><div class="full"><div class="sub" style="margin:10px 0 6px">Người phối hợp (tối đa ${OPS_MAX_CO}, không trùng điều hành chính)</div>${coList.map(n=>'<label class="ops-checkline"><input type="checkbox" name="co" value="'+esc(n)+'" '+(co.includes(n)?'checked':'')+'> '+esc(n)+'</label>').join('')}</div><label>Ghi chú bàn giao<textarea name="note" maxlength="500" placeholder="Việc đang dở, lưu ý cho người nhận…"></textarea></label><p class="notice">Mỗi lần thay đổi được lưu thành một bản ghi bàn giao (thời điểm, người bàn giao, người nhận, ghi chú); lịch sử không bị ghi đè.</p><div class="formfooter"><button class="btn primary" type="submit">Lưu phân công / bàn giao</button></div></form>`,true);
}

function saveHandover(e,id){
  e.preventDefault();
  const b=state.bookings.find(b=>b.id===id);const gt=opsEditGate(b);if(!gt.ok)return toast(gt.msg);
  const f=new FormData(e.target),main=String(f.get('operator')||''),co=[...new Set(f.getAll('co').map(String))],note=String(f.get('note')||'').trim(),ops=opsOperators(),curCo=b.coOperators||[];
  if(!main)return toast('Hãy chọn điều hành chính.');
  if(main!==b.operator&&!ops.includes(main))return toast('Điều hành này không nằm trong danh sách cấu hình.');
  if(co.some(n=>!ops.includes(n)&&!curCo.includes(n)))return toast('Người phối hợp không nằm trong danh sách cấu hình.');
  if(co.includes(main))return toast('Người phối hợp không được trùng điều hành chính.');
  if(co.length>OPS_MAX_CO)return toast('Tối đa '+OPS_MAX_CO+' người phối hợp.');
  if(note.length>500)return toast('Ghi chú tối đa 500 ký tự.');
  const changes=[];
  if(main!==(b.operator||''))changes.push({field:'operator',from:b.operator||'',to:main});
  if([...co].sort().join('|')!==[...curCo].sort().join('|'))changes.push({field:'coOperators',from:[...curCo],to:co});
  if(!changes.length)return toast('Không có thay đổi để lưu.');
  b.operator=main;b.coOperators=co;
  const g=gt.adjust?gt.grant:null;
  opsAuditBooking(b,'handover',changes,Object.assign(note?{note}:{},g?{adjustment:true,reason:g.reason}:{}));
  log(id+' phân công/bàn giao điều hành '+main);
  openBooking(id);render();toast('Đã lưu phân công và ghi bản ghi bàn giao.');
}

function operatorHistory(id){
  const b=state.bookings.find(x=>x.id===id);if(!b)return;
  const rows=(state.auditLogs||[]).filter(a=>a.entity==='booking'&&a.booking===id&&a.action==='handover').reverse();
  const co=b.coOperators||[];
  const head=card('Người phụ trách hiện tại',line('Điều hành chính',esc(b.operator||'Chưa phân công'))+line('Người phối hợp',esc(co.join(', ')||'—')));
  const body=rows.length?table(['THỜI ĐIỂM','NGƯỜI BÀN GIAO → NGƯỜI NHẬN','NGƯỜI THỰC HIỆN','PHỐI HỢP','GHI CHÚ'],rows.map(a=>{
    const op=(a.changes||[]).find(c=>c.field==='operator'),cc=(a.changes||[]).find(c=>c.field==='coOperators');
    return '<tr><td>'+esc(opsTimeText(a.at))+'</td><td style="white-space:normal">'+(op?esc(op.from||'(chưa có)')+' → <b>'+esc(op.to)+'</b>':'Giữ nguyên điều hành chính')+'</td><td>'+esc(a.by)+(a.adjustment?'<div class="sub">Điều chỉnh sau khi tour chạy</div>':'')+'</td><td style="white-space:normal">'+(cc?esc(opsValText('coOperators',cc.from))+' → <b>'+esc(opsValText('coOperators',cc.to))+'</b>':'—')+'</td><td style="white-space:normal">'+esc(a.note||'—')+'</td></tr>';
  })):'<div class="empty">Chưa có bản ghi bàn giao. Người phụ trách hiện tại lấy từ dữ liệu tạo booking/dữ liệu mẫu.</div>';
  modal('Lịch sử phụ trách · '+id,head+card('Các lần bàn giao',body)+'<div class="formfooter">'+btn('← Quay lại booking',"openBooking('"+id+"')")+'</div>');
}

function settingsForm(){
  if(role!=='CEO')return toast('Chỉ Giám đốc được chỉnh cấu hình điều hành.');
  const st=opsSettings();
  modal('Cấu hình điều hành',`<form onsubmit="saveSettings(event)"><div class="formgrid"><label>Ngưỡng sẵn sàng (%) — cảnh báo khi tiến độ checklist thấp hơn<input type="number" name="readinessThreshold" min="0" max="100" step="1" value="${st.readinessThreshold}" required></label><label>Cảnh báo trước ngày đi (ngày)<input type="number" name="warnDays" min="0" max="90" step="1" value="${st.warnDays}" required></label><label>Cửa sổ "sắp khởi hành" (ngày)<input type="number" name="upcomingDays" min="1" max="90" step="1" value="${st.upcomingDays}" required></label><label class="full">Danh sách điều hành (mỗi dòng một tên)<textarea name="operators" required>${esc(st.operators.join('\n'))}</textarea></label></div><p class="notice">Không thể bỏ một điều hành đang phụ trách hoặc phối hợp tour chưa hoàn tất/chưa hủy.</p><div class="formfooter"><button class="btn primary" type="submit">Lưu cấu hình</button></div></form>`,true);
}
function saveSettings(e){
  e.preventDefault();
  if(role!=='CEO')return toast('Chỉ Giám đốc được chỉnh cấu hình điều hành.');
  const f=new FormData(e.target),rt=Number(f.get('readinessThreshold')),wd=Number(f.get('warnDays')),ud=Number(f.get('upcomingDays'));
  const names=String(f.get('operators')||'').split(/[\n,]/).map(x=>x.trim()).filter(Boolean);
  if(!Number.isInteger(rt)||rt<0||rt>100)return toast('Ngưỡng sẵn sàng phải là số nguyên từ 0 đến 100.');
  if(!Number.isInteger(wd)||wd<0||wd>90)return toast('Số ngày cảnh báo phải là số nguyên từ 0 đến 90.');
  if(!Number.isInteger(ud)||ud<1||ud>90)return toast('Cửa sổ sắp khởi hành phải là số nguyên từ 1 đến 90.');
  if(!names.length||names.length>20||names.some(n=>n.length>40))return toast('Danh sách điều hành: 1–20 tên, mỗi tên tối đa 40 ký tự.');
  if(new Set(names.map(n=>n.toLocaleLowerCase('vi'))).size!==names.length)return toast('Danh sách điều hành có tên trùng.');
  const held=[...new Set(state.bookings.filter(b=>!['Completed','Cancelled'].includes(b.status)).flatMap(b=>[b.operator,...(b.coOperators||[])]).filter(n=>n&&!names.includes(n)))];
  if(held.length)return toast('Không thể bỏ điều hành đang phụ trách tour: '+held.join(', ')+'. Hãy bàn giao trước.');
  const r=opsSettings(),next={readinessThreshold:rt,warnDays:wd,upcomingDays:ud,operators:names};
  const changes=Object.keys(next).filter(k=>JSON.stringify(r[k])!==JSON.stringify(next[k])).map(k=>({field:k,from:r[k],to:next[k]}));
  if(!changes.length)return toast('Không có thay đổi để lưu.');
  Object.assign(r,next);
  opsAuditGeneric('settings',{action:'update',settingId:'ops',changes});
  log('Cập nhật cấu hình điều hành');closeModal();render();toast('Đã lưu cấu hình điều hành.');
}
