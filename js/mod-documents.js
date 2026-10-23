/* MODULE mod-documents — kho tài liệu tour và lưu trữ chứng từ. */

function allDocs() {
  return state.docs.filter(
    (document) =>
      can("document_sensitive") || !["Passport", "Invoice"].includes(document.type),
  );
}

let docSearch = "";
let docBooking = "all";

/* Hạn dùng: hộ chiếu cần còn hạn ≥ 6 tháng sau ngày kết thúc tour; giấy tờ khác cần chưa hết hạn. */
function docExpiryState(d) {
  if (!d.expiry) return null;
  const b = state.bookings.find((x) => x.id === d.booking);
  const need = d.type === "Passport" && b?.end ? addDaysSafe(b.end, 180) : todayISO();
  const left = Math.ceil((new Date(d.expiry) - new Date(todayISO())) / 864e5);
  if (d.expiry < todayISO()) return { tone: "red", text: "Đã hết hạn " + fmt(d.expiry) };
  if (d.expiry < need) return { tone: "red", text: "Không đủ hạn " + (d.type === "Passport" ? "(cần còn 6 tháng sau tour)" : "") + " · " + fmt(d.expiry) };
  return left <= 60 ? { tone: "amber", text: "Còn " + left + " ngày · " + fmt(d.expiry) } : { tone: "green", text: fmt(d.expiry) };
}

views.documents = () => {
  const docs = allDocs();
  const contracts = docs.filter((d) => d.type === "Contract").length;
  const vouchers = docs.filter((d) => d.type === "Voucher").length;
  const roomingLists = docs.filter((d) => d.type === "Rooming List").length;
  const invoices = docs.filter((d) => d.type === "Invoice").length;

  const filtered = docs.filter((d) => {
    const matchType = docFilter === "all" || d.type === docFilter;
    const matchSearch =
      !docSearch ||
      [d.name, d.booking, d.type].join(" ").toLowerCase().includes(docSearch.toLowerCase());
    return matchType && matchSearch && (docBooking === "all" || d.booking === docBooking);
  });

  return (
    title(
      "Trung tâm lưu trữ & quản lý tài liệu (Document Center)",
      "Quản lý hồ sơ hợp đồng, phiếu dịch vụ voucher, danh sách khách rooming list và chứng từ liên kết booking.",
      btn("+ Tải tài liệu", "documentForm()", "primary"),
    ) +
    `<div class="stats">
      ${stat("TỔNG SỐ TÀI LIỆU", docs.length, "Hồ sơ số hóa liên kết booking")}
      ${stat("HỢP ĐỒNG TOUR", contracts, "Hợp đồng đối tác và khách hàng")}
      ${stat("PHIẾU DỊCH VỤ VOUCHER", vouchers, "Voucher gửi nhà cung cấp & HDV")}
      ${stat("ROOMING LIST & HÓA ĐƠN", roomingLists + invoices, roomingLists + " rooming list · " + invoices + " hóa đơn")}
    </div>` +
    card(
      "Danh mục tài liệu theo Booking",
      `<div class="filters">
        <input
          placeholder="Tìm theo tên tệp tài liệu, mã booking..."
          value="${esc(docSearch)}"
          aria-label="Tìm tài liệu"
          oninput="docSearch=this.value;render()"
        />
        <select aria-label="Lọc loại tài liệu" onchange="docFilter=this.value;render()">
          ${[
            ["all", "Tất cả loại tài liệu (" + docs.length + ")"],
            ["Contract", "Hợp đồng tour (Contract)"],
            ["Voucher", "Phiếu dịch vụ (Voucher)"],
            ["Rooming List", "Danh sách phân phòng (Rooming List)"],
            ["Invoice", "Hóa đơn thanh toán (Invoice)"],
            ["Passport", "Hộ chiếu & visa (Passport)"],
          ]
            .map(
              ([x, l]) =>
                '<option value="' +
                x +
                '" ' +
                (docFilter === x ? "selected" : "") +
                ">" +
                l +
                "</option>",
            )
            .join("")}
        </select>
        <select aria-label="Lọc theo booking" onchange="docBooking=this.value;render()"><option value="all">Tất cả booking</option>${[...new Set(docs.map((d) => d.booking))].sort().map((b) => `<option ${docBooking === b ? "selected" : ""}>${b}</option>`).join("")}</select>
        <span class="sub" style="margin-left: auto; font-weight: 600;">
          Hiển thị ${filtered.length} / ${docs.length} tệp
        </span>
      </div>` +
      (filtered.length
        ? table(
            ["TÀI LIỆU / TỆP ĐÍNH KÈM", "BOOKING LIÊN KẾT", "PHÂN LOẠI", "NGÀY TẠO", "HẠN DÙNG", "THAO TÁC"],
            filtered.map((d) => {
              const icon = systemIcon(d.type === "Contract" ? "file-signature" : d.type === "Voucher" ? "ticket" : d.type === "Rooming List" ? "clipboard-list" : d.type === "Invoice" ? "file-invoice-dollar" : "folder-open");
              return (
                "<tr><td><strong><span style='margin-right: 6px;'>" +
                icon +
                "</span>" +
                esc(d.name) +
                "</strong></td><td><b>" +
                d.booking +
                "</b></td><td>" +
                badge(
                  d.type === "Contract"
                    ? "Hợp đồng"
                    : d.type === "Voucher"
                      ? "Voucher"
                      : d.type === "Rooming List"
                        ? "Rooming List"
                        : d.type === "Invoice"
                          ? "Hóa đơn"
                          : d.type,
                  d.type === "Voucher" ? "green" : d.type === "Contract" ? "blue" : "amber",
                ) +
                "</td><td>" +
                fmt(d.date) +
                "</td><td>" +
                (docExpiryState(d) ? badge(docExpiryState(d).text, docExpiryState(d).tone) : '<span class="sub">—</span>') +
                "</td><td>" +
                btn(
                  d.path || d.data ? "Tải tệp" : d.generated ? "Xem / In PDF" : "Thông tin mẫu",
                  "openDocument('" + d.id + "')",
                  "small",
                ) +
                "</td></tr>"
              );
            }),
          )
        : '<div class="empty">Không tìm thấy tài liệu phù hợp với điều kiện tìm kiếm.</div>'),
    ) +
    `<div class="alert green">
      <b>Tích hợp Google Drive API:</b> Phiếu dịch vụ Voucher và Rooming List được kết xuất tự động từ dữ liệu tour. Khi kết nối Google Workspace API trên môi trường production, toàn bộ chứng từ scan, hóa đơn và hợp đồng sẽ được lưu trữ đám mây và phân quyền xem theo tenant.
    </div>`
  );
};

function placeholderDoc() {
  modal(
    "Tài liệu",
    `<div class="alert">Tài liệu này chưa có file đính kèm. Hãy tải file lên từ nút "Tải tài liệu".</div>`,
    true,
  );
}

function documentForm() {
  modal(
    "Tải tài liệu",
    `<form onsubmit="uploadDoc(event)"><label>Booking<select name="booking">${state.bookings.map((b) => "<option>" + b.id + "</option>").join("")}</select></label><label>Type<select name="type">${["Contract", "Invoice", "Passport", "Voucher", "Rooming List"].map((t) => "<option>" + t + "</option>").join("")}</select></label><label>Hạn hiệu lực (hộ chiếu, visa, bảo hiểm…)<input name="expiry" type="date"></label><label>File (tối đa 10 MB)<input name="file" type="file" required></label><p class="notice">File được lưu trong thư mục uploads của máy chủ; database chỉ lưu đường dẫn.</p><div class="formfooter"><button class="btn primary">Lưu tài liệu</button></div></form>`,
    true,
  );
}

async function uploadDoc(e) {
  e.preventDefault();
  if (!requireCapability("documents_manage")) return;
  const form = e.target;
  const f = new FormData(form);
  const file = f.get("file");
  if (!file || !file.size) return toast("Hãy chọn tệp cần tải lên.");
  const submit = form.querySelector("button.primary");
  if (submit) submit.disabled = true;
  try {
    const uploaded = await uploadFile(file, "docs");
    const doc = {
      id: nextBusinessId("docs"),
      booking: f.get("booking"),
      type: f.get("type"),
      name: file.name,
      date: new Date().toLocaleDateString("en-CA"),
      path: uploaded.path,
      size: uploaded.size,
      mime: uploaded.mime,
      expiry: f.get("expiry") || "",
    };
    state.docs.push(doc);
    log("Tải " + file.name + " cho " + doc.booking);
    closeModal();
    render();
    toast("Đã lưu tài liệu.");
  } catch (error) {
    if (submit) submit.disabled = false;
    toast(error.message);
  }
}

function openDocument(id) {
  let d = allDocs().find((d) => d.id === id);
  if (!d) return toast("Bạn không có quyền truy cập tài liệu này.");
  if (d.path) {
    window.open(d.path, "_blank", "noopener");
    return;
  }
  /* Tài liệu cũ lưu base64 trong database (chưa chuyển sang uploads/) — vẫn tải được. */
  if (d.data) {
    let a = document.createElement("a");
    a.href = d.data;
    a.download = d.name;
    a.click();
    return;
  }
  if (d.type === "Voucher") return printVoucher(d.booking);
  if (d.type === "Contract" && d.generated) return printContract(d.booking);
  if (d.type === "Receipt") return openBooking(d.booking, "finance");
  if (d.type === "Rooming List") return passengerDetail(d.booking);
  if (d.type === "Invoice" && state.invoices.some((i) => i.id === d.name)) return openInvoice(d.name);
  if (d.type === "Invoice") {
    let inv = state.invoices.find((i) => i.id === d.name);
    return modal(
      "Invoice " + d.name,
      card(
        "Chi tiết",
        line("Booking", d.booking) +
          line("Type", inv?.type) +
          line("Amount", inv ? fxLedgerMoney(findBooking(inv.booking), inv.amount) : "—") +
          line("Due", fmt(inv?.due)) +
          line("Status", inv?.paid >= inv?.amount ? "Paid" : "Pending"),
      ),
      true,
    );
  }
  placeholderDoc();
}
