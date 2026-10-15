/* MODULE mod-documents — giao diện và nghiệp vụ của phân hệ Travel. */

function allDocs() {
  return state.docs;
}

views.documents = () =>
  title(
    "Kho tài liệu tour",
    "Liên kết tài liệu với booking và kiểm soát quyền xem.",
    badge("Google Drive chưa kết nối", "amber"),
  ) +
  card(
    "Tài liệu theo booking",
    `<div class="filters"><select aria-label="Lọc loại tài liệu" onchange="docFilter=this.value;render()">${["all", "Contract", "Voucher", "Rooming List"].map((x) => '<option value="' + x + '" ' + (docFilter === x ? "selected" : "") + ">" + (x === "all" ? "Tất cả loại tài liệu" : x) + "</option>").join("")}</select></div>` +
      table(
        ["TÀI LIỆU", "BOOKING", "LOẠI", "NGÀY", "THAO TÁC"],
        allDocs()
          .filter((d) => docFilter === "all" || d.type === docFilter)
          .map(
            (d) =>
              '<tr><td><span class="docicon">▧</span> ' +
              esc(d.name) +
              "</td><td>" +
              d.booking +
              "</td><td>" +
              badge(d.type) +
              "</td><td>" +
              fmt(d.date) +
              "</td><td>" +
              btn(
                d.generated ? "Xem / In" : "Thông tin mẫu",
                d.type === "Voucher"
                  ? "printVoucher('" + d.booking + "')"
                  : d.type === "Rooming List"
                    ? "passengerDetail('" + d.booking + "')"
                    : "placeholderDoc()",
                "small",
              ) +
              "</td></tr>",
          ),
      ),
  ) +
  `<div class="alert">Hợp đồng là bản ghi minh họa, chưa có file đính kèm thật. Voucher và danh sách khách được dựng từ dữ liệu tour. Hộ chiếu, hóa đơn và file tải lên cần lưu trữ cùng phân quyền khi triển khai.</div>`;

function placeholderDoc() {
  modal(
    "Hợp đồng mẫu",
    `<div class="alert">Đây là bản ghi minh họa để thể hiện cấu trúc kho tài liệu. Chưa có hợp đồng thật được tải lên.</div><p class="sub">Hệ thống triển khai sẽ lưu file trên Google Drive hoặc kho lưu trữ tương đương, liên kết booking, phiên bản, người tải lên và quyền truy cập.</p>`,
    true,
  );
}

views.documents = () =>
  title(
    "Document Center",
    "Contract · Invoice · Passport · Voucher · Rooming List · Google Drive API",
    btn("+ Tải tài liệu mẫu", "documentForm()", "primary"),
  ) +
  `<div class="alert">Google Drive API chưa kết nối. File được lưu cùng bản ghi database; chỉ dùng file kiểm thử, không tải hộ chiếu thật.</div>` +
  card(
    "Documents",
    table(
      ["DOCUMENT", "BOOKING", "TYPE", "NGÀY", "THAO TÁC"],
      allDocs().map(
        (d) =>
          "<tr><td>" +
          esc(d.name) +
          "</td><td>" +
          d.booking +
          "</td><td>" +
          badge(d.type) +
          "</td><td>" +
          fmt(d.date) +
          "</td><td>" +
          btn(
            d.data ? "Tải file" : d.generated ? "Xem / In" : "Thông tin mẫu",
            "openDocument('" + d.id + "')",
            "small",
          ) +
          "</td></tr>",
      ),
    ),
  );

function documentForm() {
  modal(
    "Tải tài liệu demo",
    `<form onsubmit="uploadDoc(event)"><label>Booking<select name="booking">${state.bookings.map((b) => "<option>" + b.id + "</option>").join("")}</select></label><label>Type<select name="type">${["Contract", "Invoice", "Passport", "Voucher", "Rooming List"].map((t) => "<option>" + t + "</option>").join("")}</select></label><label>File demo (tối đa 1 MB)<input name="file" type="file" required></label><p class="notice">File được đưa vào collection tài liệu và đồng bộ qua database.</p><div class="formfooter"><button class="btn primary">Lưu tài liệu</button></div></form>`,
    true,
  );
}

function uploadDoc(e) {
  e.preventDefault();
  let f = new FormData(e.target),
    file = f.get("file");
  if (!file || file.size > 1024 * 1024)
    return toast("File demo phải không quá 1 MB.");
  let reader = new FileReader();
  reader.onload = () => {
    let d = {
      id: "DOC-" + Date.now(),
      booking: f.get("booking"),
      type: f.get("type"),
      name: file.name,
      date: new Date().toISOString().slice(0, 10),
      data: reader.result,
    };
    state.docs.push(d);
    log("Lưu tài liệu demo " + file.name);
    closeModal();
    render();
  };
  reader.onerror = () => toast("Không đọc được file.");
  reader.readAsDataURL(file);
}

function openDocument(id) {
  let d = allDocs().find((d) => d.id === id);
  if (d.data) {
    let a = document.createElement("a");
    a.href = d.data;
    a.download = d.name;
    a.click();
    return;
  }
  if (d.type === "Voucher") return printVoucher(d.booking);
  if (d.type === "Rooming List") return passengerDetail(d.booking);
  if (d.type === "Invoice") {
    let i = state.invoices.find((i) => i.id === d.name);
    if (i)
      return printable(
        "Invoice " + i.id,
        "<p>Booking " +
          i.booking +
          " · " +
          i.type +
          "</p><p>Amount: " +
          money(i.amount) +
          "<br>Received: " +
          money(i.paid) +
          "<br>Due: " +
          fmt(i.due) +
          "</p>",
      );
  }
  placeholderDoc();
}
