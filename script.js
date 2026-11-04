// Bill Splitter by Vikas Kapuganti
// Equal split: (bill + tip) / people
// Trip settle-up: everyone's share = total / people.
// Balance = paid - share. People with a negative balance pay people with a positive balance.

const STORAGE_KEY = "bill-splitter-v1";
const personList = document.getElementById("person-list");

const rupees = n => "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const num = id => parseFloat(document.getElementById(id).value) || 0;

// ---------- Saving ----------
function save() {
  const data = {
    bill: document.getElementById("bill").value,
    people: document.getElementById("people").value,
    tip: document.getElementById("tip").value,
    roundup: document.getElementById("roundup").checked,
    persons: [...personList.children].map(r => ({
      name: r.querySelector(".name").value,
      paid: r.querySelector(".paid").value
    }))
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage not available */ }
}
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
}

// ---------- Equal split ----------
function calcEqual() {
  const bill = num("bill");
  const people = Math.max(1, Math.floor(num("people")) || 1);
  const total = bill * (1 + num("tip") / 100);
  let each = total / people;
  if (document.getElementById("roundup").checked) each = Math.ceil(each);
  return { bill, people, total, each };
}

// ---------- Trip settle-up ----------
function addPerson(name = "", paid = "") {
  const row = document.createElement("div");
  row.className = "row person";
  row.innerHTML = `
    <input class="name" type="text" placeholder="Person ${personList.children.length + 1}" aria-label="Name">
    <input class="paid" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0" aria-label="Amount paid">
    <button class="remove" aria-label="Remove person">&times;</button>`;
  row.querySelector(".name").value = name;
  row.querySelector(".paid").value = paid;
  personList.appendChild(row);
}

function calcTrip() {
  const people = [...personList.children].map((r, i) => ({
    name: r.querySelector(".name").value.trim() || `Person ${i + 1}`,
    paid: parseFloat(r.querySelector(".paid").value) || 0
  }));
  const total = people.reduce((s, p) => s + p.paid, 0);
  const share = people.length ? total / people.length : 0;

  // Work in paise (whole numbers) to avoid rounding errors
  const debtors = [], creditors = [];
  people.forEach(p => {
    const balance = Math.round((p.paid - share) * 100);
    if (balance < 0) debtors.push({ name: p.name, amt: -balance });
    if (balance > 0) creditors.push({ name: p.name, amt: balance });
  });
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);

  // Greedy matching keeps the number of payments small
  const payments = [];
  let d = 0, c = 0;
  while (d < debtors.length && c < creditors.length) {
    const amt = Math.min(debtors[d].amt, creditors[c].amt);
    if (amt > 0) payments.push({ from: debtors[d].name, to: creditors[c].name, amt: amt / 100 });
    debtors[d].amt -= amt;
    creditors[c].amt -= amt;
    if (debtors[d].amt === 0) d++;
    if (creditors[c].amt === 0) c++;
  }
  return { total, share, payments, count: people.length };
}

// ---------- Update screen ----------
function update() {
  const e = calcEqual();
  document.getElementById("each").textContent = rupees(e.each);
  document.getElementById("total").textContent = rupees(Math.round(e.total * 100) / 100);

  const t = calcTrip();
  document.getElementById("trip-total").textContent = rupees(t.total);
  document.getElementById("trip-share").textContent = rupees(Math.round(t.share * 100) / 100);
  const list = document.getElementById("settle");
  if (!t.payments.length) {
    list.innerHTML = `<li class="empty">${t.total ? "Everyone is settled up." : "Add amounts to see who pays whom."}</li>`;
  } else {
    list.innerHTML = t.payments
      .map(p => `<li><span><b>${escapeHtml(p.from)}</b> pays <b>${escapeHtml(p.to)}</b></span><span class="amt">${rupees(p.amt)}</span></li>`)
      .join("");
  }
  save();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

// ---------- Copy summaries ----------
async function copyText(text, msgId) {
  const msg = document.getElementById(msgId);
  try {
    await navigator.clipboard.writeText(text);
    msg.textContent = "Copied. Paste it in your group chat.";
  } catch (err) {
    msg.textContent = "Could not copy automatically. Select and copy the result instead.";
  }
  setTimeout(() => (msg.textContent = ""), 3000);
}

document.getElementById("copy-equal").addEventListener("click", () => {
  const e = calcEqual();
  if (!e.bill) return copyText("", "copied-equal");
  copyText(`Bill: ${rupees(Math.round(e.total * 100) / 100)} split between ${e.people} people.\nEach person pays ${rupees(e.each)}.`, "copied-equal");
});

document.getElementById("copy-trip").addEventListener("click", () => {
  const t = calcTrip();
  const lines = [`Trip total: ${rupees(t.total)} (${rupees(Math.round(t.share * 100) / 100)} each)`];
  t.payments.forEach(p => lines.push(`${p.from} pays ${p.to}: ${rupees(p.amt)}`));
  if (!t.payments.length) lines.push("Everyone is settled up.");
  copyText(lines.join("\n"), "copied-trip");
});

// ---------- Events ----------
document.addEventListener("input", update);
document.addEventListener("change", update);
document.addEventListener("click", e => {
  if (e.target.classList.contains("remove")) {
    e.target.closest(".row").remove();
    update();
  }
});
document.getElementById("add-person").addEventListener("click", () => { addPerson(); update(); });
document.getElementById("reset").addEventListener("click", () => {
  if (!confirm("Clear everything?")) return;
  ["bill"].forEach(id => (document.getElementById(id).value = ""));
  document.getElementById("people").value = 4;
  document.getElementById("tip").value = 0;
  document.getElementById("roundup").checked = false;
  personList.innerHTML = "";
  for (let i = 0; i < 3; i++) addPerson();
  update();
});

function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on);
  });
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === name));
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));

// ---------- Start ----------
const saved = load();
if (saved) {
  document.getElementById("bill").value = saved.bill || "";
  document.getElementById("people").value = saved.people || 4;
  document.getElementById("tip").value = saved.tip || 0;
  document.getElementById("roundup").checked = !!saved.roundup;
  (saved.persons && saved.persons.length ? saved.persons : [{}, {}, {}]).forEach(p => addPerson(p.name, p.paid));
} else {
  for (let i = 0; i < 3; i++) addPerson();
}
update();
