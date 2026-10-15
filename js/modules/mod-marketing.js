/* MODULE mod-marketing — giao diện và nghiệp vụ của phân hệ Travel. */

const renderCampaignOverview = () => {
  let total = state.campaigns.reduce((n, c) => n + c.leads, 0),
    spend = state.campaigns.reduce((n, c) => n + c.spend, 0);
  return (
    title(
      "Marketing & KPI",
      "Theo dõi chiến dịch, nguồn khách và chi phí tạo lead.",
      btn("+ Tiếp nhận lead", "leadForm()", "primary"),
    ) +
    `<div class="stats">${stat("LEAD CHIẾN DỊCH", total, "Số liệu lịch sử mô phỏng")}${stat("NGÂN SÁCH ĐÃ CHI", short(spend), "3 chiến dịch mẫu")}${stat("CPL BÌNH QUÂN", money(Math.round(spend / total)), "Chi phí / lead chiến dịch")}${stat("LEAD TRONG CRM", state.leads.length, "Tập mẫu để thao tác trực tiếp")}</div>` +
    card(
      "Hiệu quả chiến dịch",
      table(
        ["CHIẾN DỊCH", "KÊNH", "TRAFFIC", "LEADS", "CHI PHÍ", "CPL"],
        state.campaigns.map(
          (c) =>
            "<tr><td><strong>" +
            c.name +
            "</strong></td><td>" +
            c.channel +
            "</td><td>" +
            c.traffic +
            "</td><td>" +
            c.leads +
            "</td><td>" +
            money(c.spend) +
            "</td><td>" +
            money(Math.round(c.spend / c.leads)) +
            "</td></tr>",
        ),
      ),
    ) +
    `<div class="grid">${card("Luồng tự động hóa đề xuất", '<div class="timeline"><b>01 · Lead từ Website / Form</b><p>Thu thập nhu cầu, nguồn, consent và thời gian nhận.</p></div><div class="timeline"><b>02 · Tạo khách và kiểm tra trùng</b><p>Gộp theo email / số điện thoại, giữ lịch sử nguồn.</p></div><div class="timeline"><b>03 · Giao Sales và tạo follow-up</b><p>Chia theo thị trường, tải công việc và ca trực.</p></div><div class="timeline"><b>04 · Email chào mừng</b><p>Gửi bằng Gmail Workspace sau khi tích hợp và phê duyệt mẫu.</p></div>')}${card("Nội dung và phân tích", '<p class="sub">Kế hoạch nội dung và số liệu quảng cáo chưa có tích hợp thật. Dữ liệu chiến dịch lịch sử được tách khỏi tập lead CRM rút gọn để tránh hiểu nhầm về tỷ lệ chuyển đổi.</p><div class="alert green"><b>Có thể thử ngay</b>Thêm lead mới → chọn nguồn → giao Sales → xem tại CRM.</div>')}</div>`
  );
};

views.marketing = () =>
  renderCampaignOverview() +
  card(
    "Content · 3 Marketing",
    btn("+ Nội dung", "contentForm()") +
      table(
        ["CONTENT", "CHANNEL", "OWNER", "STATUS", "THAO TÁC"],
        state.contents.map(
          (c) =>
            "<tr><td>" +
            esc(c.title) +
            "</td><td>" +
            esc(c.channel) +
            "</td><td>" +
            esc(c.owner) +
            "</td><td>" +
            badge(c.status) +
            '</td><td><select aria-label="Trạng thái nội dung" onchange="contentStatus(\'' +
            c.id +
            "',this.value)\">" +
            ["Draft", "Scheduled", "Published"]
              .map(
                (s) =>
                  "<option " +
                  (s === c.status ? "selected" : "") +
                  ">" +
                  s +
                  "</option>",
              )
              .join("") +
            "</select></td></tr>",
        ),
      ),
  ) +
  card(
    "Lead Website → Auto Create → Assign Sales → Email Welcome → Follow-up",
    `<div class="alert">Demo thao tác bằng form. Email Welcome được mô phỏng trong nhật ký; chưa gửi email thật hoặc kết nối website ngoài.</div>${btn("Thử Lead Website", "websiteLeadForm()", "primary")}`,
  );

function contentForm() {
  modal(
    "Content",
    `<form onsubmit="addContent(event)"><label>Title${field("title", "text", "", true)}</label><label>Channel<select name="channel">${contentChannels.map((value) => `<option>${esc(value)}</option>`).join("")}</select></label><label>Owner<select name="owner">${marketingOwners.map((value) => `<option>${esc(value)}</option>`).join("")}</select></label><div class="formfooter"><button class="btn primary">Lưu nháp</button></div></form>`,
    true,
  );
}

function addContent(e) {
  e.preventDefault();
  let f = new FormData(e.target);
  state.contents.push({
    id: "CT-" + Date.now(),
    title: f.get("title"),
    channel: f.get("channel"),
    owner: f.get("owner"),
    status: "Draft",
  });
  log("Content: " + f.get("title"));
  closeModal();
  render();
}

function contentStatus(id, s) {
  state.contents.find((c) => c.id === id).status = s;
  log(id + " → " + s);
  render();
}
