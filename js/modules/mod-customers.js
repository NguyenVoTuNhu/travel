/* MODULE mod-customers — giao diện và nghiệp vụ của phân hệ Travel. */

views.customers = () =>
  title(
    "Hồ sơ khách hàng",
    "Customer ID · Company · Contact · Country · Email · WhatsApp",
    btn("+ Thêm khách hàng", "customerForm()", "primary"),
  ) +
  card(
    "Customers",
    `<div class="filters"><input placeholder="Tìm khách, email, công ty…" oninput="document.querySelectorAll('.customerrow').forEach(r=>r.hidden=!r.dataset.search.includes(this.value.toLowerCase()))" aria-label="Tìm khách hàng"></div>` +
      table(
        [
          "CUSTOMER ID",
          "COMPANY / CONTACT",
          "COUNTRY",
          "EMAIL / WHATSAPP",
          "LEADS / BOOKINGS",
          "THAO TÁC",
        ],
        state.customers.map(
          (c) =>
            '<tr class="customerrow" data-search="' +
            esc([c.name, c.company, c.email].join(" ").toLowerCase()) +
            '"><td>' +
            c.id +
            "</td><td><b>" +
            esc(c.name) +
            '</b><span class="sub">' +
            esc(c.company || "Khách cá nhân") +
            "</span></td><td>" +
            esc(c.country) +
            "</td><td>" +
            esc(c.email) +
            '<span class="sub">' +
            esc(c.whatsapp) +
            "</span></td><td>" +
            state.leads.filter((l) => l.name === c.name).length +
            " leads · " +
            state.bookings.filter((b) => b.client === c.name).length +
            " bookings</td><td>" +
            btn("Hồ sơ", "customerDetail('" + c.id + "')", "small") +
            "</td></tr>",
        ),
      ),
  );

function customerForm() {
  modal(
    "Thêm khách hàng",
    `<form onsubmit="saveCustomer(event)"><div class="formgrid"><label>Contact / Họ tên${field("name", "text", "", true)}</label><label>Company${field("company")}</label><label>Country<select name="country" required><option value="">Chọn thị trường</option>${crmCountries.map((value) => `<option>${esc(value)}</option>`).join("")}</select></label><label>Email${field("email", "email", "", true)}</label><label>Phone${field("phone")}</label><label>WhatsApp${field("whatsapp")}</label></div><div class="formfooter"><button class="btn primary">Lưu khách hàng</button></div></form>`,
    true,
  );
}

function saveCustomer(e) {
  e.preventDefault();
  let f = new FormData(e.target);
  state.customers.push({
    id: "CUS-" + Date.now(),
    ...Object.fromEntries(
      ["name", "company", "country", "email", "phone", "whatsapp"].map((k) => [
        k,
        f.get(k),
      ]),
    ),
    contact: f.get("name"),
  });
  log("Thêm khách " + f.get("name"));
  closeModal();
  render();
}

function customerDetail(id) {
  let c = state.customers.find((c) => c.id === id);
  modal(
    esc(c.name),
    card(
      "Customer profile",
      line("Customer ID", c.id) +
        line("Company", esc(c.company || "Khách cá nhân")) +
        line("Contact", esc(c.contact || c.name)) +
        line("Country", esc(c.country)) +
        line("Email", esc(c.email)) +
        line("WhatsApp", esc(c.whatsapp)),
    ) +
      card(
        "Lịch sử booking",
        state.bookings
          .filter((b) => b.client === c.name)
          .map(
            (b) =>
              '<div class="metricline">' +
              b.id +
              " · " +
              esc(b.tour) +
              bookStatus(b) +
              "</div>",
          )
          .join("") || '<p class="sub">Chưa có booking.</p>',
      ),
  );
}
