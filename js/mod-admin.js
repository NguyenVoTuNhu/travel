/* MODULE mod-admin — người dùng & phân quyền, cài đặt chính sách, nhật ký hệ thống. */

let settingsTab = "policy";
let usersBusy = false;
let userSearch = "", userRoleFilter = "all", userStatusFilter = "all";

function isLastActiveAdministrator(users, user) {
  return can("all") && user.active && (roleCapabilities[user.role] || []).includes("all") &&
    users.filter((item) => item.active && (roleCapabilities[item.role] || []).includes("all")).length === 1;
}

/* ---------- Người dùng ---------- */
async function persistAuthUsers(users) {
  const payload = JSON.stringify(users);
  const chunks = splitDatabasePayload(payload);
  const result = await getKrudList({ table: AUTH_TABLE, page: 1, limit: 1000, sort: { id: "ASC" }, where: [] });
  if (!result.success) throw new Error(result.error || "Không đọc được bảng người dùng.");
  const ids = result.data.map((r) => Number(r.id));
  for (let i = 0; i < chunks.length; i += 1) {
    const res = await krud(ids[i] ? "update" : "insert", AUTH_TABLE, databaseFields("users", chunks[i], i), ids[i] || null);
    if (!res.success) throw new Error(res.error || "Không lưu được người dùng.");
  }
  for (const id of ids.slice(chunks.length)) await krud("delete", AUTH_TABLE, {}, id);
}

async function mutateUsers(fn, successMessage) {
  if (!requireCapability("all", "Chỉ Giám đốc được quản lý người dùng.")) return;
  if (usersBusy) return;
  usersBusy = true;
  try {
    await loadAuthUsers();
    const users = authUsers.map((u) => ({ ...u }));
    const proceed = await fn(users);
    if (proceed === false) return;
    await persistAuthUsers(users);
    await loadAuthUsers();
    render();
    toast(successMessage);
  } catch (error) {
    toast("Không lưu được: " + error.message);
  } finally {
    usersBusy = false;
  }
}

function randomSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

async function passwordRecord(password, iterations = 100000) {
  const salt = randomSalt();
  return { salt, iterations, passwordHash: await hashPassword(password, salt, iterations) };
}

function toggleUser(id) {
  if (id === currentUser?.id) return toast("Không thể khóa chính tài khoản đang đăng nhập.");
  mutateUsers((users) => {
    const u = users.find((x) => x.id === id);
    if (isLastActiveAdministrator(users, u)) {
      toast("Không thể khóa tài khoản quản trị đang hoạt động cuối cùng.");
      return false;
    }
    u.active = !u.active;
    audit("user", id, u.active ? "ACTIVATE" : "DEACTIVATE", `${u.active ? "Mở khóa" : "Khóa"} tài khoản ${u.username}`);
  }, "Đã cập nhật tài khoản.");
}

function changeUserRole(id, newRole) {
  if (id === currentUser?.id) {
    render();
    return toast("Không thể tự đổi vai trò của chính mình.");
  }
  mutateUsers((users) => {
    const u = users.find((x) => x.id === id);
    if (isLastActiveAdministrator(users, u) && !(roleCapabilities[newRole] || []).includes("all")) {
      render();
      toast("Không thể đổi vai trò của tài khoản quản trị cuối cùng.");
      return false;
    }
    u.role = newRole;
    audit("user", id, "ROLE", `Đổi vai trò ${u.username} → ${rolelabels[newRole] || newRole}`);
  }, "Đã đổi vai trò.");
}

function resetUserPassword(id) {
  mutateUsers(async (users) => {
    const u = users.find((x) => x.id === id);
    Object.assign(u, await passwordRecord("123456", u.iterations || 100000), { mustChangePassword: false });
    audit("user", id, "RESET", `Đặt lại mật khẩu ${u.username} về mặc định`);
  }, "Đã đặt lại mật khẩu về 123456. Người dùng sẽ bị yêu cầu đổi mật khẩu ở lần đăng nhập kế tiếp.");
}

function linkUserGuideForm(id) {
  const user = authUsers.find((item) => item.id === id);
  if (!user) return;
  modal(
    "Liên kết hồ sơ hướng dẫn viên",
    `<form onsubmit="saveUserGuideLink(event,'${id}')"><p class="sub">Tài khoản: <b>${esc(user.fullName)}</b> · @${esc(user.username)}</p><label>Hồ sơ HDV<select name="guideId" required><option value="">Chọn hướng dẫn viên</option>${state.guides.map((guide) => `<option value="${guide.id}" ${guide.id === user.guideId ? "selected" : ""}>${esc(guide.name)} (${guide.id})</option>`).join("")}</select></label>${state.guides.length ? "" : '<div class="alert red">Chưa có hồ sơ hướng dẫn viên. Hãy tạo hồ sơ tại phân hệ Hướng dẫn viên trước.</div>'}<div class="formfooter"><button class="btn primary" ${state.guides.length ? "" : "disabled"}>Lưu liên kết</button></div></form>`,
    true,
  );
}

function saveUserGuideLink(event, id) {
  event.preventDefault();
  const guideId = new FormData(event.target).get("guideId");
  if (!findGuide(guideId)) return toast("Hồ sơ hướng dẫn viên không hợp lệ.");
  mutateUsers((users) => {
    const user = users.find((item) => item.id === id);
    user.guideId = guideId;
    audit("user", id, "GUIDE_LINK", `Liên kết ${user.username} với hồ sơ ${guideId}`);
    closeModal();
  }, "Đã liên kết tài khoản với hồ sơ hướng dẫn viên.");
}

function userForm() {
  modal(
    "Thêm người dùng",
    `<form onsubmit="addUser(event)"><div class="formgrid"><label>Tên đăng nhập${field("username", "text", "", true)}</label><label>Họ tên${field("fullName", "text", "", true)}</label><label>Vai trò<select name="role">${Object.entries(rolelabels).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select></label><label>Mã HDV (nếu là HDV)<select name="guideId"><option value="">—</option>${state.guides.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select></label></div><div class="notice">Mật khẩu ban đầu: <b>123456</b>.</div><div class="formfooter"><button class="btn primary">Tạo tài khoản</button></div></form>`,
    true,
  );
}

function addUser(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const username = f.get("username").trim().toLowerCase();
  mutateUsers(async (users) => {
    if (users.some((u) => u.username.toLowerCase() === username)) {
      toast("Tên đăng nhập đã tồn tại.");
      return false;
    }
    const id = "u" + (Math.max(0, ...users.map((u) => parseInt(String(u.id).replace(/\D/g, ""), 10) || 0)) + 1);
    users.push({ id, username, fullName: f.get("fullName").trim(), role: f.get("role"), active: true, guideId: f.get("guideId") || "", mustChangePassword: false, ...(await passwordRecord("123456")) });
    audit("user", id, "CREATE", `Tạo tài khoản ${username}`);
    closeModal();
  }, "Đã tạo tài khoản.");
}

views.users = () => {
  if (!can("all")) return title("Người dùng & phân quyền", "Chỉ Giám đốc được quản lý tài khoản.");
  const users = authUsers;
  const query = userSearch.trim().toLowerCase();
  const filtered = users.filter((user) =>
    (!query || `${user.fullName} ${user.username}`.toLowerCase().includes(query)) &&
    (userRoleFilter === "all" || user.role === userRoleFilter) &&
    (userStatusFilter === "all" || (userStatusFilter === "active") === !!user.active),
  );
  return (
    title("Người dùng & phân quyền", "Quản lý tài khoản, vai trò và trạng thái truy cập.", btn("+ Thêm người dùng", "userForm()", "primary")) +
    `<div class="stats stats--compact">${stat("TỔNG TÀI KHOẢN", users.length, "Tất cả tài khoản")}${stat("ĐANG HOẠT ĐỘNG", users.filter((u) => u.active).length, "Có thể đăng nhập")}${stat("BỊ KHÓA", users.filter((u) => !u.active).length, "Không thể đăng nhập")}${stat("VAI TRÒ", Object.keys(rolelabels).length, "Cấu hình tập trung")}</div>` +
    `<section class="user-management-card">
      <header><div><h3>Danh sách và quản lý tài khoản</h3><p>Thêm, phân vai trò, đặt lại mật khẩu và khóa/mở tài khoản.</p></div><span>${systemIcon("users")} ${users.length} tài khoản</span></header>
      <div class="filters user-filters"><label class="search-field"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input aria-label="Tìm người dùng" placeholder="Tìm họ tên hoặc tài khoản…" value="${esc(userSearch)}" oninput="userSearch=this.value;render()"></label><select aria-label="Lọc theo vai trò" onchange="userRoleFilter=this.value;render()"><option value="all">Tất cả vai trò</option>${Object.entries(rolelabels).map(([key, label]) => `<option value="${key}" ${userRoleFilter === key ? "selected" : ""}>${esc(label)}</option>`).join("")}</select><select aria-label="Lọc theo trạng thái" onchange="userStatusFilter=this.value;render()"><option value="all">Tất cả trạng thái</option><option value="active" ${userStatusFilter === "active" ? "selected" : ""}>Đang hoạt động</option><option value="locked" ${userStatusFilter === "locked" ? "selected" : ""}>Đã khóa</option></select><span class="filter-count">${filtered.length}/${users.length} tài khoản</span></div>` +
      table(
        ["NGƯỜI DÙNG", "TÀI KHOẢN", "VAI TRÒ", "TRẠNG THÁI", "THAO TÁC"],
        filtered.map((u) => `<tr><td><div class="user-cell"><span>${esc(initials(u.fullName))}</span><div><b>${esc(u.fullName)}</b>${u.guideId ? `<small>HDV: ${esc(u.guideId)}${findGuide(u.guideId) ? "" : " · Không tồn tại"}</small>` : ""}</div></div></td><td><b>@${esc(u.username)}</b></td><td><select aria-label="Vai trò của ${esc(u.fullName)}" onchange="changeUserRole('${u.id}',this.value)" ${u.id === currentUser?.id ? "disabled" : ""}>${Object.entries(rolelabels).map(([k, l]) => `<option value="${k}" ${k === u.role ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></td><td>${badge(u.active ? "Đang hoạt động" : "Đã khóa", u.active ? "green" : "red")}</td><td><div class="actions">${(roleCapabilities[u.role] || []).includes("guide_portal") ? btn("Liên kết HDV", `linkUserGuideForm('${u.id}')`, "small") : ""}${btn(u.active ? "Khóa" : "Mở khóa", `toggleUser('${u.id}')`, "small")}${btn("Đặt lại mật khẩu", `resetUserPassword('${u.id}')`, "small")}</div></td></tr>`),
      ) +
    `</section>`
  );
};

/* ---------- Cài đặt ---------- */
function savePolicy(e) {
  e.preventDefault();
  if (!requireCapability("all", "Chỉ Giám đốc được thay đổi chính sách.")) return;
  const f = new FormData(e.target);
  const next = {
    minMarginPct: +f.get("minMarginPct"),
    maxDiscountPct: +f.get("maxDiscountPct"),
    requireDeposit: f.get("requireDeposit") === "on",
    depositPct: +f.get("depositPct"),
    costOverrunPct: +f.get("costOverrunPct"),
    settlementGraceDays: +f.get("settlementGraceDays"),
    quoteValidDays: +f.get("quoteValidDays"),
    monthlyTarget: +f.get("monthlyTarget"),
    refund30: +f.get("refund30"),
    refund15: +f.get("refund15"),
    refund7: +f.get("refund7"),
  };
  const limits = { settlementGraceDays: 365, quoteValidDays: 90, monthlyTarget: 1e13 };
  if (Object.entries(next).some(([k, v]) => k !== "requireDeposit" && (!Number.isFinite(v) || v < 0 || v > (limits[k] || 100)))) return toast("Giá trị chính sách không hợp lệ.");
  if (!state.settings.length) state.settings.push({ id: "CFG-1" });
  state.settings[0].policy = { ...(state.settings[0].policy || {}), ...next };
  audit("settings", "policy", "UPDATE", "Cập nhật chính sách nghiệp vụ");
  render();
  toast("Đã lưu chính sách.");
}

function settingsPolicyTab() {
  const p = policy();
  const num = (name, label, hint, max = 100) => `<label class="settings-field"><span>${label}</span><input name="${name}" type="number" min="0" max="${max}" step="0.5" value="${p[name]}" required><small>${hint}</small></label>`;
  const group = (icon, title, description, fields, wide = false) => `<section class="settings-group${wide ? " settings-group--wide" : ""}"><header><i class="fa-solid fa-${icon}" aria-hidden="true"></i><div><h3>${title}</h3><p>${description}</p></div></header><div class="settings-fields">${fields}</div></section>`;
  return `<form class="settings-policy-form" onsubmit="savePolicy(event)">
    <div class="settings-policy-grid">
      ${group("chart-line", "Phê duyệt & doanh thu", "Kiểm soát biên lợi nhuận, chiết khấu và ngân sách.", num("minMarginPct", "Biên lợi nhuận tối thiểu (%)", "Thấp hơn mức này cần CEO duyệt") + num("maxDiscountPct", "Chiết khấu tối đa (%)", "Sales được tự duyệt đến mức này") + num("costOverrunPct", "Ngưỡng vượt chi phí (%)", "Vượt dự toán cần CEO duyệt") + num("monthlyTarget", "Mục tiêu doanh thu tháng (VND)", "Nhập 0 nếu không đặt mục tiêu", 1e13))}
      ${group("route", "Đặt tour & quyết toán", "Thiết lập cọc, hiệu lực báo giá và thời hạn quyết toán.", num("depositPct", "Tỷ lệ đặt cọc (%)", "Tính trên giá trị hợp đồng") + num("quoteValidDays", "Hiệu lực báo giá (ngày)", "Tính từ ngày gửi khách", 90) + num("settlementGraceDays", "Hạn quyết toán (ngày)", "Tính từ ngày kết thúc tour", 365))}
      ${group("rotate-left", "Chính sách hoàn tiền", "Tỷ lệ hoàn trên tổng số tiền khách đã thanh toán.", num("refund30", "Hủy trước 30 ngày (%)", "Mức hoàn tiền sớm") + num("refund15", "Hủy trước 15–29 ngày (%)", "Mức hoàn tiền trung hạn") + num("refund7", "Hủy trước 7–14 ngày (%)", "Dưới 7 ngày không hoàn"), true)}
    </div>
    <label class="settings-toggle"><input name="requireDeposit" type="checkbox" ${p.requireDeposit ? "checked" : ""}><span class="settings-toggle-control" aria-hidden="true"></span><span><b>Bắt buộc đặt cọc trước khi bàn giao Điều hành</b><small>Chỉ chuyển booking sang bộ phận Điều hành sau khi đã ghi nhận tiền cọc.</small></span></label>
    <footer class="settings-savebar"><div><b>Chính sách nghiệp vụ</b><small>Thay đổi được áp dụng ngay cho các nghiệp vụ phát sinh tiếp theo.</small></div><button class="btn primary"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Lưu thay đổi</button></footer>
  </form>`;
}

let auditUser = "all", auditEntity = "all";
function settingsAuditTab() {
  const all = state.auditLogs || [];
  const users = [...new Set(all.map((a) => a.user).filter(Boolean))].sort(), entities = [...new Set(all.map((a) => a.entity).filter(Boolean))].sort();
  const logs = all.filter((a) => (auditUser === "all" || a.user === auditUser) && (auditEntity === "all" || a.entity === auditEntity)).slice(0, 200);
  const filter = `<div class="filters"><select aria-label="Lọc theo người dùng" onchange="auditUser=this.value;render()"><option value="all">Tất cả người dùng</option>${users.map((u) => `<option ${auditUser === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select><select aria-label="Lọc theo đối tượng" onchange="auditEntity=this.value;render()"><option value="all">Tất cả đối tượng</option>${entities.map((u) => `<option ${auditEntity === u ? "selected" : ""}>${esc(u)}</option>`).join("")}</select><span class="sub" style="margin-left:auto">${logs.length} / ${all.length} dòng</span></div>`;
  return card(
    "Nhật ký hoạt động",
    filter +
    logs.length
      ? table(["THỜI GIAN", "NGƯỜI DÙNG", "ĐỐI TƯỢNG", "HÀNH ĐỘNG", "NỘI DUNG"], logs.map((a) => `<tr><td>${dateTimeVN(a.at)}</td><td>${esc(a.user)}<span class="sub">${esc(a.role || "")}</span></td><td>${esc(a.entity)} ${esc(a.entityId || "")}</td><td>${badge(a.action)}</td><td style="white-space:normal">${esc(a.summary)}</td></tr>`))
      : '<div class="empty">Chưa có nhật ký.</div>',
  );
}

function settingsRolesTab() {
  const labelOf = Object.fromEntries(pages.map((p) => [p[0], p[2]]));
  return card(
    "Ma trận vai trò & menu",
    table(
      ["VAI TRÒ", "MENU ĐƯỢC TRUY CẬP", "QUYỀN CHÍNH"],
      Object.keys(rolelabels).map((r) => `<tr><td><b>${esc(rolelabels[r])}</b></td><td style="white-space:normal">${(rights[r] || []).map((m) => badge(labelOf[m] || m)).join(" ")}</td><td style="white-space:normal"><span class="sub">${(roleCapabilities[r] || []).map(esc).join(", ")}</span></td></tr>`),
    ) + '<p class="sub">Quyền được định nghĩa theo vai trò trong hệ thống; tài khoản đổi vai trò tại mục Người dùng.</p>',
  );
}

function settingsBackupTab() {
  return card("Sao lưu dữ liệu", `<p class="sub">Xuất toàn bộ dữ liệu đang nạp từ database ra file JSON.</p>${btn("Tải bản sao lưu", "downloadBackup()", "primary")}`);
}

function settingsTabBody() {
  if (settingsTab === "fx") return fxRatesPanel();
  if (settingsTab === "audit") return settingsAuditTab();
  if (settingsTab === "roles") return settingsRolesTab();
  if (settingsTab === "backup") return settingsBackupTab();
  return settingsPolicyTab();
}

views.settings = () => {
  if (!can("all")) return title("Cài đặt", "Chỉ Giám đốc được thay đổi cài đặt hệ thống.");
  const tabs = [["policy", "sliders", "Chính sách"], ["audit", "clock-rotate-left", "Nhật ký"], ["roles", "user-shield", "Vai trò & menu"], ["backup", "database", "Sao lưu"]];
  tabs.splice(1, 0, ["fx", "coins", "Tỷ giá"]);
  return `<div class="settings-page">` +
    title("Cài đặt hệ thống", "Ngưỡng phê duyệt, nhật ký và phân quyền.") +
    `<nav class="tabs settings-tabs" aria-label="Các mục cài đặt">${tabs.map(([k, icon, label]) => `<button class="btn ${settingsTab === k ? "selected" : ""}" onclick="settingsTab='${k}';render()"><i class="fa-solid fa-${icon}" aria-hidden="true"></i>${label}</button>`).join("")}</nav>` +
    settingsTabBody() +
    `</div>`;
};


/* ---------- Đổi mật khẩu cá nhân (bắt buộc ở lần đăng nhập đầu hoặc sau khi bị đặt lại) ---------- */
function passwordForm(forced = false) {
  closeAccountMenu();
  modal("Đổi mật khẩu", `<form onsubmit="saveMyPassword(event)">${forced ? '<div class="alert red"><b>Bạn cần đổi mật khẩu mặc định</b> trước khi tiếp tục sử dụng hệ thống.</div>' : ""}<label>Mật khẩu hiện tại<input name="old" type="password" autocomplete="current-password" required></label><label>Mật khẩu mới (tối thiểu 8 ký tự, gồm chữ và số)<input name="next" type="password" autocomplete="new-password" required minlength="8"></label><label>Nhập lại mật khẩu mới<input name="again" type="password" autocomplete="new-password" required></label><div class="formfooter"><button class="btn primary">Đổi mật khẩu</button></div></form>`, true);
  if (forced) {
    const back = document.querySelector(".modalback");
    if (back) back.onclick = null;
    document.querySelector(".modal .close")?.remove();
  }
}

async function saveMyPassword(e) {
  e.preventDefault();
  const f = new FormData(e.target), oldPw = f.get("old"), next = f.get("next");
  if (next !== f.get("again")) return toast("Mật khẩu nhập lại không khớp.");
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) return toast("Mật khẩu mới cần ít nhất 8 ký tự, gồm cả chữ và số.");
  if (next === "123456" || next === oldPw) return toast("Mật khẩu mới phải khác mật khẩu cũ và không phải mật khẩu mặc định.");
  try {
    await loadAuthUsers();
    const users = authUsers.map((u) => ({ ...u })), me = users.find((u) => u.id === currentUser.id);
    if (!me) return toast("Không tìm thấy tài khoản.");
    if (!hashesMatch(await hashPassword(oldPw, me.salt, me.iterations), me.passwordHash)) return toast("Mật khẩu hiện tại không đúng.");
    Object.assign(me, await passwordRecord(next, me.iterations || 100000), { mustChangePassword: false });
    await persistAuthUsers(users);
    currentUser.mustChangePassword = false;
    audit("user", me.id, "PASSWORD", `${me.username} đổi mật khẩu`);
    closeModal();
    toast("Đã đổi mật khẩu.");
  } catch (error) {
    toast("Không đổi được mật khẩu: " + error.message);
  }
}

/* Chưa đổi mật khẩu mặc định thì không đóng được hộp thoại. */
function enforcePasswordChange() {
  if (currentUser?.mustChangePassword && !document.querySelector(".modalback")) passwordForm(true);
}
