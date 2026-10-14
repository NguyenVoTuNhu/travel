/* MODULE mod-ops-issues — OPS-05: quản lý sự cố tour.
 * state.issues[]: id (IS-001…), booking, serviceType (tùy chọn), type, severity, note (mô tả), assignee, dueAt, status (Open|InProgress|Resolved),
 * plan (phương án), result (kết quả xử lý, bắt buộc khi đóng), extraCost + extraCostNote (chi phí phát sinh, chỉ ghi nhận trên sự cố, KHÔNG tự cộng vào chi phí booking/kế toán),
 * docs[] (id tài liệu của cùng booking trong Document Center), createdAt/By, updatedAt/By, resolvedAt/By.
 * Sự cố không bao giờ bị xóa: đóng = status Resolved; mở lại được. Lịch sử thay đổi ở state.auditLogs (entity 'issue'). */
const OPS_ISSUE_TYPES=[['Supplier','Nhà cung cấp'],['Guide','Hướng dẫn viên'],['Vehicle','Phương tiện'],['Customer','Khách hàng'],['Weather','Thời tiết / bất khả kháng'],['Safety','An toàn / sức khỏe'],['Other','Khác']];
const OPS_SEVERITY=[['Low','Thấp'],['Medium','Trung bình'],['High','Cao'],['Critical','Nghiêm trọng']];
const OPS_ISSUE_STATUS=[['Open','Mới mở'],['InProgress','Đang xử lý'],['Resolved','Đã đóng']];
const OPS_ISSUE_TYPE_VI=Object.fromEntries(OPS_ISSUE_TYPES),OPS_SEVERITY_VI=Object.fromEntries(OPS_SEVERITY),OPS_ISSUE_STATUS_VI=Object.fromEntries(OPS_ISSUE_STATUS);
const OPS_SEVERITY_RANK={Low:1,Medium:2,High:3,Critical:4};
const OPS_ISSUE_VIEW_ROLES=['CEO','Operations','Accounting'],OPS_ISSUE_EDIT_ROLES=['CEO','Operations'];
const OPS_ISSUE_FIELD_LABEL={serviceType:'Dịch vụ liên quan',type:'Loại',severity:'Mức độ',note:'Mô tả',assignee:'Người xử lý',dueAt:'Hạn xử lý',status:'Trạng thái',plan:'Phương án',extraCost:'Chi phí phát sinh',extraCostNote:'Ghi chú chi phí',docs:'Tài liệu liên quan',result:'Kết quả xử lý'};
let opsIssueFilter='open',opsIssueSev='',opsIssueWho='';

const opsIssueCan=k=>(k==='view'?OPS_ISSUE_VIEW_ROLES:OPS_ISSUE_EDIT_ROLES).includes(role);
const opsIssueOpen=i=>i.status!=='Resolved';
function opsIssueNorm(i){
  if(i.severity===undefined)i.severity='Medium';
  if(i.serviceType===undefined)i.serviceType='';
  if(i.assignee===undefined)i.assignee='';
  if(i.dueAt===undefined)i.dueAt='';
  if(i.plan===undefined)i.plan='';
  if(i.result===undefined)i.result='';
  if(i.extraCost===undefined)i.extraCost=0;
  if(i.extraCostNote===undefined)i.extraCostNote='';
  if(!Array.isArray(i.docs))i.docs=[];
}
function opsIssues(){if(!Array.isArray(state.issues))state.issues=[];state.issues.forEach(opsIssueNorm);return state.issues}
const opsOpenIssues=()=>opsIssues().filter(opsIssueOpen);
const opsBookingHasOpenIssue=id=>opsOpenIssues().some(i=>i.booking===id);
const opsIssueOverdue=i=>opsIssueOpen(i)&&!!i.dueAt&&i.dueAt<opsToday();
function opsIssueSummaryText(){const o=opsOpenIssues();return o.length+' sự cố đang mở'+(o.length?' ('+o.filter(i=>i.severity==='Critical').length+' nghiêm trọng, '+o.filter(opsIssueOverdue).length+' quá hạn)':'')}
function opsNextIssueId(){const n=opsIssues().map(i=>{const m=/^IS-(\d{1,6})$/.exec(i.id);return m?+m[1]:0});return 'IS-'+String(Math.max(0,...n)+1).padStart(3,'0')}
function opsDocName(id){const d=(typeof allDocs==='function'?allDocs():[]).find(x=>x.id===id);return d?d.name+' ('+d.type+')':id}
function opsIssueVal(k,v){
  if(k==='serviceType')return v?(typesVI[v]||v):'Không gắn dịch vụ';
  if(k==='type')return OPS_ISSUE_TYPE_VI[v]||String(v);
  if(k==='severity')return OPS_SEVERITY_VI[v]||String(v);
  if(k==='status')return OPS_ISSUE_STATUS_VI[v]||String(v);
  if(k==='extraCost')return money(v||0);
  if(k==='dueAt')return v?fmt(v):'—';
  if(k==='docs')return v&&v.length?v.map(opsDocName).join('; '):'—';
  return v===''||v==null?'—':String(v);
}
const opsSevBadge=s=>badge((s==='Critical'?'⚠ ':'')+(OPS_SEVERITY_VI[s]||s),s==='Critical'||s==='High'?'red':s==='Medium'?'amber':'');
const opsIssueBkLink=id=>{const b=state.bookings.find(x=>x.id===id);return b?'<a href="#" onclick="openBooking(\''+esc(id)+'\');return false">'+esc(id)+'</a>':esc(id)};

function opsIssueFormBody(bookingId,v,edit){
  const docs=(typeof allDocs==='function'?allDocs():[]).filter(d=>d.booking===bookingId),ops=opsOperators(),who=v.assignee&&!ops.includes(v.assignee)?[...ops,v.assignee]:ops;
  const sel=(name,list,cur)=>'<select name="'+name+'">'+list.map(([k,n])=>'<option value="'+k+'" '+(cur===k?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select>';
  return `<div class="formgrid"><label>Dịch vụ liên quan${sel('serviceType',[['','Không gắn dịch vụ cụ thể'],...serviceTypes.map(t=>[t,typesVI[t]])],v.serviceType)}</label><label>Loại${sel('type',OPS_ISSUE_TYPES,v.type)}</label><label>Mức độ${sel('severity',OPS_SEVERITY,v.severity)}</label>${edit?'<label>Trạng thái'+sel('status',OPS_ISSUE_STATUS.filter(([k])=>k!=='Resolved'),v.status)+'</label>':'<span></span>'}<label class="full">Mô tả sự cố<textarea name="note" maxlength="1000" required>${esc(v.note)}</textarea></label><label>Người xử lý<select name="assignee"><option value="">— Chưa giao —</option>${who.map(n=>'<option '+(v.assignee===n?'selected':'')+'>'+esc(n)+'</option>').join('')}</select></label><label>Hạn xử lý<input type="date" name="dueAt" value="${esc(v.dueAt)}"></label><label class="full">Phương án xử lý<textarea name="plan" maxlength="1000">${esc(v.plan)}</textarea></label><label>Chi phí phát sinh (VND, nếu có)<input type="number" name="extraCost" min="0" step="1000" value="${+v.extraCost||0}"></label><label>Ghi chú chi phí<input name="extraCostNote" maxlength="200" value="${esc(v.extraCostNote)}"></label><div class="full"><div class="sub" style="margin:10px 0 6px">Tài liệu / ảnh liên quan (từ Document Center của booking)</div>${docs.length?docs.map(d=>'<label class="ops-checkline"><input type="checkbox" name="docs" value="'+esc(d.id)+'" '+(v.docs.includes(d.id)?'checked':'')+'> '+esc(d.name)+' · '+esc(d.type)+'</label>').join(''):'<p class="sub">Booking chưa có tài liệu. Tải tài liệu ở Document Center rồi liên kết lại.</p>'}</div></div><p class="notice">Sự cố nghiêm trọng/cao bắt buộc có người xử lý; nghiêm trọng bắt buộc có hạn xử lý. Chi phí phát sinh chỉ được ghi trên sự cố, chưa tự cộng vào chi phí booking hay kế toán.</p>`;
}
const OPS_ISSUE_DEFAULT=()=>({serviceType:'',type:'Supplier',severity:'Medium',note:'',assignee:'',dueAt:'',plan:'',extraCost:0,extraCostNote:'',docs:[],status:'Open'});

function issueForm(bookingId,issueId){
  if(!opsIssueCan('edit'))return toast('Vai trò này không có quyền ghi nhận/sửa sự cố.');
  const b=state.bookings.find(x=>x.id===bookingId);if(!b)return toast('Không tìm thấy booking '+bookingId+'.');
  const cur=issueId?opsIssues().find(x=>x.id===issueId):null;
  if(issueId&&(!cur||cur.booking!==bookingId))return toast('Không tìm thấy sự cố.');
  if(cur&&cur.status==='Resolved')return toast('Sự cố đã đóng: hãy mở lại trước khi sửa.');
  modal((cur?'Sửa sự cố '+cur.id:'Ghi nhận sự cố')+' · '+bookingId,'<form onsubmit="saveIssue(event,\''+bookingId+'\','+(cur?'\''+cur.id+'\'':'null')+')">'+opsIssueFormBody(bookingId,cur||OPS_ISSUE_DEFAULT(),!!cur)+'<div class="formfooter"><button class="btn primary" type="submit">Lưu sự cố</button></div></form>',true);
}

function saveIssue(e,bookingId,issueId){
  e.preventDefault();
  if(!opsIssueCan('edit'))return toast('Vai trò này không có quyền ghi nhận/sửa sự cố.');
  const b=state.bookings.find(x=>x.id===bookingId);if(!b)return toast('Không tìm thấy booking '+bookingId+'.');
  const list=opsIssues(),cur=issueId?list.find(x=>x.id===issueId):null;
  if(issueId&&(!cur||cur.booking!==bookingId))return toast('Không tìm thấy sự cố.');
  if(cur&&cur.status==='Resolved')return toast('Sự cố đã đóng: hãy mở lại trước khi sửa.');
  const f=new FormData(e.target),S=k=>String(f.get(k)||'').trim();
  const next={serviceType:S('serviceType'),type:S('type'),severity:S('severity'),note:S('note'),assignee:S('assignee'),dueAt:S('dueAt'),status:cur?S('status'):'Open',plan:S('plan'),extraCost:Math.round(Number(f.get('extraCost')||0)),extraCostNote:S('extraCostNote'),docs:[...new Set(f.getAll('docs').map(String))]};
  if(!OPS_ISSUE_TYPE_VI[next.type])return toast('Loại sự cố không hợp lệ.');
  if(!OPS_SEVERITY_VI[next.severity])return toast('Mức độ không hợp lệ.');
  if(next.serviceType&&!serviceTypes.includes(next.serviceType))return toast('Dịch vụ liên quan không hợp lệ.');
  if(!['Open','InProgress'].includes(next.status))return toast('Trạng thái không hợp lệ (muốn đóng sự cố hãy dùng "Đóng sự cố" và nhập kết quả).');
  if(next.note.length<3||next.note.length>1000)return toast('Mô tả sự cố cần 3–1000 ký tự.');
  if(next.plan.length>1000)return toast('Phương án tối đa 1000 ký tự.');
  if(next.extraCostNote.length>200)return toast('Ghi chú chi phí tối đa 200 ký tự.');
  if(!Number.isFinite(next.extraCost)||next.extraCost<0||next.extraCost>1e11)return toast('Chi phí phát sinh phải là số không âm.');
  if(next.assignee&&!opsOperators().includes(next.assignee)&&!(cur&&cur.assignee===next.assignee))return toast('Người xử lý không nằm trong danh sách điều hành cấu hình.');
  if(next.dueAt&&(!/^\d{4}-\d{2}-\d{2}$/.test(next.dueAt)||isNaN(Date.parse(next.dueAt))))return toast('Hạn xử lý không hợp lệ.');
  if(['High','Critical'].includes(next.severity)&&!next.assignee)return toast('Sự cố mức Cao/Nghiêm trọng bắt buộc có người xử lý.');
  if(next.severity==='Critical'&&!next.dueAt)return toast('Sự cố Nghiêm trọng bắt buộc có hạn xử lý.');
  if(next.status==='InProgress'&&!next.assignee)return toast('Sự cố đang xử lý phải có người xử lý.');
  const known=(typeof allDocs==='function'?allDocs():[]);
  if(next.docs.some(id=>!known.some(d=>d.id===id&&d.booking===bookingId)))return toast('Tài liệu liên kết phải thuộc cùng booking.');
  const at=new Date().toISOString(),by=opsActor();
  if(!cur){
    const id=opsNextIssueId();
    list.push(Object.assign({id,booking:bookingId},next,{result:'',createdAt:at,createdBy:by,updatedAt:at,updatedBy:by}));
    opsAuditGeneric('issue',{issue:id,booking:bookingId,action:'create',changes:[]});
    log(bookingId+' có sự cố '+next.type+' ('+id+')');closeModal();render();return toast('Đã ghi nhận sự cố '+id+'.');
  }
  const keys=['serviceType','type','severity','note','assignee','dueAt','status','plan','extraCost','extraCostNote','docs'];
  const changes=keys.filter(k=>JSON.stringify(cur[k])!==JSON.stringify(next[k])).map(k=>({field:k,from:cur[k],to:next[k]}));
  if(!changes.length)return toast('Không có thay đổi để lưu.');
  Object.assign(cur,next,{updatedAt:at,updatedBy:by});
  opsAuditGeneric('issue',{issue:cur.id,booking:bookingId,action:'update',changes});
  log('Cập nhật sự cố '+cur.id);closeModal();render();toast('Đã cập nhật sự cố '+cur.id+'.');
}

function issueResolveForm(id){
  if(!opsIssueCan('edit'))return toast('Vai trò này không có quyền đóng sự cố.');
  const i=opsIssues().find(x=>x.id===id);if(!i)return toast('Không tìm thấy sự cố.');
  if(i.status==='Resolved')return toast('Sự cố này đã đóng.');
  modal('Đóng sự cố '+id,'<form onsubmit="saveResolve(event,\''+id+'\')"><div class="alert"><b>Đóng sự cố '+esc(id)+'</b>'+esc(i.note)+'<br>Sự cố không bị xóa: vẫn xem được trong lịch sử và có thể mở lại.</div><label>Kết quả xử lý (bắt buộc)<textarea name="result" maxlength="1000" required></textarea></label><div class="formfooter"><button class="btn primary" type="submit">Xác nhận đóng sự cố</button></div></form>',true);
}
function saveResolve(e,id){
  e.preventDefault();
  if(!opsIssueCan('edit'))return toast('Vai trò này không có quyền đóng sự cố.');
  const i=opsIssues().find(x=>x.id===id);if(!i)return toast('Không tìm thấy sự cố.');
  if(i.status==='Resolved')return toast('Sự cố này đã đóng.');
  const result=String(new FormData(e.target).get('result')||'').trim();
  if(result.length<3)return toast('Đóng sự cố phải có kết quả xử lý (tối thiểu 3 ký tự).');
  if(result.length>1000)return toast('Kết quả xử lý tối đa 1000 ký tự.');
  const from=i.status,at=new Date().toISOString(),by=opsActor();
  Object.assign(i,{status:'Resolved',result,resolvedAt:at,resolvedBy:by,updatedAt:at,updatedBy:by});
  opsAuditGeneric('issue',{issue:id,booking:i.booking,action:'close',changes:[{field:'status',from,to:'Resolved'}],note:result});
  log('Đóng sự cố '+id);closeModal();render();toast('Đã đóng sự cố '+id+' kèm kết quả xử lý.');
}
function issueReopenForm(id){
  if(!opsIssueCan('edit'))return toast('Vai trò này không có quyền mở lại sự cố.');
  const i=opsIssues().find(x=>x.id===id);if(!i)return toast('Không tìm thấy sự cố.');
  if(i.status!=='Resolved')return toast('Sự cố này chưa đóng.');
  modal('Mở lại sự cố '+id,'<form onsubmit="saveReopen(event,\''+id+'\')"><div class="alert"><b>Kết quả trước đó</b>'+esc(i.result||'—')+'</div><label>Lý do mở lại (bắt buộc)<textarea name="note" maxlength="500" required></textarea></label><div class="formfooter"><button class="btn primary" type="submit">Mở lại sự cố</button></div></form>',true);
}
function saveReopen(e,id){
  e.preventDefault();
  if(!opsIssueCan('edit'))return toast('Vai trò này không có quyền mở lại sự cố.');
  const i=opsIssues().find(x=>x.id===id);if(!i)return toast('Không tìm thấy sự cố.');
  if(i.status!=='Resolved')return toast('Sự cố này chưa đóng.');
  const note=String(new FormData(e.target).get('note')||'').trim();
  if(note.length<3)return toast('Cần nhập lý do mở lại (tối thiểu 3 ký tự).');
  if(note.length>500)return toast('Lý do tối đa 500 ký tự.');
  const prev=i.result,at=new Date().toISOString(),by=opsActor();
  Object.assign(i,{status:'Open',result:'',updatedAt:at,updatedBy:by,reopenCount:(i.reopenCount||0)+1});delete i.resolvedAt;delete i.resolvedBy;
  opsAuditGeneric('issue',{issue:id,booking:i.booking,action:'reopen',changes:[{field:'status',from:'Resolved',to:'Open'}],note:note+' · Kết quả trước đó: '+prev});
  log('Mở lại sự cố '+id);closeModal();render();toast('Đã mở lại sự cố '+id+'. Kết quả cũ được giữ trong lịch sử.');
}

function issueDetail(id){
  if(!opsIssueCan('view'))return toast('Vai trò này không có quyền xem sự cố.');
  const i=opsIssues().find(x=>x.id===id);if(!i)return toast('Không tìm thấy sự cố.');
  const hist=(state.auditLogs||[]).filter(a=>a.entity==='issue'&&a.issue===id).reverse(),edit=opsIssueCan('edit');
  const histBody=hist.length?table(['THỜI ĐIỂM','NGƯỜI THỰC HIỆN','THAO TÁC','CHI TIẾT'],hist.map(a=>'<tr><td>'+esc(opsTimeText(a.at))+'</td><td>'+esc(a.by)+'</td><td>'+esc({create:'Tạo sự cố',update:'Cập nhật',close:'Đóng sự cố',reopen:'Mở lại'}[a.action]||a.action)+'</td><td style="white-space:normal">'+(a.changes||[]).map(c=>'<div>'+esc(OPS_ISSUE_FIELD_LABEL[c.field]||c.field)+': '+esc(opsIssueVal(c.field,c.from))+' → <b>'+esc(opsIssueVal(c.field,c.to))+'</b></div>').join('')+(a.note?'<div class="sub">'+esc(a.note)+'</div>':'')+'</td></tr>')):'<div class="empty">Chưa có lịch sử (sự cố từ dữ liệu mẫu).</div>';
  modal('Sự cố '+id+' · '+i.booking,card('Thông tin',line('Booking',opsIssueBkLink(i.booking))+line('Dịch vụ liên quan',esc(opsIssueVal('serviceType',i.serviceType)))+line('Loại',esc(opsIssueVal('type',i.type)))+line('Mức độ',opsSevBadge(i.severity))+line('Trạng thái',badge(OPS_ISSUE_STATUS_VI[i.status]||i.status,i.status==='Resolved'?'green':'amber')+(opsIssueOverdue(i)?' '+badge('Quá hạn','red'):''))+line('Người xử lý',esc(i.assignee||'Chưa giao'))+line('Hạn xử lý',esc(opsIssueVal('dueAt',i.dueAt))))
   +card('Mô tả và xử lý','<p>'+esc(i.note)+'</p><p class="sub">Phương án: '+esc(i.plan||'—')+'</p>'+(i.status==='Resolved'?'<p class="ops-note">Kết quả xử lý: '+esc(i.result||'(dữ liệu cũ, chưa có kết quả)')+'</p>'+(i.resolvedAt?'<p class="sub">Đóng lúc '+esc(opsTimeText(i.resolvedAt))+' bởi '+esc(i.resolvedBy)+'</p>':''):''))
   +card('Chi phí và tài liệu liên quan',line('Chi phí phát sinh',money(i.extraCost||0)+(i.extraCostNote?' · '+esc(i.extraCostNote):''))+'<p class="sub">Tài liệu: '+esc(opsIssueVal('docs',i.docs))+'</p><p class="sub">Chi phí phát sinh chưa tự cộng vào chi phí booking hay kế toán.</p>')
   +card('Lịch sử',histBody)
   +'<div class="formfooter">'+(edit?(i.status==='Resolved'?btn('Mở lại',"issueReopenForm('"+id+"')"):btn('Sửa',"issueForm('"+i.booking+"','"+id+"')")+btn('Đóng sự cố',"issueResolveForm('"+id+"')",'primary')):'')+'</div>');
}

function renderOpsIssues(){
  if(!opsIssueCan('view'))return '';
  const all=opsIssues(),open=all.filter(opsIssueOpen),edit=opsIssueCan('edit');
  let rows=all.filter(i=>(opsIssueFilter==='all'||(opsIssueFilter==='open')===opsIssueOpen(i))&&(!opsIssueSev||i.severity===opsIssueSev)&&(!opsIssueWho||i.assignee===opsIssueWho));
  rows.sort((a,b)=>(opsIssueOpen(b)-opsIssueOpen(a))||((OPS_SEVERITY_RANK[b.severity]||0)-(OPS_SEVERITY_RANK[a.severity]||0))||(String(a.dueAt||'9999').localeCompare(String(b.dueAt||'9999')))||a.id.localeCompare(b.id));
  const sev=OPS_SEVERITY.slice().reverse().map(([k,n])=>badge(n+': '+open.filter(i=>i.severity===k).length,k==='Critical'||k==='High'?'red':k==='Medium'?'amber':'')).join(' ');
  const who=[...new Set([...opsOperators(),...all.map(i=>i.assignee).filter(Boolean)])];
  const bar='<div class="filters"><select aria-label="Trạng thái sự cố" onchange="opsIssueFilter=this.value;render()">'+[['open','Đang mở'],['closed','Đã đóng'],['all','Tất cả']].map(([v,n])=>'<option value="'+v+'" '+(opsIssueFilter===v?'selected':'')+'>'+n+'</option>').join('')+'</select><select aria-label="Mức độ" onchange="opsIssueSev=this.value;render()"><option value="">Mọi mức độ</option>'+OPS_SEVERITY.map(([k,n])=>'<option value="'+k+'" '+(opsIssueSev===k?'selected':'')+'>'+n+'</option>').join('')+'</select><select aria-label="Người xử lý" onchange="opsIssueWho=this.value;render()"><option value="">Mọi người xử lý</option>'+who.map(n=>'<option '+(opsIssueWho===n?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select></div>';
  const trs=rows.map(i=>'<tr><td><b>'+esc(i.id)+'</b></td><td>'+opsIssueBkLink(i.booking)+'</td><td>'+esc(opsIssueVal('type',i.type))+'<div class="sub">'+esc(i.serviceType?typesVI[i.serviceType]||i.serviceType:'—')+'</div></td><td>'+opsSevBadge(i.severity)+'</td><td style="white-space:normal">'+esc(i.note.length>90?i.note.slice(0,90)+'…':i.note)+'</td><td>'+esc(i.assignee||'Chưa giao')+'</td><td>'+(i.dueAt?fmt(i.dueAt):'—')+(opsIssueOverdue(i)?'<div>'+badge('Quá hạn','red')+'</div>':'')+'</td><td>'+badge(OPS_ISSUE_STATUS_VI[i.status]||i.status,i.status==='Resolved'?'green':'amber')+'</td><td>'+btn('Chi tiết',"issueDetail('"+i.id+"')",'small')+(edit?(opsIssueOpen(i)?btn('Đóng',"issueResolveForm('"+i.id+"')",'small'):btn('Mở lại',"issueReopenForm('"+i.id+"')",'small')):'')+'</td></tr>');
  const cost=open.reduce((n,i)=>n+(+i.extraCost||0),0);
  return card('Sự cố tour',`<p>${opsIssueSummaryText()} · ${sev}</p><p class="sub">Chi phí phát sinh đang ghi nhận trên sự cố mở: ${money(cost)} (chưa cộng vào kế toán)</p>${bar}`+(rows.length?table(['SỰ CỐ','BOOKING','LOẠI · DỊCH VỤ','MỨC ĐỘ','MÔ TẢ','NGƯỜI XỬ LÝ','HẠN','TRẠNG THÁI','THAO TÁC'],trs):'<div class="empty">Không có sự cố phù hợp bộ lọc.</div>'),'<span class="sub">Sự cố không bị xóa khi đóng</span>');
}
