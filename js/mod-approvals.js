/* MODULE mod-approvals — hàng chờ phê duyệt của Giám đốc. */

let approvalTab = "pending";

const approvalRefLink = (a) => (a.refType === "quote" ? entityLink("quote", a.ref) : entityLink("booking", a.ref));

function approvalDetail(a) {
  const d = a.data || {};
  if (a.type === "QUOTE_PRICE") return `Chiết khấu/biên lợi nhuận vượt ngưỡng${d.margin != null ? ` · biên ${d.margin}%` : ""}`;
  if (a.type === "CANCEL") return `Hoàn tiền đề xuất: ${money(d.refund || 0)}`;
  if (a.type === "COST_OVERRUN") return d.total ? `Tổng chi phí: ${money(d.total)}` : "";
  if (a.type === "REFUND") return `Hoàn ${money(a.amount || 0)}`;
  return "";
}

views.approvals = () => {
  const all = [...(state.approvals || [])].sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || ""));
  const pending = all.filter((a) => a.status === "PENDING");
  const decided = all.filter((a) => a.status !== "PENDING");
  const list = approvalTab === "pending" ? pending : decided;
  const tabs = [["pending", `Chờ duyệt (${pending.length})`], ["decided", `Đã xử lý (${decided.length})`]];
  return (
    title("Phê duyệt", "Các đề xuất cần Giám đốc quyết định: giá/chiết khấu, miễn cọc, vượt chi phí, hủy tour, hoàn tiền.") +
    `<nav class="tabs">${tabs.map(([k, l]) => `<button class="btn ${approvalTab === k ? "selected" : ""}" onclick="approvalTab='${k}';render()">${l}</button>`).join("")}</nav>` +
    card(
      approvalTab === "pending" ? "Đang chờ quyết định" : "Lịch sử phê duyệt",
      list.length
        ? table(
            ["MÃ", "LOẠI", "ĐỐI TƯỢNG", "NỘI DUNG", "GIÁ TRỊ", "NGƯỜI ĐỀ XUẤT", approvalTab === "pending" ? "" : "KẾT QUẢ"],
            list.map((a) => `<tr><td>${a.id}<span class="sub">${dateTimeVN(a.requestedAt)}</span></td><td>${badge(approvalTypes[a.type] || a.type, "blue")}</td><td>${approvalRefLink(a)}</td><td style="white-space:normal">${esc(a.reason || "")}<span class="sub">${esc(approvalDetail(a))}</span></td><td>${a.amount ? money(a.amount) : "—"}</td><td>${esc(a.requestedBy || "")}</td><td>${approvalTab === "pending" ? `<div class="actions">${btn("Duyệt", `approvalDecisionForm('${a.id}',true)`, "small primary")}${btn("Từ chối", `approvalDecisionForm('${a.id}',false)`, "small")}</div>` : `${badge(approvalLabels[a.status], a.status === "APPROVED" ? "green" : "red")}<span class="sub">${esc(a.decidedBy || "")} · ${dateTimeVN(a.decidedAt)}${a.decisionNote ? "<br>" + esc(a.decisionNote) : ""}</span>`}</td></tr>`),
          )
        : `<div class="empty">${approvalTab === "pending" ? "Không có đề xuất nào đang chờ." : "Chưa có phê duyệt nào được xử lý."}</div>`,
    )
  );
};

function approvalDecisionForm(id, approve) {
  const a = state.approvals.find((x) => x.id === id);
  if (!a) return;
  modal(
    `${approve ? "Duyệt" : "Từ chối"} · ${approvalTypes[a.type]}`,
    `<form onsubmit="submitApprovalDecision(event,'${id}',${approve})">${line("Đối tượng", approvalRefLink(a))}${line("Lý do đề xuất", esc(a.reason || "—"))}${a.amount ? line("Giá trị", money(a.amount)) : ""}<label style="margin-top:14px">Ghi chú quyết định${approve ? " (tùy chọn)" : " (bắt buộc)"}<textarea name="note" ${approve ? "" : "required"}></textarea></label><div class="formfooter"><button class="btn ${approve ? "primary" : "danger"}">${approve ? "Xác nhận duyệt" : "Xác nhận từ chối"}</button></div></form>`,
    true,
  );
}

function submitApprovalDecision(e, id, approve) {
  e.preventDefault();
  decideApproval(id, approve, new FormData(e.target).get("note").trim());
  closeModal();
  render();
  toast(approve ? "Đã duyệt." : "Đã từ chối.");
}
