/* MODULE mod-marketing — chiến dịch, nội dung và KPI Marketing. */

let marketingTab = "kpi";

const campaignStatusLabels = { Planned: "Lên kế hoạch", Running: "Đang chạy", Ended: "Đã kết thúc" };

function campaignStats(c) {
  const leads = state.leads.filter((l) => l.campaign === c.id);
  const won = leads.filter((l) => l.status === "WON");
  const bookings = state.bookings.filter((b) => b.status !== "Cancelled" && won.some((l) => l.id === b.lead));
  const count = leads.length || c.leads || 0;
  const scores = bookings.map((b) => b.feedback?.score).filter((v) => typeof v === "number" && v > 0);
  const revenue = bookings.reduce((n, b) => n + (b.revenue || 0), 0);
  return {
    leads: count,
    qualified: leads.filter((l) => l.status !== "UNQUALIFIED" && l.status !== "NEW").length,
    won: won.length,
    revenue,
    cpl: count ? Math.round((c.spend || 0) / count) : 0,
    cac: won.length ? Math.round((c.spend || 0) / won.length) : 0,
    csat: scores.length ? scores.reduce((n, v) => n + v, 0) / scores.length : 0,
    csatCount: scores.length,
    roi: c.spend ? Math.round(((revenue - c.spend) / c.spend) * 100) : 0,
    linked: leads.length,
  };
}

function marketingKpiTab() {
  const campaigns = state.campaigns;
  const rows = campaigns.map((c) => ({ c, s: campaignStats(c) }));
  const total = rows.reduce((n, r) => n + r.s.leads, 0);
  const spend = campaigns.reduce((n, c) => n + (c.spend || 0), 0);
  const won = rows.reduce((n, r) => n + r.s.won, 0);
  const revenue = rows.reduce((n, r) => n + r.s.revenue, 0);
  const maxLeads = Math.max(1, ...rows.map((r) => r.s.leads));
  const bySource = {};
  state.leads.forEach((l) => (bySource[l.source] = (bySource[l.source] || 0) + 1));
  return (
    `<div class="stats">${stat("LEAD TỪ CHIẾN DỊCH", total, "Tổng lead ghi nhận")}${stat("NGÂN SÁCH ĐÃ CHI", short(spend), "Tổng chi tiếp thị")}${stat("CHI PHÍ / LEAD", money(total ? Math.round(spend / total) : 0), "CPL trung bình")}${stat("LEAD CHỐT ĐƠN", won, `Doanh thu ${short(revenue)}`)}${stat("CHI PHÍ / KHÁCH CHỐT (CAC)", won ? money(Math.round(spend / won)) : "—", won ? "Tổng chi ÷ khách chốt đơn" : "Chưa có khách chốt đơn")}</div>` +
    card(
      "Hiệu quả chiến dịch",
      rows.length
        ? table(
            ["CHIẾN DỊCH", "KÊNH", "LEAD", "ĐỦ ĐIỀU KIỆN", "CHỐT", "CHI PHÍ", "CPL", "CAC", "HÀI LÒNG", "DOANH THU"],
            rows.map(({ c, s }) => `<tr><td>${entityLink("campaign", c.id, c.name)}<span class="sub">${esc(c.owner || "")}</span></td><td>${badge(c.channel, "blue")}</td><td><b>${s.leads}</b><div class="bar"><i style="width:${Math.round((s.leads / maxLeads) * 100)}%"></i></div></td><td>${s.qualified}</td><td>${s.won}</td><td>${money(c.spend || 0)}</td><td><b>${money(s.cpl)}</b></td><td>${s.won ? money(s.cac) : "—"}</td><td>${s.csatCount ? `${badge(s.csat.toFixed(1) + " / 5", s.csat >= 4 ? "green" : s.csat >= 3 ? "amber" : "red")}<span class="sub">${s.csatCount} đánh giá</span>` : '<span class="sub">Chưa có</span>'}</td><td class="moneypositive">${money(s.revenue)}</td></tr>`),
          )
        : '<div class="empty">Chưa có chiến dịch.</div>',
    ) +
    card("Lead theo nguồn", Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => line(esc(k), v)).join("") || '<p class="sub">Chưa có lead.</p>', btn("Mở Leads", "navigate('crm',{crmTab:'leads'})", "small"))
  );
}

function marketingCampaignTab() {
  return card(
    "Danh sách chiến dịch",
    state.campaigns.length
      ? table(
          ["CHIẾN DỊCH", "KÊNH", "THỜI GIAN", "NGÂN SÁCH", "ĐÃ CHI", "LEAD", "TRẠNG THÁI", ""],
          state.campaigns.map((c) => {
            const s = campaignStats(c);
            return `<tr><td>${entityLink("campaign", c.id, c.name)}<span class="sub">${esc(c.owner || "")}</span></td><td>${badge(c.channel, "blue")}</td><td>${c.start ? fmt(c.start) + " – " + (c.end ? fmt(c.end) : "…") : "—"}</td><td>${money(c.budget || c.spend || 0)}</td><td>${money(c.spend || 0)}</td><td><b>${s.leads}</b></td><td>${badge(campaignStatusLabels[c.status] || "Đang chạy", c.status === "Ended" ? "" : "green")}</td><td>${btn("Chi tiết", `campaignDetail('${c.id}')`, "small")}</td></tr>`;
          }),
        )
      : '<div class="empty">Chưa có chiến dịch.</div>',
    can("marketing_manage") ? btn("+ Tạo chiến dịch", "campaignForm()", "small primary") : "",
  );
}

let contentMonth = todayISO().slice(0, 7);
function contentCalendar() {
  const [y, m] = contentMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate(), offset = (first.getDay() + 6) % 7;
  const byDay = {};
  state.contents.filter((c) => (c.date || "").startsWith(contentMonth)).forEach((c) => (byDay[+c.date.slice(8, 10)] ||= []).push(c));
  const tone = { Published: "green", Scheduled: "blue", Draft: "amber" };
  const cells = Array.from({ length: offset }, () => '<div class="cal-cell cal-empty"></div>').concat(Array.from({ length: days }, (_, i) => {
    const d = i + 1, iso = `${contentMonth}-${String(d).padStart(2, "0")}`;
    return `<div class="cal-cell ${iso === todayISO() ? "cal-today" : ""}"><b>${d}</b>${(byDay[d] || []).map((c) => `<span class="cal-item cal-${tone[c.status] || "amber"}" title="${esc(c.title)} · ${esc(c.channel)}">${esc(c.title)}</span>`).join("")}</div>`;
  })).join("");
  const shift = (n) => { const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
  return card(`Lịch nội dung · tháng ${m}/${y}`, `<div class="cal-head"><button class="btn small" onclick="contentMonth='${shift(-1)}';render()">‹ Trước</button><button class="btn small" onclick="contentMonth='${todayISO().slice(0, 7)}';render()">Tháng này</button><button class="btn small" onclick="contentMonth='${shift(1)}';render()">Sau ›</button></div><div class="cal-grid">${["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => `<div class="cal-dow">${d}</div>`).join("")}${cells}</div>${state.contents.some((c) => !c.date) ? '<p class="sub">Nội dung chưa đặt ngày sẽ không hiện trên lịch.</p>' : ""}`);
}

function marketingContentTab() {
  return contentCalendar() + card(
    "Kế hoạch nội dung",
    table(
      ["TIÊU ĐỀ", "NGÀY ĐĂNG", "KÊNH", "PHỤ TRÁCH", "TRẠNG THÁI", "ĐỔI TRẠNG THÁI"],
      state.contents.map(
        (c) => `<tr><td><b>${esc(c.title)}</b></td><td>${c.date ? fmt(c.date) : '<span class="sub">Chưa đặt</span>'}</td><td>${badge(c.channel)}</td><td>${esc(c.owner)}</td><td>${badge(c.status === "Published" ? "Đã đăng" : c.status === "Scheduled" ? "Đã lên lịch" : "Bản nháp", c.status === "Published" ? "green" : c.status === "Scheduled" ? "blue" : "amber")}</td><td>${can("marketing_manage") ? `<select aria-label="Trạng thái nội dung" onchange="contentStatus('${c.id}',this.value)">${[["Draft", "Bản nháp"], ["Scheduled", "Lên lịch"], ["Published", "Đã đăng"]].map(([s, l]) => `<option value="${s}" ${s === c.status ? "selected" : ""}>${l}</option>`).join("")}</select>` : ""}</td></tr>`,
      ),
    ),
    can("marketing_manage") ? btn("+ Thêm nội dung", "contentForm()", "small primary") : "",
  );
}

views.marketing = () => {
  const tabs = [["kpi", "KPI tổng quan"], ["campaigns", "Chiến dịch"], ["content", "Nội dung"]];
  return (
    title("Marketing", "Chiến dịch, nguồn lead và hiệu quả chi phí. Lead được xử lý tập trung tại CRM.", btn("Mở Leads", "navigate('crm',{crmTab:'leads'})", "primary")) +
    `<nav class="tabs">${tabs.map(([k, l]) => `<button class="btn ${marketingTab === k ? "selected" : ""}" onclick="marketingTab='${k}';render()">${l}</button>`).join("")}</nav>` +
    (marketingTab === "campaigns" ? marketingCampaignTab() : marketingTab === "content" ? marketingContentTab() : marketingKpiTab())
  );
};

function campaignForm() {
  modal(
    "Tạo chiến dịch",
    `<form onsubmit="addCampaign(event)"><div class="formgrid"><label class="full">Tên chiến dịch${field("name", "text", "", true)}</label><label>Kênh<select name="channel">${contentChannels.map((v) => `<option>${esc(v)}</option>`).join("")}</select></label><label>Phụ trách<select name="owner">${marketingOwners.map((v) => `<option ${v === actor().name ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label><label>Bắt đầu<input name="start" type="date" value="${todayISO()}" required></label><label>Kết thúc<input name="end" type="date"></label><label>Ngân sách (VND)<input name="budget" type="number" min="0" required></label></div><div class="formfooter"><button class="btn primary">Tạo chiến dịch</button></div></form>`,
    true,
  );
}

function addCampaign(e) {
  e.preventDefault();
  if (!requireCapability("marketing_manage")) return;
  const f = new FormData(e.target);
  const c = { id: nextBusinessId("campaigns"), name: f.get("name").trim(), channel: f.get("channel"), owner: f.get("owner"), start: f.get("start"), end: f.get("end") || "", budget: +f.get("budget"), spend: 0, traffic: 0, leads: 0, status: "Running" };
  state.campaigns.push(c);
  audit("campaign", c.id, "CREATE", "Tạo chiến dịch " + c.name);
  closeModal();
  render();
  toast("Đã tạo chiến dịch.");
}

function campaignDetail(id) {
  const c = findCampaign(id);
  if (!c) return;
  const s = campaignStats(c);
  const leads = state.leads.filter((l) => l.campaign === id);
  modal(
    esc(c.name),
    card("Kết quả", line("Kênh", esc(c.channel)) + line("Phụ trách", esc(c.owner || "—")) + line("Ngân sách", money(c.budget || 0)) + line("Đã chi", money(c.spend || 0)) + line("Lead", s.leads) + line("Chốt đơn", s.won) + line("CPL", money(s.cpl)) + line("CAC (chi phí / khách chốt)", s.won ? money(s.cac) : "—") + line("Điểm hài lòng sau tour", s.csatCount ? s.csat.toFixed(1) + " / 5 (" + s.csatCount + " đánh giá)" : "Chưa có") + line("Doanh thu mang về", money(s.revenue)), can("marketing_manage") ? btn("Cập nhật chi phí", `campaignSpendForm('${id}')`, "small") : "") +
      card("Lead thuộc chiến dịch", leads.map((l) => `<div class="metricline"><span>${esc(l.name)} · ${leadBadge(l.status)}</span>${entityLink("lead", l.id)}</div>`).join("") || '<p class="sub">Chưa có lead gắn với chiến dịch.</p>'),
  );
}

function campaignSpendForm(id) {
  const c = findCampaign(id);
  modal("Cập nhật chi phí · " + esc(c.name), `<form onsubmit="saveCampaignSpend(event,'${id}')"><label>Đã chi (VND)<input name="spend" type="number" min="0" value="${c.spend || 0}" required></label><label>Lượt truy cập<input name="traffic" type="number" min="0" value="${c.traffic || 0}"></label><div class="formfooter"><button class="btn primary">Lưu</button></div></form>`, true);
}

function saveCampaignSpend(e, id) {
  e.preventDefault();
  if (!requireCapability("marketing_manage")) return;
  const c = findCampaign(id);
  const f = new FormData(e.target);
  c.spend = +f.get("spend");
  c.traffic = +f.get("traffic") || 0;
  audit("campaign", id, "UPDATE", `Cập nhật chi phí chiến dịch ${c.name}`);
  closeModal();
  render();
}

function contentForm() {
  modal(
    "Thêm kế hoạch nội dung",
    `<form onsubmit="addContent(event)"><div class="formgrid"><label class="full">Tiêu đề${field("title", "text", "", true)}</label><label>Ngày đăng dự kiến<input name="date" type="date" value="${todayISO()}"></label><label>Kênh<select name="channel">${contentChannels.map((v) => `<option>${esc(v)}</option>`).join("")}</select></label><label>Phụ trách<select name="owner">${marketingOwners.map((v) => `<option>${esc(v)}</option>`).join("")}</select></label></div><div class="formfooter"><button class="btn primary" type="submit">Lưu nội dung</button></div></form>`,
    true,
  );
}

function addContent(e) {
  e.preventDefault();
  if (!requireCapability("marketing_manage")) return;
  const f = new FormData(e.target);
  state.contents.push({ id: nextBusinessId("contents"), title: f.get("title"), date: f.get("date") || "", channel: f.get("channel"), owner: f.get("owner"), status: "Draft" });
  audit("content", "", "CREATE", "Tạo nội dung: " + f.get("title"));
  closeModal();
  render();
}

function contentStatus(id, s) {
  if (!requireCapability("marketing_manage")) return;
  state.contents.find((c) => c.id === id).status = s;
  audit("content", id, "STATUS", `Nội dung ${id} chuyển sang ${s}`);
  render();
}
