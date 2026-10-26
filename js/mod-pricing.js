/* MODULE mod-pricing — bảng giá mẫu theo số khách, dùng chung cho thiết kế tour và báo giá. */
let pricingEditor = { id: "", name: "", tiers: [{ pax: 1, price: "" }] };

function pricingSettings() {
  if (!Array.isArray(state.settings)) state.settings = [{}];
  if (!state.settings[0]) state.settings[0] = {};
  if (!Array.isArray(state.settings[0].quotationPriceLists)) state.settings[0].quotationPriceLists = [];
  return state.settings[0].quotationPriceLists;
}
function pricingProfileName(id) { return pricingSettings().find((p) => p.id === id)?.name || ""; }
function pricingMoneyInput(vnd) { return fxFromVnd(Number(vnd) || 0, fxInputCode(fxDisplayCurrency)); }
function pricingMoneyLabel(vnd) { return fxMoney(Number(vnd) || 0, fxDisplayCurrency); }
function pricingCanManage() { return can("all") || can("pricing_manage"); }

function pricingPage() {
  if (!pricingCanManage()) return title("Điều chỉnh bảng giá", "Bạn không có quyền truy cập bảng giá.");
  const profiles = pricingSettings();
  const rows = profiles.map((p) => `<tr><td><b>${esc(p.name)}</b></td><td class="pricing-count">${(p.tiers || []).length}</td><td>${p.updatedAt ? esc(dateTimeVN(p.updatedAt)) : "—"}</td><td><div class="pricing-actions"><button class="btn small" onclick="pricingView('${p.id}')">Xem</button><button class="btn small" onclick="pricingEdit('${p.id}')">Sửa</button><button class="btn small danger" onclick="pricingDelete('${p.id}')">Xóa</button></div></td></tr>`).join("");
  return `<section class="pricing-page">${title("Điều chỉnh bảng giá", "Quản lý các bảng giá mẫu để tái sử dụng khi thiết kế tour.")}
    <div class="pricing-toolbar"><div><b>${profiles.length} bảng giá</b><p class="sub">Mỗi bảng giá gồm các mức giá theo số khách và đơn giá mỗi khách. Chỉ bắt buộc khai báo mức 1 khách; giá nhập theo tiền tệ đang chọn và lưu nội bộ bằng VND theo tỷ giá VCB hiện có.</p></div><button class="btn primary" onclick="pricingNew()"><i class="fa-solid fa-plus"></i> Tạo bảng giá</button></div>
    <div class="table-wrap pricing-table-wrap"><table class="pricing-table"><thead><tr><th>Tên báo giá</th><th>Số mức giá</th><th>Thời gian cập nhật</th><th>Hành động</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="pricing-empty-cell">Chưa có bảng giá. Hãy tạo bảng đầu tiên để sử dụng khi thiết kế tour.</td></tr>'}</tbody></table></div></section>`;
}

views.pricing = pricingPage;

function pricingView(id) {
  const p = pricingSettings().find((x) => x.id === id); if (!p) return toast("Không tìm thấy bảng giá.");
  const tiers = [...(p.tiers || [])].sort((a,b) => Number(a.pax)-Number(b.pax));
  const rows = tiers.map((t) => `<tr><td>${Number(t.pax)} khách</td><td>${pricingMoneyLabel(t.priceVnd)}</td></tr>`).join("");
  modal("Chi tiết bảng giá", `<div class="pricing-view-modal"><div class="pricing-view-meta"><div><span>Tên báo giá</span><b>${esc(p.name)}</b></div><div><span>Số mức giá</span><b>${tiers.length}</b></div><div><span>Thời gian cập nhật</span><b>${p.updatedAt ? esc(dateTimeVN(p.updatedAt)) : "—"}</b></div></div><div class="table-wrap"><table class="pricing-view-table"><thead><tr><th>Số khách</th><th>Giá mỗi khách</th></tr></thead><tbody>${rows || '<tr><td colspan="2">Chưa có mức giá</td></tr>'}</tbody></table></div><p class="sub">Khi áp dụng cho tour, hệ thống chọn mức có ngưỡng số khách lớn nhất mà số khách tour lớn hơn hoặc bằng ngưỡng đó; ví dụ mức 5 khách áp dụng cho tour từ 5 khách trở lên. Nếu không có mức phù hợp thì dùng mức 1 khách. Đơn giá được áp dụng theo cách tính giá đã chọn (theo ngày hoặc cả tour).</p><footer class="formfooter"><button type="button" class="btn" onclick="closeModal()">Đóng</button><button type="button" class="btn primary" onclick="pricingEdit('${p.id}')">Sửa bảng giá</button></footer></div>`);
}

function pricingNew() { pricingEditor = { id: "", name: "", tiers: [{ pax: 1, price: "" }] }; pricingEditorRender(); }
function pricingEdit(id) {
  const p = pricingSettings().find((x) => x.id === id); if (!p) return toast("Không tìm thấy bảng giá.");
  pricingEditor = { id: p.id, name: p.name, tiers: (p.tiers || []).map((t) => ({ pax: Number(t.pax), price: pricingMoneyInput(t.priceVnd) })) };
  pricingEditorRender();
}
function pricingAddTier() { pricingEditor.tiers.push({ pax: "", price: "" }); pricingEditorRender(); }
function pricingTierEdit(i, field, value) { if (pricingEditor.tiers[i]) pricingEditor.tiers[i][field] = value; }
function pricingRemoveTier(i) {
  if (Number(pricingEditor.tiers[i]?.pax) === 1) return toast("Mức 1 khách là bắt buộc.");
  pricingEditor.tiers.splice(i, 1); pricingEditorRender();
}
function pricingEditorRender() {
  const rows = pricingEditor.tiers.map((t, i) => `<div class="pricing-tier-row"><label>Số khách<input name="pax_${i}" type="number" min="1" step="1" value="${esc(t.pax)}" onchange="pricingTierEdit(${i},'pax',this.value)" ${Number(t.pax) === 1 ? 'readonly aria-label="Mức bắt buộc 1 khách"' : 'required'}></label><label>Giá mỗi khách (${esc(fxInputCode(fxDisplayCurrency))})<input name="price_${i}" type="number" min="0" step="any" value="${esc(t.price)}" onchange="pricingTierEdit(${i},'price',this.value)" required></label><button type="button" class="btn small danger" onclick="pricingRemoveTier(${i})" ${Number(t.pax) === 1 ? "disabled title='Mức 1 khách là bắt buộc'" : ""}>Xóa</button></div>`).join("");
  modal(pricingEditor.id ? "Sửa bảng giá" : "Tạo bảng giá", `<form onsubmit="pricingSave(event)" class="pricing-editor"><label class="dz-field">Tên bảng giá <i class="req">*</i><input name="name" required maxlength="100" value="${esc(pricingEditor.name)}" oninput="pricingEditor.name=this.value" placeholder="Ví dụ: Báo giá A"></label><div class="pricing-tier-head"><div><b>Các mức giá</b><p class="sub">Mỗi mức có ngưỡng số khách từ 1 trở lên và đơn giá mỗi khách. Không giới hạn số khách tối đa, không cần khai báo đủ các mức; chỉ bắt buộc có mức 1 khách. Đơn giá được dùng theo lựa chọn giá theo ngày hoặc cả tour khi thiết kế tour.</p></div><button type="button" class="btn small" onclick="pricingAddTier()">+ Thêm mức</button></div><div class="pricing-tier-list">${rows}</div><footer class="formfooter"><button type="button" class="btn" onclick="closeModal()">Hủy</button><button class="btn primary">Lưu bảng giá</button></footer></form>`, true);
}
function pricingSave(e) {
  e.preventDefault();
  const form = e.currentTarget, data = new FormData(form), name = String(data.get("name") || "").trim();
  if (!name) return toast("Hãy nhập tên bảng giá.");
  const tiers = pricingEditor.tiers.map((t, i) => ({ pax: Number(data.get(`pax_${i}`)), priceVnd: fxToVnd(Math.max(0, Number(data.get(`price_${i}`)) || 0), fxInputCode(fxDisplayCurrency)) }));
  if (tiers.some((t) => !Number.isSafeInteger(t.pax) || t.pax < 1 || !Number.isFinite(t.priceVnd))) return toast("Số khách phải là số nguyên dương an toàn và giá phải hợp lệ.");
  if (!tiers.some((t) => t.pax === 1)) return toast("Mức 1 khách là bắt buộc.");
  if (new Set(tiers.map((t) => t.pax)).size !== tiers.length) return toast("Không được trùng số khách trong cùng bảng giá.");
  if (pricingSettings().some((p) => p.id !== pricingEditor.id && p.name.trim().toLowerCase() === name.toLowerCase())) return toast("Tên bảng giá đã tồn tại.");
  tiers.sort((a,b) => a.pax-b.pax);
  const list = pricingSettings(), now = new Date().toISOString();
  if (pricingEditor.id) {
    const p = list.find((x) => x.id === pricingEditor.id); if (!p) return toast("Bảng giá không còn tồn tại.");
    Object.assign(p, { name, tiers, updatedAt: now }); audit("pricing", p.id, "UPDATE", `Cập nhật bảng giá ${name}`);
  } else {
    const p = { id: "PR-" + Date.now().toString(36).toUpperCase(), name, tiers, createdAt: now, updatedAt: now, owner: actor().name };
    list.push(p); audit("pricing", p.id, "CREATE", `Tạo bảng giá ${name}`);
  }
  save(); closeModal(); render(); toast("Đã lưu bảng giá.");
}
function pricingDelete(id) {
  const p = pricingSettings().find((x) => x.id === id); if (!p) return;
  if (!confirm(`Xóa bảng giá “${p.name}”? Các báo giá đã tạo trước đó không bị thay đổi.`)) return;
  state.settings[0].quotationPriceLists = pricingSettings().filter((x) => x.id !== id);
  audit("pricing", id, "DELETE", `Xóa bảng giá ${p.name}`); save(); render(); toast("Đã xóa bảng giá.");
}
