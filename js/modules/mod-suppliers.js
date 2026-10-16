/* MODULE mod-suppliers — giao diện và nghiệp vụ của phân hệ Travel. */

function score(s) {
  return Math.round(
    s.quality * 0.4 + s.price * 0.3 + s.response * 0.2 + s.complaint * 0.1,
  );
}

views.suppliers = () =>
  title(
    "Mạng lưới nhà cung cấp",
    "Danh bạ nhà cung cấp theo dịch vụ, hợp đồng và điểm đánh giá.",
    btn("+ Thêm nhà cung cấp", "supplierForm()", "primary"),
  ) +
  `<div class="stats">${stat("NHÀ CUNG CẤP", state.suppliers.length, "Các nhóm dịch vụ đang hợp tác")}${stat("HỢP ĐỒNG ĐÃ KÝ", state.suppliers.filter((s) => s.contract === "Đã ký").length, "Theo hồ sơ hợp đồng")}${stat("ĐIỂM TRUNG BÌNH", Math.round(state.suppliers.reduce((n, s) => n + score(s), 0) / state.suppliers.length) + "/100", "Chất lượng 40% · Giá 30%")}${stat("CẦN CẢI THIỆN", state.suppliers.filter((s) => score(s) < 75).length, "Dưới ngưỡng 75/100")}</div>` +
  card(
    "Supplier master",
    `<div class="filters"><input aria-label="Tìm nhà cung cấp" placeholder="Tìm tên, mã, quốc gia…" value="${esc(supSearch)}" oninput="supSearch=this.value;supPage=1;refreshSuppliers()"><select aria-label="Loại nhà cung cấp" onchange="supType=this.value;supPage=1;refreshSuppliers()"><option value="">Tất cả dịch vụ</option>${serviceTypes.map((t) => '<option value="' + t + '" ' + (t === supType ? "selected" : "") + ">" + typesVI[t] + "</option>").join("")}</select><select aria-label="Sắp xếp nhà cung cấp" onchange="supSort=this.value;refreshSuppliers()"><option value="score">Điểm cao → thấp</option><option value="low">Điểm thấp → cao</option><option value="name">Tên A → Z</option></select></div><div id="supplierlist">${supplierRows()}</div>`,
  ) +
  `<div class="notice">Công thức: chất lượng × 40% + giá × 30% + phản hồi × 20% + mức độ ít khiếu nại × 10%. Mỗi thành phần quy về 0–100; điểm “ít khiếu nại” càng cao càng tốt. Đây là cách diễn giải cần khách hàng xác nhận.</div>`;

function supplierRows() {
  let list = state.suppliers.filter(
    (s) =>
      (!supType || s.type === supType) &&
      [s.name, s.id, s.country]
        .join(" ")
        .toLowerCase()
        .includes(supSearch.toLowerCase()),
  );
  list.sort((a, b) =>
    supSort === "low"
      ? score(a) - score(b)
      : supSort === "name"
        ? a.name.localeCompare(b.name)
        : score(b) - score(a),
  );
  let total = Math.ceil(list.length / tablePageSize);
  supPage = Math.min(supPage, Math.max(1, total));
  return (
    table(
      [
        "MÃ / NHÀ CUNG CẤP",
        "LOẠI / QUỐC GIA",
        "ĐIỂM",
        "HỢP ĐỒNG",
        "ĐIỀU KHOẢN",
      ],
      list
        .slice((supPage - 1) * tablePageSize, supPage * tablePageSize)
        .map(
          (s) =>
            '<tr><td><button class="link" onclick="supplierDetail(\'' +
            s.id +
            "')\">" +
            esc(s.name) +
            '</button><span class="sub">' +
            s.id +
            "</span></td><td>" +
            typesVI[s.type] +
            '<span class="sub">' +
            s.country +
            "</span></td><td>" +
            badge(score(s) + "/100", score(s) < 75 ? "red" : "green") +
            "</td><td>" +
            badge(s.contract, s.contract === "Đã ký" ? "green" : "amber") +
            "</td><td>" +
            esc(s.terms) +
            "</td></tr>",
        ),
    ) +
    `<div class="pagination"><span class="pagination-summary">Hiển thị <strong>${list.length ? (supPage - 1) * tablePageSize + 1 : 0}–${Math.min(supPage * tablePageSize, list.length)}</strong> trên tổng <strong>${list.length}</strong> nhà cung cấp</span><nav class="pagination-controls" aria-label="Phân trang"><button class="pagination-arrow" type="button" aria-label="Trang trước" onclick="supPage=Math.max(1,supPage-1);refreshSuppliers()" ${supPage === 1 ? "disabled" : ""}>${systemIcon("chevron-left")}</button><span class="pagination-pages">${paginationWindow(supPage, Math.max(1, total)).map((item) => item === "…" ? '<span class="pagination-ellipsis" aria-hidden="true">…</span>' : `<button class="pagination-page${item === supPage ? " is-active" : ""}" type="button" aria-label="Đến trang ${item}" ${item === supPage ? 'aria-current="page"' : ""} onclick="supPage=${item};refreshSuppliers()">${item}</button>`).join("")}</span><button class="pagination-arrow" type="button" aria-label="Trang sau" onclick="supPage=Math.min(${Math.max(1, total)},supPage+1);refreshSuppliers()" ${supPage >= Math.max(1, total) ? "disabled" : ""}>${systemIcon("chevron-right")}</button></nav></div>`
  );
}

/* ---------- Bảng giá theo mùa & công nợ NCC ---------- */
const priceUnits = ["/khách", "/đêm", "/ngày", "/đoàn"];
const priceSeasons = ["Quanh năm", "Cao điểm", "Thấp điểm"];

/* Giá còn hiệu lực tại ngày khởi hành: ưu tiên giá có khoảng ngày chứa ngày đó, sau đó giá quanh năm. */
function priceActive(item, date) {
  if (!item.from && !item.to) return item.season === "Quanh năm" || !item.season;
  return (!item.from || date >= item.from) && (!item.to || date <= item.to);
}
function priceQuantity(item, ctx) {
  const pax = Math.max(1, ctx.pax || 1), days = Math.max(1, ctx.days || 1);
  return item.unit === "/khách" ? pax : item.unit === "/đêm" ? Math.max(1, days - 1) : item.unit === "/ngày" ? days : 1;
}
function supplierLibrary(type, date) {
  const out = [];
  state.suppliers.filter((x) => x.type === type).forEach((sup) =>
    (sup.prices || []).filter((p) => priceActive(p, date || todayISO())).forEach((p, idx) => out.push({ sup, item: p, key: `${sup.id}|${(sup.prices || []).indexOf(p)}` })));
  return out;
}
function supplierPricesCard(sp) {
  const can_ = can("suppliers_manage");
  const rows = (sp.prices || []).map((p, i) => `<tr><td><b>${esc(p.name)}</b></td><td>${money(p.price)} <span class="sub">${esc(p.unit)}</span></td><td>${badge(p.season || "Quanh năm", p.season === "Cao điểm" ? "red" : p.season === "Thấp điểm" ? "blue" : "")}${p.from || p.to ? `<span class="sub">${p.from ? fmt(p.from) : "…"} – ${p.to ? fmt(p.to) : "…"}</span>` : ""}</td><td>${can_ ? btn("Xóa", `deleteSupplierPrice('${sp.id}',${i})`, "small") : ""}</td></tr>`);
  const form = can_ ? `<form class="formgrid" onsubmit="addSupplierPrice(event,'${sp.id}')" style="margin-top:12px"><label>Hạng mục<input name="name" required placeholder="Phòng đôi, xe 16 chỗ…"></label><label>Đơn giá (VND)<input name="price" type="number" min="0" required></label><label>Tính theo<select name="unit">${priceUnits.map((u) => `<option>${u}</option>`).join("")}</select></label><label>Mùa<select name="season">${priceSeasons.map((u) => `<option>${u}</option>`).join("")}</select></label><label>Từ ngày<input name="from" type="date"></label><label>Đến ngày<input name="to" type="date"></label><div class="formfooter full"><button class="btn primary small">+ Thêm giá</button></div></form>` : "";
  return card("Bảng giá theo mùa", (rows.length ? table(["HẠNG MỤC", "ĐƠN GIÁ", "MÙA / HIỆU LỰC", ""], rows) : '<p class="sub">Chưa có bảng giá. Thêm giá để Thiết kế tour tự điền chi phí.</p>') + form);
}
function addSupplierPrice(e, id) {
  e.preventDefault();
  if (!requireCapability("suppliers_manage")) return;
  const sp = findSupplier(id), f = new FormData(e.target);
  const price = { name: f.get("name").trim(), price: Math.max(0, +f.get("price") || 0), unit: f.get("unit"), season: f.get("season"), from: f.get("from") || "", to: f.get("to") || "" };
  if (price.from && price.to && price.from > price.to) return toast("Ngày bắt đầu phải trước ngày kết thúc.");
  (sp.prices ||= []).push(price);
  audit("supplier", id, "PRICE", `Thêm giá ${price.name} cho ${id}`);
  save(); supplierDetail(id);
}
function deleteSupplierPrice(id, i) {
  if (!requireCapability("suppliers_manage")) return;
  findSupplier(id).prices.splice(i, 1);
  save(); supplierDetail(id);
}
function supplierDebtCard(sp) {
  const list = (state.payables || []).filter((p) => p.supplier === sp.id);
  const open = list.filter((p) => p.status !== "Paid").reduce((n, p) => n + Number(p.amount || 0), 0);
  const paid = list.filter((p) => p.status === "Paid").reduce((n, p) => n + Number(p.amount || 0), 0);
  return card("Công nợ nhà cung cấp", line("Còn phải trả", `<b>${money(open)}</b>`) + line("Đã thanh toán", money(paid)) + (list.length ? table(["MÃ", "BOOKING", "SỐ TIỀN", "HẠN", "TRẠNG THÁI"], list.map((p) => `<tr><td>${p.id}</td><td>${entityLink("booking", p.booking)}</td><td>${money(p.amount)}</td><td>${fmt(p.due)}</td><td>${badge(p.status === "Paid" ? "Đã chi" : p.status === "Approved" ? "Đã duyệt" : "Chờ duyệt", p.status === "Paid" ? "green" : "amber")}</td></tr>`)) : '<p class="sub">Chưa phát sinh công nợ.</p>'));
}

function refreshSuppliers() {
  document.getElementById("supplierlist").innerHTML = supplierRows();
}

function renderSupplierProfile(id) {
  let s = state.suppliers.find((s) => s.id === id),
    bs = state.bookings.filter((b) =>
      b.services.some((x) => x.needed && x.supplier === id),
    );
  modal(
    esc(s.name),
    card(
      "Thông tin hợp tác",
      line("Mã NCC", s.id) +
        line("Loại dịch vụ", typesVI[s.type]) +
        line("Quốc gia", s.country) +
        line("Hợp đồng", s.contract) +
        line("Điều khoản", esc(s.terms)),
    ) +
      card(
        "Cấu phần đánh giá",
        line("Chất lượng · 40%", s.quality + "/100") +
          line("Giá · 30%", s.price + "/100") +
          line("Phản hồi · 20%", s.response + "/100") +
          line("Ít khiếu nại · 10%", s.complaint + "/100") +
          line("Điểm tổng", badge(score(s) + "/100", "green")),
      ) +
      supplierPricesCard(s) +
      supplierDebtCard(s) +
      card(
        "Booking sử dụng dịch vụ",
        bs
          .map(
            (b) =>
              '<div class="metricline">' +
              b.id +
              " · " +
              esc(b.client) +
              bookStatus(b) +
              "</div>",
          )
          .join("") || '<p class="sub">Chưa có booking trong tập mẫu.</p>',
      ),
  );
}

function supplierForm() {
  modal(
    "Thêm nhà cung cấp",
    `<form onsubmit="addSupplier(event)"><label>Tên nhà cung cấp<input name="name" required maxlength="100"></label><div class="formgrid"><label>Loại dịch vụ<select name="type">${serviceTypes.map((t) => '<option value="' + t + '">' + typesVI[t] + "</option>").join("")}</select></label><label>Quốc gia<select name="country"><option>Vietnam</option><option>Cambodia</option><option>Thailand</option></select></label></div><label>Điều khoản thanh toán<input name="terms" value="Thanh toán sau 15 ngày" required></label><p class="notice">Bộ điểm khởi tạo minh họa 50/100. Có thể cập nhật các thành phần trong hồ sơ NCC.</p><div class="formfooter"><button class="btn primary" type="submit">Tạo nhà cung cấp</button></div></form>`,
    true,
  );
}

function addSupplier(e) {
  e.preventDefault();
  if (!requireCapability("suppliers_manage")) return;
  let f = new FormData(e.target),
    id = nextBusinessId("suppliers");
  state.suppliers.push({
    id,
    name: f.get("name").trim(),
    type: f.get("type"),
    country: f.get("country"),
    terms: f.get("terms"),
    quality: 50,
    price: 50,
    response: 50,
    complaint: 50,
    contract: "Chờ ký",
  });
  log("Thêm " + id);
  closeModal();
  render();
  toast("Đã tạo " + id + ".");
}

function supplierDetail(id) {
  renderSupplierProfile(id);
  document
    .querySelector(".modal")
    .insertAdjacentHTML(
      "beforeend",
      btn("Cập nhật đánh giá NCC", "ratingForm('" + id + "')", "primary"),
    );
}

function ratingForm(id) {
  let s = state.suppliers.find((s) => s.id === id);
  modal(
    "Supplier Score · " + id,
    `<form onsubmit="rateSupplier(event,'${id}')">${[
      ["quality", "Quality · 40%"],
      ["price", "Price · 30%"],
      ["response", "Response · 20%"],
      ["complaint", "Complaint · 10% (điểm ít khiếu nại)"],
    ]
      .map(
        ([k, t]) =>
          "<label>" +
          t +
          '<input name="' +
          k +
          '" type="number" min="0" max="100" value="' +
          s[k] +
          '" required></label>',
      )
      .join(
        "",
      )}<p class="notice">Điểm khiếu nại: điểm càng cao nghĩa là càng ít khiếu nại.</p><div class="formfooter"><button class="btn primary">Tính điểm & lưu</button></div></form>`,
    true,
  );
}

function rateSupplier(e, id) {
  e.preventDefault();
  if (!requireCapability("suppliers_manage")) return;
  let s = state.suppliers.find((s) => s.id === id),
    f = new FormData(e.target);
  for (const k of ["quality", "price", "response", "complaint"]) {
    let v = +f.get(k);
    if (v < 0 || v > 100 || !Number.isFinite(v))
      return toast("Điểm phải trong 0–100.");
  }
  for (const k of ["quality", "price", "response", "complaint"])
    s[k] = +f.get(k);
  log(id + " rating " + score(s) + "/100");
  closeModal();
  render();
}
