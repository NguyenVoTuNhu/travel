/* MODULE mod-operations — giao diện và nghiệp vụ của phân hệ Travel. */

/* OPS-02 — Hồ sơ vận hành và checklist dịch vụ.
 * Mô hình local: mỗi booking giữ services[] lồng nhau (tương thích các module khác).
 * Trường dịch vụ: type, needed, supplier, cost (chi phí DỰ KIẾN), status, confirmed (bản sao boolean để
 * module Guide/Vehicle cũ vẫn đọc được), dueAt, notes, dateStart/dateEnd/pax (chỉ lưu khi khác mặc định của booking),
 * updatedBy, updatedAt. Lịch sử thay đổi lưu ở state.auditLogs (bảng đích travel_audit_logs). */
const OPS_STATUS=[['Draft','Nháp'],['Requested','Chờ NCC xác nhận'],['Confirmed','Đã xác nhận'],['Cancelled','NCC đã hủy'],['Completed','Đã hoàn tất']];
const OPS_STATUS_VI=Object.fromEntries(OPS_STATUS);
const OPS_BOOKING_STATUS_VI={Preparing:'Chuẩn bị',Running:'Đang chạy',Completed:'Hoàn tất',OnHold:'Tạm dừng',Cancelled:'Đã hủy'};
const OPS_READY=['Confirmed','Completed'];
const OPS_EDIT_ROLES=['CEO','Operations'];
const OPS_FIELD_LABEL={needed:'Cần dùng',supplier:'NCC',cost:'Chi phí dự kiến',status:'Trạng thái xác nhận',dueAt:'Hạn xác nhận',dateStart:'Dịch vụ từ ngày',dateEnd:'Dịch vụ đến ngày',pax:'Số khách',notes:'Ghi chú',bookingStatus:'Trạng thái booking',operator:'Điều hành chính',coOperators:'Người phối hợp'};
const OPS_FIELDS=['needed','supplier','cost','status','dueAt','dateStart','dateEnd','pax','notes'];
const OPS_VOUCHER_FIELDS=['needed','supplier','cost','dateStart','dateEnd','pax'];
const OPS_NEW_SERVICE=type=>({type,needed:false,supplier:'',cost:0,confirmed:false,status:'Draft',dueAt:'',notes:''});

function opsToday(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function opsTimeText(iso){const d=new Date(iso);return isNaN(d)?'—':d.toLocaleString('vi-VN')}
function opsActor(){return (rolelabels[role]||role)+' (demo)'}
function opsSupplier(s){return state.suppliers.find(n=>n.id===s.supplier)}

// Trạng thái hiệu lực của một dịch vụ. Hàm thuần: nếu module khác (Guide/Vehicle) chỉ đổi boolean `confirmed`,
// trạng thái được suy ra lại cho khớp thay vì để hai nguồn mâu thuẫn.
function opsStatus(s){
  const st=OPS_STATUS_VI[s.status]?s.status:null,ready=OPS_READY.includes(st);
  if(st&&ready===!!s.confirmed)return st;
  if(s.confirmed)return 'Confirmed';
  if(ready)return 'Requested';
  return st||(s.needed?'Requested':'Draft');
}
const opsReady=s=>OPS_READY.includes(opsStatus(s));
const opsRequired=b=>b.services.filter(s=>s.needed);
const opsPending=b=>opsRequired(b).filter(s=>!opsReady(s));
// Quy tắc chi phí booking: tổng chi phí dự kiến của dịch vụ BẮT BUỘC chưa bị NCC hủy, mỗi dịch vụ cộng đúng một lần.
// Chi phí thực tế/đã ghi nhận thuộc kế toán, không cộng vào đây.
const opsCostRows=b=>opsRequired(b).filter(s=>opsStatus(s)!=='Cancelled');
const opsCostTotal=b=>opsCostRows(b).reduce((n,s)=>n+(+s.cost||0),0);

function opsEffective(b,s){return{needed:!!s.needed,supplier:s.supplier||'',cost:+s.cost||0,status:opsStatus(s),dueAt:s.dueAt||'',dateStart:s.dateStart||b.start,dateEnd:s.dateEnd||b.end,pax:+s.pax||b.pax,notes:s.notes||''}}

function opsValText(k,v){
  if(Array.isArray(v))return v.length?v.join(', '):'—';
  if(k==='needed')return v?'Có':'Không';
  if(k==='supplier'){if(!v)return 'Chưa chọn';const n=state.suppliers.find(x=>x.id===v);return v+(n?' · '+n.name:'')}
  if(k==='bookingStatus')return OPS_BOOKING_STATUS_VI[v]||String(v);
  if(k==='cost')return money(v||0);
  if(k==='status')return OPS_STATUS_VI[v]||String(v);
  if(k==='dateStart'||k==='dateEnd'||k==='dueAt')return v?fmt(v):'—';
  return v===''||v==null?'—':String(v);
}

function opsNormalize(b){
  if(b.voucher===true&&b.voucherStale)delete b.voucherStale; // voucher hợp lệ thì không còn cờ lỗi thời
  (b.services||[]).forEach(s=>{
    s.status=opsStatus(s);s.confirmed=OPS_READY.includes(s.status);
    if(s.dueAt===undefined)s.dueAt='';
    if(s.notes===undefined)s.notes='';
  });
}
function opsMigrate(){
  if(Array.isArray(state.bookings))state.bookings.forEach(opsNormalize);
  if(!Array.isArray(state.auditLogs))state.auditLogs=[];
}
opsMigrate();

function opsAudit(b,type,action,changes,extra){
  if(!Array.isArray(state.auditLogs))state.auditLogs=[];
  state.auditLogs.push(Object.assign({id:'AUD-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),entity:'booking_service',booking:b.id,serviceType:type,action,changes,by:opsActor(),role,at:new Date().toISOString()},extra||{}));
}

// Đánh dấu voucher hiện hành cần tạo lại (không xóa dữ liệu; OPS-06 sẽ bổ sung phiên bản voucher đầy đủ).
function opsInvalidateVoucher(b,reason){
  const at=new Date().toISOString();
  b.voucher=false;b.voucherStale={at,by:opsActor(),reason};
  (state.docs||[]).forEach(d=>{if(d.booking===b.id&&d.type==='Voucher'&&!d.stale){d.stale=true;d.staleAt=at}});
}

function progress(b){let req=opsRequired(b);return Math.round((req.filter(opsReady).length+(!!b.guide)+(!!b.voucher))/(req.length+2)*100)}

/* OPS-03 — Quy trình trạng thái tour.
 * Trạng thái booking (b.status) chỉ đổi qua opsTransition(): Preparing → Running → Completed. Các bước Operation Assigned … Guide Assigned
 * là điều kiện suy ra từ dữ liệu (không lưu nhãn riêng) nên không thể "bỏ qua" bằng cách đổi nhãn. Ngoại lệ Cancelled/On Hold: chưa triển khai (chờ chính sách). */
const OPS_FLOW=['Booking Confirmed','Operation Assigned','Book Services','Supplier Confirmed','Voucher Ready','Guide Assigned','Tour Running','Completed'];
const OPS_TRANSITIONS={Preparing:['Running','OnHold','Cancelled'],Running:['Completed','OnHold'],OnHold:['Preparing','Running','Cancelled'],Completed:[],Cancelled:[]};
const OPS_ADJUST_MINUTES=15;
let opsAdjust={}; // phiên điều chỉnh sau khi tour chạy: id booking → {until,reason,by}. Chỉ lưu trong bộ nhớ, tải lại trang phải xác nhận lại.
const opsLocked=b=>!!b&&(b.status==='Running'||b.status==='Completed');
function opsAdjustActive(id){const g=opsAdjust[id];if(!g)return null;if(Date.now()>g.until){delete opsAdjust[id];return null}return g}
// Cổng sửa dữ liệu vận hành nhạy cảm (dịch vụ, voucher, điều hành, HDV, xe).
// Preparing: được sửa. Running/Completed: chỉ khi điều hành/giám đốc đã xác nhận cảnh báo ("Điều chỉnh vận hành", hiệu lực OPS_ADJUST_MINUTES phút).
// OnHold/Cancelled: đóng băng.
function opsEditGate(b){
  if(!OPS_EDIT_ROLES.includes(role))return{ok:false,msg:'Vai trò này không có quyền sửa dữ liệu vận hành.'};
  if(!b)return{ok:false,msg:'Không tìm thấy booking.'};
  if(b.status==='Preparing')return{ok:true,adjust:false};
  if(b.status==='Running'||b.status==='Completed'){const g=opsAdjustActive(b.id);return g?{ok:true,adjust:true,grant:g}:{ok:false,msg:'Tour '+(b.status==='Running'?'đang chạy':'đã hoàn tất')+': hãy mở hồ sơ booking, bấm "Điều chỉnh vận hành" và xác nhận cảnh báo trước khi thay đổi.'}}
  if(b.status==='OnHold')return{ok:false,msg:'Tour đang tạm dừng: hãy tiếp tục tour trước khi sửa dữ liệu vận hành.'};
  return{ok:false,msg:'Booking đã hủy: không thể sửa dữ liệu vận hành.'};
}
const opsEditable=b=>opsEditGate(b).ok;
function opsLockGuard(id){const g=opsEditGate(state.bookings.find(x=>x.id===id));if(!g.ok){toast(g.msg);return true}return false}
// Ghi nhật ký cho thay đổi do module khác thực hiện trong phiên điều chỉnh.
function opsNoteAdjust(b,text){const g=opsAdjustActive(b.id);if(g&&opsLocked(b))opsAuditBooking(b,'adjustment',[],{note:text,adjustment:true,reason:g.reason})}
const opsSvcNames=list=>list.map(s=>typesVI[s.type]).join(', ');

function opsWorkflow(b){
  const req=opsRequired(b),guideSvc=req.find(s=>s.type==='Guide'),eff=b.status==='OnHold'?b.holdFrom:(b.status==='Cancelled'&&b.cancellation?b.cancellation.fromStatus:b.status),started=eff==='Running'||eff==='Completed';
  const notBooked=req.filter(s=>!(s.supplier&&['Requested','Confirmed','Completed'].includes(opsStatus(s))));
  const nonGuidePending=req.filter(s=>s.type!=='Guide'&&!opsReady(s));
  const staleDoc=(state.docs||[]).some(d=>d.booking===b.id&&d.type==='Voucher'&&d.stale);
  const guideOk=!!b.guide&&b.guideConfirmed===true&&(!guideSvc||opsReady(guideSvc));
  const d=[
    [true,''],
    [!!b.operator,'Chưa phân công điều hành phụ trách'],
    [req.length>0&&!notBooked.length,req.length?'Dịch vụ bắt buộc chưa chọn NCC hoặc chưa gửi yêu cầu: '+opsSvcNames(notBooked):'Chưa có dịch vụ bắt buộc nào'],
    [req.length>0&&!nonGuidePending.length,req.length?'Dịch vụ bắt buộc chưa được NCC xác nhận: '+opsSvcNames(nonGuidePending):'Chưa có dịch vụ bắt buộc nào'],
    [b.voucher===true&&!b.voucherStale&&!staleDoc,b.voucherStale?'Voucher cần tạo lại ('+b.voucherStale.reason+')':staleDoc?'Tài liệu voucher đã lỗi thời, cần tạo lại':'Chưa tạo voucher'],
    [guideOk,!b.guide?'Chưa phân công HDV':b.guideConfirmed!==true?'HDV chưa xác nhận nhận tour':'Dịch vụ HDV chưa được xác nhận'],
    [started,'Tour chưa bắt đầu'],
    [b.status==='Completed','Tour chưa hoàn tất']
  ];
  const steps=OPS_FLOW.map((label,i)=>({label,done:(started&&i<=5)?true:d[i][0],missing:d[i][1]}));
  const cur=steps.findIndex(x=>!x.done);
  return{steps,current:cur,blockers:steps.slice(1,6).filter(x=>!x.done).map(x=>x.missing)};
}

function opsAuditBooking(b,action,changes,extra){
  if(!Array.isArray(state.auditLogs))state.auditLogs=[];
  state.auditLogs.push(Object.assign({id:'AUD-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),entity:'booking',booking:b.id,action,changes,by:opsActor(),role,at:new Date().toISOString()},extra||{}));
}

// Cổng duy nhất để đổi trạng thái booking. Trả {ok,msg}; chỉ ghi dữ liệu + nhật ký khi hợp lệ.
// Chính sách (thiết kế được nghiệp vụ đồng ý 2026-10-13, chờ rà soát thêm): OnHold/Cancelled bắt buộc lý do; OnHold chỉ tiếp tục về đúng
// trạng thái trước đó (không kiểm tra lại điều kiện bắt đầu vì dữ liệu bị đóng băng); hủy tour đã bắt đầu chạy chỉ Giám đốc; Completed/Cancelled là trạng thái cuối.
function opsTransition(b,to,extra){
  extra=extra||{};
  if(!OPS_EDIT_ROLES.includes(role))return{ok:false,msg:'Vai trò này không có quyền đổi trạng thái tour.'};
  if(!b)return{ok:false,msg:'Không tìm thấy booking.'};
  const from=b.status,label=x=>OPS_BOOKING_STATUS_VI[x]||x,note=String(extra.note||'').trim();
  if(!(OPS_TRANSITIONS[from]||[]).includes(to))return{ok:false,msg:'Không thể chuyển tour từ "'+label(from)+'" sang "'+label(to)+'".'};
  if(from==='OnHold'&&to!=='Cancelled'&&to!==b.holdFrom)return{ok:false,msg:'Tour tạm dừng từ "'+label(b.holdFrom)+'" chỉ có thể tiếp tục về đúng trạng thái đó.'};
  if((to==='OnHold'||to==='Cancelled')&&note.length<3)return{ok:false,msg:'Cần nhập lý do (tối thiểu 3 ký tự).'};
  if(to==='Cancelled'&&role!=='CEO'&&(from==='Running'||b.holdFrom==='Running'))return{ok:false,msg:'Chỉ Giám đốc được hủy tour đã bắt đầu chạy.'};
  if(to==='Running'&&from==='Preparing'){const bl=opsWorkflow(b).blockers;if(bl.length)return{ok:false,msg:'Chưa thể bắt đầu tour: '+bl.join('; ')+'.'}}
  const at=new Date().toISOString(),by=opsActor(),prev=from==='OnHold'?b.holdFrom:from;
  if(to==='OnHold'){b.holdFrom=from;b.hold={at,by,reason:note}}
  else if(from==='OnHold'){delete b.hold;delete b.holdFrom}
  if(to==='Cancelled'){
    b.cancellation={at,by,reason:note,fromStatus:prev,supplierServices:opsRequired(b).filter(x=>x.supplier&&['Requested','Confirmed','Completed'].includes(opsStatus(x))).map(x=>({type:x.type,supplier:x.supplier,status:opsStatus(x)}))};
    if(b.voucher)opsInvalidateVoucher(b,'Booking đã hủy');
  }
  b.status=to;
  if(to==='Running'&&from==='Preparing'){b.startedAt=at;b.startedBy=by}
  if(to==='Completed')b.completion={at,by,note:extra.note||'',openIssues:extra.openIssues||[]};
  opsAuditBooking(b,'status_change',[{field:'bookingStatus',from,to}],note?{note}:{});
  return{ok:true};
}

function bookStatus(b){return badge(OPS_BOOKING_STATUS_VI[b.status]||String(b.status),b.status==='Cancelled'?'red':(b.status==='Preparing'||b.status==='OnHold')?'amber':'green')}

function bkLink(b){return '<button class="link" onclick="openBooking(\''+b.id+'\')">'+b.id+'</button>'}

let opsSearch='',opsFrom='',opsTo='',opsOperator='',opsRunningOnly=false,opsIssueOnly=false;

function opsHasIssue(b){
  if(b.status==='Cancelled')return false;
  const openIssue=opsBookingHasOpenIssue(b.id);
  const missingService=opsPending(b).length>0;
  return openIssue||missingService||!b.guide;
}

function opsApplySearch(e){if(e)e.preventDefault();opsSearch=(document.getElementById('opsSearchInput')?.value||'').trim();render();}

const renderOperationTours=()=>{
  // state.bookings là nguồn booking dùng chung của demo; không tạo bản sao booking trong phân hệ điều hành.
  const bs=state.bookings;
  const filtered=bs.filter(b=>{
    const q=opsSearch.toLocaleLowerCase('vi');
    const matchesSearch=!q||[b.id,b.client,b.tour].some(v=>String(v||'').toLocaleLowerCase('vi').includes(q));
    const matchesStatus=bookingFilter==='all'||b.status===bookingFilter;
    const matchesFrom=!opsFrom||b.start>=opsFrom;
    const matchesTo=!opsTo||b.start<=opsTo;
    const matchesOperator=!opsOperator||b.operator===opsOperator||(b.coOperators||[]).includes(opsOperator);
    const matchesRunning=!opsRunningOnly||b.status==='Running';
    const matchesIssue=!opsIssueOnly||opsHasIssue(b);
    return matchesSearch&&matchesStatus&&matchesFrom&&matchesTo&&matchesOperator&&matchesRunning&&matchesIssue;
  }).sort((a,b)=>String(a.start).localeCompare(String(b.start)));
  const operators=[...new Set([...opsOperators(),...bs.map(b=>b.operator).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,'vi'));
  const issues=opsOpenIssues();
  const statCards=`<div class="stats ops-stats">${stat('CẦN CHUẨN BỊ',bs.filter(b=>b.status==='Preparing').length,'Booking đã vào hàng đợi điều hành')}${stat('DỊCH VỤ CHỜ XÁC NHẬN',bs.filter(b=>!['Completed','Cancelled'].includes(b.status)).reduce((n,b)=>n+opsPending(b).length,0),'Chỉ tính dịch vụ được đánh dấu cần dùng')}${stat('TOUR ĐANG CHẠY',bs.filter(b=>b.status==='Running').length,'Tour đang thực hiện')}${stat('THIẾU HDV',bs.filter(b=>!['Completed','Cancelled'].includes(b.status)&&!b.guide).length,'Tour chưa được phân công HDV')}${stat('TOUR CÓ VẤN ĐỀ',bs.filter(opsHasIssue).length,opsIssueSummaryText()) }</div>`;
  const filterBar=`<form class="filters ops-filters" onsubmit="opsApplySearch(event)"><input id="opsSearchInput" value="${esc(opsSearch)}" placeholder="Tìm mã booking, khách hàng hoặc tour…" aria-label="Tìm booking"><button class="btn" type="submit">Tìm kiếm</button><input type="date" value="${esc(opsFrom)}" aria-label="Khởi hành từ ngày" onchange="opsFrom=this.value;render()"><input type="date" value="${esc(opsTo)}" aria-label="Khởi hành đến ngày" onchange="opsTo=this.value;render()"><select aria-label="Điều hành phụ trách" onchange="opsOperator=this.value;render()"><option value="">Tất cả điều hành</option>${operators.map(o=>`<option value="${esc(o)}" ${opsOperator===o?'selected':''}>${esc(o)}</option>`).join('')} </select><button type="button" class="btn ops-toggle ${opsRunningOnly?'is-active':''}" aria-pressed="${opsRunningOnly}" onclick="opsRunningOnly=!opsRunningOnly;render()">Chỉ tour đang chạy</button><button type="button" class="btn ops-toggle ${opsIssueOnly?'is-active':''}" aria-pressed="${opsIssueOnly}" onclick="opsIssueOnly=!opsIssueOnly;render()">Chỉ tour có vấn đề</button></form>`;
  const statusTabs=`<div class="tabs">${[['all','Tất cả'],['Preparing','Chuẩn bị'],['Running','Đang chạy'],['Completed','Hoàn tất'],['OnHold','Tạm dừng'],['Cancelled','Đã hủy']].map(([v,n])=>btn(n,"bookingFilter='"+v+"';render()",bookingFilter===v?'selected':'')).join('')}</div>`;
  const cards=filtered.map(b=>{
    const dead=b.status==='Cancelled',pending=dead?0:opsPending(b).length,overdue=dead?0:opsPending(b).filter(s=>s.dueAt&&s.dueAt<opsToday()).length,issue=opsBookingHasOpenIssue(b.id);
    const warning=b.status==='Cancelled'?badge('Đã hủy','red'):b.status==='OnHold'?badge('Tạm dừng','amber'):issue?badge('Có sự cố','red'):opsReadinessRisk(b)?badge('Nguy cơ chưa sẵn sàng','red'):pending||!b.guide?badge('Cần xử lý','amber'):badge('Sẵn sàng theo dõi','green');
    return `<article class="tourcard"><div class="cardhead"><span class="toursymbol">${b.tour.includes('Luxury')?'◇':'⌁'}</span>${bookStatus(b)}</div><div class="eyebrow">${bkLink(b)} · ${b.pax} KHÁCH</div><h3>${esc(b.tour)}</h3><div class="sub">${esc(b.client)} · Điều hành: ${esc(b.operator||'Chưa phân công')}${(b.coOperators||[]).length?' (+'+b.coOperators.length+')':''}</div><div class="dates">◷ ${fmt(b.start)} — ${fmt(b.end)}</div><div class="barrow"><div class="bar" style="flex:1"><i style="width:${progress(b)}%"></i></div><small>${progress(b)}%</small></div><div class="bottom"><div class="sub">${b.guide?esc(state.guides.find(g=>g.id===b.guide)?.name||'Đã gán HDV'):'Chưa có HDV'}<br>${pending} dịch vụ chờ xác nhận${overdue?' ('+overdue+' quá hạn)':''}<br>${warning}</div>${btn('Điều hành →',"openBooking('"+b.id+"')",'small')}</div></article>`;
  }).join('');
  return title('Trung tâm điều hành','Bảng booking tập trung · tìm kiếm, lọc lịch khởi hành và nhận diện tour cần xử lý.',btn('Quy trình demo',"go('help')"))+statCards+filterBar+statusTabs+`<div class="ops-resultline"><span>${filtered.length} / ${bs.length} booking</span><button class="btn small" onclick="opsSearch='';opsFrom='';opsTo='';opsOperator='';opsRunningOnly=false;opsIssueOnly=false;bookingFilter='all';render()">Xóa bộ lọc</button></div><div class="tourgrid">${cards||'<div class="empty">Không có booking phù hợp với bộ lọc hiện tại.</div>'}</div>`;
};
function opsProcessBody(b,wf){
  const g=opsAdjustActive(b.id),lbl=x=>OPS_BOOKING_STATUS_VI[x]||x;
  let h=g?'<div class="alert"><b>⚠ Đang ở chế độ điều chỉnh vận hành</b>Hết hạn lúc '+esc(new Date(g.until).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}))+' · mọi thay đổi được ghi vào nhật ký. '+btn('Kết thúc điều chỉnh',"endAdjust('"+b.id+"')",'small')+'</div>':'';
  h+=opsRiskAlert(b);
  if(b.status==='Preparing')h+=wf.blockers.length?'<p class="sub">Bước hiện tại: <b>'+wf.steps[wf.current].label+'</b>. Còn thiếu để bắt đầu tour:</p><ul class="ops-missing">'+wf.blockers.map(m=>'<li>'+esc(m)+'</li>').join('')+'</ul>':'<p>'+badge('Đủ điều kiện bắt đầu tour','green')+'</p>';
  else if(b.status==='Running')h+='<p class="sub">Tour đang chạy'+(b.startedAt?' · bắt đầu '+esc(opsTimeText(b.startedAt))+' bởi '+esc(b.startedBy):' · (dữ liệu mẫu, chưa có thời điểm bắt đầu)')+'</p>';
  else if(b.status==='Completed')h+='<p class="sub">Tour đã hoàn tất'+(b.completion?' · '+esc(opsTimeText(b.completion.at))+' bởi '+esc(b.completion.by):' · (dữ liệu mẫu)')+'</p>'+(b.completion&&b.completion.note?'<p class="ops-note">Ghi chú: '+esc(b.completion.note)+'</p>':'')+(b.completion&&b.completion.openIssues.length?'<p class="sub">Vấn đề còn tồn khi hoàn tất:</p><ul class="ops-missing">'+b.completion.openIssues.map(i=>'<li>'+esc(i.id)+' · '+esc(i.type)+': '+esc(i.note)+'</li>').join('')+'</ul>':'');
  else if(b.status==='OnHold')h+='<p>'+badge('Tạm dừng','amber')+'</p><p class="sub">Tạm dừng từ "'+esc(lbl(b.holdFrom))+'"'+(b.hold?' · '+esc(opsTimeText(b.hold.at))+' bởi '+esc(b.hold.by):'')+'. Dữ liệu vận hành đang đóng băng.</p>'+(b.hold?'<p class="ops-note">Lý do: '+esc(b.hold.reason)+'</p>':'');
  else if(b.status==='Cancelled'){const c=b.cancellation;h+='<p>'+badge('Đã hủy','red')+'</p>'+(c?'<p class="sub">Hủy lúc '+esc(opsTimeText(c.at))+' bởi '+esc(c.by)+' · trạng thái trước khi hủy: '+esc(lbl(c.fromStatus))+'</p><p class="ops-note">Lý do: '+esc(c.reason)+'</p>'+(c.supplierServices.length?'<p class="sub">Dịch vụ cần hủy riêng với NCC:</p><ul class="ops-missing">'+c.supplierServices.map(x=>'<li>'+esc(typesVI[x.type]||x.type)+' · '+esc(x.supplier)+' · '+esc(OPS_STATUS_VI[x.status]||x.status)+'</li>').join('')+'</ul>':'')+'<p class="sub">Hoàn tiền khách và phí hủy/công nợ NCC chưa được xử lý tự động — làm ở Kế toán.</p>':'<p class="sub">Booking đã hủy.</p>')}
  return h;
}
function opsStatusButtons(b,canOp){
  if(!canOp)return '';
  let h='';
  if(b.status==='Preparing'||b.status==='Running')h+=btn('Tạm dừng tour',"statusForm('"+b.id+"','hold')");
  if(b.status==='OnHold')h+=btn('Tiếp tục tour',"statusForm('"+b.id+"','resume')",'primary');
  if(b.status==='Preparing'||b.status==='OnHold')h+=btn('Hủy booking',"statusForm('"+b.id+"','cancel')",'danger');
  if(opsLocked(b))h+=opsAdjustActive(b.id)?btn('Kết thúc điều chỉnh',"endAdjust('"+b.id+"')"):btn('Điều chỉnh vận hành',"adjustWarning('"+b.id+"')",'danger');
  return h;
}

function adjustWarning(id){
  const b=state.bookings.find(x=>x.id===id);
  if(!OPS_EDIT_ROLES.includes(role))return toast('Chỉ Giám đốc và Điều hành được điều chỉnh dữ liệu vận hành.');
  if(!b||!opsLocked(b))return toast('Chỉ cần xác nhận điều chỉnh khi tour đang chạy hoặc đã hoàn tất.');
  const running=b.status==='Running';
  modal('Điều chỉnh vận hành · '+id,'<div class="alert red"><b>⚠ Cảnh báo: tour '+(running?'ĐANG CHẠY':'đã hoàn tất')+'</b>'+(running?'Khách đang đi tour. Đổi dịch vụ, HDV, xe, voucher hoặc người phụ trách lúc này có thể ảnh hưởng trực tiếp tới khách và các bên liên quan.':'Tour đã kết thúc. Thay đổi dữ liệu vận hành lúc này làm sai lệch hồ sơ đã chốt và có thể ảnh hưởng đối soát.')+'<br>Voucher hiện tại có thể bị đánh dấu cần tạo lại. Mọi thay đổi đều được ghi vào nhật ký kèm người thực hiện.</div><form onsubmit="confirmAdjust(event,\''+id+'\')"><label>Lý do điều chỉnh (không bắt buộc, được ghi vào nhật ký)<textarea name="reason" maxlength="500"></textarea></label><p><b>Bạn có chắc chắn muốn thay đổi?</b></p><div class="formfooter"><button type="button" class="btn" onclick="openBooking(\''+id+'\')">Không, quay lại</button><button class="btn danger" type="submit">Có, cho phép điều chỉnh trong '+OPS_ADJUST_MINUTES+' phút</button></div></form>',true);
}
function confirmAdjust(e,id){
  e.preventDefault();
  const b=state.bookings.find(x=>x.id===id);
  if(!OPS_EDIT_ROLES.includes(role))return toast('Chỉ Giám đốc và Điều hành được điều chỉnh dữ liệu vận hành.');
  if(!b||!opsLocked(b))return toast('Chỉ cần xác nhận điều chỉnh khi tour đang chạy hoặc đã hoàn tất.');
  const reason=String(new FormData(e.target).get('reason')||'').trim();
  if(reason.length>500)return toast('Lý do tối đa 500 ký tự.');
  opsAdjust[id]={until:Date.now()+OPS_ADJUST_MINUTES*60000,reason,by:opsActor()};
  opsAuditBooking(b,'adjustment_start',[],{note:reason||'(không ghi lý do)',adjustment:true});
  log(id+' mở chế độ điều chỉnh vận hành');
  openBooking(id);toast('Đã mở chế độ điều chỉnh trong '+OPS_ADJUST_MINUTES+' phút. Mọi thay đổi được ghi nhật ký.');
}
function endAdjust(id){
  const b=state.bookings.find(x=>x.id===id);if(!b)return;
  if(opsAdjust[id]){delete opsAdjust[id];opsAuditBooking(b,'adjustment_end',[],{adjustment:true});log(id+' kết thúc điều chỉnh vận hành')}
  openBooking(id);toast('Đã kết thúc chế độ điều chỉnh. Dữ liệu vận hành được khóa lại.');
}

function statusForm(id,kind){
  const b=state.bookings.find(x=>x.id===id);if(!b)return;
  if(!OPS_EDIT_ROLES.includes(role))return toast('Vai trò này không có quyền đổi trạng thái tour.');
  const to=kind==='hold'?'OnHold':kind==='cancel'?'Cancelled':b.holdFrom;
  if(!to||!(OPS_TRANSITIONS[b.status]||[]).includes(to))return toast('Không thể chuyển tour từ "'+(OPS_BOOKING_STATUS_VI[b.status]||b.status)+'" sang trạng thái này.');
  if(kind==='cancel'&&role!=='CEO'&&(b.status==='Running'||b.holdFrom==='Running'))return toast('Chỉ Giám đốc được hủy tour đã bắt đầu chạy.');
  const svc=opsRequired(b).filter(x=>x.supplier&&['Requested','Confirmed','Completed'].includes(opsStatus(x)));
  const info=kind==='hold'?'<div class="alert"><b>Tạm dừng tour</b>Dữ liệu vận hành (dịch vụ, HDV, xe, voucher, người phụ trách) bị đóng băng cho tới khi tiếp tục hoặc hủy. HDV và xe vẫn được giữ lịch.</div>':kind==='resume'?'<div class="alert green"><b>Tiếp tục tour</b>Tour sẽ trở về "'+esc(OPS_BOOKING_STATUS_VI[b.holdFrom]||b.holdFrom)+'".</div>':'<div class="alert red"><b>⚠ Hủy booking — không thể hoàn tác</b>HDV và xe được trả lịch. Dịch vụ đã gửi/xác nhận cho NCC cần được hủy riêng'+(svc.length?' ('+svc.length+' dịch vụ: '+esc(opsSvcNames(svc))+')':'')+'. Hoàn tiền khách và phí hủy/công nợ NCC chưa được xử lý tự động — làm ở Kế toán.</div>';
  const need=kind!=='resume';
  modal((kind==='hold'?'Tạm dừng tour':kind==='resume'?'Tiếp tục tour':'Hủy booking')+' · '+id,info+'<form onsubmit="submitStatus(event,\''+id+'\',\''+kind+'\')"><label>'+(need?'Lý do (bắt buộc)':'Ghi chú (không bắt buộc)')+'<textarea name="note" maxlength="500" '+(need?'required':'')+'></textarea></label><div class="formfooter"><button type="button" class="btn" onclick="openBooking(\''+id+'\')">Quay lại</button><button class="btn '+(kind==='cancel'?'danger':'primary')+'" type="submit">'+(kind==='hold'?'Xác nhận tạm dừng':kind==='resume'?'Xác nhận tiếp tục':'Xác nhận hủy booking')+'</button></div></form>',true);
}
function submitStatus(e,id,kind){
  e.preventDefault();
  const b=state.bookings.find(x=>x.id===id);if(!b)return;
  const note=String(new FormData(e.target).get('note')||'').trim();
  if(note.length>500)return toast('Nội dung tối đa 500 ký tự.');
  const to=kind==='hold'?'OnHold':kind==='cancel'?'Cancelled':b.holdFrom;
  const r=opsTransition(b,to,{note});
  if(!r.ok)return toast(r.msg);
  delete opsAdjust[id];
  log(id+(kind==='hold'?' tạm dừng tour':kind==='cancel'?' bị hủy':' tiếp tục tour'));closeModal();render();openBooking(id);
  toast(kind==='hold'?'Đã tạm dừng tour.':kind==='cancel'?'Đã hủy booking. Hãy hủy các dịch vụ đã đặt với NCC và báo Kế toán.':'Đã tiếp tục tour.');
}

function opsServiceRow(b,t,canEdit){
  const s=b.services.find(x=>x.type===t),edit=n=>canEdit?btn(n,"serviceForm('"+b.id+"','"+t+"')",'small'):'';
  if(!s||!s.needed)return '<div class="checkitem ops-svc off"><span>–</span><div class="grow"><b>'+typesVI[t]+'</b><div class="sub">Không sử dụng cho booking này · không tính vào tiến độ và chi phí</div></div>'+badge('Không dùng')+edit('Thêm vào booking')+'</div>';
  const st=opsStatus(s),ready=OPS_READY.includes(st),sup=opsSupplier(s),over=!ready&&s.dueAt&&s.dueAt<opsToday();
  return '<div class="checkitem ops-svc"><span>'+(ready?'●':'○')+'</span><div class="grow"><b>'+typesVI[t]+'</b><div class="sub">'+esc(sup?sup.name:'Chưa chọn NCC')+' · '+money(s.cost)+(s.dueAt?' · Hạn xác nhận '+fmt(s.dueAt):'')+'</div>'+(s.notes?'<div class="sub ops-note">Ghi chú: '+esc(s.notes)+'</div>':'')+'<div class="sub">'+(s.updatedBy?'Cập nhật bởi '+esc(s.updatedBy)+' · '+esc(opsTimeText(s.updatedAt)):'Chưa có cập nhật (dữ liệu mẫu)')+'</div></div>'+(over?badge('Quá hạn','red'):'')+badge(OPS_STATUS_VI[st],ready?'green':st==='Cancelled'?'red':'amber')+edit('Cập nhật')+'</div>';
}

function renderBookingDetails(id){let b=state.bookings.find(b=>b.id===id);opsNormalize(b);let canOp=OPS_EDIT_ROLES.includes(role),guide=state.guides.find(g=>g.id===b.guide),req=opsRequired(b),done=req.filter(opsReady).length,canEdit=canOp&&opsEditable(b);const wf=opsWorkflow(b);let tabs=`<div class="flow">${wf.steps.map((x,i)=>'<span class="'+(x.done?'on':i===wf.current?'cur':'')+'">'+x.label+'</span>').join('')}</div>`;
  const voucherBody=b.voucher?badge('Sẵn sàng','green'):b.voucherStale?'<p>'+badge('Cần tạo lại','red')+'</p><p class="sub">'+esc(b.voucherStale.reason)+' · '+esc(opsTimeText(b.voucherStale.at))+'</p>':'<p class="sub">Tạo sau khi NCC xác nhận; thông tin HDV cập nhật sau phân công.</p>';
  modal(b.id+' · '+esc(b.tour),tabs+card('Hồ sơ booking',`<div class="split"><div>${line('Khách',esc(b.client))}${line('Ngày đi',fmt(b.start)+' – '+fmt(b.end))}${line('Số khách',b.pax)}${line('Điều hành',esc(b.operator||'Chưa phân công')+((b.coOperators||[]).length?' · phối hợp: '+esc(b.coOperators.join(', ')):''))}</div><div>${line('Trạng thái',bookStatus(b))}${role==='Sales'||role==='CEO'?line('Giá trị',money(b.revenue))+line('Chi phí dự kiến',money(b.cost))+line('Biên dự kiến',((b.revenue-b.cost)/b.revenue*100).toFixed(1)+'%'):line('Chi phí dịch vụ',money(b.cost))}${role==='CEO'?line('Đã thu',money(b.received)):''}</div></div>`)
  +card('Quy trình tour',opsProcessBody(b,wf),btn('Lịch sử trạng thái',"tourHistory('"+b.id+"')",'small'))
  
  +card('Checklist dịch vụ',serviceTypes.map(t=>opsServiceRow(b,t,canEdit)).join('')+'<p class="notice">Tiến độ chỉ tính '+req.length+' dịch vụ bắt buộc ('+done+' đã xác nhận). Chi phí booking = tổng chi phí dự kiến của dịch vụ bắt buộc chưa bị NCC hủy ('+money(opsCostTotal(b))+'); mỗi dịch vụ chỉ cộng một lần.</p>',btn('Lịch sử thay đổi',"serviceHistory('"+b.id+"')",'small'))
  +`<div class="split">${card('Hướng dẫn viên',guide?'<b>'+esc(guide.name)+'</b><p class="sub">'+esc(guide.lang)+' · '+esc(guide.area)+'</p>':'<p class="sub">Chưa phân công HDV cho tour.</p>')}${card('Voucher',voucherBody)}</div><div class="actions">${canEdit?btn('Phân công HDV',"assignForm('"+id+"')")+btn(b.voucherStale?'Tạo lại voucher':'Tạo voucher',"makeVoucher('"+id+"')"):''}${canOp&&b.status==='Preparing'?btn('Bắt đầu tour',"startTour('"+id+"')",'primary'):''}${b.voucher?btn('In voucher',"printVoucher('"+id+"')"):''}${canOp&&b.status==='Running'?btn('Hoàn tất tour',"finishTour('"+id+"')",'primary'):''}${opsStatusButtons(b,canOp)}${btn('Danh sách khách',"passengerDetail('"+id+"')")}</div>${b.status==='Preparing'?'<p class="notice">Điều kiện bắt đầu: mọi dịch vụ bắt buộc được xác nhận, HDV đã nhận tour và voucher hợp lệ. Tài liệu không quy định tỷ lệ cọc bắt buộc.</p>':(opsLocked(b)&&!opsAdjustActive(b.id))?'<p class="notice">Tour đã chạy hoặc hoàn tất nên dữ liệu vận hành đang được khóa. Giám đốc/Điều hành muốn thay đổi hãy bấm "Điều chỉnh vận hành" và xác nhận cảnh báo.</p>':''}`);}

function serviceForm(id,type){
  if(!OPS_EDIT_ROLES.includes(role))return toast('Vai trò này không có quyền cập nhật dịch vụ điều hành.');
  const b=state.bookings.find(b=>b.id===id);if(!b)return toast('Không tìm thấy booking '+id+'.');
  const gate=opsEditGate(b);if(!gate.ok)return toast(gate.msg);
  const s=b.services.find(s=>s.type===type)||OPS_NEW_SERVICE(type),c=opsEffective(b,s);
  let ncc=state.suppliers.filter(n=>n.type===type);
  if(c.supplier&&!ncc.some(n=>n.id===c.supplier)){const cur=opsSupplier(s);if(cur)ncc=[cur,...ncc]}
  const statuses=OPS_STATUS.filter(([v])=>v!=='Completed'||c.status==='Completed');
  modal('Dịch vụ '+typesVI[type]+' · '+id,`<form onsubmit="saveService(event,'${id}','${type}')"><div class="formgrid"><label class="full ops-checkline"><input type="checkbox" name="needed" value="1" ${c.needed?'checked':''}> Dịch vụ này cần dùng cho booking (bắt buộc, tính vào tiến độ và chi phí)</label><label class="full">Nhà cung cấp<select name="supplier"><option value="">— Chưa chọn NCC —</option>${ncc.map(n=>'<option value="'+n.id+'" '+(c.supplier===n.id?'selected':'')+'>'+esc(n.name)+' · '+score(n)+'/100</option>').join('')}</select></label><label>Chi phí dự kiến (VND)<input type="number" name="cost" min="0" step="1000" value="${c.cost}" required></label><label>Trạng thái xác nhận<select name="status">${statuses.map(([v,n])=>'<option value="'+v+'" '+(c.status===v?'selected':'')+'>'+n+'</option>').join('')}</select></label><label>Thời hạn xác nhận<input type="date" name="dueAt" value="${esc(c.dueAt)}"></label><label>Số khách<input type="number" name="pax" min="1" step="1" value="${c.pax}" required></label><label>Dịch vụ từ ngày<input type="date" name="dateStart" value="${esc(c.dateStart)}" required></label><label>Dịch vụ đến ngày<input type="date" name="dateEnd" value="${esc(c.dateEnd)}" required></label><label class="full">Ghi chú<textarea name="notes" maxlength="500">${esc(c.notes)}</textarea></label></div>${gate.adjust?'<div class="alert red"><b>⚠ Bạn đang điều chỉnh tour '+(b.status==='Running'?'đang chạy':'đã hoàn tất')+'</b>Thay đổi sẽ được ghi nhật ký là điều chỉnh sau khi tour chạy.</div>':''}<p class="notice">Dịch vụ bắt buộc chỉ được gửi yêu cầu/xác nhận khi đã chọn NCC. Đổi NCC sẽ tự đưa trạng thái về "Chờ NCC xác nhận". Đổi NCC, chi phí, ngày, số khách hoặc trạng thái xác nhận sẽ đánh dấu voucher hiện tại cần tạo lại. Mọi thay đổi được ghi vào lịch sử.</p><div class="formfooter"><button class="btn primary" type="submit">Lưu dịch vụ</button></div></form>`,true)
}

function saveService(e,id,type){
  e.preventDefault();
  // Kiểm tra ở tầng nghiệp vụ (client-side trong demo): quyền, trạng thái booking, dữ liệu hợp lệ.
  if(!OPS_EDIT_ROLES.includes(role))return toast('Vai trò này không có quyền cập nhật dịch vụ điều hành.');
  const b=state.bookings.find(b=>b.id===id);if(!b)return toast('Không tìm thấy booking '+id+'.');
  const gate=opsEditGate(b);if(!gate.ok)return toast(gate.msg);
  if(!serviceTypes.includes(type))return toast('Loại dịch vụ không hợp lệ.');
  const f=new FormData(e.target),found=b.services.find(x=>x.type===type),isNew=!found,s=found||OPS_NEW_SERVICE(type),cur=opsEffective(b,s);
  const next={needed:f.get('needed')==='1',supplier:String(f.get('supplier')||''),cost:Math.round(Number(f.get('cost'))),status:String(f.get('status')||''),dueAt:String(f.get('dueAt')||''),dateStart:String(f.get('dateStart')||'')||b.start,dateEnd:String(f.get('dateEnd')||'')||b.end,pax:Number(f.get('pax')),notes:String(f.get('notes')||'').trim()};
  const isDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v);
  if(!OPS_STATUS_VI[next.status])return toast('Trạng thái xác nhận không hợp lệ.');
  if(!Number.isFinite(next.cost)||next.cost<0)return toast('Chi phí dự kiến phải là số không âm.');
  if(!Number.isInteger(next.pax)||next.pax<1)return toast('Số khách phải là số nguyên từ 1 trở lên.');
  if(!isDate(next.dateStart)||!isDate(next.dateEnd)||(next.dueAt&&!isDate(next.dueAt)))return toast('Ngày không hợp lệ.');
  if(next.dateEnd<next.dateStart)return toast('Ngày kết thúc dịch vụ phải sau hoặc bằng ngày bắt đầu.');
  if(next.notes.length>500)return toast('Ghi chú tối đa 500 ký tự.');
  if(next.supplier){const sup=state.suppliers.find(n=>n.id===next.supplier);if(!sup)return toast('Nhà cung cấp không tồn tại.');if(sup.type!==type)return toast('Nhà cung cấp này không cung cấp loại dịch vụ '+typesVI[type]+'.');}
  if(next.needed&&!next.supplier&&['Requested','Confirmed','Completed'].includes(next.status))return toast('Dịch vụ bắt buộc cần chọn NCC trước khi gửi yêu cầu hoặc đánh dấu đã xác nhận.');
  // Quyết định nghiệp vụ: đổi NCC thì NCC mới chưa xác nhận → tự đưa trạng thái về Requested (trừ khi điều hành chủ động chọn trạng thái khác).
  let autoReset=false;
  if(next.supplier&&cur.supplier!==next.supplier&&['Confirmed','Completed','Cancelled'].includes(cur.status)&&next.status===cur.status){next.status='Requested';autoReset=true}
  const changes=OPS_FIELDS.filter(k=>cur[k]!==next[k]).map(k=>({field:k,from:cur[k],to:next[k]}));
  if(!changes.length)return toast('Không có thay đổi để lưu.');
  // Ghi dịch vụ (bản boolean `confirmed` giữ đồng bộ cho các module khác).
  Object.assign(s,{needed:next.needed,supplier:next.supplier,cost:next.cost,status:next.status,confirmed:OPS_READY.includes(next.status),dueAt:next.dueAt,notes:next.notes});
  if(cur.dateStart!==next.dateStart)s.dateStart=next.dateStart;
  if(cur.dateEnd!==next.dateEnd)s.dateEnd=next.dateEnd;
  if(cur.pax!==next.pax)s.pax=next.pax;
  s.updatedBy=opsActor();s.updatedAt=new Date().toISOString();
  if(isNew)b.services.push(s);
  b.cost=opsCostTotal(b);
  // Voucher hiện hành chỉ lỗi thời khi thay đổi ảnh hưởng nội dung/hiệu lực voucher của dịch vụ đang được dùng.
  const readyChanged=OPS_READY.includes(cur.status)!==OPS_READY.includes(next.status);
  const touched=changes.filter(c=>OPS_VOUCHER_FIELDS.includes(c.field)).map(c=>OPS_FIELD_LABEL[c.field]);
  if(readyChanged)touched.push('Xác nhận NCC');
  let invalidated=false;
  if(touched.length&&(cur.needed||next.needed)&&b.voucher){opsInvalidateVoucher(b,typesVI[type]+': đổi '+touched.join(', ').toLowerCase());invalidated=true}
  opsAudit(b,type,isNew?'create':'update',changes,{voucherInvalidated:invalidated,autoStatusReset:autoReset,adjustment:!!gate.adjust,reason:gate.adjust?gate.grant.reason:''});
  log(id+' cập nhật dịch vụ '+type);
  render();openBooking(id);
  toast((invalidated?'Đã cập nhật dịch vụ. Voucher hiện tại cần tạo lại.':'Đã cập nhật dịch vụ và chi phí booking.')+(gate.adjust?' (ghi nhật ký: điều chỉnh sau khi tour chạy)':'')+(autoReset?' Đổi NCC nên trạng thái đã về "Chờ NCC xác nhận".':''));
}

function serviceHistory(id){
  const rows=(state.auditLogs||[]).filter(a=>a.entity==='booking_service'&&a.booking===id).reverse();
  const body=rows.length?table(['THỜI ĐIỂM','NGƯỜI CẬP NHẬT','DỊCH VỤ','THAY ĐỔI (TRƯỚC → SAU)'],rows.map(a=>'<tr><td>'+esc(opsTimeText(a.at))+'</td><td>'+esc(a.by)+'</td><td>'+esc(typesVI[a.serviceType]||a.serviceType)+(a.action==='create'?'<span class="sub">Thêm mới</span>':'')+'</td><td style="white-space:normal">'+(a.changes||[]).map(c=>'<div>'+esc(OPS_FIELD_LABEL[c.field]||c.field)+': '+esc(opsValText(c.field,c.from))+' → <b>'+esc(opsValText(c.field,c.to))+'</b></div>').join('')+(a.voucherInvalidated?'<div>'+badge('Voucher cần tạo lại','red')+'</div>':'')+(a.adjustment?'<div>'+badge('Điều chỉnh sau khi tour chạy','amber')+(a.reason?' <span class="sub">Lý do: '+esc(a.reason)+'</span>':'')+'</div>':'')+'</td></tr>')):'<div class="empty">Chưa có thay đổi nào được ghi lại cho booking này.</div>';
  modal('Lịch sử dịch vụ · '+id,body+'<div class="formfooter">'+btn('← Quay lại booking',"openBooking('"+id+"')")+'</div>');
}

function makeVoucher(id){let b=state.bookings.find(b=>b.id===id);if(!OPS_EDIT_ROLES.includes(role))return toast('Vai trò này không có quyền tạo voucher.');{const gt=opsEditGate(b);if(!gt.ok)return toast(gt.msg)}if(opsPending(b).some(s=>s.type!=='Guide'))return toast('Cần xác nhận các dịch vụ NCC trước khi tạo voucher.');b.voucher=true;delete b.voucherStale;opsNoteAdjust(b,'Tạo/tạo lại voucher');state.docs=state.docs.filter(d=>!(d.booking===id&&d.type==='Voucher'));state.docs.unshift({id:'DOC-'+Date.now(),booking:id,type:'Voucher',name:'Voucher '+id,date:new Date().toISOString().slice(0,10),generated:true});log('Tạo voucher '+id);render();openBooking(id);toast('Voucher đã sẵn sàng, có thể in / lưu PDF.');}

function startTour(id){
  let b=state.bookings.find(b=>b.id===id);if(!b)return;
  if(b.status==='OnHold')return toast('Tour đang tạm dừng: dùng "Tiếp tục tour" để chạy lại.');
  const r=opsTransition(b,'Running');
  if(!r.ok)return toast(r.msg);
  log(id+' bắt đầu tour');render();openBooking(id);toast('Tour đã chuyển sang Đang chạy.');
}

function finishTour(id){
  const b=state.bookings.find(b=>b.id===id);if(!b)return;
  if(!OPS_EDIT_ROLES.includes(role))return toast('Vai trò này không có quyền đổi trạng thái tour.');
  if(b.status!=='Running')return toast('Chỉ tour đang chạy mới hoàn tất được.');
  const open=opsOpenIssues().filter(i=>i.booking===id);
  modal('Hoàn tất tour · '+id,'<form onsubmit="completeTour(event,\''+id+'\')">'+(open.length?'<div class="alert red"><b>'+open.length+' sự cố đang mở sẽ được ghi vào hồ sơ hoàn tất</b>'+open.map(i=>'<div>'+esc(i.id)+' · '+esc(i.type)+': '+esc(i.note)+'</div>').join('')+'</div>':'<p class="sub">Không có sự cố đang mở.</p>')+'<label>Ghi chú hoàn tất'+(open.length?' (bắt buộc khi còn vấn đề tồn)':'')+'<textarea name="note" maxlength="1000" '+(open.length?'required':'')+'></textarea></label><div class="formfooter"><button class="btn primary" type="submit">Xác nhận hoàn tất</button></div></form>',true);
}

function completeTour(e,id){
  e.preventDefault();
  const b=state.bookings.find(b=>b.id===id);if(!b)return;
  const note=String(new FormData(e.target).get('note')||'').trim(),open=opsOpenIssues().filter(i=>i.booking===id);
  if(note.length>1000)return toast('Ghi chú tối đa 1000 ký tự.');
  if(open.length&&!note)return toast('Còn sự cố đang mở: hãy ghi chú về vấn đề tồn trước khi hoàn tất.');
  const r=opsTransition(b,'Completed',{note,openIssues:open.map(i=>({id:i.id,type:i.type,note:i.note}))});
  if(!r.ok)return toast(r.msg);
  log(id+' hoàn tất tour, mở chăm sóc sau tour');closeModal();render();openBooking(id);toast('Tour hoàn tất. Có thể nhập feedback trong Chăm sóc khách hàng.');
}

function tourHistory(id){
  const rows=(state.auditLogs||[]).filter(a=>a.entity==='booking'&&a.booking===id).reverse();
  const body=rows.length?table(['THỜI ĐIỂM','NGƯỜI THỰC HIỆN','THAY ĐỔI','GHI CHÚ'],rows.map(a=>'<tr><td>'+esc(opsTimeText(a.at))+'</td><td>'+esc(a.by)+'</td><td style="white-space:normal">'+((a.changes||[]).length?a.changes.map(c=>'<div>'+esc(OPS_FIELD_LABEL[c.field]||c.field)+': '+esc(opsValText(c.field,c.from))+' → <b>'+esc(opsValText(c.field,c.to))+'</b></div>').join(''):'<div>'+esc({adjustment_start:'Bắt đầu chế độ điều chỉnh vận hành',adjustment_end:'Kết thúc chế độ điều chỉnh vận hành',adjustment:'Điều chỉnh sau khi tour chạy/hoàn tất'}[a.action]||a.action)+'</div>')+'</td><td style="white-space:normal">'+esc(a.note||'—')+(a.action==='adjustment'&&a.reason?'<div class="sub">Lý do phiên: '+esc(a.reason)+'</div>':'')+'</td></tr>')):'<div class="empty">Chưa có chuyển trạng thái hoặc điều chỉnh nào được ghi lại cho booking này.</div>';
  modal('Lịch sử trạng thái · '+id,body+'<div class="formfooter">'+btn('← Quay lại booking',"openBooking('"+id+"')")+'</div>');
}

function printVoucher(id){let b=state.bookings.find(b=>b.id===id);if(!b.voucher)return toast('Chưa có voucher hợp lệ.');let g=state.guides.find(g=>g.id===b.guide);printable('Voucher '+id,'<h2>'+esc(b.tour)+'</h2><p>'+esc(b.client)+' · '+b.pax+' khách<br>'+fmt(b.start)+' — '+fmt(b.end)+'<br>HDV: '+esc(g?.name||'—')+'</p><table><tr><th>Dịch vụ</th><th>Nhà cung cấp</th><th>Trạng thái</th></tr>'+b.services.filter(s=>s.needed).map(s=>'<tr><td>'+typesVI[s.type]+'</td><td>'+esc(state.suppliers.find(n=>n.id===s.supplier)?.name)+'</td><td>'+OPS_STATUS_VI[opsStatus(s)]+'</td></tr>').join('')+'</table><p>Chi tiết phòng, giờ đón và mã xác nhận NCC cần được bổ sung trong triển khai.</p>');}
/* EXTENSIONS */



function openBooking(id){
  renderBookingDetails(id);
  const b=state.bookings.find(b=>b.id===id);let actions='';
  if(OPS_EDIT_ROLES.includes(role)){
    if(opsEditable(b))actions+=btn('Giao điều hành',"operationForm('"+id+"')");
    actions+=btn('Lịch sử phụ trách',"operatorHistory('"+id+"')");
    actions+=btn('Bảng chi phí & lợi nhuận',"costDetail('"+id+"')")+btn('Ghi nhận sự cố',"issueForm('"+id+"')");
    if(opsEditable(b)&&b.guide&&!b.guideConfirmed)actions+=btn('Xác nhận HDV nhận tour',"confirmGuide('"+id+"')",'primary');
  }
  document.querySelector('.modal').insertAdjacentHTML('beforeend','<div class="actions" style="margin-top:18px">'+actions+'</div>');
}

function costDetail(id){let b=state.bookings.find(b=>b.id===id);modal('Cost & Profit · '+id,card('Dự toán tour',line('Revenue',money(b.revenue))+line('Cost',money(b.cost))+line('Profit',money(b.revenue-b.cost))+line('Margin',((b.revenue-b.cost)/b.revenue*100).toFixed(1)+'%'))+card('Chi phí dịch vụ',table(['DỊCH VỤ','COST'],opsCostRows(b).map(s=>'<tr><td>'+typesVI[s.type]+'</td><td>'+money(s.cost)+'</td></tr>'))))}



views.operations=()=>renderOperationTours()+renderOpsAssignment()+renderOpsIssues()+renderOpsSettings();
