/* MODULE mod-suppliers — giao diện và nghiệp vụ của phân hệ Travel. */

function score(s) {
  return Math.round(
    s.quality * 0.4 + s.price * 0.3 + s.response * 0.2 + s.complaint * 0.1,
  );
}

views.suppliers = () =>
  title(
    "Mạng lưới nhà cung cấp",
    "520 hồ sơ mẫu · Phân loại dịch vụ, hợp đồng và điểm đánh giá.",
    btn("+ Thêm nhà cung cấp", "supplierForm()", "primary"),
  ) +
  `<div class="stats">${stat("NHÀ CUNG CẤP", state.suppliers.length, "7 nhóm NCC và Insurance trong checklist")}${stat("HỢP ĐỒNG ĐÃ KÝ", state.suppliers.filter((s) => s.contract === "Đã ký").length, "Trạng thái mô phỏng")}${stat("ĐIỂM TRUNG BÌNH", Math.round(state.suppliers.reduce((n, s) => n + score(s), 0) / state.suppliers.length) + "/100", "Chất lượng 40% · Giá 30%")}${stat("CẦN CẢI THIỆN", state.suppliers.filter((s) => score(s) < 75).length, "Ngưỡng mẫu dưới 75/100")}</div>` +
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
  let total = Math.ceil(list.length / 12);
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
        .slice((supPage - 1) * 12, supPage * 12)
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
    '<div class="pagination"><span>' +
    list.length +
    " kết quả · Trang " +
    supPage +
    "/" +
    Math.max(1, total) +
    '</span><div class="actions">' +
    btn(
      "← Trước",
      "supPage=Math.max(1,supPage-1);refreshSuppliers()",
      "small",
    ) +
    btn("Tiếp →", "supPage++;refreshSuppliers()", "small") +
    "</div></div>"
  );
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
  let f = new FormData(e.target),
    id = "NCC-" + String(state.suppliers.length + 1).padStart(3, "0");
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
      )}<p class="notice">Trọng số theo tài liệu. Cách quy đổi điểm Complaint cần được khách hàng chốt; demo dùng điểm cao = ít khiếu nại.</p><div class="formfooter"><button class="btn primary">Tính điểm & lưu</button></div></form>`,
    true,
  );
}

function rateSupplier(e, id) {
  e.preventDefault();
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
