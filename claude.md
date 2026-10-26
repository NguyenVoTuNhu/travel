# claude.md — TypicOne ERP (Typic Travel)

> **Đọc file này TRƯỚC KHI làm bất cứ việc gì.** File này là bản chuyển ngữ và tổng hợp của file yêu cầu `.docx` của khách (`Ai_Automation (2) (1).docx`, được cung cấp lại ngày 22/10/2026). Mọi yêu cầu nghiệp vụ, kiến trúc hiện tại, quy định làm việc và danh sách việc cần làm đều nằm ở đây. **Nếu claude.md mâu thuẫn với docx thì docx là nguồn gốc**: sửa claude.md cho đúng docx rồi ghi vào mục 4.2 (quy trình ở mục 5.11).
> Sau mỗi lần làm việc: **tick checkbox, ghi chú ngắn ngay dưới đầu task đó ở mục 6 (luật 5.5; không còn mục Nhật ký), trả lại file claude.md đã cập nhật** cùng bản zip.

- Lập ngày: 21/10/2026 — dựa trên yêu cầu khách (docx) + đọc code demo `travel.zip` (nhánh `main`, commit `a0e448a`).
- **Rà soát lại 22/10/2026** — nhánh `main`, commit `71f2b33` ("update 9h30 22/10/2026"): đã đối chiếu docx ↔ claude.md ↔ code. Kết quả ở mục 3.5.1–3.5.3 (tài khoản, vai trò, menu), mục 4.1 (demo đúng/sai/thiếu), mục 4.2 (điểm claude.md từng lệch yêu cầu).
- Hiện trạng ở mục 4 dựa trên việc đọc code, **chưa chạy thử trên trình duyệt và chưa xem dữ liệu thật trong database KIO**. Khi bắt tay làm từng mục, hãy kiểm tra lại đoạn code liên quan trước khi tin vào ghi chú.

---

## 0. TÓM TẮT 30 GIÂY

- **Là gì:** hệ thống quản lý & điều hành tour (Tour Operator Management System) cho **Typic Travel**, tên sản phẩm trong code là **TypicOne ERP**. Giao diện **tiếng Việt**.
- **Quy mô khách:** **5 Sales** (khách đổi từ 2 → 5 ngày 22/10/2026, docx chưa sửa), 2 Điều hành, 1 Kế toán, 3 Marketing, 1 Giám đốc, 10 HDV, 500+ nhà cung cấp (NCC), hàng chục tour/tháng.
- **Công nghệ (CHỐT, không đổi):** web tĩnh thuần **HTML + CSS + JavaScript không build** (không React/Next/Laravel/Node), dữ liệu lưu qua **KIO (KRUD)** tại `https://kio.dvqt.vn`. Chi tiết mục 3.
- **Stack khách đề xuất trong docx (NextJS, Laravel, PostgreSQL, Make.com…) KHÔNG dùng** (quyết định 21/10). **Nhưng docx cũng chứa các *năng lực* khách có thể mong đợi — Google Login, lưu tệp trên Google Drive, gửi email Gmail, AI (OpenAI), app mobile cho HDV — các năng lực này KHÔNG bị bỏ**, chỉ là chưa chọn cách thực hiện (T0-03, mục 8.1).
- **Cây mã nguồn hiện hành là PHẲNG:** `js/*.js` và `css/mod-*.css` (đúng như `index.html` nạp). Các thư mục `js/core/`, `js/modules/`, `js/api/`, `js/data/`, `css/modules/` là **bản cũ trùng lặp, KHÔNG được nạp — đừng sửa ở đó** (T0-10).
- **Tài khoản / vai trò / menu:** 22 tài khoản mẫu, 6 vai trò, CEO có 17 menu — xem bảng ở mục 3.5.1–3.5.3 (không cần đọc lại code để biết).
- **Luật viết code (mục 5.12):** mỗi dòng một câu lệnh, định dạng giống các file mẫu trong demo, không nén nhiều lệnh trên một dòng.
- **Việc tiếp theo:** mục 6 (checkbox). Thứ tự ưu tiên đề xuất ở mục 7.
- **Có những việc đang CHỜ khách / chờ quyết định** (mục 8) — đừng tự bịa, hãy hỏi lại.

---

## 1. YÊU CẦU NGHIỆP VỤ CỦA KHÁCH (nguồn gốc — đã chuyển từ docx)

> Đây là nội dung yêu cầu khách, đã bỏ phần đề xuất công nghệ và sửa lỗi chính tả. Những câu khách ghi chú trực tiếp được giữ lại ý.

### 1.1 Luồng tổng thể

`Lead → Khách hàng → Báo giá/Thiết kế tour → Booking → Hóa đơn/Thanh toán → Đặt dịch vụ NCC → Phân công HDV/Xe → Chạy tour → Quyết toán → Chăm sóc khách hàng sau tour`

Các phân hệ: CEO Dashboard · Marketing · Sales CRM · Tour Operations (Điều hành) · Accounting · Guide Management · Supplier Management · Reporting & KPI · Document Center · Customer Service.

### 1.2 Phân quyền

| Vai trò | Chỉ được thấy | Ghi chú của khách |
|---|---|---|
| **CEO** | Toàn quyền | Làm giao diện khác cho dễ nhìn, **có biểu đồ là tốt nhất**. Làm theo **form khách gửi mẫu trên Zalo**, theo từng phân quyền, từ tổng quan đến từng vai trò. |
| **Marketing** | Leads, Campaign, Content, KPI | Xem mục 1.3 |
| **Sales** | Leads, Khách hàng, Quotes, Booking | **Không thấy Kế toán.** Xem mục 1.4 |
| **Điều hành** | Booking đã xác nhận, Supplier, Guide, Xe | Chia 3 phân hệ — mục 1.5 |
| **Kế toán** | Invoice, Payments, VAT, Debt | Mục 1.6 |
| **HDV / Xe** | Tour được giao, Khách, Lịch trình (+ Voucher, Liên hệ khẩn cấp) | Dạng **app mobile**; nhận lịch tour và theo dõi kế hoạch được giao |

> **Cập nhật quy mô 22/10/2026 (khách báo, chưa có trong docx):** Sales **5 người** (docx ghi 2). Các chỗ docx nói "Sales 1, Sales 2" (dashboard, pipeline) hiểu là *từng Sales trong danh mục*, không cố định 2.

### 1.3 Marketing

- Chỉ thấy: Leads, Campaign, Content, KPI.
- **Bổ sung các nguồn Lead** (nhiều người nhập về), gồm:
  1. Form website
  2. WhatsApp
  3. Fanpage
  4. Instagram
  5. CTV (cộng tác viên: **HDV**, **khách hàng cũ**)
  6. Sách báo – quảng cáo bên thứ 3 (ví dụ **Petit Futé, Routard**)
  7. Đối tác B2B
  8. Kênh hội chợ
  9. Khác
- **Kết hợp AI** để: chạy quảng cáo, đăng bài Fanpage, viết Email tự động.
- KPI cần có: Traffic, Leads, CPL (chi phí / lead).

### 1.4 Sales — quy trình làm chương trình tour

1. Nhận lead → phân tích nhu cầu → tạo chương trình (CT) tour.
2. Tạo CT tour mới, **hoặc dùng tour mẫu đã upload**.
3. **Điều chỉnh linh hoạt các ngày bằng nút kéo–thả** (đảo thứ tự ngày).
4. **Tạo bộ data tour sẵn** để thiết lập tour theo yêu cầu: chỉ cần **nhặt (gắp) các ngày tour hoặc các tour mẫu** ghép thành 1 tour có độ dài mong muốn.
5. **AI dịch tour đã thiết kế** sang đa ngôn ngữ (ví dụ tour gốc tiếng Pháp → dịch sang ngôn ngữ khách chọn). Có **cài đặt ngôn ngữ**.
6. Sau khi thiết kế → **tính giá theo từng ngày hoặc theo tổng tour**, với **các ngưỡng giá theo số khách (pax) tùy ý, không giới hạn ở 30 khách**.
7. **Tiền chung hiển thị là USD**: các ngoại tệ khác quy đổi sang USD theo **tỷ giá cố định của Vietcombank (VCB), giá bán**. Có thể linh hoạt chuyển hiển thị sang **EUR, VND, CAD…**
8. **Chế độ Tour ghép (SIC / "Sictour")**: ngày khởi hành cố định, ghép tour với các đơn vị khác.
9. **AI nhập danh sách khách từ ảnh hộ chiếu**, các trường chính: **họ tên đầy đủ, ngày tháng năm sinh, số hộ chiếu (CCCD), ngày cấp hộ chiếu, ngày hết hạn, quốc tịch**.
10. Thiết kế tour **theo form mẫu — khách sẽ gửi sau** (CHƯA CÓ).
11. Các tùy biến khác: **tạo hợp đồng cho khách ngay sau khi thanh toán cọc tour**.

Pipeline lead: `NEW → CONTACTED → QUALIFIED → QUOTE SENT → NEGOTIATION → WON → (LOST)`; sau WON: `DEPOSIT → FINAL PAYMENT`.
Sales xem: Lead, Quote, Revenue, Profit, Follow-up.
Tự động hóa lead website: `Lead từ website → tự tạo lead → phân công sales → email chào mừng → task follow-up`.

### 1.5 Điều hành — 3 phân hệ

**(1) Đặt dịch vụ với nhà cung cấp**
- Lưu trú: Homestay · Khách sạn · Junk/Boat (du thuyền/tàu) · Night Train
- Vận chuyển: Hàng không (VNA, VietJet, hãng khác) · Xe (từ **7 chỗ đến 47 chỗ**) · Thuyền, tàu
- HDV các vùng **Bắc – Trung – Nam, Laos, Cambodia, Thailand**…
- Nhà hàng
- **Landtour đối tác**
- Dịch vụ khác: Visa, lệ phí, tham quan

**(2) Theo dõi dịch vụ đã đặt / chưa đặt** của từng tour (đối chiếu với phân hệ 1).

**(3) Nhập liệu nhà cung cấp** (lưu trú, vận chuyển, HDV, ăn uống, tham quan, khác); **lưu hợp đồng online hoặc offline**.
Dùng **AI hỗ trợ nhập liệu** các trường: phân loại NCC; địa chỉ, SĐT người phụ trách, email; các loại dịch vụ; **các loại phòng + giá theo mùa, tính theo phòng/đêm**; **các chương trình khuyến mại**.

Workflow điều hành: `Sales Won → Operation tiếp nhận → Đặt khách sạn → Đặt xe → Đặt HDV → Xác nhận → Voucher → Tour chạy → Hoàn tất`.
Checklist dịch vụ: Hotel, Vehicle, Guide, Restaurant, Flights, Cruise, Train, Insurance.
Tour Dashboard: Booking, Status, Operation, Cost, Profit, Progress.

### 1.6 Kế toán

Chỉ thấy Invoice, Payments, VAT, Debt. Cần theo dõi:
- Từ lúc Sales tạo Invoice → dòng tiền về công ty qua: **chuyển khoản quốc tế, nội địa**, bằng **USD / EUR / VND**, qua **cổng thanh toán OnePay hoặc VNPAY**, hoặc **tiền mặt**.
- Dịch vụ do Điều hành đặt: **hạn thanh toán cọc** và **thanh quyết toán cho NCC**.
- Theo dõi các khoản tiền về TK công ty **đã xuất VAT đầu ra** tương ứng.
- Theo dõi các khoản thanh toán NCC **để lấy VAT đầu vào**.
- **Báo cáo lãi/lỗ cho từng tour, từng dịch vụ.**
- Flow thu: `Booking → Hóa đơn cọc → Nhận tiền → Hóa đơn quyết toán → Tour hoàn tất`. Flow chi NCC: `NCC → Invoice → Duyệt → Thanh toán`.
- Cash flow theo ngày / tuần / tháng. Phải thu (khách), phải trả (NCC), VAT đầu vào/đầu ra.

### 1.7 Nhà cung cấp

- Loại: Hotel, Homestay, Cruise, Restaurant, Vehicle, Guide, Flight, Train, Others.
- Thông tin: tên, loại, quốc gia, hợp đồng, rating, điều khoản thanh toán.
- **Điểm NCC tự động (0–100)** = Quality 40% + Price 30% + Response 20% + Complaint 10%.
- Quy mô: **khách ghi "500+ NCC" ở đầu, "1000 NCC" ở một đoạn, "500 NCC" ở ERP V1** → thiết kế chịu được **≥ 1000**. Không thể quản lý bằng Excel.

### 1.8 Hướng dẫn viên (10 HDV)

Hồ sơ: ngôn ngữ, khu vực, giá/ngày, rating. Lịch trống (calendar). Phân công: `Tour → HDV rảnh → Assign → Confirm`. App mobile: HDV thấy Tour, Khách, Voucher, Emergency.

### 1.9 Phương tiện

Đơn vị vận chuyển, xe, sức chứa. Đặt: `Tour → Xe → Confirm`.

### 1.10 Dashboard CEO (màn hình quan trọng nhất)

- Thẻ tổng: doanh thu tháng, lợi nhuận, tour đang chạy, khách đang đi tour, công nợ khách, công nợ NCC.
- Sales: Leads, Quotations, Won, Lost, Revenue, Profit; thiết kế tour và chọn bảng giá đã cấu hình.
- Marketing: Traffic, Leads, CPL.
- Operations: Tours Running, Pending Services, Supplier Issues, Guide Issues, Error Rate, Cost Control, CSAT.
- Accounting: Receivable, Payable, Cash Flow.

### 1.11 Các module khác trong "ERP V1"

- **Tour Design:** tour mẫu (Vietnam 10 Days, Vietnam–Cambodia, Luxury Vietnam, Family Vietnam…). **AI Itinerary Builder**: Sales nhập Country / Pax / Budget / Duration (vd France, 4 pax, 3500 EUR, 14 ngày) → AI sinh bản nháp → Sales chỉnh sửa.
- **Quotation:** Quote No, Version, Client, Amount, Profit. **PDF 1 click → Email khách.**
- **Bookings:** khi khách đồng ý, Quote → Booking. Booking ID, Client, Arrival, Departure, Pax, Revenue, Profit.
- **Document Center:** lưu Contract, Invoice, Passport, Voucher, Rooming List.
- **Customer Service:** sau tour → Feedback Form → CSAT → Review → Referral.
- **Giai đoạn 4 – AI:** viết chương trình tour, tạo quotation, dịch Pháp–Anh–Việt, phân công guide, phân tích lợi nhuận.

### 1.12 Thông tin còn thiếu từ khách

Xem mục 8 (Câu hỏi mở).

---

## 2. TỪ ĐIỂN NHANH

| Thuật ngữ | Nghĩa |
|---|---|
| NCC | Nhà cung cấp (supplier) |
| HDV | Hướng dẫn viên (guide) |
| Pax | Số khách |
| SIC / Sictour / Tour ghép | Tour khởi hành cố định, ghép khách nhiều đơn vị |
| Landtour | Đối tác tổ chức tour mặt đất |
| Voucher | Phiếu dịch vụ gửi cho NCC/HDV |
| Rooming list | Danh sách phân phòng |
| VCB | Vietcombank (nguồn tỷ giá cố định khách yêu cầu) |
| KIO / KRUD | Dịch vụ database multi-tenant `kio.dvqt.vn` mà demo dùng |
| CPL | Cost per lead |

---

## 3. KIẾN TRÚC & CÔNG NGHỆ HIỆN TẠI (DEMO) — CÁCH LÀM CHUẨN

### 3.1 Stack

- **Frontend only**, tĩnh: `index.html` + `css/` + `js/` + `assets/`. **Không có bước build, không npm, không module ES.** Chạy bằng cách mở qua web server tĩnh bất kỳ. **Ngoại lệ phía máy chủ (2 file PHP): `upload.php`** (nhận tệp tải lên vào `uploads/` — mục 3.4a, T0-05) và **`fx-vcb.php`** (đọc tỷ giá VCB — mục 3.4b, T1-01). Thiếu PHP thì chỉ tải tệp / tự lấy tỷ giá lỗi (tỷ giá vẫn nhập tay được), phần còn lại vẫn hoạt động.
- Toàn bộ script là **global** (`<script src>` thường), phụ thuộc **thứ tự nạp** trong `index.html`.
- UI dựng bằng **chuỗi template HTML** (template literal) rồi gán vào `#app.innerHTML`. Sự kiện dùng `onclick="tenHam(...)"` inline gọi hàm global.
- Font: Plus Jakarta Sans (Google Fonts, cần internet). Icon: Font Awesome (nội bộ `assets/fa/`).
- Database: **KIO** — SDK `krud.js`, `list.js` được nạp động từ `https://kio.dvqt.vn` (xem `js/travel-config.js`).
- Repo git: `https://github.com/NguyenVoTuNhu/travel.git`, nhánh `main` (và `hoang`). Commit hiện chỉ ghi "update".

### 3.2 Cấu trúc thư mục (cây PHẲNG — đúng với commit `71f2b33`)

```
travel/
├─ index.html                  # khung trang, đăng nhập, sidebar, nạp CSS/JS
├─ upload.php                  # nhận tệp tải lên → lưu vào uploads/, trả đường dẫn (T0-05)
├─ fx-vcb.php                  # đọc XML tỷ giá VCB phía máy chủ, cache 5 phút, trả JSON (T1-01)
├─ cache/                      # cache của fx-vcb.php (không vào git; .htaccess chặn truy cập trực tiếp)
├─ uploads/                    # tệp người dùng tải lên (không đưa vào git; có .htaccess chặn chạy mã)
├─ .gitignore, .gitattributes  # bỏ qua uploads/, zip…; repo lưu LF, checkout CRLF (T0-07)
├─ assets/
│  ├─ fa/                      # Font Awesome (css + webfonts)
│  ├─ images/                  # logo, avatar
│  ├─ chart.js, tailwind.js, vendor/jszip.min.js   # CÓ trong thư mục nhưng KHÔNG được nạp ở index.html
├─ css/
│  ├─ style.css                # nền tảng (mẫu định dạng CSS chuẩn — mục 5.12)
│  ├─ mod-dashboard.css, mod-crm.css, mod-customers.css, mod-care.css, mod-quotes.css,
│  │  mod-guideapp.css, mod-guides.css, mod-operations.css, mod-admin.css, mod-auth.css   # CSS theo phân hệ
│  ├─ mod-design.css           # kéo–thả đổi thứ tự ngày tour (T3-01), chi tiết chương trình; nạp sau mod-admin, trước overlays
│  ├─ mod-tourdays.css         # ngân hàng ngày tour (T3-02); nạp ngay sau mod-design.css
│  ├─ mod-tourtemplates.css    # form tour mẫu, hộp thoại nhập CSV (T3-03); nạp ngay sau mod-tourdays.css
│  ├─ overlays.css, theme-polish.css, erp-ui.css, compact-density.css,
│  │  system-upgrades.css, erp-modern.css, erp-v4.css   # lớp ghi đè, nạp sau cùng — file nào nạp sau thì thắng
│  └─ modules/*.css            # BẢN CŨ TRÙNG — không nạp (T0-10)
└─ js/
   ├─ data.js                  # emptyState(), danh sách collection, tiền tố mã, nextBusinessId, normalizeBusinessIds, applyDatabaseSettings
   ├─ travel-config.js         # cấu hình KIO (apiBaseUrl, tablePrefix, chunkSize), databaseErrorMessage()
   ├─ travel-api.js            # nạp/lưu state qua KIO, cache, phát hiện xung đột, save(), log()
   ├─ travel-auth.js           # đăng nhập, phiên, PBKDF2, requiredTeamAccounts (22 tài khoản mẫu)
   ├─ app.core.js              # router go(), nav, pages/navGroups, phân quyền (businessRolePolicies, can()), modal, toast, btn/card/table/stat, phân trang, xuất CSV, in
   ├─ workflow.js              # nghiệp vụ dùng chung: trạng thái, phê duyệt, audit, phạm vi dữ liệu, thanh toán, hủy/hoàn tiền, workQueue (thông báo), migrateWorkflowData, ensureBookingContract
   ├─ mod-*.js                 # mỗi phân hệ một file (xem 3.8); thiết kế tour 5 bước nằm ở mod-design.js
   ├─ mod-tourdays.js          # ngân hàng ngày tour: kho ngày, nhặt/ghép vào lịch trình (T3-02); nạp ngay sau mod-design.js
   ├─ mod-tourtemplates.js     # quản lý tour mẫu: thêm/sửa/xóa, phân loại, nhập/xuất CSV (T3-03); nạp ngay sau mod-tourdays.js
   ├─ mod-fx.js                # bảng tỷ giá VCB: dữ liệu, lịch sử (collection `fxHistory`), tự cập nhật, nhập tay, giao diện (T1-01)
   ├─ app.js                   # khởi động: đăng nhập → enterApplication → loadDatabase → render
   └─ core/, modules/, api/, data/   # BẢN CŨ TRÙNG — không nạp (T0-10)
```

**Tên file đã đổi so với bản cũ** (các ghi chú/lịch sử cũ có thể còn nhắc tên cũ):

| Bản cũ (không nạp) | Bản hiện hành |
|---|---|
| `js/core/app.core.js`, `js/core/workflow.js` | `js/app.core.js`, `js/workflow.js` |
| `js/api/travel-*.js`, `js/data/data.js` | `js/travel-*.js`, `js/data.js` |
| `js/modules/quote-engine.js` | `js/mod-design.js` |
| `js/modules/mod-crm-sales.js` | `js/mod-crm.js` |
| `js/modules/mod-customer-service.js` | `js/mod-care.js` |
| `js/modules/mod-guide-app.js` | `js/mod-guideapp.js` |
| `css/modules/crm-sales.css`, `customer-service.css`, `guide-app.css`, … | `css/mod-crm.css`, `mod-care.css`, `mod-guideapp.css`, … |

> Hai cây này đang cùng nằm trong git (do hai nhánh làm việc: commit `71f2b33` tạo cây phẳng, cây cũ không bị xóa). Bản phẳng là bản mới hơn (nhiều thay đổi ở đăng nhập, quản trị, cổng HDV, hợp đồng). Đã so từng cặp file: mọi khác biệt còn lại ở cây cũ chỉ là phiên bản cũ hơn (emoji thay icon, nhãn cũ, nhóm menu theo vai trò…); **không có tính năng nào chỉ nằm ở cây cũ**, ngoại trừ thông báo trong `travel-api.js` trỏ về claude.md (T0-02b).
> Thay đổi lớn nhất của `71f2b33` so với cây cũ: (1) tài khoản mẫu tự tạo — lúc đó 19, nay 22 (3.5.1); (2) đổi nhãn màn hình và gộp thanh điều hướng thành một danh sách chung lọc theo `rights[role]`; (3) cổng HDV có menu 6 chức năng riêng; (4) tự tạo bản ghi hợp đồng khi booking đủ điều kiện xác nhận; (5) quản trị người dùng có tìm kiếm/lọc, liên kết hồ sơ HDV, chặn khóa quản trị cuối cùng; (6) mật khẩu mặc định không còn bắt đổi.

### 3.3 Thứ tự nạp trong index.html (PHẢI giữ)

**JS** (thẻ `<script src>` thường, không `defer`):

`data.js → travel-config → travel-api → travel-auth → app.core → workflow → mod-dashboard → mod-crm → mod-customers → mod-design → **mod-tourdays** → **mod-tourtemplates** → mod-quotes → mod-bookings → mod-operations → mod-suppliers → mod-guides → mod-vehicles → mod-accounting → mod-marketing → mod-documents → mod-care → mod-guideapp → mod-approvals → **mod-fx** → mod-admin → app.js`

**CSS:** `assets/fa/css/all.min.css → style.css → mod-dashboard → mod-crm → mod-customers → mod-care → mod-quotes → mod-guideapp → mod-guides → mod-operations → mod-admin → mod-design → **mod-tourdays** → **mod-tourtemplates** → overlays → theme-polish → erp-ui → compact-density → mod-auth → system-upgrades → erp-modern → erp-v4`

> `mod-ai.js` và `mod-help.js` **tồn tại nhưng không được nạp** và không có trong danh sách `pages` → màn hình `ai`/`help` không truy cập được. Xem task T0-06.
> `?v=` (22/10, sau T1-01): các thẻ JS `travel-config` (`20261022.2`), `travel-api`, `travel-auth`, `app.core`, `mod-accounting`, `mod-documents`, `mod-guideapp`, `mod-fx`, `mod-admin`, `app.js` (`20261022.1`) đã theo quy ước 5.3; `mod-guideapp.css?v=2` còn số nguyên; các thẻ còn lại chưa có `?v=` (T0-01).

### 3.4 Lưu trữ dữ liệu — KIO

**Mô hình:** mỗi *collection* của `state` được lưu thành **một mảng JSON**, cắt thành các **chunk 30.000 ký tự**, mỗi chunk là **một dòng** trong bảng KIO.

- Tên bảng = `typicone_` + tên collection đổi sang snake_case. Ví dụ `customerServiceCases` → `typicone_customer_service_cases`.
- Mỗi bảng có các cột: `state_key` (string), `chunk_index` (int), `payload_text` (text), `updated_at` (string ISO). Đọc: `getKrudList({table, page:1, limit:1000, sort:{id:'ASC'}})`, ghép `payload_text` theo thứ tự rồi `JSON.parse`. Ghi: `krud('insert'|'update'|'delete', table, fields, id)`.
- **Bảng cần tồn tại trên KIO** (25 bảng):
  `typicone_guides, suppliers, bookings, leads, quotes, payables, transactions, drafts, docs, activities, campaigns, customers, invoices, vat, contents, vehicles, issues, customer_service_cases, settings, tour_templates` + `approvals`, `audit_logs`, **`fx_history`** (lịch sử tỷ giá, T1-01d) + **`tour_days`** (ngân hàng ngày tour, T3-02) (bốn bảng này *optional*: thiếu thì dùng bộ nhớ phiên và báo toast) + **`typicone_users`**, **`typicone_roles`** (bảng đăng nhập, cùng định dạng chunk).
- **Thêm collection mới:** thêm vào `emptyState()` trong `data.js` (+ `businessIdSchemas` nếu cần mã nghiệp vụ) và **tạo bảng KIO tương ứng**; nếu chưa chắc bảng đã có thì thêm vào `optionalCollections`.
- **Ghi:** gọi `save()` (debounce 200 ms) → `flushDatabase()`. Chỉ collection nào có JSON thay đổi mới được ghi lại, và **trong collection đó chỉ chunk nào đổi nội dung mới bị `update`** (`syncDatabaseCollection` so với `databaseChunks`, nội dung chunk đang lưu trên KIO; 23/10) — thêm bản ở cuối mảng chỉ ghi chunk cuối.
- **Xung đột:** trước khi ghi, đọc lại bản server của từng collection đã đổi; khác bản snapshot → ném lỗi `DATA_CONFLICT` ("hãy tải lại trang"). `auditLogs` được gộp theo id thay vì chặn. Chưa có compare-and-swap thật (comment `shortcut` trong `travel-api.js`).
- **Cache:** `sessionStorage` (`typicone_database_cache_<userId>`), bỏ `data` base64 (tài liệu cũ) của `docs`. Cache đăng nhập: `typicone_auth_cache`; phiên: `typicone_auth_session` (session hoặc local nếu "duy trì đăng nhập"). Thu gọn sidebar: `localStorage typicone_sidebar_collapsed`.
- **Cài đặt & danh mục nằm TRONG DATABASE, không nằm trong code:** `state.settings[0]` chứa `serviceTypes, serviceLabels, leadStages, crmOwners, careOwners, operationOwners, countries, leadSources, contentChannels, marketingOwners, currencies, languages, translations, serviceCostWeights`, `policy` và **`fxRates`** (chỉ còn `{source, rateType}`; lịch sử tỷ giá nằm ở collection riêng `fxHistory` — mục 3.4b). `applyDatabaseSettings()` nạp chúng vào biến global (`serviceTypes`, `crmLeadSources`, `travelCurrencies`, …). **Repo không có dữ liệu mẫu (seed)**; muốn xem dữ liệu thật hãy nhờ người dùng xuất bản sao ở *Cài đặt hệ thống → Sao lưu* (hàm `downloadBackup()`, file JSON).
- File README_NGHIEP_VU.md (hướng dẫn tạo bảng) **đã bị xóa khỏi repo** nhưng `travel-api.js` dòng ~193 vẫn nhắc tới → nội dung đó nay nằm ở mục này. *(Thông báo trong `travel-api.js` đã sửa trỏ về claude.md mục 3.4 — T0-02b, 22/10.)*

### 3.4a Tệp tải lên (T0-05) — tệp ở `uploads/`, database chỉ lưu đường dẫn

- **Luồng:** trình duyệt gọi `uploadFile(file, nhóm)` (`js/travel-api.js`) → `POST upload.php` (multipart: `file`, `category`) → máy chủ lưu `uploads/<nhóm>/<năm>/<tháng>/<32 ký tự ngẫu nhiên>.<đuôi>` → trả `{ok, path, mime, size}` → code lưu **`path`** vào bản ghi (collection `docs`; `bookings[].finalReport.photos`). Hiển thị/tải bằng chính `path` (`openDocument`, thẻ `<img src>`).
- **Cấu hình:** `TRAVEL_CONFIG.uploadEndpoint` (`"upload.php"`) và `uploadMaxBytes` (10 MB) trong `js/travel-config.js`.
- **Nhóm (`category`)** hiện có: `docs` (Kho tài liệu), `guide-reports` (ảnh báo cáo cuối tour của HDV). Thêm nhóm mới phải thêm vào `ALLOWED_CATEGORIES` trong `upload.php`.
- **`upload.php` kiểm tra:** chỉ POST; cùng nguồn (`Origin` trùng `Host`); ≤ 10 MB; đuôi thuộc `pdf, jpg, jpeg, png, webp, docx, xlsx` **và** MIME thật (`finfo`) khớp đuôi; tên lưu ngẫu nhiên (không dùng tên người dùng đặt).
- **`uploads/.htaccess`** (Apache): không liệt kê thư mục, không chạy `php`, chặn `php/phtml/phar/html/js/svg`. Nếu chạy Nginx phải cấu hình tương đương (không thực thi PHP trong `uploads/`).
- **Yêu cầu máy chủ:** PHP ≥ 7.4; `upload_max_filesize` và `post_max_size` ≥ 10M (mặc định PHP thường chỉ 2M); thư mục `uploads/` cho phép PHP ghi. Chạy thử local: `php -S 127.0.0.1:8080` ở thư mục gốc (Python `http.server`/Live Server **không** nhận upload).
- **Khi nhận zip bản vá:** `uploads/` chứa dữ liệu thật trên máy chủ — **giải nén đè không được xóa** thư mục này; không đưa nội dung `uploads/` vào git/zip (đã có `.gitignore`).
- **Chưa làm / rủi ro:** chưa thử trên máy chủ PHP thật (T0-05c); `upload.php` **chưa xác thực người dùng** và tệp phục vụ bằng URL tĩnh (chỉ che bằng tên ngẫu nhiên) — hộ chiếu/hợp đồng nhạy cảm cần cơ chế tốt hơn (T0-05e); tài liệu cũ base64 chưa chuyển (T0-05d).

### 3.4b Tỷ giá VCB (T1-01) — `state.fxHistory`, `settings[0].fxRates`, `js/mod-fx.js`, `fx-vcb.php`

- **Nguồn:** XML chính thức của VCB `https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx` (trang tỷ giá VCB tự ghi link này). Mỗi dòng có `Buy` (mua tiền mặt), `Transfer` (mua chuyển khoản), `Sell` (bán). **VCB chỉ có MỘT cột bán** (không tách tiền mặt/chuyển khoản) nên "giá bán" = cột `Sell`. Số dạng `17,701.51`, `-` = không có. **VCB ghi: tối đa 1 request / 5 phút.** XML có 19 loại tiền (AUD CAD CHF CNY DKK EUR GBP HKD INR JPY KRW KWD MYR NOK RUB SAR SEK SGD THB USD), không có VND (hệ thống tự thêm `VND: 1`). Trang web VCB dựng bảng bằng JS (không scrape được) → dùng XML. *Lưu ý: lúc thử, giờ trong XML (6:52 AM) sớm hơn giờ "cập nhật" trên trang (08:55) → lưu nguyên `vcbTime` để đối chiếu, không dùng làm ngày hiệu lực.*
- **Luồng:** trình duyệt gọi `TRAVEL_CONFIG.fxEndpoint` (`fx-vcb.php`) → PHP tải XML (curl hoặc `file_get_contents`, timeout 10 giây), phân tích, ghi `cache/vcb-fx.json` (dùng lại trong 5 phút), trả JSON `{ok, vcbTime, fetchedAt, cached, stale, rates:{USD:{buy,transfer,sell}}}`. VCB lỗi mà còn cache cũ → trả `stale:true` (JS **không** ghi bản `stale`); không có cache → HTTP 502. Chỉ nhận GET cùng nguồn (như `upload.php`). Trình duyệt gọi thẳng VCB không chắc được vì CORS.
- **Dữ liệu (tách riêng từ 23/10/2026, T1-01d):** lịch sử nằm ở **collection riêng `state.fxHistory`** (bảng KIO **`typicone_fx_history`**), **không còn trong `settings`** (trước đây `settings[0].fxRates.history`, làm bản `settings` phình tới ~300–400 KB và mỗi lần đổi một danh mục là ghi lại cả đống tỷ giá). `settings[0].fxRates` chỉ còn `{ source:"VCB", rateType:"sell" }`. `fxHistory` là mảng xếp **cũ → mới** (đổi hướng so với trước), **KHÔNG giới hạn số bản** (đã bỏ giới hạn 800; chứng từ cũ luôn tra được tỷ giá đúng ngày), **mỗi ngày hiệu lực một bản** (lưu lại cùng ngày thì thay). Mỗi bản: `{ date:"YYYY-MM-DD", mode:"auto"|"manual", by, at, vcbTime, rates:{USD:26050, EUR:29771.25, CAD:18697.77, VND:1, …} }`; số = **VND cho 1 đơn vị ngoại tệ, giá bán**. Vì thêm bản mới ở cuối mảng nên mỗi ngày chỉ ghi lại chunk cuối của bảng (xem 3.4 *Ghi*). Mỗi bản ~0,5 KB (10 năm ≈ 2 MB ≈ 70 chunk); bản này cũng nằm trong cache `sessionStorage` (lỗi quota chỉ `console.warn`, app vẫn chạy). **Cần tạo bảng `typicone_fx_history`** (cột `state_key, chunk_index, payload_text, updated_at` như các bảng khác) — bảng *optional* nên thiếu bảng thì app vẫn chạy.
- **Chuyển dữ liệu cũ (tự động, `fxMigrateLegacy()`):** khi CEO/Kế toán (`fx_manage`) vào hệ thống, nếu `settings[0].fxRates.history` còn bản cũ thì chép (đảo thứ tự) sang `fxHistory`, ghi lên KIO, và **chỉ xóa `history` trong settings sau khi ghi thành công**. Bảng `typicone_fx_history` chưa tạo thì **giữ nguyên lịch sử ở settings** (không mất dữ liệu) và `console.warn`. Trước khi chuyển xong, `fxHistory()` vẫn đọc tạm bản cũ trong settings nên Sales/Điều hành… không bị mất tỷ giá.
- **Hàm dùng chung (`mod-fx.js`):** `fxCurrent()` (bản có hiệu lực hôm nay), `fxEntryOn("YYYY-MM-DD")` (bản có hiệu lực vào ngày đó — dùng cho snapshot T1-03), `fxRate(code, entry?)`, `fxConvert(amount, from, to, entry?)` (đổi qua VND, trả `null` nếu thiếu tỷ giá), `fxRatesPanel()` (giao diện), **`fxDisplayCurrency`** (= `"USD"`, tiền hiển thị chung — T1-02), **`fxMoney(vnd, code?, entry?)`** (hiển thị số VND ở tiền tệ `code`, mặc định USD; thiếu tỷ giá thì rơi về VND; tối đa 2 số lẻ, không thừa số 0: `555,56 USD`, `1.000 USD`), `fxViewCurrencies(extra)` (USD, tiền của khách nếu có tỷ giá, VND — cho nút chuyển hiển thị).
- **Tỷ giá theo ngày tạo chứng từ (T1-03):** chứng từ **không lưu tỷ giá**, chỉ có **ngày tạo**; khi cần chuyển sang tiền nào thì tra bản tỷ giá của ngày đó trong `fxHistory` (`fxEntryOn(ngày)` = bản mới nhất có `date` ≤ ngày đó; sớm hơn mọi bản đã lưu thì dùng bản cũ nhất). Ngày tạo của từng loại: **báo giá / phiên bản báo giá / booking** → trường **`fxDate`** (`YYYY-MM-DD`; sửa báo giá đặt `fxDate` = hôm nay cho phiên bản mới, phiên bản cũ giữ `fxDate` cũ; booking thừa hưởng `fxDate` của báo giá được chấp nhận vì giá khách đã chốt theo tỷ giá ngày đó) · **hóa đơn** → `issuedAt` · **giao dịch thu/chi** → `date` · báo giá cũ chưa có `fxDate` → ngày của `createdAt`. Hàm: `fxDocDate(doc)`, `fxEntryOf(doc)` (bản tỷ giá của ngày tạo; không có ngày thì tỷ giá hiện hành), `fxMoneyOf(doc, vnd, code?)`, `fxSumMoney(docs, amountOf, code?)` (mỗi chứng từ theo ngày riêng rồi cộng; thiếu một cái thì cả tổng hiện VND), `fxDual(vnd, entry)` ("1.000 USD (26.050.000 ₫)"), `fxFormat(value, code)`. Hệ quả: **sửa/ghi đè bản tỷ giá của một ngày (nhập tay, hoặc "Cập nhật từ VCB" lại trong ngày) sẽ đổi số quy đổi của mọi chứng từ tạo ngày đó**; và **`fxHistory` là dữ liệu tham chiếu của chứng từ nên giữ đầy đủ, không giới hạn số bản** (trước là 180, rồi 800; bỏ giới hạn 23/10/2026).
- **Nhập tiền mặc định bằng USD (T1-02b):** số tiền **vẫn lưu bằng VND**; ô nhập giá bán/chi phí hiển thị và nhận theo tiền đang chọn (mặc định USD), rồi quy đổi sang VND theo tỷ giá. Hàm: `fxInputCode(code?)` (USD nếu có tỷ giá, không thì VND), `fxToVnd(amount, code, entry?)`, `fxFromVnd(vnd, code, entry?)` (làm tròn 2 số lẻ). Thiết kế tour: ô giá bán (2 chỗ) + chi phí từng mục dịch vụ theo `d.cur`, đổi nút USD/tiền khách/VND thì các ô nhập tự đổi theo; quy đổi bằng tỷ giá **hiện hành** (bản nháp đang làm hôm nay). Form *Điều chỉnh giá* của báo giá: nhập USD, hiện sẵn theo tỷ giá của ngày tạo báo giá; cả giá bán và chi phí **luôn quy đổi theo tỷ giá hôm nay** (phiên bản mới có `fxDate` = hôm nay), nên **giá USD không đổi khi không sửa số** còn VND trôi theo tỷ giá (từ 23/10; trước đó giữ VND cũ nhưng đổi `fxDate` làm giá USD bị lệch). **Chưa đổi (vẫn VND):** hóa đơn, thu/chi, khoản phải trả, VAT, duyệt giá, booking (mục 8.1).
- **Sổ kế toán ghi bằng USD (T1-04):** hóa đơn và thu tiền nhập/hiển thị bằng USD; **dữ liệu vẫn lưu VND**. Quy tắc: mọi số tiền của **một booking** (giá trị hợp đồng, hóa đơn, thu, công nợ) quy đổi USD theo tỷ giá của **ngày chốt báo giá** (`booking.fxDate`, tra bằng `fxEntryOf(booking)`), nên một khoản thu USD luôn khớp đúng hóa đơn USD, không phát sinh chênh lệch tỷ giá. **Thu tiền** (`receiveForm`/`receiveMoney`): khách trả bằng USD / EUR / CAD / VND (theo bảng tỷ giá hôm nay); EUR/CAD/VND đổi sang USD theo tỷ giá hôm nay rồi sang VND theo tỷ giá của booking (`receiptVnd`); giao dịch `transactions` thêm **`currency`** (tiền khách trả) và **`original`** (số khách trả), `amount` vẫn là VND ghi sổ. **Hóa đơn** (`invoiceForm`/`createInvoice`): nhập USD (`invoiceVnd`), chỉ một loại tiền ghi sổ là USD; bản in hóa đơn hiện `USD (VND)`. Số thu/hóa đơn **lệch ≤ 1 VND hoặc dưới 1 xu USD (0,0099) so với công nợ thì coi là thu đủ** (`nearBalance`): công nợ còn lẻ vài trăm VND do làm tròn vẫn hiện "0,01 USD", nhập 0,01 USD phải đưa công nợ về 0; ô số tiền mặc định không thấp hơn 0,01 USD khi còn công nợ. Chưa có tỷ giá thì form và sổ quay về VND như cũ. Hàm dùng chung (`mod-fx.js`): `fxLedgerReady()`, `fxLedgerMoney(booking, vnd)`, `fxTxMoney(booking, tx)`. **Đã chuyển sang USD (T1-04 và T1-04b, 23/10):** màn Kế toán (Hóa đơn, Phải thu, **Phải trả NCC**, **Chi phí & quyết toán**, **Lãi/lỗ theo tháng và theo tour**, **Dòng tiền**, Tổng quan, các thẻ KPI), tab Tài chính và danh sách booking, **booking 360 (chi phí điều hành, quyết toán)**, **Điều hành (chi phí dịch vụ, form dịch vụ)**, **Phê duyệt (giá trị, chi tiết, lý do mới)**, **hàng chờ việc (`workQueue`)**, **dashboard CEO/Sales/Kế toán**, **CRM (doanh thu/lợi nhuận, danh sách booking, báo giá)**, **Khách hàng (doanh số, công nợ, đơn hàng)**, **công nợ NCC trong chi tiết NCC**, **hợp đồng in (`USD (VND)`)**. **Vẫn VND (có chủ ý):** **VAT** (khai theo VND — chờ quyết định, T1-04d), tạm ứng/chi tiêu HDV ở app HDV, đơn giá HDV, nhiên liệu xe, bảng giá NCC, **Marketing** (ngân sách/chi phí/CPL/CAC/doanh thu chiến dịch), **ngân sách lead**, **mục tiêu doanh thu tháng** (nhập VND trong Cài đặt, dashboard quy đổi theo tỷ giá hiện hành), xuất CSV giao dịch (`exportData('transactions')`, VND thô). Lý do: các khoản này không gắn booking hoặc là số liệu VND địa phương (xem T1-04b, T1-04d).
- **Quy tắc quy đổi cho màn kế toán còn lại (T1-04b):** dữ liệu **vẫn lưu VND**; mọi khoản gắn với một booking (phải trả NCC `payables[].booking`, giao dịch `transactions[].ref`, quyết toán, chi phí dịch vụ, hoàn tiền, đề xuất phê duyệt) quy đổi USD theo **tỷ giá ngày chốt báo giá của booking đó** (`fxEntryOf(booking)`), như hóa đơn/thu tiền. Các tổng (`accountingTotals()`, lãi/lỗ, dòng tiền, dashboard, khách hàng, NCC) **cộng từng khoản theo tỷ giá riêng rồi mới cộng** (`fxLedgerTotal`), không nhân tổng VND với một tỷ giá. Hàm dùng chung (`mod-fx.js`): `fxLedgerCode()`, `fxLedgerRate(booking)`, `fxLedgerNumber(booking, vnd)`, `fxLedgerTotal(items, bookingOf, amountOf)`, `fxLedgerText(n)`, `fxLedgerShort(n)` (1,25M USD / 12,5K USD), `fxLedgerSum(...)`, `fxLedgerInput(booking, vnd)` (số hiện trong ô nhập), `fxLedgerInputVnd(booking, input, currentVnd?)` (ô nhập → VND; nếu bằng số đang hiển thị của `currentVnd` thì giữ nguyên VND cũ để làm tròn 2 số lẻ không làm trôi). **Ô nhập chuyển sang USD:** số tiền hóa đơn NCC (`payableForm`/`createPayable`), chi phí thực tế quyết toán (`settlementForm`/`saveSettlement`), chi phí dự kiến dịch vụ (`serviceForm`/`saveService`), số tiền hoàn khi hủy booking (`cancelForm`/`submitCancel`). Chưa có tỷ giá thì tất cả quay về VND. Duyệt giá: `approvalMoney(a, vnd)` (booking → `fxDate`; báo giá → `fxDate`/`createdAt`); các câu `reason` của đề xuất **tạo từ 23/10 trở đi** ghi bằng USD, đề xuất cũ giữ chữ VND đã lưu.
- **Tự cập nhật mỗi ngày 1 lần:** `fxAutoUpdate()` chạy sau `loadDatabase()` trong `enterApplication` (`app.js`) **chỉ khi người dùng có quyền `fx_manage`** (CEO, Kế toán) và bản mới nhất chưa là của hôm nay. Lỗi chỉ `console.warn`. Không có cron phía máy chủ: ngày nào CEO/Kế toán không đăng nhập thì tỷ giá không tự cập nhật (T1-01c). Nút **Cập nhật từ VCB** lấy lại ngay (ghi đè bản hôm nay, hỏi xác nhận nếu bản đó nhập tay); nút **Nhập tay** có ngày hiệu lực (không được ở tương lai), USD bắt buộc, ô trống = bỏ loại tiền đó.
- **Chỗ hiển thị / quyền:** tab **Tỷ giá** trong *Cài đặt hệ thống* (CEO) và tab **Tỷ giá** trong *Kế toán* (khi `can("fx_manage")`: CEO + Kế toán). Quyền `fx_manage` mới thêm cho Kế toán ở `businessRolePolicies.accounting`. Sales/Điều hành/Marketing không có tab tỷ giá nhưng thấy giá tour/báo giá đã quy đổi USD (T1-02, đọc từ `fxRates` đã lưu).
- **Yêu cầu máy chủ:** PHP ≥ 7.4, ra được HTTPS tới `portal.vietcombank.com.vn`, thư mục `cache/` cho PHP ghi, Apache đọc `cache/.htaccess` (Nginx: chặn truy cập trực tiếp `cache/`). Chạy thử local: `php -S 127.0.0.1:8080` ở thư mục gốc. Kiểm tra nhanh: mở `/fx-vcb.php` phải thấy JSON `"ok":true`.

### 3.5 Xác thực & phân quyền

- Người dùng ở `typicone_users`: `{id, username, fullName, role, guideId, active, salt, iterations, passwordHash, mustChangePassword}`. Băm **PBKDF2-SHA256** ngay trên trình duyệt (`crypto.subtle`); so khớp ở client.
- Mật khẩu mặc định khi tạo/đặt lại: **`123456`**. **Từ commit `71f2b33` cờ `mustChangePassword` được đặt `false`** (tài khoản mẫu, tạo mới và đặt lại đều KHÔNG bị bắt đổi mật khẩu; trước đó là `true`). Màn hình đăng nhập có **nút chọn nhanh vai trò (mỗi vai trò một nút) tự điền `123456`** (`selectLoginRole`) — chỉ phù hợp demo (T0-04).
- Vai trò ở `typicone_roles`. **Quyền thực tế do CODE quyết định**: `businessRolePolicies` trong `js/app.core.js` ghép với vai trò trong DB theo `aliases`; nếu khớp thì **menus/capabilities/features lấy từ code, ghi đè DB**. → *Muốn đổi quyền hãy sửa `businessRolePolicies`, đừng sửa bảng roles.* Không có vai trò "admin" riêng: alias `admin`, `director`, `giam doc` đều ghép về **CEO**.
- `can(capability)` kiểm tra quyền; `requireCapability(cap, msg)` chặn thao tác. Vai trò có `all` (CEO) qua mọi kiểm tra.
- Menu hiển thị: `pages` (danh sách màn hình: id, icon Font Awesome, nhãn), `navGroups` (**một danh sách nhóm chung cho mọi vai trò**; `navigationGroups()` chỉ trả về danh sách này), menu được phép = `rights[role]` (lọc từ `businessRolePolicies.menus`). Riêng HDV có thanh điều hướng riêng gồm 6 chức năng (`guidePortalMenus` trong `mod-guideapp.js`).
- Phạm vi dữ liệu (`workflow.js`): `scopedLeads/Bookings/Quotes/CareCases`. Cách ghép là **so tên**: `myName()` = `currentUser.fullName`, so với danh mục `crmOwners` / `operationOwners` / `marketingOwners` trong `settings[0]`. Sales chỉ thấy lead/booking có `sales === fullName` **khi fullName nằm trong `crmOwners`** (không thì thấy tất cả); Điều hành chỉ thấy booking trạng thái `Confirmed/Preparing/Running/Completed` (`bookingOpsStatuses`); Marketing chỉ thấy lead từ chiến dịch của mình (không thì mọi lead có chiến dịch); HDV chỉ thấy tour có `guide === activeGuideId()`; Kế toán thấy tất cả booking. → *22 tài khoản mẫu có `fullName` kiểu "Nhân viên Sales 01" — nếu danh mục owners trong DB chưa chứa đúng tên đó thì phạm vi bị bỏ qua mà không có cảnh báo (T0-12).*
- Lưu ý: kiểm tra quyền hiện **chỉ ở phía giao diện**; code cũng ghi chú "API/database vẫn phải kiểm tra lại quyền ở phía máy chủ" (T0-04).

#### 3.5.1 Tài khoản (nguồn: `requiredTeamAccounts` trong `js/travel-auth.js`)

Hàm `ensureRequiredTeamAccounts()` chạy khi đọc bảng người dùng lúc đăng nhập: **tự tạo tài khoản còn thiếu** (mật khẩu `123456`), **xóa các tài khoản demo cũ** (`legacyDemoUsernames`: `giamdoc`, `tiep thi`, `kinh doanh`, `dieuhanh`, `ketoan`, `huongdanvien`, `kinhdoanh-001`, `kinhdoanh-002`) và gỡ cờ bắt đổi mật khẩu của tài khoản chuẩn. Chỉ chạy khi bảng `typicone_roles` có đủ 6 vai trò nghiệp vụ (khớp theo `aliases`); nếu thiếu thì chỉ `console.warn`.

| Vai trò (id) | Số TK | Tên đăng nhập | Họ tên mặc định | So với quy mô khách |
|---|---|---|---|---|
| CEO (`ceo`) | 1 | `GD-001` | Giám đốc Điều hành | 1 Giám đốc ✅ |
| Sales (`sales`) | 5 | `SALES-001` … `SALES-005` | Nhân viên Sales 01 … 05 | 5 Sales ✅ (khách đổi 2 → 5 ngày 22/10) |
| Điều hành (`operations`) | 2 | `DH-001`, `DH-002` | Nhân viên Điều hành 01 / 02 | 2 Điều hành ✅ |
| Marketing (`marketing`) | 3 | `MKT-001`, `MKT-002`, `MKT-003` | Nhân viên Marketing 01 / 02 / 03 | 3 Marketing ✅ |
| Kế toán (`accounting`) | 1 | `KT-001` | Nhân viên Kế toán 01 | 1 Kế toán ✅ |
| HDV (`guide`) | 10 | `HDV-001` … `HDV-010` | Hướng dẫn viên 01 … 10 | 10 HDV ✅ |
| Xe / Tài xế | 0 | — | — | **Chưa có vai trò** (T6-01; hỏi khách mục 8.1) |
| **Tổng** | **22** | | | Tài khoản tạo tay thêm ở *Người dùng & phân quyền* không tính |

- Tài khoản HDV tạo ra có `guideId: ""` → **chưa gắn với hồ sơ trong `guides`**; cổng HDV sẽ báo "chưa liên kết" cho tới khi CEO bấm *Liên kết hồ sơ HDV* (`linkUserGuideForm` trong `mod-admin.js`) (T0-12).
- Tên đăng nhập không phân biệt hoa/thường khi đăng nhập; mã chuẩn viết HOA.
- **Khách đổi quy mô Sales 2 → 5 (22/10/2026):** đã thêm `SALES-003…005` vào `requiredTeamAccounts`; `ensureRequiredTeamAccounts()` tự tạo ở lần đăng nhập kế tiếp (mật khẩu `123456`). **Phải thêm 3 tên mới vào `crmOwners` trong `settings[0]`** (T0-12), nếu không 3 Sales mới thấy toàn bộ lead/booking. Đã `grep`: không có chỗ nào trong code cố định số lượng 2 Sales (dashboard/hiệu suất lấy theo `crmOwners`).

#### 3.5.2 Ma trận vai trò ↔ menu (nguồn: `pages` và `businessRolePolicies.menus` trong `js/app.core.js`)

Có **19 màn hình** trong `pages`. **CEO có 18** (tất cả trừ `guideapp`). Cột cuối là nhãn hiện tại trên giao diện.

| id | CEO | Marketing | Sales | Điều hành | Kế toán | HDV | Nhãn trên giao diện |
|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| `dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ | | Bảng điều khiển |
| `marketing` | ✓ | ✓ | | | | | Tiếp thị |
| `crm` | ✓ | ✓ | ✓ | | | | Khách hàng tiềm năng |
| `customers` | ✓ | | ✓ | | | | Khách hàng |
| `design` | ✓ | | ✓ | | | | Mẫu và thiết kế tour |
| `quotes` | ✓ | | ✓ | | | | Danh sách báo giá |
| `pricing` | ✓ | | ✓ | | | | Điều chỉnh bảng giá (thuộc nhóm Báo giá) |
| `bookings` | ✓ | | ✓ | ✓ | | | Danh sách đặt tour |
| `operations` | ✓ | | | ✓ | | | Bảng điều hành tour |
| `suppliers` | ✓ | | | ✓ | | | Danh mục nhà cung cấp |
| `guides` | ✓ | | | ✓ | | | Hồ sơ và phân công |
| `vehicles` | ✓ | | | ✓ | | | Đội xe và điều phối |
| `accounting` | ✓ | | | | ✓ | | Tổng quan kế toán |
| `documents` | ✓ | | ✓ | ✓ | ✓ | | Kho tài liệu |
| `care` | ✓ | | ✓ | ✓ | | | Hồ sơ sau tour |
| `approvals` | ✓ | | | | | | Phê duyệt |
| `users` | ✓ | | | | | | Người dùng & phân quyền |
| `settings` | ✓ | | | | | | Cài đặt hệ thống |
| `guideapp` | | | | | | ✓ | Tour được giao |
| **Tổng menu** | **18** | **3** | **9** | **8** | **3** | **1** | |

**Nhóm trên thanh điều hướng** (`navGroups`, lọc theo menu được phép): TỔNG QUAN (dashboard) · CRM VÀ KINH DOANH (marketing, crm, customers) · THIẾT KẾ CHƯƠNG TRÌNH TOUR (design) · BÁO GIÁ (quotes, pricing) · ĐẶT TOUR (bookings) · TRUNG TÂM ĐIỀU HÀNH (operations) · NHÀ CUNG CẤP (suppliers) · HƯỚNG DẪN VIÊN (guides) · PHƯƠNG TIỆN (vehicles) · KẾ TOÁN (accounting) · TRUNG TÂM TÀI LIỆU (documents) · CHĂM SÓC KHÁCH HÀNG (care) · QUẢN TRỊ HỆ THỐNG (approvals, users, settings).

**CEO (quản trị) có đủ 18 menu:** dashboard, marketing, crm, customers, design, quotes, pricing, bookings, operations, suppliers, guides, vehicles, accounting, documents, care, approvals, users, settings. Ngoài ra CEO là vai trò duy nhất có `approvals`, `users`, `settings` (người dùng, vai trò & menu, chính sách, nhật ký, sao lưu). CEO **không** có menu `guideapp`.

**Tab bên trong từng màn hình** (đọc từ code; CEO thấy đủ, vai trò khác có thể bị ẩn một số mục theo capability):

| Màn hình | Tab / chức năng chính |
|---|---|
| `dashboard` | Tự chọn bản theo vai trò: CEO → `dashboardCeo`; Kế toán → `dashboardAccounting`; Điều hành → `dashboardOps`; Sales → `dashboardSales`; Marketing → `dashboardMarketing` |
| `marketing` | KPI tổng quan · Chiến dịch · Nội dung |
| `crm` | Tổng quan · Danh sách Lead · Pipeline · Công việc chăm sóc · Hiệu suất |
| `customers` | Danh sách; chi tiết khách: Tổng quan · Đơn hàng · Báo giá · Công nợ · Nhật ký CSKH |
| `design` | Thiết kế tour 5 bước; chi tiết: Lịch trình chi tiết · Tổng quan · Ghi chú |
| `quotes` | Danh sách báo giá, phiên bản, duyệt giá, gửi mail, in PDF, chuyển Booking (không chia tab) |
| `pricing` | Trang điều chỉnh bảng giá dùng lại trong thiết kế tour; Sales và CEO truy cập qua nhóm **Báo giá** |
| `bookings` | Danh sách; chi tiết: Tổng quan · Dịch vụ & điều hành · Khách đoàn · Tài chính (chỉ khi có `booking_financials`/`sales_financials` hoặc `operations_costs`) · Tài liệu · Lịch sử |
| `operations` | Bảng điều hành · Dịch vụ NCC · Lịch điều hành · Sự cố |
| `suppliers` | Danh sách NCC, điểm 40/30/20/10, bảng giá theo mùa, công nợ NCC (không chia tab) |
| `guides` | Đội ngũ · Phân công & phản hồi |
| `vehicles` | Danh sách xe, giấy tờ, nhiên liệu, phân xe (không chia tab) |
| `accounting` | Tổng quan · Hóa đơn & thanh toán · Phải thu · Phải trả NCC · VAT · Chi phí & quyết toán · Lãi / lỗ theo tour · Dòng tiền · Chứng từ · **Tỷ giá** (chỉ vai trò có `fx_manage`: CEO, Kế toán) |
| `documents` | Kho tài liệu có bộ lọc (không chia tab) |
| `care` | Phản hồi, CSAT, phục hồi, review, referral |
| `approvals` | Chờ duyệt · Đã xử lý |
| `users` | Danh sách tài khoản (tìm kiếm, lọc vai trò/trạng thái, thêm, đổi vai trò, đặt lại mật khẩu, khóa/mở, liên kết HDV) |
| `settings` | Chính sách · **Tỷ giá** · Nhật ký · Vai trò & menu · Sao lưu |
| `guideapp` (HDV) | 6 chức năng: Tour được phân công · Thông tin khách hàng · Lịch trình tour · Phiếu dịch vụ · Thông tin khẩn cấp · Xác nhận phân công |

> Cổng HDV còn 3 tab nữa trong code (Lịch phân công · Báo cáo · Tạm ứng & chi phí) nhưng chỉ hiện với vai trò *không phải* HDV, mà không vai trò nào khác có menu `guideapp` → hiện **không truy cập được** (T6-04).

**Capabilities theo vai trò** (nguồn `businessRolePolicies.capabilities`):

| Vai trò (id) | Capabilities |
|---|---|
| ceo | `all` |
| marketing | marketing_manage, crm_manage, crm_scope_assigned |
| sales | crm_manage, customers_manage, tour_design_manage, quotes_manage, pricing_manage, bookings_manage, care_manage, documents_manage, sales_financials, crm_scope_assigned |
| operations | operations_manage, suppliers_manage, guides_manage, vehicles_manage, documents_manage, operations_costs, guide_switch_profile, care_manage |
| accounting | accounting_manage, documents_manage, document_sensitive, booking_financials, booking_receipts |
| guide | guide_portal |

> Capability `approvals_manage`, `users_manage` được code kiểm tra nhưng không gán cho vai trò nào ngoài `all` → thực tế chỉ CEO.

#### 3.5.3 Đối chiếu vai trò với yêu cầu khách (mục 1.2)

| Vai trò | Khách yêu cầu "chỉ thấy" | Code cho thấy | Kết luận |
|---|---|---|---|
| CEO | Toàn quyền | 17 menu + `all` | ✅ |
| Marketing | Leads, Campaign, Content, KPI | Dashboard + Tiếp thị (KPI/Chiến dịch/Nội dung) + CRM (Leads); không có tài chính | ✅ khớp |
| Sales | Leads, Khách hàng, Quotes, Booking; **không thấy Kế toán** | CRM, Khách hàng, Báo giá (bao gồm Điều chỉnh bảng giá), Booking, **Thiết kế tour** + **Dashboard, Tài liệu, CSKH**; không có menu Kế toán | ✅ phần chính, không thấy Kế toán. 🟡 Dashboard/Tài liệu/CSKH nằm ngoài danh sách (Thiết kế tour là bước của quy trình Sales nên hợp lý) → hỏi khách (T12-02) |
| Điều hành | Booking Confirmed, Supplier, Guide, Xe | Booking **đã lọc** Confirmed→Completed, Điều hành tour, NCC, HDV, Xe + **Dashboard, Tài liệu, CSKH** | ✅ lọc booking đúng. 🟡 Tài liệu/CSKH ngoài danh sách (T12-02) |
| Kế toán | Invoice, Payments, VAT, Debt | Kế toán (Hóa đơn & thanh toán, Phải thu, Phải trả, VAT…) + Dashboard + Tài liệu | ✅ khớp |
| HDV / Xe | Tour được giao, Khách, Lịch trình (+ Voucher, Emergency) | Cổng HDV 6 chức năng | ✅ cho HDV · ❌ **chưa có vai trò Xe/Tài xế** (T6-01) |

### 3.6 Mô hình dữ liệu (collections trong `state`)

| Collection | Mã | Nội dung |
|---|---|---|
| customers | `KH-2026-0001` | khách hàng/công ty |
| leads | `TN-` | khách tiềm năng, nguồn (`source` ∈ 9 nguồn chuẩn) + `sourceDetail` (tên CTV / ấn phẩm / đối tác B2B / hội chợ / ghi chú), nguồn CTV thêm `ctvType`/`ctvId`/`commissionRate` (%, mặc định 0), sales phụ trách, follow-up, welcomeEmail |
| quotes | `BG-` | báo giá nhiều phiên bản |
| bookings | `BK-` | đặt tour, `services[]` (dịch vụ NCC), `passengers[]`, hóa đơn/thu chi, `statusHistory` |
| suppliers | `NCC-` | NCC, điểm 4 tiêu chí, `prices[]` (bảng giá theo mùa) |
| guides | `HDV-` | hồ sơ HDV, lịch bận |
| vehicles | `XE-` | xe, sức chứa, giấy tờ, nhiên liệu |
| payables | `PC-` | công nợ phải trả NCC |
| transactions | `GD-` | giao dịch thu/chi |
| invoices | `HD-` | hóa đơn |
| vat | `VAT-` | chứng từ VAT vào/ra |
| docs | `TL-` | tài liệu: tệp mới chỉ lưu `path` (+ `size`, `mime`) trỏ vào `uploads/…`; tài liệu cũ còn `data` base64 (T0-05d) |
| issues | `SC-` | sự cố vận hành |
| customerServiceCases | `CS-` | hồ sơ chăm sóc sau tour |
| campaigns | `CD-` | chiến dịch marketing |
| contents | `ND-` | nội dung marketing |
| tourTemplates | `CT-` | tour mẫu: `itinerary` = mảng tiêu đề ngày (mẫu cũ chỉ có phần này); mẫu lưu từ 26/10 có thêm `program` = `[{title, text}]`; từ T3-03 có thêm `region` (khu vực), `country`, `type` (loại tour), `owner`, `createdAt`, `updatedAt` (mẫu cũ thiếu các trường này: khu vực suy từ tên/quốc gia, không có `owner` → chỉ CEO sửa/xóa) |
| tourDays | `NG-2026-0001` (ổn định, không đánh lại số) | ngân hàng ngày tour: `{id, title, text, language, services:[{cat, name}], owner, createdAt, updatedAt}` — dùng chung cho Sales, **không có điểm đến**; ghép vào tour là **sao chép** nên sửa/xóa ngày trong ngân hàng không đổi tour đã ghép |
| drafts | — | bản nháp thiết kế tour |
| approvals | `PD-2026-0001` (ổn định) | yêu cầu phê duyệt |
| auditLogs | `NK-2026-0001` (ổn định, tối đa 600) | nhật ký thao tác |
| activities | — | hoạt động gần đây (tối đa 80) |
| settings | — | `[0]` = danh mục + chính sách |

- Mã nghiệp vụ dạng `TIỀNTỐ-NĂM-4SỐ`, sinh bằng `nextBusinessId(collection, date)`; `normalizeBusinessIds()` đánh lại mã và cập nhật tham chiếu chéo khi tải dữ liệu — **thêm collection có tham chiếu tới collection khác thì phải bổ sung phần remap ở hàm này**.
- Tiền trong dữ liệu **hiện là số nguyên VND** (`money()` định dạng `vi-VN` + " ₫"; `short()` rút gọn tr/tỷ). *Đây là hiện trạng, KHÔNG phải quy ước cố định: yêu cầu khách là USD làm tiền chung + tỷ giá VCB (mục 1.4 điểm 7, EPIC 1) nên cách lưu tiền sẽ phải đổi — đừng viết thêm code giả định mãi là VND.* Ngày: chuỗi `YYYY-MM-DD` (`fmt()` hiển thị `dd/mm/yyyy`).

### 3.7 Máy trạng thái & chính sách (trong `workflow.js`)

- **Lead:** `NEW → CONTACTED → QUALIFIED → QUOTE SENT → NEGOTIATION → WON`, nhánh `LOST`, `UNQUALIFIED`.
- **Quote:** `Draft → PendingApproval → Sent → Accepted | Rejected`.
- **Booking:** `PendingDeposit → PendingApproval → Confirmed → Preparing → Running → Completed | Cancelled`.
- **Dịch vụ NCC:** `NOT_BOOKED → WAITING → CONFIRMED | REJECTED | CANCELLED`.
- **Phê duyệt (CEO):** `QUOTE_PRICE, NO_DEPOSIT, COST_OVERRUN, CANCEL, REFUND`; trạng thái `PENDING/APPROVED/REJECTED`.
- **Chính sách mặc định** (CEO chỉnh trong *Cài đặt*): biên lợi nhuận tối thiểu 15%, chiết khấu tối đa 10%, cọc 30%, vượt dự toán 5%, quyết toán trong 7 ngày, báo giá hiệu lực 14 ngày, hoàn tiền 90%/50%/20% (trước 30/15/7 ngày).
- `workQueue()` tạo "Hộp việc"/thông báo theo vai trò.

### 3.8 Bản đồ phân hệ ↔ file

| Màn hình (`id`) | File | Ghi chú |
|---|---|---|
| dashboard | mod-dashboard.js | khác nhau theo vai trò (CEO/Marketing/Sales/Điều hành/Kế toán); biểu đồ tự vẽ bằng SVG/HTML, **không dùng Chart.js** |
| marketing | mod-marketing.js | chiến dịch, nội dung, KPI |
| crm | mod-crm.js | lead, funnel, follow-up, email chào mừng (ghi nhận thủ công) |
| customers | mod-customers.js | hồ sơ, hạng khách, nhắc chăm sóc |
| design | mod-design.js + css/mod-design.css | thiết kế tour 5 bước; kéo–thả đổi thứ tự ngày (`designDayCard`, `designDrop`…); chi tiết chương trình (`designDetail*`); xóa nháp (`designDeleteDraft`) |
| (design) tour mẫu | mod-tourtemplates.js + css/mod-tourtemplates.css | tab *Mẫu tour có sẵn* ở bước chọn mẫu: dòng mẫu (`tplRow`), thanh công cụ (`tplToolbar`), form thêm/sửa (`tplForm`, `tplSave`), xóa (`tplDelete`), nhập CSV (`tplImportOpen`, `tplImportFile`, `tplBuildImport`, `tplImportConfirm`), xuất/CSV mẫu (`tplExportAll`, `tplDownloadSample`) |
| (design) ngân hàng ngày | mod-tourdays.js + css/mod-tourdays.css | kho ngày tour: tab *Ngân hàng ngày* ở bước chọn mẫu (`tourDayManagePanel`), hộp thoại nhặt ngày (`tourDayPicker`), form thêm/sửa (`tourDayForm`, `saveTourDay`), ghép vào lịch trình (`tourDayAppend`) |
| quotes | mod-quotes.js | phiên bản, duyệt giá, gửi mail (mailto), in PDF (cửa sổ in), chuyển Booking |
| bookings | mod-bookings.js | Booking 360°, khách đi tour, in hợp đồng, miễn cọc, hủy |
| operations | mod-operations.js | tiếp nhận, đặt dịch vụ NCC, lịch, voucher, bắt đầu/kết thúc tour, sự cố |
| suppliers | mod-suppliers.js | danh sách, điểm NCC, bảng giá theo mùa, công nợ NCC |
| guides | mod-guides.js | hồ sơ, lịch trống, phân công, xác nhận/từ chối |
| vehicles | mod-vehicles.js | xe, giấy tờ, nhiên liệu, phân xe |
| accounting | mod-accounting.js | hóa đơn, thu tiền, công nợ, VAT, dòng tiền, quyết toán, lãi/lỗ, khóa kỳ |
| documents | mod-documents.js | kho tài liệu, voucher/rooming; tải tệp qua `uploadFile()` |
| care | mod-care.js | phản hồi, CSAT, phục hồi, review, referral |
| approvals | mod-approvals.js | hàng chờ CEO |
| users / settings | mod-admin.js | người dùng, chính sách, nhật ký, vai trò, sao lưu (tab Tỷ giá gọi `fxRatesPanel()`) |
| (dùng chung) tỷ giá | mod-fx.js | tỷ giá VCB: dữ liệu (lịch sử ở collection riêng `fxHistory`), chuyển dữ liệu cũ, tự cập nhật, nhập tay, bảng + lịch sử; hiển thị ở Cài đặt và Kế toán |
| guideapp | mod-guideapp.js | cổng HDV (mobile-first) |
| (không nạp) ai, help | mod-ai.js, mod-help.js | xem T0-06 |

### 3.9 Hàm/UI dùng chung (tái sử dụng, đừng viết lại)

- Khung: `title(h1, mô tả, nút)`, `card(tiêu đề, body, extra)`, `table(headers, rows)` (tự phân trang 10 dòng), `stat(label, value, meta)`, `badge(text, tone)`, `btn(text, onclick, cls)`, `field(name,type,value,required)`, `line(label, value)`.
- Hộp thoại/thông báo: `modal(title, html, narrow)`, `closeModal()`, `toast(text)`.
- Điều hướng: `go(pageId)`, `goTo/entityLink/navigate` (liên kết tới bản ghi), `render()`.
- Dữ liệu: `findLead/findQuote/findBooking/findSupplier/findGuide/findInvoice/findCampaign`, `nextBusinessId`, `nextStableId`.
- Ghi vết: **`audit(entity, id, action, summary)`** (ghi nhật ký + hoạt động), `pushHistory(record, entry)`.
- Xuất: `exportData(kind)` (CSV, có chống CSV injection), `printable(title, bodyHtml)` (mở cửa sổ in/lưu PDF), `downloadFile`.
- An toàn: **luôn dùng `esc()` khi chèn dữ liệu vào HTML.**
- Mẫu viết một màn hình: `views.tên = () => title(...) + ...;` rồi đăng ký trong `pages` (+ `navGroups`, `businessRolePolicies`). Mẫu form: `modal("Tiêu đề", '<form onsubmit="saveX(event)">…</form>')`, hàm `saveX(e){ e.preventDefault(); const f=new FormData(e.target); …; audit(...); save(); closeModal(); render(); }`.

### 3.10 Cạm bẫy đã biết (đọc trước khi sửa)

1. **`localizeUI()` tự dịch chữ tiếng Anh sang tiếng Việt trên toàn DOM** (bảng `uiTranslations` trong `app.core.js`), kể cả dữ liệu người dùng nhập (ví dụ chữ "Guide", "Final", "Name" có thể bị đổi). Khi thêm nhãn mới: viết tiếng Việt luôn; khi dữ liệu hiển thị lạ, nghi ngờ bảng này.
2. **Quyền do code ghi đè DB** (mục 3.5).
3. **Tên có dấu trong `cut`/shell:** khi dùng công cụ dòng lệnh để cắt dòng, đừng cắt theo byte với UTF-8.
4. **CRLF:** toàn bộ file nguồn dùng CRLF (`\r\n`). Giữ nguyên khi sửa. `git status` có thể báo hàng loạt file "modified" chỉ vì khác kiểu xuống dòng — không phải thay đổi thật.
5. `chart.js`, `tailwind.js`, `jszip.min.js` nằm trong `assets/` nhưng chưa được nạp; Tailwind và JSZip chưa được code nào dùng. Đừng giả định chúng có sẵn trên trang.
6. Tên cột/trường lưu trong JSON dùng tên tiếng Anh viết liền (camelCase) — giữ nhất quán.
7. Hiệu năng: mỗi lần đổi dữ liệu ghi lại **cả collection**. Tệp mới đã lưu ra `uploads/` (không còn base64); tài liệu cũ còn base64 sẽ làm phình cho tới khi chuyển (T0-05d).
8. **Hai cây mã nguồn trong git** (mục 3.2): chỉ cây phẳng (`js/*.js`, `css/mod-*.css`) được nạp. Sửa nhầm vào `js/modules/…`, `js/core/…` thì giao diện không đổi. Trước khi sửa luôn kiểm tra file đó có trong thẻ `<script>`/`<link>` của `index.html` không.
9. **Phạm vi dữ liệu theo tên** (mục 3.5): đổi `fullName` của một tài khoản sẽ làm mất liên kết với lead/booking cũ (`sales`, `operator` lưu bằng tên) và phạm vi giới hạn. Đổi tên người dùng → đổi cả danh mục owners.
10. **Nhiều lệnh trên một dòng và dòng rất dài:** demo có nhiều chỗ như vậy (ví dụ `workflow.js` dòng ~322 và ~662; hàng trăm dòng JS dài hơn 200 ký tự). Đó là nợ cũ, **không bắt chước** — luật ở mục 5.12.
11. **Thẻ `<aside>` là sidebar ứng dụng:** `css/style.css`/`erp-modern.css` gán cho thẻ `aside` trần `position: fixed` ở mép trái, rộng `--sidebar-w`, `z-index: 30`. **Đừng dùng thẻ `<aside>` làm cột phụ trong modal/màn hình** — dùng `<div class="…">` (ví dụ `tour-detail-side`). Nếu buộc dùng, phải ghi đè `position/inset/width/height` như `.account-profile-card` ở `erp-modern.css`. (`travel-auth.js` còn một `<aside class="account-profile-card">` đã có ghi đè.)
12. **Nội dung modal tự đặt trong `.modal` phải được cho phép cuộn:** `.modal` là flex cột `overflow: hidden` (`erp-v4.css`), chỉ `form`, `booking360`, `quote-detail`… cuộn sẵn. Khối mới (ví dụ `.tour-detail`, `.tour-day-picker`) phải tự thêm `body .modal > .tên { min-height: 0; overflow-y: auto; }`, nếu không phần dưới bị cắt. Ngoài ra `style.css` cho mọi `input` rộng 100% — ô tích (`checkbox`) trong hàng flex phải ép lại `width: 16px` (xem `mod-tourdays.css`).

---

## 4. HIỆN TRẠNG DEMO SO VỚI YÊU CẦU

Ký hiệu: ✅ đã có · 🟡 có một phần · ❌ chưa có · ⏳ chờ khách.

| # | Yêu cầu | Trạng thái | Hiện có / thiếu gì |
|---|---|---|---|
| 1 | Phân quyền 6 vai trò | ✅ | 6 vai trò khớp bảng 1.2 (CEO, Marketing, Sales, Điều hành, Kế toán, HDV) + 22 tài khoản mẫu khớp quy mô khách (mục 3.5.1–3.5.3). Chưa có vai trò **Xe/Tài xế** (T6-01) |
| 2 | CEO dashboard có biểu đồ | 🟡 | Có dashboard theo vai trò, biểu đồ SVG tự vẽ. Chưa theo **form mẫu khách gửi Zalo** ⏳ (T7-01) |
| 3 | Nguồn lead đa kênh (9 nguồn) | ✅ | Xong T2-01 (23/10): 9 nguồn chuẩn + chi tiết theo nguồn (`sourceDetail`), tự chuẩn hóa dữ liệu cũ. Chưa chạy thử trên trình duyệt (T2-01b). CTV liên kết HDV/khách cũ + hoa hồng + thống kê theo CTV: xong T2-02 (23/10, chưa chạy thử → T2-02b); báo cáo theo nguồn → T2-03 |
| 4 | Lead từ web tự động | ❌ | Chỉ có form nhập tay mô phỏng "lead website"; email chào mừng chỉ **ghi nhận đã gửi**, không gửi thật (T10-01) |
| 5 | Tour mẫu | ✅ | Xong T3-03 (26/10): thêm/sửa/xóa mẫu, phân loại khu vực/quốc gia/loại tour, nhập mẫu có sẵn từ tệp CSV, xuất CSV. Chưa chạy thử trong ứng dụng thật (T3-03b). Mẫu cũ chỉ có tiêu đề, không mô tả ngày |
| 6 | Kéo–thả đổi thứ tự ngày | ✅ | Xong T3-01: chế độ "Sắp xếp" làm các ngày chỉ đọc và kéo thả ở bất kỳ đâu trên thẻ (`designDrag*`, `designDrop`) + vạch báo vị trí thả; giữ nút lên/xuống cho cảm ứng. Chưa chạy thử trên trình duyệt (T3-01b) |
| 7 | Ngân hàng ngày tour, nhặt ghép | ✅ | Xong T3-02 (26/10): kho `tourDays`, nhặt từng ngày hoặc cả tour mẫu để ghép; không có điểm đến. Chưa chạy thử trên trình duyệt, cần tạo bảng KIO `typicone_tour_days` (T3-02b) |
| 8 | AI dịch tour đa ngôn ngữ | 🟡 | Có chọn ngôn ngữ; bản dịch là dữ liệu tĩnh `translations` trong settings, **không có AI** (T3-06, T9-02) |
| 9 | Giá theo ngày / cả tour, nhập tay hoặc dùng bảng giá | 🟡 | Có trang **Điều chỉnh bảng giá** nằm trong nhóm **Báo giá**, hiển thị dạng bảng với tên báo giá, số mức giá, thời gian cập nhật và nút Xem/Sửa/Xóa dưới cột Hành động. Modal Xem hiển thị các mức giá. Khi thiết kế tour, chọn cơ sở tính **theo ngày** hoặc **cả tour**, rồi chọn cách nhập **giá mỗi khách** hoặc **sử dụng bảng giá**. Bảng giá có các mức pax tùy chọn (bắt buộc mức 1), áp dụng mức có ngưỡng khách lớn nhất mà số khách tour ≥ ngưỡng đó (ví dụ mức 5 áp dụng từ 5 khách trở lên; fallback mức 1 nếu không có mức phù hợp). Giá lưu nội bộ VND, nhập/hiển thị theo tiền đang chọn, mặc định USD khi có tỷ giá VCB. Chưa kiểm thử trình duyệt/KIO thật. |
| 10 | Tiền chung USD, tỷ giá VCB, đổi EUR/VND/CAD | 🟡 | Hệ thống tính bằng **VND**; thiết kế tour có nút VND/ngoại tệ với `rate` **nhập tay**, mặc định 26000. **Đã có bảng tỷ giá VCB (T1-01), hiển thị + nhập USD mặc định ở thiết kế tour/báo giá (T1-02, T1-02b), tra tỷ giá theo ngày tạo chứng từ + bản in/email USD (T1-03, 22/10)**; **hóa đơn USD + thu tiền đa tiền tệ (T1-04, 23/10)**; **phải trả/quyết toán/lãi lỗ/dòng tiền/dashboard/duyệt giá/CRM/hợp đồng in (T1-04b, 23/10)**; còn: VAT (T1-04d) |
| 11 | Tour ghép (SIC) | ❌ | (T3-07) |
| 12 | AI nhập khách từ ảnh hộ chiếu | ❌ | Khách đi tour nhập tay (`passengerForm`) (T3-08) |
| 13 | Form tour theo mẫu | ⏳ | Khách sẽ gửi sau (T3-09) |
| 14 | Hợp đồng sau khi cọc | 🟡 | Từ 22/10: khi booking đủ điều kiện xác nhận (nhận đủ cọc hoặc CEO miễn cọc) hệ thống tự tạo **bản ghi** Contract trong Tài liệu (`ensureBookingContract`, `workflow.js`). Bản ghi chỉ có tên + ngày (`generated: true`) — **chưa có nội dung, mẫu, số hợp đồng, tệp**. Vẫn còn nút "In hợp đồng" thủ công (`printContract`) (T3-10) |
| 15 | Báo giá nhiều phiên bản, duyệt, PDF, email | ✅/🟡 | Có đủ; PDF qua hộp thoại in, email qua `mailto:` (không đính kèm) (T3-11) |
| 16 | Quy trình Won → Điều hành → Voucher → Chạy → Hoàn tất | ✅ | Có (operations + bookings) |
| 17 | Điều hành phân hệ 1: đặt dịch vụ | 🟡 | Có đặt/xác nhận/từ chối NCC. Loại dịch vụ phụ thuộc `serviceTypes` trong DB — cần đối chiếu với danh sách khách (T4-01) |
| 18 | Phân hệ 2: theo dõi đã đặt/chưa | 🟡 | Có checklist & tab dịch vụ theo tour; chưa có bảng nhìn chung mọi tour (T4-03) |
| 19 | Phân hệ 3: nhập liệu NCC | 🟡 | Có hồ sơ NCC, điểm, bảng giá theo mùa (Quanh năm/Cao điểm/Thấp điểm + khoảng ngày). **Thiếu:** nhiều người liên hệ, loại phòng có cấu trúc, khuyến mại, file hợp đồng, nhập hàng loạt (T4-04…T4-09) |
| 20 | Điểm NCC 40/30/20/10 | ✅ | `score()` trong `mod-suppliers.js` |
| 21 | AI hỗ trợ nhập liệu NCC | ❌ | (T9-04) |
| 22 | HDV: hồ sơ, lịch, phân công, xác nhận | ✅ | Có, kèm thẻ HDV, ngôn ngữ, địa bàn, giá/ngày |
| 23 | App HDV | 🟡 | Có cổng **web mobile-first** với đúng 6 chức năng khách yêu cầu (Tour được phân công, Khách, Lịch trình, Voucher/Phiếu dịch vụ, Khẩn cấp, Xác nhận phân công). Không phải app native/PWA. 3 tab Lịch phân công / Báo cáo / Tạm ứng & chi phí có trong code nhưng HDV không thấy (T6-04) |
| 24 | Xe 7–47 chỗ | 🟡 | Có xe + sức chứa + kiểm tra lịch/giấy tờ; loại xe/hãng chưa tách |
| 25 | Kế toán: hóa đơn, thu, VAT, công nợ, dòng tiền, quyết toán | ✅ | Có (mod-accounting) |
| 26 | Thu đa tiền tệ USD/EUR/VND | ❌ | Ô "Số tiền thu" là VND (T5-01) |
| 27 | OnePay / VNPAY / quốc tế / nội địa / tiền mặt | 🟡 | Có chọn phương thức thu (Chuyển khoản, Tiền mặt, …); chưa phân loại đủ, chưa tích hợp cổng (T5-02) |
| 28 | VAT đầu ra ↔ tiền về; VAT đầu vào ↔ trả NCC | 🟡 | Có nhập VAT vào/ra; chưa đối soát liên kết (T5-03, T5-04) |
| 29 | Hạn cọc & quyết toán NCC | ✅/🟡 | Có `payables.due`, duyệt, trả; cần xem nhắc hạn (T5-05) |
| 30 | Lãi/lỗ từng tour, từng dịch vụ | 🟡 | Có theo tour và theo tháng; **chưa theo dịch vụ** (T5-06) |
| 31 | Document Center | 🟡 | Có kho tài liệu, voucher, rooming list; từ 22/10 tệp tải lên lưu ở `uploads/`, database chỉ giữ đường dẫn (T0-05; còn T0-05c/d/e, EPIC 11) |
| 32 | CSKH: feedback, CSAT, review, referral | ✅ | Có (mod-care) |
| 33 | Phê duyệt CEO, nhật ký, người dùng, chính sách | ✅ | Có (ngoài yêu cầu khách, nhưng đã làm) |
| 34 | AI: itinerary builder, quotation, dịch, phân công, phân tích lợi nhuận, marketing | ❌ | `mod-ai.js` là thuật toán mô phỏng, **chưa nạp** (EPIC 9) |
| 35 | KPI Marketing: Traffic, CPL | 🟡 | Có lead/CPL theo chiến dịch; Traffic cần nguồn dữ liệu (T2-06) |

### 4.1 Đối chiếu demo ↔ yêu cầu (rà soát 22/10/2026, commit `71f2b33`)

> Dựa trên đọc code + `grep` từ khóa. **Chưa chạy thử trên trình duyệt, chưa xem dữ liệu thật trong KIO.** Mã `L…` là mã lỗi/lệch để tham chiếu trong task.

**A. Đã làm và ĐÚNG so với yêu cầu**

1. Phân quyền: 6 vai trò, menu từng vai trò khớp danh sách "chỉ thấy" của khách (bảng 3.5.3). Sales **không có** menu Kế toán; Marketing không có quyền tài chính.
2. Số tài khoản khớp quy mô khách: 1 CEO + 5 Sales + 2 Điều hành + 3 Marketing + 1 Kế toán + 10 HDV = 22 (`travel-auth.js`).
3. Điều hành chỉ thấy booking đã xác nhận trở đi (`bookingOpsStatuses` = Confirmed/Preparing/Running/Completed).
4. HDV chỉ thấy tour được giao cho mình; cổng HDV có đủ Tour · Khách · Lịch trình · Phiếu dịch vụ · Khẩn cấp · Xác nhận phân công.
5. Marketing có đủ KPI · Chiến dịch · Nội dung + Leads (qua CRM). Kế toán có Hóa đơn & thanh toán · Phải thu · Phải trả NCC · VAT · Quyết toán · Lãi/lỗ theo tour · Dòng tiền · Chứng từ.
6. Pipeline lead; luồng Booking (chờ cọc → xác nhận → bàn giao điều hành → chạy → hoàn tất); trạng thái dịch vụ NCC; điểm NCC 40/30/20/10 (`mod-suppliers.js`).
7. Dashboard riêng theo vai trò (CEO / Kế toán / Điều hành / Sales / Marketing), biểu đồ tự vẽ bằng SVG.
8. Ngoài yêu cầu nhưng hợp lý: phê duyệt CEO, nhật ký thao tác, chính sách nghiệp vụ, sao lưu JSON, chặn khóa/đổi vai trò tài khoản quản trị cuối cùng.

**B. LỆCH hoặc SAI so với yêu cầu / so với claude.md cũ**

| Mã | Vấn đề | Bằng chứng | Xử lý |
|---|---|---|---|
| L1 | **Tiền tệ sai hướng:** hệ thống tính VND; đổi sang ngoại tệ bằng `rate` **nhập tay** (mặc định 26000); không có USD chung; *(đã xử lý ở T1-01…T1-03: bảng tỷ giá VCB, USD chung cho hiển thị và nhập, bỏ `rate` nhập tay, tra tỷ giá theo ngày; hóa đơn USD + thu tiền đa tiền tệ T1-04; phải trả/quyết toán/lãi lỗ/dòng tiền… T1-04b; còn VAT T1-04d)* | `mod-design.js` dòng ~27, ~37 | EPIC 1 (T1-01…T1-04) |
| L2 | **Mật khẩu:** 22 tài khoản mẫu dùng `123456` và **không bắt đổi** (`mustChangePassword: false`); nút chọn nhanh vai trò tự điền `123456` | `travel-auth.js` (`ensureRequiredTeamAccounts`, `selectLoginRole`), `mod-admin.js` | T0-04, T0-11 |
| L3 | **Phạm vi dữ liệu so tên:** tài khoản mẫu tên "Nhân viên Sales 01"… — nếu danh mục `crmOwners`/`operationOwners`/`marketingOwners` trong DB chưa có đúng tên, Sales/Điều hành/Marketing thấy rộng hơn dự định và **không có cảnh báo** | `workflow.js` `scopedLeads/Bookings`, `myName()` | T0-12 |
| L4 | **HDV chưa gắn hồ sơ:** 10 tài khoản HDV có `guideId` rỗng → cổng HDV báo "chưa liên kết" cho tới khi liên kết tay | `travel-auth.js`, `mod-guideapp.js` `guidePortalEmpty` | T0-12 |
| L5 | **Menu ngoài danh sách khách:** Sales và Điều hành có thêm Dashboard, Tài liệu, CSKH (Sales còn có Thiết kế tour) | `businessRolePolicies.menus` | T12-02 (hỏi khách) |
| L6 | **Tab HDV không truy cập được:** Lịch phân công / Báo cáo / Tạm ứng & chi phí (docx không yêu cầu) | `mod-guideapp.js` dòng ~116 + không vai trò nào khác có menu `guideapp` | T6-04 |
| L7 | **Hai cây mã nguồn trùng trong git;** thông báo trong `travel-api.js` trỏ về README đã xóa (đã sửa ở T0-02b ngày 22/10) | `git ls-files`, `travel-api.js` ~193 | T0-10 |
| L8 | `?v=` trong `index.html` chỉ có 5 thẻ, dạng số nguyên, sai quy ước | `index.html` | T0-01 |
| L9 | `mod-ai.js`, `mod-help.js` vẫn không được nạp | `index.html` | T0-06 |
| L10 | Hợp đồng chỉ là bản ghi rỗng (không nội dung/mẫu/tệp) | `workflow.js` `ensureBookingContract` | T3-10 |
| L11 | Mã nguồn có nhiều dòng quá dài / nhiều lệnh một dòng, CSS nén một dòng — khó đọc, khó review | thống kê mục 5.12 | Luật 5.12 + T0-13 |

**C. THIẾU hẳn (đã `grep` không thấy trong code)**

Kéo–thả đổi thứ tự ngày (chỉ có nút lên/xuống) · Tour ghép SIC · AI/OCR nhập khách từ hộ chiếu · USD chung + tỷ giá VCB + thu nhiều tiền tệ · OnePay/VNPAY · Landtour đối tác · khuyến mại NCC · loại phòng có cấu trúc · đăng nhập Google / lưu Google Drive / email Gmail thật · gọi AI thật · form web tự tạo lead · vai trò Xe/Tài xế. (Chi tiết và mã task: bảng mục 4 phía trên và mục 6.)

### 4.2 Điểm trong claude.md từng đi ngược / lệch yêu cầu (đã rà 22/10/2026 và đã sửa tại chỗ)

| # | Nội dung cũ trong claude.md | Vấn đề | Đã xử lý |
|---|---|---|---|
| 1 | Mục 0, 5.1.1: "Mọi công nghệ docx bị BỎ QUA, chỉ giữ nghiệp vụ" | docx mục 3 và "ERP V1" có **năng lực** khách có thể mong đợi: Google Login + Role Permission, Google Drive (Document Center), Gmail Workspace, OpenAI, Make.com, app mobile HDV. Bỏ cả khối dễ làm mất yêu cầu ngầm | Sửa câu chữ mục 0: bỏ **stack**, giữ **năng lực**. Quyết định "giữ web tĩnh + KIO" **không đổi**. Hỏi khách ở mục 8.1 |
| 2 | Đầu file: "thay thế hoàn toàn file docx (đã không còn)" | docx đã có lại; nếu hai bên khác nhau thì docx là gốc | Sửa đầu file |
| 3 | 3.6: "Tiền trong dữ liệu: số nguyên VND" như quy ước | Trái yêu cầu USD là tiền chung (1.4 điểm 7) | Đổi thành "hiện trạng, sẽ đổi" |
| 4 | 3.5: "`mustChangePassword` bắt đổi ở lần đầu" | Code mới đặt `false` | Sửa mô tả đúng hiện trạng; thêm T0-11 |
| 5 | 3.2 / 3.3 / 3.8: cây `js/core`, `js/modules`, `mod-crm-sales`, `quote-engine`… | Cây đó không còn được nạp | Viết lại theo cây phẳng, thêm bảng đổi tên |
| 6 | 5.3, T0-01, 8.2: "`index.html` chưa có `?v=`" | Thực tế có 5 thẻ, sai dạng | Sửa mô tả, viết lại T0-01 |
| 7 | Dòng 23 của mục 4: cổng HDV có "báo cáo, tạm ứng/chi phí" | HDV không thấy 3 tab đó | Sửa dòng 23, thêm T6-04 |
| 8 | T0-02b ghi `[x]` | Sửa đổi nằm ở cây cũ, bản `main` mới không có | Mở lại `[ ]` |
| 9 | 5.1.4: "không tiện tay format lại" | Xung đột nhẹ với luật định dạng mới | Thống nhất ở 5.12: luật áp dụng cho code **viết mới / đoạn đang sửa** |
| 10 | Chưa ghi số tài khoản, menu theo vai trò, menu của CEO | Người dùng cần để làm nhanh | Thêm 3.5.1–3.5.3 |
| 11 | Chưa ghi chỗ docx **tự mâu thuẫn**: (a) Điều hành "chỉ thấy Booking Confirmed, Supplier, Guide, Xe" nhưng Tour Dashboard của Điều hành lại có **Cost, Profit**; (b) hai phiên bản trạng thái lead | (a) chưa rõ Điều hành có xem lợi nhuận không; (b) claude.md đã gộp đúng | Thêm câu hỏi (a) vào 8.1 |
| 12 | 3.3: "`?v=` chỉ có ở 5 thẻ, số nguyên" | `index.html` đã có thêm thẻ `?v=20261022.N` | Viết lại ghi chú 3.3 theo hiện trạng |

---

## 5. QUY ĐỊNH LÀM VIỆC (BẮT BUỘC)

### 5.1 Nguyên tắc chung

1. **Không đổi công nghệ.** Giữ web tĩnh thuần + KIO. Không thêm framework, không thêm bước build, không chuyển sang NextJS/Laravel/PostgreSQL/Make.com. Muốn thêm thư viện: chỉ khi thật cần, đặt file nội bộ vào `assets/vendor/` (không tải từ CDN lúc chạy), nạp bằng `<script>` thường, ghi chú dưới task liên quan.
2. **Làm theo cách đang có:** dùng lại hàm dùng chung ở mục 3.9, đặt tên/camelCase/kiểu viết như file xung quanh, mỗi phân hệ một file `mod-*.js`.
3. **Giao diện tiếng Việt**, văn phong ngắn gọn. Không để chữ tiếng Anh lẫn lộn (xem cạm bẫy `localizeUI`).
4. **Sửa tối thiểu, đúng phạm vi:** chỉ động vào file cần thiết cho task. Không "tiện tay" format lại, đổi tên, dọn code ngoài yêu cầu. **Nhưng** code mình viết mới và đoạn/hàm mình đang sửa phải theo luật định dạng ở mục 5.12.
5. **Mọi chuỗi chèn vào HTML phải qua `esc()`.**
6. **Mọi thao tác ghi dữ liệu:** kiểm tra quyền (`requireCapability`/`can`) → thay đổi `state` → `audit(...)` → `save()` → cập nhật giao diện (`render()` hoặc hàm refresh của màn hình).
7. **Không tự thêm tính năng ngoài yêu cầu.** Nếu thấy cần, ghi vào mục 6 dưới dạng task mới để người dùng quyết.
8. **Không bịa dữ liệu khách chưa cung cấp** (mẫu form, tỷ giá, danh mục). Đánh dấu ⏳ và hỏi (mục 8).
9. **Phải đọc code liên quan trước khi sửa** — bảng mục 4 là ghi chú, không thay được việc đọc code.

### 5.2 Mã hóa ký tự & xuống dòng

- File **UTF-8**, xuống dòng **CRLF** (như hiện tại). Khi tạo/sửa file bằng công cụ, kiểm tra lại bằng `file <tên>`; file mới phải là CRLF cho đồng nhất.
- Không thêm BOM.
- Riêng `claude.md` dùng LF (như hiện tại).
- **`.gitattributes` (T0-07):** git lưu LF, checkout ra `.html/.css/.js/.svg` là CRLF; `.php`, `.htaccess`, `.md` giữ LF. Nhờ đó `git status` không còn báo "modified" hàng loạt do EOL. File mới thuộc các loại trên cứ viết đúng EOL như quy định; không cần cấu hình `core.autocrlf`.

### 5.3 Cache-busting `?v=` trong index.html

**Hiện trạng (22/10):** chỉ 5 thẻ trong `index.html` có `?v=` và dùng số nguyên (`mod-guideapp.css?v=2`, `travel-config.js?v=3`, `travel-auth.js?v=2`, `app.core.js?v=2`, `app.js?v=2`); các thẻ khác chưa có (việc đầu tiên: T0-01). Trình duyệt sẽ giữ bản cũ của JS/CSS nếu không đổi URL, nên quy ước dưới đây là bắt buộc.

- Mọi thẻ `<link rel="stylesheet">` và `<script src>` **nội bộ** (css/…, js/…) phải có dạng: `...file.js?v=YYYYMMDD.N`
  (ví dụ `js/mod-quotes.js?v=20261022.1`). `N` bắt đầu từ 1 và tăng trong cùng một ngày.
- **Sửa file nào thì tăng `?v=` của đúng thẻ đó** trong `index.html`. Không tăng cho file không đổi. (Nếu người dùng yêu cầu "tăng đồng loạt", mới tăng toàn bộ.)
- **Thêm file CSS/JS mới:** thêm thẻ vào `index.html` đúng vị trí thứ tự nạp (mục 3.3), kèm `?v=`.
- **Không** gắn `?v=` cho tài nguyên bên ngoài (Google Fonts, `kio.dvqt.vn/krud.js`).
- Sửa `index.html` thì file này luôn nằm trong gói zip giao.
- Nếu một thay đổi chỉ nằm trong `assets/` (ảnh, font) và tên file giữ nguyên, tăng `?v=` ở thẻ tham chiếu tới nó (nếu có thẻ).

### 5.4 Cách giao file (zip)

- **Chỉ zip các file có thay đổi hoặc mới**, **giữ nguyên đường dẫn thư mục** bên trong zip (để người dùng giải nén đè lên thư mục dự án), **kèm `claude.md` đã cập nhật** và **`index.html` nếu có tăng `?v=`**.
- **Không** đưa vào zip: `.git/`, file không đổi, `assets/` không đổi (chart.js, tailwind.js, fa/, vendor/…).
- Tên zip: `travel_patch_YYYYMMDD_NN.zip` (NN = số thứ tự trong ngày, 01, 02…).
- **Không** đưa vào zip nội dung thư mục `uploads/` (dữ liệu thật trên máy chủ) và khi giải nén đè **không xóa** `uploads/`.
- Xóa file: nếu task yêu cầu xóa file, **ghi rõ danh sách file cần xóa** trong câu trả lời và trong ghi chú dưới task liên quan (zip không thể xóa file giúp).
- Khi trả lời, **liệt kê danh sách file trong zip** (đường dẫn + 1 dòng mô tả thay đổi) và các bước người dùng cần làm thêm (ví dụ tạo bảng KIO mới).
- Nếu task đụng tới **dữ liệu/bảng KIO** (collection mới, trường mới cần migrate): nêu rõ trong câu trả lời, vì code không tự tạo bảng.

### 5.5 Ghi chép công việc (không có nhật ký riêng)

- **Không còn mục Nhật ký.** Làm gì thì ghi **trực tiếp ngay dưới dòng đầu của task đó ở mục 6** (đoạn in nghiêng ngay sau tiêu đề task), rồi **tick `[x]`**. Task làm dở: để `[ ]`, ghi "đang dở: còn thiếu …".
- **Chỉ ghi đủ để lúc sau biết hệ thống đang như thế nào:** (a) hiện có gì và hoạt động ra sao (hàm/file chính, cách dùng); (b) quyết định hay giới hạn ảnh hưởng tới việc sau; (c) còn thiếu gì, chưa chạy thử gì; (d) việc người dùng phải làm (tạo bảng KIO, đặt file lên máy chủ…). **Không ghi** lịch sử từng lần sửa, ngày giờ từng bước, kết quả test chi tiết, danh sách `?v=` đã tăng.
- Sửa lại một việc đã ghi thì **sửa đoạn ghi chú cũ cho đúng hiện trạng**, không thêm đoạn "lần 2". Việc chưa có task thì thêm task mới (đánh số tiếp) rồi ghi dưới đó.
- Thay đổi ảnh hưởng nhiều nơi (cấu trúc thư mục, dữ liệu, quyền, quy ước chung) → **sửa thẳng mục 3/4 cho đúng hiện trạng**, không chỉ ghi ở task.
- Mục 6 chỉ **thêm** task mới, không xóa task cũ; task bỏ thì gạch bằng `~~...~~` và ghi lý do.
- Quyết định quan trọng (đổi cách làm, chọn phương án) ghi vào mục 8 → chuyển thành "Đã quyết định" kèm ngày.

### 5.6 Thêm một phân hệ/màn hình mới — checklist

1. `js/mod-<tên>.js` (hoặc thêm vào module cùng nhóm nếu nhỏ), định nghĩa `views.<id> = () => ...`.
2. `js/app.core.js`: thêm vào `pages` (`[id, ký hiệu, nhãn]`), vào `navGroups`/`navigationGroups()`, thêm icon trong `sidebarIcon()`, và gán `menus` + `capabilities` trong `businessRolePolicies` cho đúng vai trò.
3. `index.html`: thêm `<script>`/`<link>` (đúng thứ tự, có `?v=`).
4. CSS riêng: `css/mod-<tên>.css` (thêm trước nhóm file ghi đè `overlays.css`…, tránh sửa các file ghi đè sau cùng trừ khi bắt buộc).
5. Dữ liệu mới: `emptyState()` + `businessIdSchemas` (nếu có mã) + `normalizeBusinessIds()` (nếu tham chiếu chéo) + **bảng KIO** + `migrateWorkflowData()` nếu cần bù dữ liệu cũ.
6. Thông báo/hộp việc: nếu có việc cần xử lý, thêm vào `workQueue()` (workflow.js).
7. Thêm bước kiểm tra thủ công cho vai trò liên quan (5.8).

### 5.7 Đổi cấu trúc dữ liệu đang có

- Dữ liệu thật nằm trong KIO → **không được phá dữ liệu cũ**. Thêm trường mới thì code phải chịu được bản ghi chưa có trường đó (`x.field ?? mặc định`) và, nếu cần, bù trong `migrateWorkflowData()`.
- Không đổi tên trường/collection đang dùng trừ khi có kế hoạch migrate được ghi dưới task liên quan.

### 5.8 Kiểm tra trước khi giao (không có test tự động)

1. Chạy kiểm tra cú pháp từng file JS đã sửa: `node --check <file>` (không lỗi mới).
2. Tự rà luồng bằng cách đọc code; nếu có trình duyệt thì mở thử.
3. Kiểm tra theo vai trò bị ảnh hưởng: CEO, Sales, Điều hành, Kế toán, Marketing, HDV — vai trò **không được phép** không thấy màn hình/số liệu mới (đặc biệt: Sales không thấy kế toán; Marketing không thấy lợi nhuận/chi phí tour; HDV chỉ thấy tour của mình).
4. Kiểm tra dữ liệu rỗng (chưa có bản ghi) không làm vỡ màn hình.
5. Nếu không chạy thử được, **nói rõ "chưa chạy thử trên trình duyệt"** trong câu trả lời, đừng khẳng định đã test.
6. **Kiểm tra định dạng (5.12)** trên phần đã sửa: không có dòng nhiều lệnh, không có dòng mới > 160 ký tự; nêu kết quả trong câu trả lời.

### 5.9 Git

- Người dùng tự commit/push. Claude không chạy git push.
- Gợi ý thông điệp commit: `[T3-01] kéo thả ngày tour` (mã task + mô tả ngắn).

### 5.10 Khi nào phải hỏi lại người dùng

Hỏi trước khi làm nếu: (a) task phụ thuộc mục ⏳/mục 8; (b) có hai cách làm khác nhau rõ rệt về dữ liệu/quyền; (c) cần tạo/đổi bảng KIO; (d) cần gọi dịch vụ bên ngoài (AI, email, cổng thanh toán, tỷ giá) — vì demo là web tĩnh, **không giữ được khóa bí mật phía trình duyệt**.

### 5.11 Quy trình cập nhật claude.md (phát hiện thiếu / sai thì ghi vào đâu)

Mục tiêu: claude.md luôn khớp với **docx của khách** và với **code đang chạy**, để phiên sau không phải đọc lại toàn bộ.

**A. Khi có yêu cầu mới từ khách** (docx mới, tin Zalo, ảnh, mẫu form…)

1. Ghi vào **mục 1**, đúng phân hệ, kèm ngày và nguồn. Không xóa ý cũ: nếu hai bên khác nhau, ghi cả hai và đưa câu hỏi vào mục 8.1.
2. Với từng ý mới, tìm dòng tương ứng ở **bảng mục 4**; chưa có thì thêm dòng cuối bảng (đánh số tiếp) với ký hiệu ✅ 🟡 ❌ ⏳.
3. Mỗi dòng 🟡 / ❌ / ⏳ phải có **ít nhất một task ở mục 6** (đánh số tiếp trong EPIC phù hợp). Ghi mã task vào cột "Hiện có / thiếu gì" của mục 4; mô tả task nhắc ngược dòng mục 4.
4. Có điều chưa rõ hoặc đang chờ khách → mục 8.1 (checkbox) và gắn 🔒 / ⏳ cho task liên quan.
5. Ghi chú ngắn dưới task liên quan (luật 5.5).

**B. Khi nhận bản code mới (zip/commit mới) hoặc đầu mỗi phiên**

1. Chạy `git log --oneline -5` và so với commit ghi ở đầu file; chạy `git diff --stat <commit cũ>` để biết file nào đổi. **Cấu trúc thư mục đổi → sửa 3.2, 3.3, 3.8 trước tiên.**
2. Nếu `requiredTeamAccounts`, `businessRolePolicies`, `pages` hoặc `navGroups` đổi → **cập nhật ngay 3.5.1–3.5.3** (số tài khoản, ma trận menu, đối chiếu yêu cầu). Lệnh trích nhanh (chạy ở thư mục gốc dự án):

```bash
# 22 tài khoản mẫu
sed -n '/requiredTeamAccounts = \[/,/^\];/p' js/travel-auth.js
# menu của từng vai trò
grep -n 'menus:' js/app.core.js
# danh sách màn hình + nhãn
sed -n '/^const pages = \[/,/^\];/p' js/app.core.js
# file nào thực sự được nạp
grep -oE '(src|href)="(js|css)/[^"]+"' index.html
```

3. Đối chiếu từng dòng mục 4 với code (dùng `grep` từ khóa nghiệp vụ, ví dụ `draggable`, `pax`, `SIC`, `USD`, `OnePay`) → sửa ký hiệu. Nếu code làm **sai ý khách** thì ghi vào mục 4.1-B (mã `L…`) kèm task sửa.
4. Task đã xong → tick `[x]`. Task dở → để `[ ]` và ghi "đang dở: còn thiếu …" ngay dưới task. Task bị code khác làm mất → **bỏ tick** và ghi lý do (ví dụ T0-02b).
5. Cập nhật dòng **"Rà soát lại"** ở đầu file (ngày + commit).

**C. Khi chính claude.md trái yêu cầu hoặc trái code**

1. Sửa tại chỗ rồi thêm một dòng vào **mục 4.2** (cũ → mới).
2. Nếu sửa cần **quyết định của người dùng/khách** (đổi công nghệ, đổi quyền, xóa file) thì **không tự đổi**: ghi vào mục 8.1 và nêu trong câu trả lời.

**D. Cách viết:** ngắn gọn, có mã task, không xóa lịch sử (gạch `~~...~~`), mỗi thông tin ghi **một chỗ** rồi dẫn "xem mục X" ở chỗ khác. Mỗi lần xong luôn trả lại claude.md đã cập nhật.

### 5.12 Quy tắc viết code & định dạng (BẮT BUỘC)

**Mục đích:** code dễ đọc, dễ review, diff nhỏ. **Nguyên tắc cốt lõi: mỗi dòng một câu lệnh — tuyệt đối không nhồi nhiều lệnh trên cùng một dòng.** Định dạng theo cách các file mẫu trong demo đang làm.

**File mẫu để bắt chước:** `js/travel-api.js`, `js/travel-auth.js`, `js/mod-crm.js` (dòng 61–102: `leadIsOpen`, `views.crm`, `crmFunnel`), phần mới trong `js/mod-admin.js` (`isLastActiveAdministrator`, `saveUserGuideLink`), `css/style.css`.

**Phạm vi:** áp dụng cho code **viết mới** và **đoạn/hàm đang sửa**. Không format lại phần không đụng tới (giữ diff nhỏ, mục 5.1.4). Muốn dọn cả file → làm bằng task riêng (T0-13) và báo trước người dùng.

**JavaScript**

1. **Một câu lệnh một dòng.** Cấm nối lệnh bằng `;` trên cùng dòng, cấm khai báo nhiều biến bằng dấu phẩy trên cùng dòng.
2. Thụt lề **2 dấu cách** (không tab); chuỗi dùng `"..."`; template literal `` `...` `` khi có `${}` hoặc HTML; **luôn có `;`**; có dấu cách sau `,` và `:`; có dấu cách quanh toán tử và `=>`; tham số arrow luôn có ngoặc `(x) => ...`.
3. `const` mặc định, `let` khi phải gán lại, **không `var`**; tên `camelCase`; hàm `function tenHam() {` với `{` cùng dòng; một dòng trống giữa các hàm; chú thích ngắn tiếng Việt `/* ... */` trước mỗi nhóm hàm.
4. **Mảng/đối tượng nhiều phần tử** (hơn 3 phần tử hoặc dài quá 100 ký tự): **mỗi phần tử một dòng**, có dấu phẩy cuối (mẫu: `tabs` ở `mod-crm.js` dòng 74–81; `requiredTeamAccounts` ở `travel-auth.js`). Cấm kiểu nén `dashboard:"a",crm:"b",customers:"c",`.
5. `if`: guard ngắn một dòng được (`if (!user) return;`) như demo. Còn lại dùng `{ }` và xuống dòng. **Cấm** `if (a) b(); else c();` và hai lệnh sau `if` trên cùng dòng. Không lồng toán tử ba ngôi quá 1 cấp.
6. Chuỗi gọi nối (`.filter().map().join()`) dài quá 100 ký tự: **mỗi `.phươngThức()` một dòng** (mẫu `crmFunnel`, `mod-crm.js` dòng 99–101).
7. **Độ dài dòng:** logic JS ≤ 100 ký tự (tối đa 120). **Chuỗi HTML dài** phải ngắt: tách thành hàm nhỏ trả về từng khối (`xxxCard()`, `xxxRow()`) hoặc template nhiều dòng, mỗi thẻ khối (`<section>`, `<div class="...">`, `<tr>`) một dòng. **Không dòng mới nào > 160 ký tự.**
8. **Sự kiện inline** `onclick="..."` chỉ gọi **một hàm**; cần nhiều bước thì viết hàm riêng (không `onclick="a=1;b=2;render()"`).
9. Không minify, không dán code đã nén, không gộp nhiều dòng thành một để "cho ngắn".

Ví dụ:

```js
// SAI — nhiều lệnh một dòng (kiểu workflow.js dòng ~322)
function addDaysSafe(iso, n) { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
let a = 1, b = 2, c = 3;
const tabs = [["a", "A"], ["b", "B"], ["c", "C"], ["d", "D"], ["e", "E"]];
if (!b.guideReports) { b.guideReports = []; changed = true; }

// ĐÚNG
function addDaysSafe(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const a = 1;
const b = 2;
const c = 3;

const tabs = [
  ["a", "A"],
  ["b", "B"],
  ["c", "C"],
  ["d", "D"],
  ["e", "E"],
];

if (!b.guideReports) {
  b.guideReports = [];
  changed = true;
}
```

**CSS** — theo `css/style.css`: mỗi selector một dòng, **mỗi khai báo một dòng**, thụt 2 dấu cách, có dấu cách sau `:`, thuộc tính đặt trong `{ }` xuống dòng. Cấm nén `.a{color:red;margin:0;padding:0}` trên một dòng (nhiều file `css/mod-*.css`, `erp-ui.css` đang như vậy — không bắt chước ở code mới, không tự giãn lại file cũ).

```css
/* ĐÚNG */
.crm-workspace-tabs .btn.selected {
  color: var(--green);
  background: var(--mint);
  border-color: #c9ded0;
}
```

**HTML (`index.html`)** — thụt 2 dấu cách; thẻ có nhiều thuộc tính (hơn 3 hoặc dòng > 100 ký tự) thì **mỗi thuộc tính một dòng**, như các thẻ `<input>`, `<button>` đang có trong file.

**Tệp:** UTF-8, **CRLF** cho `.js/.css/.html` (mục 5.2), cuối file có xuống dòng.

**Kiểm tra trước khi giao** (chạy trên file đã sửa, thay `<file>`):

```bash
node --check <file>                                    # cú pháp
awk 'length > 160 {print FILENAME": dòng "FNR": "length" byte"}' <file>   # dòng quá dài (ước lượng theo byte)
grep -nE ';[[:space:]]+[A-Za-z_$][A-Za-z0-9_$.]*[[:space:]]*(\(|=[^=>])' <file> | grep -v 'for ('   # nhiều lệnh một dòng
```

Hai lệnh sau chỉ là **gợi ý nhanh** (có thể báo nhầm ở chuỗi HTML dài hoặc vòng `for`); chỉ cần chắc chắn **đoạn mình viết/sửa** sạch. Nêu kết quả trong câu trả lời. Hiện trạng demo (để biết nợ cũ): khoảng 390 dòng JS dài hơn 200 ký tự (nhiều nhất ở `mod-design.js`, `mod-accounting.js`, `mod-bookings.js`, `mod-operations.js`, `app.core.js`) và hàng trăm quy tắc CSS nén một dòng.

---

## 6. DANH SÁCH VIỆC CẦN LÀM

Ưu tiên: **P0** nền tảng/chặn việc khác · **P1** lõi theo yêu cầu khách · **P2** quan trọng · **P3** nâng cao/AI.
`[x]` xong · `[ ]` chưa làm · 🔒 bị chặn bởi quyết định/khách (mục 8).

### EPIC 0 — Nền tảng & nợ kỹ thuật

- [ ] **T0-01 (P0)** Chuẩn hóa `?v=` trong `index.html`: hiện chỉ 5 thẻ có `?v=` kiểu số nguyên (`mod-guideapp.css?v=2`, `travel-config.js?v=3`, `travel-auth.js?v=2`, `app.core.js?v=2`, `app.js?v=2`). Đổi **mọi** thẻ `<link>`/`<script>` nội bộ sang `?v=YYYYMMDD.N` (mục 5.3). *Nghiệm thu: không còn thẻ nội bộ nào thiếu `?v=` hoặc sai dạng.*
- [x] **T0-02 (P0)** Ghi lại cấu trúc bảng KIO thay cho README_NGHIEP_VU.md đã xóa → mục 3.4 của file này.
- [x] **T0-02b (P2)** Sửa thông báo trong `js/travel-api.js` (~dòng 193) đang trỏ "README_NGHIEP_VU.md" cho đúng nguồn mới (claude.md mục 3.4) hoặc bỏ tham chiếu file. *Mở lại 22/10: bản sửa từng làm nằm ở `js/api/travel-api.js` (cây cũ), bản phẳng đang chạy vẫn trỏ README đã xóa.* **Xong 22/10:** đã sửa trong `js/travel-api.js` (cây phẳng) — thông báo nay trỏ "claude.md mục 3.4". Bản ở `js/api/` (cây cũ) vốn đã đúng, sẽ bị xóa ở T0-10.
- [ ] **T0-03 (P0) 🔒** Quyết định **nơi chạy AI và tự động hóa** (gọi mô hình AI, gửi email thật, nhận form web, OCR hộ chiếu): web tĩnh không giữ được khóa API. Cần xác nhận KIO có hỗ trợ chức năng phía server/proxy/webhook không, hoặc người dùng chọn cách khác. Ghi quyết định vào mục 8. *Chặn: EPIC 9, EPIC 10, T3-06, T3-08.*
- [ ] **T0-04 (P1)** Bảo mật đăng nhập trước khi dùng thật: (a) bỏ tự điền mật khẩu `123456` ở `selectLoginRole` (`travel-auth.js`) và cân nhắc ẩn các nút chọn nhanh vai trò; (b) lưu ý bảng `typicone_users` (salt + hash) đọc được từ trình duyệt, kiểm tra quyền chỉ ở giao diện → xác định với KIO cách chặn phía máy chủ; (c) ghi rủi ro còn lại vào mục 8; (d) xem T0-11 (mật khẩu mặc định không còn bắt đổi).
- [x] **T0-05 (P1)** Lưu tệp ra thư mục `uploads/` trong source, database chỉ lưu đường dẫn — **người dùng chọn phương án này 22/10**. *Đã làm (code):* `upload.php`, `uploads/.htaccess`, `uploadFile()` trong `travel-api.js`, cấu hình trong `travel-config.js`; `mod-documents.js` (`uploadDoc` lưu `path/size/mime`, `openDocument` mở theo `path`, vẫn đọc được tài liệu cũ base64); `mod-guideapp.js` (ảnh báo cáo cuối tour lưu `uploads/guide-reports/`, báo cáo chỉ giữ đường dẫn; lỗi tải thì không kết thúc tour và báo toast). Chi tiết mục 3.4a. **Chưa thử trên máy chủ PHP thật — xem T0-05c.**
- [ ] **T0-05c (P1)** Triển khai và **thử `upload.php` trên máy chủ thật**: PHP ≥ 7.4, `upload_max_filesize`/`post_max_size` ≥ 10M, quyền ghi `uploads/`, Apache đọc được `.htaccess` (hoặc cấu hình Nginx tương đương). Thử: tải PDF/ảnh ở Kho tài liệu, nộp báo cáo cuối tour có ảnh; thử tệp .php đổi đuôi .pdf (phải bị từ chối); thử tệp > 10 MB. *Hỏi người dùng: máy chủ chạy thật là gì (mục 8.1).*
- [ ] **T0-05d (P2)** Chuyển **tài liệu cũ** đang lưu base64 (`docs[].data`) và ảnh cũ (`finalReport.photos` dạng `data:`) sang `uploads/` rồi xóa `data` khỏi database (viết hàm chuyển một lần, CEO bấm; sao lưu JSON trước).
- [ ] **T0-05e (P1) 🔒** Bảo mật tệp tải lên: `upload.php` chưa xác thực người dùng (chỉ chặn khác nguồn) và tệp phục vụ qua URL tĩnh, chỉ che bằng tên ngẫu nhiên 128 bit. Hộ chiếu/hợp đồng là dữ liệu nhạy cảm → cần phương án xác thực phía máy chủ (liên quan T0-04). Hỏi người dùng/khách.
- [ ] **T0-05b (P2)** Đo thời gian tải/lưu với dữ liệu lớn (1000+ NCC, hàng trăm booking) và quyết định có cần tách collection `suppliers` (blob lớn) hoặc phân trang phía server.
- [ ] **T0-06 (P2)** Xử lý `mod-ai.js` và `mod-help.js` (đang không nạp, không có trong `pages`): hoặc nạp + đăng ký màn hình, hoặc xóa. `mod-ai.js` chỉ là thuật toán mô phỏng.
- [x] **T0-07 (P2)** Thêm `.gitignore` (bỏ qua `uploads/*`, `*.zip`, `backup*.json`, rác hệ điều hành/trình soạn thảo) và `.gitattributes` (repo LF, checkout CRLF cho `.html/.css/.js/.svg`; `.php/.htaccess/.md` LF; ảnh/font nhị phân). *Đã kiểm chứng 22/10 trên bản giải nén: `git status` từ ~80 file "modified" do EOL còn đúng các file thật sự đổi. Người dùng chỉ cần chép 2 file này vào thư mục gốc, không cần `git add --renormalize`.*
- [ ] **T0-08 (P2)** Rà `localizeUI()`/`uiTranslations`: giới hạn phạm vi hoặc loại trừ vùng dữ liệu người dùng để không đổi nhầm tên khách/tour.
- [ ] **T0-09 (P3)** Đối chiếu dữ liệu thật: lấy bản Sao lưu JSON từ người dùng, ghi nội dung `settings[0]` (`serviceTypes`, `leadSources`, `currencies`, `languages`, `countries`…) vào mục 3.4 để lần sau không phải đoán.

- [x] **T0-10 (P0) 🔒** Dọn **cây mã nguồn trùng**: các thư mục `js/core/`, `js/modules/`, `js/api/`, `js/data/`, `css/modules/` không được `index.html` nạp (bản phẳng `js/*.js`, `css/mod-*.css` mới hơn). Trước khi xóa: hỏi đồng đội/người dùng (cây phẳng do commit `71f2b33` tạo), làm xong T0-02b, đối chiếu lần cuối bằng `diff`. Người dùng tự chạy: `git rm -r js/core js/modules js/api js/data css/modules`. *Nghiệm thu: `git ls-files` chỉ còn một bản của mỗi file; mở trang vẫn chạy.*
- [ ] **T0-11 (P1)** Khôi phục **bắt đổi mật khẩu lần đầu** (`mustChangePassword: true`) cho tài khoản tạo mới/đặt lại (`mod-admin.js`) và tài khoản mẫu (`travel-auth.js` `ensureRequiredTeamAccounts`), hoặc đặt mật khẩu riêng từng tài khoản trước khi giao khách. *Hỏi người dùng: demo có cần giữ "đăng nhập nhanh không đổi mật khẩu" không.*
- [ ] **T0-12 (P1)** Đồng bộ **người phụ trách ↔ 22 tài khoản mẫu**: (a) `settings[0].crmOwners/operationOwners/marketingOwners/careOwners` phải chứa đúng `fullName` của từng tài khoản (hoặc đổi cách ghép sang `username`/id để không vỡ khi đổi tên); (b) liên kết `guideId` của `HDV-001…HDV-010` với hồ sơ trong `guides`. *Nghiệm thu: đăng nhập `SALES-001` chỉ thấy lead/booking của mình; `HDV-001` thấy tour được giao. Cần xem dữ liệu thật (T0-09).*
- [ ] **T0-13 (P3) 🔒** Chuẩn hóa **định dạng code cũ** theo mục 5.12: khoảng 390 dòng JS dài hơn 200 ký tự, các dòng nhiều lệnh (`workflow.js` ~322, ~662…), CSS nén một dòng. Làm **từng file**, mỗi lần giao một file, kiểm tra `node --check`, nêu trước với người dùng vì diff sẽ rất lớn.

### EPIC 1 — Tiền tệ & tỷ giá (USD là tiền chung)

- [x] **T1-01 (P1)** Bảng tỷ giá theo VCB (giá bán): USD, EUR, CAD, VND và các tiền khác; ngày hiệu lực; lịch sử; CEO/Kế toán chỉnh; lưu ở `settings[0].fxRates`; tự lấy từ XML của VCB mỗi ngày 1 lần. *Xong 22/10 — chi tiết mục 3.4b. Chưa chạy thử trên trình duyệt và chưa thử `fx-vcb.php` với VCB thật từ máy chủ → T1-01b.*
- [ ] **T1-01b (P1)** Triển khai và **thử `fx-vcb.php` trên máy chủ thật**: mở `/fx-vcb.php` thấy `"ok":true`; thư mục `cache/` ghi được; máy chủ ra được `portal.vietcombank.com.vn`. Thử trên trình duyệt: CEO đăng nhập → *Cài đặt → Tỷ giá* có bản của hôm nay (Tự động VCB); Kế toán thấy tab *Kế toán → Tỷ giá*; Sales không thấy; thử nhập tay/ghi đè; bảng `settings` trên KIO vẫn ghi được khi thêm lịch sử.
- [x] **T1-01d (P1)** Tách lịch sử tỷ giá khỏi `settings` sang collection riêng `fxHistory` (bảng KIO `typicone_fx_history`), bỏ giới hạn 800 bản, ghi chỉ chunk có đổi. *Xong 23/10 — chi tiết mục 3.4b. Chưa chạy thử trên trình duyệt/KIO thật.*
- [ ] **T1-01e (P1)** **Tạo bảng `typicone_fx_history` trên KIO TRƯỚC khi triển khai bản này** (cột `state_key` string, `chunk_index` int, `payload_text` text, `updated_at` string). Sau đó: CEO/Kế toán đăng nhập một lần → lịch sử tự chuyển khỏi `settings` (kiểm tra `settings[0].fxRates` không còn `history`, bảng mới có dữ liệu, tab *Tỷ giá* vẫn đủ số bản). Chưa có bảng thì lịch sử vẫn nằm ở settings, không mất.
- [ ] **T1-01c (P2) 🔒** Tỷ giá tự cập nhật **kể cả khi CEO/Kế toán không đăng nhập** (hiện chỉ cập nhật khi họ vào hệ thống). Cần cron/tác vụ phía máy chủ ghi KIO (🔒 T0-03) hoặc cho mọi vai trò văn phòng kích hoạt (rủi ro xung đột ghi `settings`). Hỏi người dùng.
- [x] **T1-02 (P1)** Chốt USD làm tiền hiển thị chung cho giá tour/báo giá; chuyển đổi hiển thị USD/EUR/VND/CAD… bằng bảng tỷ giá thay cho ô `rate` nhập tay ở `mod-design.js`. *Xong 22/10, dữ liệu vẫn **lưu** bằng VND; phần **nhập** USD làm ở T1-02b (mục 3.4b). Thiết kế tour: mặc định USD, nút USD / tiền của khách (nếu có tỷ giá) / VND, ô "Tỷ giá VCB" chỉ đọc (bỏ `rate` 26000 và ô nhập tay); báo giá không còn lưu `rate`, chỉ lưu `fxDate`. Báo giá: danh sách, KPI, chi tiết, lịch sử hiển thị USD (chi tiết kèm số VND). **Chưa đổi:** duyệt giá, booking, kế toán → T1-04.*
- [x] **T1-03 (P1)** Mỗi báo giá/booking/hóa đơn/giao dịch lưu **tiền tệ + tỷ giá tại thời điểm** để không đổi khi tỷ giá thay đổi. *Làm lại 22/10 theo yêu cầu: **không lưu tỷ giá trên chứng từ**, chỉ lưu ngày tạo (`fxDate` / `issuedAt` / `date`) và tra tỷ giá của ngày đó trong lịch sử — chi tiết mục 3.4b. Màn báo giá (danh sách, KPI, chi tiết, lịch sử), **bản in báo giá** và **email gửi khách** hiển thị USD (kèm VND) theo tỷ giá của ngày tạo, in lại bản cũ không đổi số. Booking/hóa đơn/giao dịch mới chưa hiển thị USD (sẽ dùng ở T1-04). Chưa migrate: báo giá cũ dùng ngày `createdAt`.*
- [x] **T1-02b (P1)** Thống nhất **nhập** số tiền mặc định bằng USD (cùng với hiển thị): ô giá bán, chi phí mục dịch vụ (thiết kế tour), form *Điều chỉnh giá* báo giá; lưu vẫn VND. *Xong 22/10 — mục 3.4b. Chưa làm cho hóa đơn / thu chi / phải trả / VAT (thuộc T1-04 🔒).*
- [x] **T1-04 (P1)** Thu tiền & hóa đơn nhiều tiền tệ (USD/EUR/VND). *Xong 23/10 theo quyết định "ghi sổ bằng USD" của người dùng — chi tiết mục 3.4b. Thu tiền: khách trả USD/EUR/CAD/VND; hóa đơn: nhập USD; sổ lưu VND, quy đổi theo tỷ giá ngày chốt báo giá. Chưa chạy trên trình duyệt.*
- [x] **T1-04b (P1)** Chuyển nốt sang USD các màn còn VND: phải trả NCC và chi NCC, quyết toán, lãi/lỗ theo tour và tháng, dòng tiền, dashboard, duyệt giá, hàng chờ việc, CRM–khách hàng, công nợ NCC, hợp đồng in, chi phí dịch vụ ở Điều hành, hoàn tiền khi hủy. *Xong 23/10, **trừ VAT** (giữ VND, chờ quyết định — T1-04d) — chi tiết mục 3.4b. Kiểm tra bằng node; chưa chạy trên trình duyệt (T1-04c).*
- [ ] **T1-04d (P1) 🔒** VAT: giữ VND (khai thuế theo quy định Việt Nam, như đang làm) hay quy đổi USD? Hiện VAT, `vat[].base` và VAT đầu vào khi nhập hóa đơn NCC đều **VND**; hóa đơn NCC nhập USD rồi quy ra VND theo tỷ giá booking nên `base` đúng VND. *Hỏi người dùng.* Khi chốt, cũng chốt luôn Marketing/HDV/mục tiêu tháng/CSV giao dịch có chuyển USD không.
- [ ] **T1-04c (P1)** Thử trên trình duyệt: tạo booking từ báo giá → xuất hóa đơn USD → thu đủ bằng USD → công nợ đúng 0; thu bằng EUR và VND; đổi tỷ giá hôm nay rồi thu tiếp; in hóa đơn.

### EPIC 2 — Marketing & nguồn Lead

- [x] **T2-01 (P1)** Chuẩn hóa danh sách nguồn lead theo 9 nguồn ở mục 1.3 (`settings[0].leadSources`); thêm trường chi tiết theo nguồn (tên CTV, đối tác B2B, hội chợ, tên ấn phẩm như Petit Futé/Routard). *Xong 23/10 — 9 nguồn chuẩn nằm ở `leadSourceCatalog` (`mod-crm.js`), lead lưu `source` + `sourceDetail`; `migrateLeadSources()` (gọi từ `migrateWorkflowData`) tự đưa `settings[0].leadSources` và nguồn của lead cũ về 9 nguồn chuẩn (không khớp → "Khác", chữ cũ giữ ở `sourceDetail`). Chưa chạy thử trên trình duyệt/KIO thật → T2-01b.*
- [ ] **T2-01b (P1)** Thử trên trình duyệt với dữ liệu KIO thật: (1) đăng nhập một lần → `settings[0].leadSources` thành đúng 9 nguồn, lead cũ có nguồn thuộc 9 nguồn (xem lead nào rơi vào "Khác" và sửa tay nếu cần); (2) *Thêm lead thủ công*: chọn CTV / Sách báo / Đối tác B2B / Hội chợ thì hiện ô chi tiết bắt buộc, các nguồn còn lại ẩn ô; (3) bảng Leads, hồ sơ lead, bộ lọc nguồn, tìm theo chi tiết nguồn, xuất CSV (cột *Chi tiết nguồn*); (4) *Tiếp nhận lead từ website* ra nguồn "Biểu mẫu trên trang web"; (5) Marketing (MKT-001) và Sales (SALES-001) thấy đúng; (6) dữ liệu rỗng không vỡ màn.
- [x] **T2-02 (P2)** CTV: liên kết CTV là HDV hoặc khách cũ (tham chiếu `guides`/`customers`); thống kê lead/doanh thu theo CTV. *Xong 23/10 theo yêu cầu người dùng "cho phép nhập hoa hồng, mặc định 0%": lead nguồn CTV lưu `ctvType` (`GUIDE`/`CUSTOMER`), `ctvId` (mã HDV/KH), `commissionRate` (%, mặc định 0); form *Thêm lead* chọn CTV từ danh sách HDV/khách; nút *CTV và hoa hồng* trong hồ sơ lead để sửa sau; tab *Cộng tác viên* ở CRM thống kê lead, đã chốt, tỷ lệ chốt, doanh thu, hoa hồng theo từng CTV. Hoa hồng = giá trị hợp đồng booking chưa hủy × tỷ lệ; chỉ CEO/Sales (`sales_financials`) thấy và sửa doanh thu/hoa hồng. Chưa chạy thử trên trình duyệt → T2-02b.*
- [ ] **T2-02b (P1)** Thử trên trình duyệt: (1) CEO/SALES-001 *+ Lead thủ công* chọn nguồn CTV → hiện *Loại CTV*, *CTV*, *Hoa hồng (%)* (mặc định 0), ẩn ô tên tự gõ; đổi sang nguồn khác thì ẩn lại; (2) chọn HDV rồi khách hàng cũ → danh sách CTV đổi theo loại; (3) hồ sơ lead CTV hiện CTV + hoa hồng, nút *CTV và hoa hồng* sửa được và ghi nhật ký; (4) tạo booking từ lead CTV → tab *Cộng tác viên* ra doanh thu/hoa hồng USD đúng (booking hủy không tính); (5) MKT-001 nhập được lead CTV nhưng **không** thấy hoa hồng/doanh thu, không có nút sửa; (6) SALES-001 chỉ thấy CTV của lead mình; (7) lead CTV cũ (T2-01, chưa có `ctvId`) hiện "Chưa liên kết hồ sơ" và liên kết được bằng nút sửa; (8) dữ liệu rỗng không vỡ.
- [x] **T2-03 (P2)** Báo cáo theo nguồn: số lead, tỷ lệ chốt, doanh thu, CPL theo kênh. Hoàn thành 23/10/2026; báo cáo nằm trong *Marketing → KPI tổng quan*, gồm số lead, lead chốt, tỷ lệ chốt, doanh thu, chi phí chiến dịch phân bổ và CPL. Chi phí chiến dịch được phân bổ theo tỷ trọng lead từng nguồn trong chiến dịch; chiến dịch chưa gắn lead chưa thể phân bổ. Chưa chạy thử trên trình duyệt.
- [ ] **T2-04 (P2)** Nhập nhanh lead từ WhatsApp/Fanpage/Instagram: nhập tay + nhập hàng loạt CSV trước; tích hợp tự động sau (🔒 T0-03).
- [ ] **T2-05 (P3) 🔒** AI: gợi ý nội dung quảng cáo, bài Fanpage, email tự động (🔒 T0-03).
- [ ] **T2-06 (P2) 🔒** KPI Traffic: cần nguồn số liệu (nhập tay theo tuần/tháng hay lấy từ công cụ phân tích). Hỏi khách.

### EPIC 3 — Sales: thiết kế tour, báo giá, booking

- [x] **T3-01 (P1)** Kéo–thả đổi thứ tự ngày (nút lên/xuống `designMoveDay` giữ lại cho màn hình cảm ứng). *Hiện trạng (`mod-design.js`, `mod-design.css`): bấm *Sắp xếp* thì mỗi ngày thành thẻ **chỉ đọc** — hiện tiêu đề và mô tả bằng chữ, **không có ô nhập, không có nút xóa ngày**, không có tay nắm — và **kéo thả được ở bất kỳ đâu trên thẻ** (`.dz-day.is-sorting` có `draggable`; `designDragStart/Over/Leave/End`, `designDrop`, `designDropIndex`, `designMoveDayTo`; vạch xanh `drop-before`/`drop-after` báo vị trí thả). Bấm *Xong* thì `designDayCard` vẽ lại thẻ có ô nhập như cũ (`designDayBodyEditing`). HTML5 kéo–thả không chạy trên cảm ứng nên chỗ đó dùng nút lên/xuống. Chỉ đổi thứ tự `design.program`; dịch vụ/chi phí không gắn theo chỉ số ngày nên không lệch. Không đổi dữ liệu, không cần bảng KIO. Đã kiểm tra bằng Node: thẻ chỉ đọc không còn `input/textarea`, có `draggable`; thẻ sửa có ô nhập, nút xóa, không `draggable`. Chưa thử kéo thật trên trình duyệt → T3-01b.*
- [ ] **T3-01b (P1)** Thử trên trình duyệt: (1) Thiết kế tour → bước *Lịch trình* → bấm *Sắp xếp*: các ngày chuyển sang chữ (không còn ô nhập, không còn nút xóa), con trỏ thành bàn tay, còn nút lên/xuống; bấm *Xong* thì ô nhập quay lại và sửa được như cũ; (2) nhấn giữ chuột ở **tiêu đề, phần mô tả, chỗ trống** của thẻ đều kéo được; kéo ngày 1 xuống cuối, ngày cuối lên đầu, ngày giữa lên/xuống: vạch xanh hiện đúng phía, số *Ngày N* và tab *Tổng quan* đổi đúng; (3) thả lên chính nó hoặc ra ngoài thẻ → không đổi; (4) sửa tiêu đề/mô tả một ngày, bấm *Sắp xếp*, kéo: nội dung đi theo ngày; (5) lưu nháp → mở lại, xem trước, báo giá, xuất chương trình đúng thứ tự mới; (6) 1 ngày và 60 ngày không vỡ; cuộn modal khi kéo gần mép; (7) điện thoại/máy tính bảng: nút lên/xuống dùng được; (8) Firefox/Safari/Chrome (nút lên/xuống bấm được trong thẻ kéo được); (9) vai trò khác Sales/CEO không đổi gì.
- [x] **T3-02 (P1)** **Ngân hàng "ngày tour"**: kho ngày dùng lại; Sales nhặt ngày hoặc cả tour mẫu để ghép thành tour độ dài tùy ý. *Hiện trạng (`mod-tourdays.js`, `mod-tourdays.css`; người dùng yêu cầu **bỏ trường điểm đến**): collection mới `tourDays` (bảng KIO **`typicone_tour_days`**, optional; mã `NG-2026-0001`, ổn định) — mỗi ngày có tiêu đề (bắt buộc), mô tả, ngôn ngữ (lấy từ danh mục `languages`), dịch vụ gợi ý (`[{cat, name}]`, không có giá). Dùng chung cho mọi Sales/CEO có `tour_design_manage`; **chỉ người tạo hoặc CEO sửa/xóa**; không cho trùng (tiêu đề + ngôn ngữ). Chỗ dùng trong Thiết kế tour: (1) bước *Chọn mẫu* → tab **Ngân hàng ngày** (tìm theo chữ/ngôn ngữ, thêm, sửa, xóa, *Lưu lịch trình đang thiết kế* thành nhiều ngày); (2) bước *Lịch trình* → nút **Ngân hàng ngày** mở hộp thoại tích chọn (số trên mỗi ngày = thứ tự sẽ thêm) và danh sách tour mẫu có nút *Thêm vào cuối*; (3) nút bookmark trên mỗi thẻ ngày để lưu riêng ngày đó vào ngân hàng. Ghép vào tour là **sao chép** vào cuối `design.program` (tối đa 60 ngày; ngày trống mặc định bị thay), tick *Kèm dịch vụ gợi ý* thì thêm vào bước Chi phí với giá 0 (bỏ dịch vụ trùng tên). Tour mẫu: `designSaveTemplate` nay lưu thêm `program` (tiêu đề + mô tả); mẫu có `program` bỏ qua bản dịch tĩnh `translations` khi áp dụng, mẫu cũ chỉ có `itinerary` hoạt động như trước. Mọi thêm/sửa/xóa có `audit`. **Việc người dùng phải làm: tạo bảng KIO `typicone_tour_days`** (cột `state_key`, `chunk_index`, `payload_text`, `updated_at`) trước khi dùng thật — chưa có bảng thì ngân hàng chỉ nằm trong bộ nhớ phiên và mất khi tải lại. Chưa có: nhập hàng loạt từ CSV, phân loại theo vùng/loại tour, AI dịch ngày sang ngôn ngữ khác (T3-06, T9-02). Đã kiểm tra bằng Node (30 ca: tạo/trùng/quyền/lọc/thứ tự chọn/dịch vụ/tour mẫu/60 ngày/xóa/escape) và Chromium (hộp thoại cuộn được, chân hộp thoại luôn thấy); chưa chạy thử trong ứng dụng thật → T3-02b.*
- [ ] **T3-02b (P1)** Thử trên trình duyệt với KIO thật (sau khi tạo bảng `typicone_tour_days`): (1) Thiết kế tour → *Chọn mẫu* → tab *Ngân hàng ngày* → *Thêm ngày* (có/không dịch vụ gợi ý) → sau khi lưu trình thiết kế mở lại đúng bước; tải lại trang vẫn còn; (2) *Lịch trình* → *Ngân hàng ngày*: tích 3 ngày theo thứ tự lạ → thêm vào cuối đúng thứ tự, số ngày và tab *Tổng quan* đúng, bước *Chi phí* có dịch vụ giá 0; bỏ tích *Kèm dịch vụ* thì không thêm; (3) thêm cả tour mẫu cũ (chỉ tiêu đề) và mẫu mới (có mô tả); (4) bookmark trên thẻ ngày, *Lưu lịch trình đang thiết kế*: bỏ ngày trống/trùng; (5) SALES-001 tạo, SALES-002 thấy và dùng được nhưng **không** sửa/xóa; CEO sửa/xóa được; DH/KT/MKT không vào được màn thiết kế; (6) lọc theo ngôn ngữ/tìm chữ; hộp thoại 100+ ngày cuộn mượt, giữ vị trí cuộn khi tích chọn; điện thoại không tràn ngang; (7) *Nhật ký thao tác* có dòng thêm/sửa/xóa ngày; (8) chưa tạo bảng KIO: app vẫn chạy, báo lỗi ghi rõ ràng, không vỡ màn.
- [x] **T3-03 (P1)** Quản lý tour mẫu: nhập/sửa/xóa/phân loại (vùng, quốc gia, loại tour); upload tour mẫu có sẵn. *Hiện trạng (`mod-tourtemplates.js`, `mod-tourtemplates.css`; không cần bảng KIO mới — vẫn collection `tourTemplates`): ở Thiết kế tour → bước *Chọn mẫu* → tab *Mẫu tour có sẵn* có nút **Thêm mẫu** và **Nhập từ tệp**; mỗi dòng mẫu hiện khu vực · quốc gia · loại tour · số ngày · người tạo, kèm nút *Dùng mẫu / Sửa / Xóa*. Form (`tplForm`): tên (bắt buộc, không trùng không phân biệt hoa/thường), 3 ô phân loại lấy từ `tourRegions` / `crmCountries` / `tourTypes` (để trống = chưa phân loại; giá trị cũ không có trong danh sách vẫn giữ được), danh sách ngày (tiêu đề + mô tả, 1–60 ngày, số ngày tự đánh bằng CSS). Sửa mẫu giữ nguyên `services` và `id`. Quyền: cần `tour_design_manage`; **chỉ người tạo hoặc CEO sửa/xóa** (mẫu cũ chưa có `owner` → chỉ CEO); mọi thao tác có `audit("template", …)`. Xóa mẫu không ảnh hưởng tour đã dùng mẫu (tour chỉ lưu tên mẫu). `designSaveTemplate` (nút *Lưu thành mẫu*) nay cũng ghi `region`, `owner`, `createdAt`, `updatedAt`. Bộ lọc khu vực/quốc gia/loại tour có sẵn từ trước, giữ nguyên (mẫu chưa có quốc gia/loại tour vẫn hiện ở mọi lựa chọn lọc quốc gia/loại; khu vực lọc chặt). **Nhập tệp (upload) = CSV UTF-8**, đọc ngay trên trình duyệt (không `upload.php`, không gửi lên máy chủ): mỗi dòng một ngày; cột `Tên mẫu, Khu vực, Quốc gia, Loại tour, Ngày, Tiêu đề ngày, Mô tả ngày` (chấp nhận thêm tên cột tiếng Anh, bỏ dấu; phân cách `,` `;` hoặc tab; có ngoặc kép và xuống dòng trong ô). Các dòng cùng tên mẫu gộp thành một mẫu, xếp theo cột `Ngày` nếu đủ số hợp lệ, không thì theo thứ tự dòng. Có bước *Xem lại trước khi nhập*: danh sách sẽ thêm, mẫu bị bỏ qua (trùng tên, trùng số ngày, quá 60 ngày, quá dài, quá 200 mẫu/lần) và lưu ý (thiếu tên/tiêu đề, khu vực/quốc gia/loại tour không có trong danh sách → để trống). Giới hạn tệp 2 MB; tệp Excel (.xlsx/.xls) bị từ chối kèm hướng dẫn lưu \"CSV UTF-8\"; tệp không phải UTF-8 (có ký tự lỗi) bị từ chối. Nút *Tải CSV mẫu* (có 1 mẫu ví dụ, nên xóa dòng ví dụ) và *Xuất mẫu hiện có* (cùng định dạng, nhập lại được; ô bắt đầu bằng `= + @ -` được thêm dấu `'` chống CSV injection và bỏ dấu đó khi nhập). Đã kiểm tra bằng Node (phân tích/gom/phân loại CSV) và Chromium với CSS thật (form, thêm/sửa/xóa, quyền Sales/CEO, nhập–xuất–nhập lại, cuộn hộp thoại); chưa chạy trong ứng dụng thật → T3-03b. **Chưa làm:** nhập Excel `.xlsx` trực tiếp (cần thư viện — `assets/vendor/jszip.min.js` có nhưng chưa nạp), nhập kèm dịch vụ/chi phí của mẫu, đổi thứ tự ngày trong form mẫu, tạo mẫu từ file Word/PDF (cần AI — T0-03).*
- [ ] **T3-03b (P1)** Thử trên trình duyệt với dữ liệu thật: (1) CEO: Thiết kế tour → *Chọn mẫu* → *Mẫu tour có sẵn*: thấy *Thêm mẫu* / *Nhập từ tệp*, mẫu cũ hiện khu vực suy ra đúng; (2) *Thêm mẫu*: lưu rồi lọc theo khu vực/quốc gia/loại tour ra đúng; sửa tên/ngày/phân loại, mở lại đúng; xóa có hỏi xác nhận; sau mỗi thao tác tải lại trang (KIO) vẫn đúng và quay lại đúng trình thiết kế đang mở; (3) Sales: sửa/xóa được mẫu của mình, **không** sửa/xóa mẫu của người khác và mẫu cũ chưa có người tạo; DH/KT/MKT không vào được màn thiết kế; (4) *Dùng mẫu* với mẫu mới (có mô tả) và mẫu cũ (chỉ tiêu đề) vẫn ghép đúng; *Lưu thành mẫu* từ bản thiết kế → mẫu có khu vực/người tạo; (5) Nhập CSV: tải *CSV mẫu* → chỉnh trong Excel → lưu \"CSV UTF-8\" → nhập: xem lại đúng số mẫu/ngày, mẫu trùng tên bị bỏ qua, giá trị phân loại sai bị cảnh báo; thử Excel `;` và tab, tệp ANSI (phải bị từ chối), `.xlsx` (phải bị từ chối); *Xuất mẫu hiện có* rồi nhập lại vào bản sao dữ liệu; (6) 200 mẫu / 60 ngày không vỡ, hộp thoại cuộn được trên điện thoại; (7) *Nhật ký thao tác* có dòng thêm/sửa/xóa/nhập mẫu.
- [x] **T3-04 (P1, điều chỉnh 26/10 theo yêu cầu mới)** Thêm trang **Điều chỉnh bảng giá** và tách hai lựa chọn: cơ sở tính `daily` (đơn giá/người/ngày × số khách × số ngày) hoặc `total` (đơn giá/người/toàn tour × số khách); sau đó chọn nguồn giá `manual` (nhập giá mỗi khách) hoặc `table` (dùng bảng giá đã cấu hình). Bảng giá lưu trong `settings[0].quotationPriceLists` (không thêm collection KIO): tên bảng + các mức `{pax, priceVnd}`, bắt buộc `pax=1`, các ngưỡng pax từ 2 trở lên tùy chọn, không giới hạn tối đa 30 và không trùng số khách. Khi dùng bảng giá, lấy mức có `pax` lớn nhất thỏa `pax <= số khách tour`; ví dụ ngưỡng 5 áp dụng cho tour có từ 5 khách trở lên; fallback mức 1 nếu không có mức phù hợp. Trang **Điều chỉnh bảng giá** trình bày dạng bảng gồm tên báo giá, số mức giá, thời gian cập nhật, cột Hành động với nút Xem/Sửa/Xóa dưới cột Hành động; Xem mở modal chi tiết các mức. Báo giá lưu ảnh chụp chế độ/nguồn/bảng giá/mức áp dụng và số tiền để thay đổi bảng giá về sau không làm thay đổi báo giá đã tạo. Chưa chạy kiểm thử trên trình duyệt/KIO thật.
- [x] **T3-05 (P1)** Hiển thị giá theo tiền tệ chọn (USD mặc định) — phụ thuộc EPIC 1. Tận dụng `fxDisplayCurrency`, `fxMoney`, `fxInputCode`, `fxToVnd` và `fxFromVnd` của T1-01/T1-02/T1-02b: tiền nội bộ vẫn lưu VND; thiết kế tour mặc định hiển thị/nhập USD khi có tỷ giá, cho chuyển USD / tiền tệ khách (nếu có tỷ giá) / VND; khi chưa có tỷ giá tự fallback VND. Đợt T3-05 rà soát và sửa các giá trong đề xuất xe/HDV/NCC còn hiển thị thẳng VND: nay dùng `designFmt(d, amount)` theo tiền tệ đang chọn; tên dịch vụ thêm từ bảng giá NCC không nhúng số tiền VND cố định để tránh sai khi đổi tiền tệ. Kiểm tra cú pháp JS và kiểm tra tĩnh đã chạy; chưa kiểm thử thủ công trên trình duyệt/KIO thật.
  - File thay đổi: `js/mod-design.js`, `index.html`, `claude.md`. Giá gợi ý xe/HDV/NCC theo cùng bộ định dạng với chi phí và giá bán; đổi tiền tệ cập nhật cách hiển thị mà không đổi giá trị VND lưu trữ. `index.html` tăng cache version của `mod-design.js` lên `?v=20261026.9`. Kiểm thử: `node --check`; xác nhận không còn `money(total)` trong phần gợi ý; kiểm thử trình duyệt thật còn chờ.
- [ ] **T3-06 (P2) 🔒** Lưu nội dung chương trình theo nhiều ngôn ngữ (bản gốc + bản dịch), cài đặt ngôn ngữ; dịch thủ công trước, AI dịch sau (T9-02).
- [ ] **T3-07 (P1)** **Tour ghép (SIC):** thực thể "chuyến khởi hành" (ngày cố định, sức chứa, giá theo pax, đơn vị ghép), booking gắn vào chuyến; còn chỗ/đã đầy. *Cần collection mới → bảng KIO.*
- [ ] **T3-08 (P2) 🔒** Nhập danh sách khách từ **ảnh hộ chiếu** (họ tên, ngày sinh, số hộ chiếu, ngày cấp, ngày hết hạn, quốc tịch): màn hình xem lại/sửa trước khi lưu vào `bookings.passengers`. (🔒 T0-03; lưu ảnh bằng `uploadFile()`). Trước mắt có thể làm trước phần form khách đầy đủ 6 trường + cảnh báo hộ chiếu sắp hết hạn.
- [ ] **T3-09 (P1) ⏳** Thiết kế/xuất tour theo **form mẫu khách sẽ gửi sau**. Chờ file mẫu.
- [ ] **T3-10 (P1)** **Hợp đồng:** *đã có một phần (22/10):* tự tạo **bản ghi** Contract trong Tài liệu khi booking đủ điều kiện xác nhận (`ensureBookingContract`). *Còn thiếu:* mẫu hợp đồng, số hợp đồng, nội dung điền sẵn theo booking, lưu tệp/PDF, gắn với nút "In hợp đồng" (`printContract`). *Cần mẫu hợp đồng từ khách (mục 8).*
- [ ] **T3-11 (P2)** Báo giá "1 click → PDF → email khách" (hiện in PDF qua hộp thoại + `mailto:`; không đính kèm). Phụ thuộc cách gửi email (🔒 T0-03).
- [ ] **T3-12 (P2)** Đảm bảo Sales nhìn thấy tiến độ sau WON (đặt cọc → thanh toán cuối) trên booking của mình mà **không** thấy màn hình kế toán.
- [x] **T3-13 (P1)** Sửa bố cục màn *Chi tiết chương trình* (Thiết kế tour → mở tour đã lưu nháp): cột *Dịch vụ & chi phí* bị kéo ra thành sidebar xanh cố định bên trái, đè lên tiêu đề, KPI và lịch trình. *Xong 26/10/2026 — nguyên nhân: cột đó là thẻ `<aside>`, mà `css/style.css` (và `erp-modern.css`) có luật cho thẻ `aside` trần (`position: fixed; inset: 0 auto 0 0; z-index: 30; width: var(--sidebar-w)`) dành cho sidebar ứng dụng. Đổi sang `<div class="tour-detail-side">`; thiết kế lại: lịch trình ở cột chính, cột phải gồm 2 thẻ *Dịch vụ & chi phí* (kèm lợi nhuận dự kiến) và *Thông tin chương trình*, cột phải `sticky`, dưới 900px xếp một cột. Tách `designDetail` thành `designDetailHead/Kpis/Day(s)/Service/Side/Footer`. Đã dựng thử bằng Chromium với CSS thật: bản cũ tái hiện đúng lỗi, bản mới không chồng lấn ở 1440px và 820px. **Cuộn:** `.modal` là flex cột `overflow: hidden` (`erp-v4.css`) và chỉ cho cuộn vài loại nội dung (`form`, `booking360`, `quote-detail`…) nên `.tour-detail` bị cắt phần dưới, không cuộn được; đã thêm `body .modal > .tour-detail { min-height: 0; overflow-y: auto; }` trong `mod-design.css` (modal mới có loại nội dung riêng thì phải thêm vào danh sách cuộn). Đã thử bằng Chromium: cuộn được hết, chân modal (Xóa nháp/Đóng) luôn thấy. Chưa chạy thử trong ứng dụng thật → T3-14b.*
- [x] **T3-14 (P1)** Nút **Xóa nháp** để xóa chương trình đã lưu nháp. *Xong 26/10/2026 — có ở (1) chân modal *Chi tiết chương trình* (nút đỏ bên trái), (2) chân mỗi thẻ trong thư viện *Chương trình tour* (biểu tượng thùng rác, bấm không mở chi tiết), (3) danh sách *Tour của tôi* trong trình thiết kế (nút *Xóa* đã có, nay dùng chung hàm). `designDeleteDraft` làm lại: cần quyền `tour_design_manage` và là người tạo nháp (CEO xóa được mọi nháp), có hộp xác nhận, `audit("draft", id, "DELETE", …)`, `save()`, tự đóng modal chi tiết (không đóng trình thiết kế đang mở), làm mới danh sách. Chỉ xóa bản ghi `drafts`; báo giá/booking đã tạo từ nháp không bị ảnh hưởng (nháp vốn đã tự xóa khi chuyển thành báo giá). Không cần bảng KIO mới. Chưa chạy thử trong ứng dụng thật → T3-14b.*
- [ ] **T3-14b (P1)** Thử trên trình duyệt với dữ liệu thật: (1) Thiết kế tour mới → *Lưu nháp* → vào lại *Chương trình tour* → mở thẻ: không còn sidebar đè, bảng dịch vụ nằm bên phải, thu hẹp cửa sổ còn một cột, tour dài thì cuộn được xuống hết và chân modal vẫn hiện; (2) *Xóa nháp* ở modal chi tiết: hỏi xác nhận → Hủy thì không mất, OK thì modal đóng, thẻ biến mất, tải lại trang (KIO) vẫn không còn; (3) thùng rác trên thẻ: không mở chi tiết, kể cả bằng bàn phím (Tab + Enter); (4) SALES-001 chỉ thấy/xóa nháp của mình, SALES-002 không thấy nháp của SALES-001; CEO thấy và xóa được tất cả; DH/KT/MKT không vào được màn thiết kế; (5) *Nhật ký thao tác* (Cài đặt) có dòng *Xóa chương trình nháp …*; (6) đang mở trình thiết kế đúng bản nháp đó rồi xóa ở *Tour của tôi*: trình thiết kế không đóng, lưu lại thì tạo nháp mới (không lỗi).

### EPIC 4 — Điều hành & Nhà cung cấp

- [ ] **T4-01 (P1)** Đối chiếu/chuẩn hóa loại dịch vụ-NCC (`settings[0].serviceTypes/serviceLabels`) với danh sách khách: Khách sạn, Homestay, Du thuyền (Junk/Boat), Tàu đêm, Máy bay (VNA, VietJet, khác), Xe (7–47 chỗ), Thuyền/Tàu, HDV (Bắc/Trung/Nam, Laos, Cambodia, Thailand), Nhà hàng, **Landtour đối tác**, Visa, Lệ phí, Tham quan, Khác.
- [ ] **T4-02 (P2)** Phân hệ 1 — đặt dịch vụ: trường riêng theo loại (khách sạn: loại phòng/số đêm; bay: hãng/số hiệu/giờ; xe: loại chỗ; tàu đêm: toa/giường…).
- [ ] **T4-03 (P1)** Phân hệ 2 — bảng theo dõi dịch vụ **đã đặt / chưa đặt** của mọi tour, lọc theo trạng thái/hạn/điều hành viên.
- [ ] **T4-04 (P1)** Phân hệ 3 — form nhập NCC đầy đủ: phân loại, địa chỉ, người phụ trách + SĐT, email, các loại dịch vụ, điều khoản thanh toán.
- [ ] **T4-05 (P1)** **Loại phòng có cấu trúc** (tên, sức chứa) + **giá theo mùa tính theo phòng/đêm** (khoảng ngày + mùa). Hiện chỉ có "hạng mục" giá tự do trong `suppliers[].prices`.
- [ ] **T4-06 (P2)** **Chương trình khuyến mại** của NCC (thời gian, điều kiện, % hoặc số tiền) và áp vào tính giá thiết kế tour.
- [ ] **T4-07 (P2)** **Hợp đồng NCC:** upload tệp (online) hoặc đánh dấu lưu bản giấy (offline), ngày ký/hết hạn + cảnh báo. (dùng `uploadFile()` — T0-05 đã xong, nhóm `docs`). Hiện chỉ có trạng thái "Đã ký".
- [ ] **T4-08 (P2)** Nhiều người liên hệ cho mỗi NCC.
- [ ] **T4-09 (P1)** **Nhập NCC hàng loạt** từ CSV/Excel (500–1000+ NCC); kiểm tra trùng.
- [ ] **T4-10 (P2)** Landtour đối tác như loại NCC riêng và luồng đặt tour qua đối tác.
- [ ] **T4-11 (P2)** Trường quốc gia/khu vực đủ cho NCC & HDV ở Việt Nam, Laos, Cambodia, Thailand; lọc theo khu vực.
- [ ] **T4-12 (P3)** Loại xe/hạng chỗ (7, 16, 29, 35, 45, 47…), liên kết NCC xe.

### EPIC 5 — Kế toán

- [ ] **T5-01 (P1) 🔒** Hóa đơn & thu tiền đa tiền tệ **USD/EUR/VND** kèm tỷ giá (xem T1-04). *Phần thu tiền đa tiền tệ đã làm ở T1-04; hóa đơn hiện chỉ ghi USD (bản in kèm VND), chưa phát hành hóa đơn bằng EUR/VND.*
- [ ] **T5-02 (P1)** Phân loại phương thức thu: chuyển khoản quốc tế / chuyển khoản nội địa / tiền mặt / OnePay / VNPAY. Ghi nhận thủ công trước; **tích hợp cổng thanh toán** làm sau (🔒 T0-03).
- [ ] **T5-03 (P1)** Đối soát **VAT đầu ra** với tiền đã về tài khoản: cảnh báo khoản đã thu nhưng chưa xuất VAT.
- [ ] **T5-04 (P1)** Đối soát **VAT đầu vào** với thanh toán NCC: cảnh báo đã trả NCC nhưng chưa có hóa đơn VAT.
- [ ] **T5-05 (P2)** Nhắc hạn cọc & quyết toán NCC (từ `payables.due`) vào hộp việc/thông báo kế toán.
- [ ] **T5-06 (P1)** **Báo cáo lãi/lỗ theo từng dịch vụ** (hiện chỉ theo tour và theo tháng).
- [ ] **T5-07 (P2)** Báo cáo tuổi nợ phải thu/phải trả.

### EPIC 6 — HDV & Xe

- [ ] **T6-01 (P1) 🔒** Vai trò **Xe/Tài xế**: menu riêng, chỉ thấy tour được giao, khách, lịch trình; thêm vào `businessRolePolicies` và liên kết `vehicles`. (Hiện chỉ có vai trò HDV; `requiredTeamAccounts` chưa có tài khoản tài xế.) *Hỏi khách: tài xế có cần tài khoản riêng không, bao nhiêu (mục 8.1).*
- [ ] **T6-02 (P2)** Rà soát cổng HDV trên điện thoại (cỡ chữ, thao tác một tay, mạng yếu); cân nhắc PWA (cài lên màn hình chính) — hỏi người dùng trước.
- [ ] **T6-03 (P3)** Lọc HDV theo vùng/ngôn ngữ trong màn phân công.
- [ ] **T6-04 (P3) 🔒** Cổng HDV có 3 tab không ai truy cập được (Lịch phân công · Báo cáo · Tạm ứng & chi phí; `mod-guideapp.js` ~dòng 116). docx không yêu cầu 3 tab này (chỉ Tour/Khách/Voucher/Emergency). Quyết định: giữ (và cấp đường vào cho đúng vai trò) hay xóa.

### EPIC 7 — Dashboard CEO

- [ ] **T7-01 (P1) ⏳** Làm giao diện CEO theo **form mẫu khách gửi trên Zalo**, theo từng phân quyền. Chờ mẫu.
- [ ] **T7-02 (P1)** Bổ sung biểu đồ: pipeline, nguồn lead, công nợ phải thu/phải trả, dòng tiền, hiệu suất Sales/NCC (hiện có doanh thu theo tháng, phễu, trạng thái booking, sparkline).
- [ ] **T7-03 (P2)** Đối chiếu KPI mục 1.10: Marketing (Traffic, CPL), Operations (Error Rate, Cost Control, Running Tours, Pending Services, Supplier/Guide Issues, CSAT), Accounting (Receivable, Payable, Cash Flow) — thiếu gì bổ sung.

### EPIC 8 — Chăm sóc khách hàng

- [ ] **T8-01 (P3)** Biểu mẫu phản hồi khách điền trực tiếp (liên kết công khai) thay vì nhân viên nhập — phụ thuộc cách nhận dữ liệu từ ngoài (🔒 T0-03).
- [ ] **T8-02 (P3)** Nối Referral với CTV (T2-02).

### EPIC 9 — AI (toàn bộ 🔒 T0-03)

- [ ] **T9-01 (P3)** AI Itinerary Builder: nhập Quốc gia / Số khách / Ngân sách / Thời lượng → bản nháp chương trình để Sales chỉnh.
- [ ] **T9-02 (P3)** AI dịch chương trình tour (Pháp–Anh–Việt và ngôn ngữ khác theo cài đặt).
- [ ] **T9-03 (P3)** AI tạo báo giá nháp từ chương trình + bảng giá NCC.
- [ ] **T9-04 (P3)** AI hỗ trợ nhập liệu NCC từ văn bản/PDF (phân loại, liên hệ, loại phòng, giá mùa, khuyến mại).
- [ ] **T9-05 (P3)** AI OCR hộ chiếu (T3-08).
- [ ] **T9-06 (P3)** AI gợi ý phân công HDV, phân tích lợi nhuận (đã có bản thuật toán thường trong `mod-ai.js`, chưa nạp — T0-06).
- [ ] **T9-07 (P3)** AI nội dung marketing (T2-05).

### EPIC 10 — Tự động hóa lead website (🔒 T0-03)

- [ ] **T10-01 (P2)** Form website → tự tạo lead → phân công Sales (luật phân: luân phiên/theo thị trường) → email chào mừng → tạo task follow-up. Hiện chỉ có form nhập tay và panel mô phỏng.

### EPIC 11 — Tài liệu

- [ ] **T11-01 (P2) 🔒** Document Center đủ loại: Contract, Invoice, Passport, Voucher, Rooming List — gắn booking, quyền xem nhạy cảm (`document_sensitive`), cảnh báo hộ chiếu/giấy tờ hết hạn. Phụ thuộc T0-05.

### EPIC 12 — Phân quyền & kiểm thử vai trò

- [ ] **T12-01 (P1)** Rà từng vai trò so với bảng mục 1.2 (Marketing chỉ Leads/Campaign/Content/KPI; Sales không thấy kế toán; Điều hành chỉ Booking confirmed/Supplier/Guide/Xe; Kế toán chỉ Invoice/Payments/VAT/Debt). Ghi kết quả ngay dưới task này, sửa `businessRolePolicies` nếu lệch. *Đã rà bằng đọc code ngày 22/10: bảng 3.5.3 (khớp, trừ L5). Còn lại: **đăng nhập thử từng tài khoản trên trình duyệt** (CEO, SALES-001, DH-001, MKT-001, KT-001, HDV-001) và ghi kết quả — chưa làm nên chưa tick.*
- [ ] **T12-02 (P2) ⏳** Xin khách xác nhận các menu **ngoài danh sách "chỉ thấy"**: Dashboard (mọi vai trò), Tài liệu và CSKH (Sales, Điều hành), Thiết kế tour (Sales). Nếu khách muốn đúng chữ thì gỡ khỏi `businessRolePolicies.menus` (mục 3.5.2).

---

## 7. THỨ TỰ ĐỀ XUẤT

1. **Nền tảng:** T0-10 (dọn cây trùng) → T0-01 → T0-12 (đồng bộ owners/HDV) → T0-03 (quyết định AI/automation) → T0-04, T0-11, T0-05c, T0-05e.
2. **Tiền tệ:** EPIC 1 (ảnh hưởng báo giá, hóa đơn, thu tiền) — làm sớm vì kéo theo T3-04/05, T5-01.
3. **Sales lõi:** T3-01, T3-02, T3-03, T3-04, T3-07, T3-10.
4. **NCC & Điều hành:** T4-01, T4-04, T4-05, T4-09, T4-03.
5. **Kế toán:** T5-02, T5-03, T5-04, T5-06.
6. **Marketing:** T2-01, T2-03.
7. **Dashboard CEO** khi có mẫu Zalo (T7-01), **form tour** khi có mẫu (T3-09).
8. **AI & tự động hóa** (EPIC 9, 10) sau khi chốt T0-03.

> Đây là đề xuất; người dùng có thể đổi thứ tự bất cứ lúc nào.

---

## 8. CÂU HỎI MỞ & QUYẾT ĐỊNH

### 8.1 Đang chờ (khách hoặc người dùng trả lời)

- [ ] ⏳ **Mẫu giao diện CEO Dashboard** khách đã gửi qua Zalo (cần file/ảnh) — T7-01.
- [ ] ⏳ **Form mẫu thiết kế tour** "anh sẽ gửi sau" — T3-09.
- [ ] ⏳ **Mẫu hợp đồng** khách hàng (nội dung, điều khoản, ngôn ngữ) — T3-10.
- [x] ~~**Nguồn tỷ giá VCB:** nhập tay định kỳ hay tự lấy? Loại giá bán? Bao lâu cập nhật?~~ → Đã quyết định 22/10 (mục 8.2): tự lấy, giá bán, 1 lần/ngày. Còn nhờ khách xác nhận cột "Bán" của VCB (chỉ có một cột, không tách tiền mặt/chuyển khoản) là đúng ý — T1-01.
- [x] ~~**Sổ kế toán ghi bằng VND hay USD?**~~ → Đã quyết định 23/10: **USD** (mục 8.2). Còn hỏi: VAT/thuế Việt Nam vẫn phải khai theo VND — VAT giữ VND hay quy đổi? — T1-04d.
- [ ] **AI & tự động hóa chạy ở đâu?** (khóa API, gửi email thật, nhận form web, OCR). Demo là web tĩnh; KIO có hỗ trợ server-side/webhook/file không? — T0-03.
- [ ] **Quy mô NCC:** khách ghi 500+/1000/500 không thống nhất — thiết kế cho ≥ 1000, cần xác nhận.
- [x] ~~**CTV có hoa hồng không?**~~ *Người dùng quyết định 23/10: cho phép nhập hoa hồng, mặc định 0%.* - [ ] **Cách tính và chi trả hoa hồng CTV?** Hiện tính % trên giá trị hợp đồng booking chưa hủy, chưa có bước duyệt/chi trả (sổ phải trả, quyết toán) — hỏi khách còn muốn tính trên doanh thu thực thu, theo từng tour, hay có bậc thang — T2-02.
- [ ] **Traffic** lấy từ đâu? — T2-06.
- [ ] **Tài khoản thật:** demo đang tự tạo 22 tài khoản mẫu (`GD-001`, `SALES-001…005`, `DH-001/002`, `MKT-001/002/003`, `KT-001`, `HDV-001…010`) — cần **tên người thật** của từng người (Sales nay là 5 người) để đổi `fullName` và đồng bộ `crmOwners`, `operationOwners`, `marketingOwners`, `careOwners` (T0-12).
- [ ] **Tên thương hiệu:** docx ghi "Typic One ERP" và "Typic Travel"; code ghi "TypicOne ERP" — giữ **TypicOne ERP** trừ khi khách yêu cầu khác.
- [ ] **Máy chủ chạy thật là gì?** (Apache+PHP, Nginx, VPS, hosting nào?) — `upload.php` cần PHP ≥ 7.4; nếu không có PHP phải làm bản khác (T0-05c).
- [ ] **Google Login / Google Drive / Gmail:** docx mục 3 và "ERP V1" đề xuất đăng nhập Google, lưu tệp trên Google Drive, email qua Gmail Workspace. Đây là **bắt buộc** hay chỉ gợi ý của người tư vấn? — T0-03, T0-04, T0-05, T11-01.
- [ ] **Vai trò Xe/Tài xế:** có tài khoản riêng không, bao nhiêu người? (docx ghi "HDV / XE — App mobile" nhưng quy mô khách chỉ nêu 10 HDV, không nêu tài xế) — T6-01.
- [ ] **Điều hành có được xem lợi nhuận (Profit) của tour không?** docx: Điều hành "chỉ thấy Booking Confirmed, Supplier, Guide, Xe" nhưng Tour Dashboard của Điều hành có Cost và Profit. Hiện Điều hành có `operations_costs` (chi phí) nhưng không có `sales_financials`/`booking_financials` — T12-01.
- [ ] ⏳ **Menu ngoài danh sách:** Sales/Điều hành có thêm Tài liệu, CSKH; Sales có Thiết kế tour; mọi vai trò có Dashboard — chấp nhận hay gỡ? — T12-02.
- [ ] **Sales có chỉ thấy lead/booking của mình hay thấy chung?** docx không nói; demo đang giới hạn theo người phụ trách (khi tên khớp danh mục). Cần khách xác nhận.
- [ ] **Xóa cây mã nguồn trùng** (`js/core`, `js/modules`, `js/api`, `js/data`, `css/modules`): người dùng/đồng đội đồng ý chưa? — T0-10.
- [ ] **Mật khẩu mặc định `123456` không bắt đổi** có chủ ý cho demo không, hay cần khôi phục bắt đổi? — T0-11.

### 8.2 Đã quyết định

| Ngày | Quyết định |
|---|---|
| 21/10/2026 | Bỏ toàn bộ công nghệ đề xuất trong docx; giữ nguyên công nghệ demo (web tĩnh thuần + KIO). |
| 21/10/2026 | Nhật ký công việc ghi trong chính `claude.md` (mục 9). *Đã thay thế ngày 26/10/2026 — xem dòng dưới.* |
| 21/10/2026 | Giao file bằng zip chỉ chứa file thay đổi (giữ đường dẫn) + `claude.md` + `index.html` nếu đổi `?v=`. Quy ước `?v=YYYYMMDD.N` theo từng file. *(Đề xuất của Claude khi lập file này vì demo chưa có `?v=`; người dùng có thể đổi.)* |
| 22/10/2026 | Người dùng yêu cầu thêm vào claude.md: (a) bảng tài khoản/vai trò/menu (3.5.1–3.5.3); (b) quy trình cập nhật claude.md (5.11); (c) **luật viết code đúng định dạng demo, mỗi dòng một lệnh** (5.12); (d) kết quả đối chiếu demo ↔ yêu cầu (4.1) và điểm claude.md từng lệch (4.2). |
| 22/10/2026 | **Tệp tải lên lưu ở thư mục `uploads/` trong source, database chỉ lưu đường dẫn** (người dùng quyết định, thay cho base64). Cần `upload.php` — thành phần phía máy chủ duy nhất, là ngoại lệ so với "web tĩnh thuần" nhưng **không đổi stack** (vẫn không build, không framework). |
| 22/10/2026 | Khách đổi quy mô **Sales 2 → 5**: tài khoản mẫu thành 22 (`SALES-001…005`). docx chưa cập nhật. |
| 22/10/2026 | `.gitattributes`: repo lưu LF, checkout CRLF (`.php/.htaccess/.md` LF); `.gitignore` bỏ qua `uploads/*`. |
| 22/10/2026 | Cây mã nguồn **phẳng** (`js/*.js`, `css/mod-*.css`) là bản chạy thật; cây cũ (`js/core`, `js/modules`, `js/api`, `js/data`, `css/modules`) chỉ là bản trùng — **đề xuất xóa**, chờ xác nhận (T0-10). |
| 22/10/2026 | **Tỷ giá (T1-01):** nguồn là tỷ giá **bán** của VCB, **tự lấy mỗi ngày 1 lần** từ XML chính thức (người dùng yêu cầu). Thêm file PHP thứ hai `fx-vcb.php` (cùng loại ngoại lệ như `upload.php`, không đổi stack) vì trình duyệt không chắc gọi thẳng VCB được (CORS) và để giữ giới hạn 1 request/5 phút. |
| 22/10/2026 | **Tỷ giá — do Claude chọn, người dùng có thể đổi:** (a) chỉ CEO/Kế toán (`fx_manage`) kích hoạt tự cập nhật, tránh nhiều người cùng ghi `settings` gây `DATA_CONFLICT`; (b) Kế toán chỉnh tỷ giá ở tab mới trong màn *Kế toán* vì Kế toán không có menu *Cài đặt* (không đổi ma trận menu); (c) giữ 180 bản lịch sử; (d) không cho ngày hiệu lực ở tương lai. |
| 22/10/2026 | **T1-02 — do Claude chọn, người dùng có thể đổi:** USD là tiền *hiển thị*; dữ liệu và ô nhập vẫn VND (đổi sang nhập USD thuộc T1-04 🔒 vì ảnh hưởng ghi sổ). Mặc định hiển thị USD; nút chuyển USD / tiền của khách / VND. Bản in và email gửi khách giữ nguyên VND cho đến T1-03. |
| 22/10/2026 | **T1-03 (làm lại theo yêu cầu người dùng):** không lưu tỷ giá trên chứng từ, chỉ lưu ngày tạo và tra tỷ giá của ngày đó trong lịch sử để chuyển sang mọi loại tiền. Do Claude chọn: (a) booking thừa hưởng `fxDate` của báo giá được chấp nhận; (b) lịch sử giữ 800 bản (từ 180) vì chứng từ phụ thuộc vào nó; (c) ngày sớm hơn mọi bản đã lưu thì dùng bản cũ nhất; (d) báo giá cũ dùng ngày `createdAt`, không migrate; (e) khoản phải trả và VAT chưa tra tỷ giá theo ngày. |
| 22/10/2026 | **Nhập USD mặc định (T1-02b, người dùng yêu cầu):** hiển thị và nhập số tiền mặc định bằng USD; **lưu vẫn VND** (hệ thống, kế toán, VAT đều tính VND; đổi đơn vị lưu là di chuyển dữ liệu lớn). Do Claude chọn: form sửa báo giá giữ nguyên VND của số không sửa; phần kế toán (hóa đơn, thu/chi, phải trả, VAT) chưa đổi sang nhập USD vì thuộc T1-04 🔒. |
| 23/10/2026 | **Sổ kế toán ghi bằng USD (T1-04, người dùng quyết định).** Cách làm do Claude chọn: USD là đơn vị nhập và hiển thị của hóa đơn/thu tiền, **dữ liệu vẫn lưu VND** (không migrate dữ liệu cũ, không đụng `workflow.js`/VAT/quyết toán); số tiền của mỗi booking quy đổi USD theo tỷ giá ngày chốt báo giá để thu USD khớp hóa đơn USD. Nếu muốn **lưu hẳn bằng USD** (đổi đơn vị lưu của toàn bộ số tiền) thì phải migrate dữ liệu và sửa toàn bộ kế toán — cần người dùng xác nhận. Hóa đơn chỉ ghi USD (không phát hành bằng EUR/VND). Khách trả VND thì USD ghi sổ theo tỷ giá VCB hôm nay (có thể còn lẻ công nợ nếu tỷ giá đã đổi). |
| 23/10/2026 | **Nguồn lead chuẩn (T2-01) — do Claude chọn, người dùng có thể đổi:** (a) tên 9 nguồn viết tiếng Việt, riêng nguồn 1 tên là "Biểu mẫu trên trang web" (docx ghi "Form website") vì `localizeUI()` tự dịch "Form"/"Website" và làm lệch giá trị lưu; (b) chi tiết **bắt buộc** với CTV, Sách báo – quảng cáo, Đối tác B2B, Kênh hội chợ; "Khác" tùy chọn; 4 nguồn số, WhatsApp, Fanpage, Instagram không có ô chi tiết; (c) nguồn cũ tự đổi khi vào hệ thống: chứa web/whatsapp/fanpage|facebook/instagram/ctv/b2b/hội chợ/petit|routard… thì vào nguồn tương ứng, **còn lại vào "Khác" và giữ chữ cũ ở `sourceDetail`** (ví dụ "Giới thiệu", "Zalo"); (d) điểm lead (`leadScore`) vẫn cộng 10 cho kênh giới thiệu/CTV/WhatsApp/web. |
| 23/10/2026 | **CTV và hoa hồng (T2-02, người dùng quyết định: cho phép nhập hoa hồng, mặc định 0%).** Cách làm do Claude chọn, người dùng có thể đổi: (a) hoa hồng lưu **theo từng lead** (`lead.commissionRate`, %), không lưu theo CTV, để mỗi lead có thể thỏa thuận mức khác nhau; thống kê hiện "Nhiều mức" nếu một CTV có nhiều mức; (b) hoa hồng = `booking.revenue` (giá trị hợp đồng) của booking chưa hủy × tỷ lệ, lưu VND, hiển thị USD theo tỷ giá của booking; chưa có chi trả/công nợ hoa hồng; (c) CTV chọn từ `guides` (HDV) hoặc `customers` (khách cũ = **mọi** khách trong danh bạ, chưa lọc khách đã đi tour); (d) chỉ CEO và Sales (`sales_financials`) xem/sửa hoa hồng và doanh thu theo CTV vì Marketing không được xem chi phí/lợi nhuận (mục 1.2); Marketing vẫn nhập được lead CTV (hoa hồng mặc định 0) và xem số lead, đã chốt, tỷ lệ chốt; (e) khi chọn CTV thì `sourceDetail` tự lấy tên hồ sơ (không còn ô gõ tay). |
| 26/10/2026 | **Bỏ mục Nhật ký công việc** (người dùng yêu cầu): từ nay ghi trực tiếp dưới đầu task ở mục 6, chỉ ghi đủ để biết hệ thống đang thế nào (luật 5.5). Các dòng nhật ký cũ đã xóa; thông tin còn giá trị nằm ở mục 3, 4 và ghi chú dưới từng task. |
| 26/10/2026 | **Kéo–thả ngày tour (T3-01, người dùng yêu cầu):** bỏ tay nắm; khi *Sắp xếp* thì các ngày chỉ đọc (kể cả không cho xóa ngày — do Claude chọn) và kéo thả ở bất kỳ đâu trên thẻ; bấm *Xong* mới sửa lại được. |
| 26/10/2026 | **Quản lý tour mẫu (T3-03).** Do Claude chọn, người dùng có thể đổi: (a) "upload tour mẫu có sẵn" hiểu là **nhập từ tệp CSV UTF-8** đọc tại trình duyệt (không cần máy chủ/PHP/bảng KIO mới; chưa hỗ trợ Excel/Word/PDF — cần thư viện hoặc AI); (b) người tạo hoặc CEO sửa/xóa mẫu, mẫu cũ chưa có người tạo chỉ CEO sửa (giống ngân hàng ngày); (c) tên mẫu không được trùng (không phân biệt hoa/thường); mẫu trùng trong tệp nhập bị bỏ qua, không ghi đè; (d) phân loại dùng đúng 3 danh sách có sẵn (`tourRegions`, `crmCountries`, `tourTypes`), giá trị lạ trong tệp nhập bị để trống kèm cảnh báo; (e) mẫu nhập từ tệp chưa có dịch vụ/chi phí. |
| 26/10/2026 | **Ngân hàng ngày tour (T3-02, người dùng yêu cầu bỏ trường điểm đến).** Do Claude chọn, người dùng có thể đổi: (a) ghép ngày vào tour là **sao chép**, không tham chiếu — sửa/xóa ngày trong ngân hàng không đổi tour đã ghép; (b) ngân hàng dùng chung cho mọi người có quyền thiết kế tour, chỉ người tạo hoặc CEO sửa/xóa (giống nháp); (c) dịch vụ gợi ý chỉ có loại + tên, thêm vào chi phí với giá 0 vì giá phụ thuộc số khách/mùa; (d) trùng = cùng tiêu đề và ngôn ngữ; (e) thứ tự ghép = thứ tự bấm tích chọn; (f) tour mẫu mới lưu thêm `program` và bỏ qua bản dịch tĩnh khi áp dụng; (g) bảng KIO `typicone_tour_days` là optional như `fx_history`. |

### 8.3 Rủi ro đã biết

- Đăng nhập kiểm tra ở trình duyệt, bảng người dùng đọc được từ client (T0-04).
- Mỗi collection là một blob → hiệu năng khi dữ liệu lớn, ghi đồng thời có thể gây xung đột (đã có chặn xung đột bằng so sánh, chưa tuyệt đối).
- Tài liệu **cũ** còn base64 trong `docs` (T0-05d); tệp **mới** ở `uploads/` nhưng `upload.php` chưa xác thực người dùng và tệp phục vụ qua URL tĩnh (T0-05e); `upload.php` chưa thử trên máy chủ thật (T0-05c).
- Nhiều thành phần AI/tự động hóa không làm được thuần phía trình duyệt nếu thiếu backend (T0-03).
- 22 tài khoản mẫu dùng mật khẩu `123456`, không bắt đổi, lại có nút điền sẵn mật khẩu ở màn hình đăng nhập (T0-04, T0-11).
- Phạm vi dữ liệu theo **tên** người dùng: lệch tên so với danh mục owners → phạm vi bị bỏ qua mà không báo (T0-12).
- Hai cây mã nguồn trùng trong git: dễ sửa nhầm file không được nạp, hoặc mất thay đổi khi hợp nhất nhánh (T0-10).
- docx đề xuất Google Login/Drive/Gmail; chưa rõ bắt buộc hay không — nếu bắt buộc thì phải có phương án phía máy chủ (mục 8.1).
- `fx-vcb.php` chưa thử với VCB thật từ máy chủ (T1-01b); phụ thuộc endpoint XML của VCB (VCB đổi định dạng thì tự lấy lỗi, vẫn nhập tay được). Tỷ giá chỉ tự cập nhật khi CEO/Kế toán đăng nhập (T1-01c).
- **Sửa/ghi đè bản tỷ giá của một ngày (nhập tay, hoặc bấm "Cập nhật từ VCB" lại trong ngày) làm đổi số USD của mọi báo giá/chứng từ tạo ngày đó**, vì chứng từ chỉ lưu ngày. Báo giá cũ (trước T1-03) dùng ngày `createdAt`; nếu sớm hơn lúc có bảng tỷ giá thì dùng bản cũ nhất. Lịch sử tỷ giá không giới hạn số bản nhưng đã nằm ở bảng riêng `typicone_fx_history`, không làm nặng `settings` (T1-01d). Chưa có tỷ giá thì màn hình tự hiện VND và ô nhập là VND.
- T1-04b: gần như mọi màn tiền gắn booking đã ở USD; còn **trộn đơn vị** ở VAT, Marketing, app HDV, đơn giá HDV/NCC, ngân sách lead, mục tiêu tháng (VND) — xem T1-04d. Chi phí thực tế quyết toán/hóa đơn NCC nhập USD nên VND lưu có thể lệch vài chục VND so với hóa đơn gốc VND (làm tròn theo tỷ giá). Đề xuất phê duyệt tạo **trước** 23/10 có câu lý do bằng VND (đã lưu thành chữ). Booking tạo trước khi có bảng tỷ giá dùng tỷ giá cũ nhất làm tỷ giá sổ; chưa có tỷ giá thì mọi thứ quay về VND.

---

## 9. CÁCH BẮT ĐẦU MỘT PHIÊN LÀM VIỆC MỚI

1. Đọc toàn bộ file này (đặc biệt mục 3, 5, 8, 9).
2. Người dùng cung cấp: `travel.zip` (bản mới nhất) và, nếu có, bản sao lưu dữ liệu JSON.
3. Giải nén; muốn biết lần trước đã làm gì thì đọc ghi chú dưới các task ở mục 6 (và mục 3, 4 mô tả hiện trạng); so với zip hiện tại nếu thấy lệch. **Chạy quy trình 5.11-B:** `git log`, so cấu trúc thư mục với 3.2, so tài khoản/menu với 3.5.1–3.5.3 và `index.html` (file nào thực sự được nạp).
4. Chọn task theo yêu cầu người dùng (hoặc theo mục 7), đọc code liên quan.
5. Làm → kiểm tra (5.8) → tăng `?v=` (5.3) → cập nhật checkbox + ghi chú dưới task (5.5) → đóng gói zip (5.4) → trả lời kèm danh sách file và việc người dùng cần làm.


### Nhật ký triển khai — 26/10/2026 (T3-04 và sửa riêng lựa chọn khách hàng)

- [x] **T3-04 (P1, điều chỉnh UI 26/10)** Tách lựa chọn cơ sở giá `daily`/`total` khỏi nguồn giá `manual`/`table`; trang Điều chỉnh bảng giá chuyển thành bảng danh sách, có Xem (modal), Sửa, Xóa. Không thêm collection KIO mới.
- [x] **Sửa riêng yêu cầu chọn khách hàng thường** ở bước 1 *Thông tin khách hàng & yêu cầu* (không phải nội dung T3-04): danh sách phân nhóm *Khách hàng tiềm năng* và *Khách hàng thường*; khách thường lấy từ `state.customers`, lưu `customerId`/`customerType`, vẫn tương thích trường `lead` cũ cho lead. Báo giá giữ liên kết khách thường qua `customerId`.
- [x] Cập nhật cache busting trong `index.html` lên `?v=20261026.8` cho các tài nguyên có version; thêm `mod-pricing.js` và `mod-pricing.css`.
- [ ] **T3-04b (P1)** Kiểm thử thủ công trong ứng dụng thật: (1) tạo/sửa/xóa nhiều bảng giá; (2) bắt buộc pax=1, từ chối số khách trùng, không nguyên hoặc nhỏ hơn 1; xác nhận có thể lưu ngưỡng lớn hơn 30; (3) tour 6 khách với mức 1/5/10 phải lấy mức 5; (4) tour đúng bằng ngưỡng phải áp dụng đúng mức giá của ngưỡng đó; (5) daily nhân ngày × khách, total nhân khách; (6) tạo báo giá rồi đổi/xóa bảng giá, xác nhận báo giá đã tạo không đổi; (7) tải lại trang và kiểm tra dữ liệu local/KIO; (8) xác nhận Sales truy cập được và các vai trò khác không thấy trang.


### Cập nhật — 26/10/2026 (bỏ giới hạn 30 khách trong bảng giá)

- [x] Trang Điều chỉnh bảng giá không còn đặt `max=30` cho ngưỡng khách.
- [x] Kiểm tra dữ liệu chỉ yêu cầu ngưỡng là số nguyên dương an toàn; vẫn bắt buộc mức 1, không cho trùng ngưỡng và kiểm tra giá hợp lệ.
- [x] Mức giá vẫn áp dụng theo ngưỡng lớn nhất thỏa `ngưỡng pax <= số khách thực tế`; không thay đổi cách tính tiền.
- [x] `index.html` cập nhật cache version cho `mod-pricing.js` và `mod-pricing.css` lên `?v=20261026.10`.
- [x] Kiểm tra cú pháp JavaScript; chưa kiểm thử thủ công trên trình duyệt/KIO thật.

**File thay đổi:** `js/mod-pricing.js`, `index.html`, `claude.md`.

### Cập nhật — 26/10/2026 (bỏ giới hạn 30 khách trong bảng giá)

- [x] Trang Điều chỉnh bảng giá không còn đặt `max=30` cho ngưỡng khách.
- [x] Kiểm tra dữ liệu chỉ yêu cầu ngưỡng là số nguyên dương an toàn; vẫn bắt buộc mức 1, không cho trùng ngưỡng và kiểm tra giá hợp lệ.
- [x] Mức giá vẫn áp dụng theo ngưỡng lớn nhất thỏa `ngưỡng pax <= số khách thực tế`; không thay đổi cách tính tiền.
- [x] `index.html` cập nhật cache version cho `mod-pricing.js` và `mod-pricing.css` lên `?v=20261026.10`.
- [x] Kiểm tra cú pháp JavaScript; chưa kiểm thử thủ công trên trình duyệt/KIO thật.

**File thay đổi:** `js/mod-pricing.js`, `index.html`, `claude.md`.

### Quyết định bổ sung — 26/10/2026 (bảng giá theo số khách)
- Yêu cầu nguồn khách hàng ban đầu ghi mức pax 1–30; theo điều chỉnh mới nhất của người dùng, ngưỡng bảng giá không bị giới hạn ở 30 khách. Đơn vị hiển thị chung USD, có thể đổi ngoại tệ theo tỷ giá bán VCB.
- Quyết định ban đầu là chế độ thứ ba “giá theo số khách”; quyết định UI mới hơn đã thay thế cách chọn này bằng hai bước: cơ sở giá (theo ngày/cả tour), sau đó nguồn giá (nhập tay/sử dụng bảng giá). Bảng giá vẫn có nhiều hồ sơ đặt tên, mỗi hồ sơ chứa các ngưỡng pax tùy ý, không giới hạn 30 khách, không cần đủ mọi mức nhưng bắt buộc pax=1.
- Quy tắc chọn mức: lấy mức pax lớn nhất thỏa **pax ≤ số khách thực tế**; ví dụ mức 5 áp dụng cho tour đúng 5 khách cũng như tour 6 khách (nếu các mức là 1, 5, 10). Nếu không có mức phù hợp thì dùng mức 1.
- Bảng giá lưu trong bản ghi `settings` hiện có để giữ tương thích lưu trữ hiện tại, không tạo bảng KIO mới. Số tiền lưu VND, nhập/hiển thị theo tiền đang chọn mặc định USD; quy đổi theo cơ chế tỷ giá VCB hiện có.
- Bảng giá mới được chọn khi thiết kế tour; khi tạo báo giá, lưu ảnh chụp thông tin bảng giá/mức áp dụng và số tiền để thay đổi bảng giá về sau không làm thay đổi báo giá đã tạo.


### Nhật ký triển khai — 26/10/2026 (T3-04 UI điều chỉnh)

- [x] Tách cách tính giá theo ngày/cả tour khỏi nguồn giá nhập tay/sử dụng bảng giá. Khi dùng bảng giá, đơn giá theo số khách được hiểu theo cơ sở đã chọn: mỗi khách/ngày hoặc mỗi khách/cả tour.
- [x] Trang Điều chỉnh bảng giá chuyển sang bảng danh sách với các cột **Tên báo giá**, **Số mức giá**, **Thời gian cập nhật**, **Các nút chức năng**; mỗi hàng có **Xem**, **Sửa**, **Xóa**. Nút Xem mở modal chi tiết bảng giá.
- [ ] Kiểm thử thủ công giao diện, tính giá daily/total kết hợp manual/table và các thao tác CRUD trong trình duyệt/KIO thật.
