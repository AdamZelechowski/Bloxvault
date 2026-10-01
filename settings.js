import { parseNumber, setFieldFeedback } from "./ui.js";

const KEY = "bv.setup.v2";
let cache = null;

// Printers and filaments are arrays so several profiles can be added later; only the active ones are used today.
// Starting values are placeholders, not recommendations.
const fresh = () => ({
  v: 2, activePrinter: "p1", activeFilament: "f1",
  printers: [{ id: "p1", name: "", watts: 120, bedX: 220, bedY: 220, bedZ: 250 }],
  filaments: [{ id: "f1", name: "", pricePerKg: 20, emptySpoolGrams: 200 }],
  costs: { electricityRate: 0.15, failureRate: 5, laborRate: 15, feePercent: 0, marginPercent: 30, currency: "$" },
});

// [group, property, label, input type, extra attributes, plain-language hint]
const FIELDS = [
  ["printer", "name", "Printer name", "text", { maxlength: 40, placeholder: "e.g. Ender 3" }, "Just a label for you."],
  ["printer", "watts", "Average power (W)", "number", { min: 0, step: 1 }, "Electricity used while printing. Check the spec sheet, or measure with a plug-in power meter."],
  ["printer", "bedX", "Bed width (mm)", "number", { min: 0, step: 1 }, "The largest size your printer can print, from its spec sheet."],
  ["printer", "bedY", "Bed depth (mm)", "number", { min: 0, step: 1 }, "Front to back."],
  ["printer", "bedZ", "Max print height (mm)", "number", { min: 0, step: 1 }, "How tall a print can be."],
  ["filament", "name", "Filament", "text", { maxlength: 40, placeholder: "e.g. PLA, black" }, "Just a label for you."],
  ["filament", "pricePerKg", "Price per kg", "number", { min: 0, step: 0.01 }, "The price of a spool divided by its weight in kg."],
  ["filament", "emptySpoolGrams", "Empty spool weight (g)", "number", { min: 0, step: 1 }, "Varies by brand. Weigh an empty spool if you can."],
  ["costs", "electricityRate", "Electricity price per kWh", "number", { min: 0, step: 0.01 }, "On your electric bill, listed per kWh."],
  ["costs", "failureRate", "Failed prints (%)", "number", { min: 0, max: 90, step: 1 }, "Out of 100 prints, how many go wrong and get thrown away. 5 is a fair guess to start."],
  ["costs", "laborRate", "Your time per hour", "number", { min: 0, step: 0.5 }, "What an hour of your time is worth. Use 0 for a hobby."],
  ["costs", "feePercent", "Marketplace fees (%)", "number", { min: 0, max: 50, step: 0.1 }, "The cut a marketplace like Etsy takes. Use 0 if you sell directly."],
  ["costs", "marginPercent", "Profit you want to keep (%)", "number", { min: 0, max: 90, step: 1 }, "The share of the sale price left as profit after costs and fees."],
  ["costs", "currency", "Currency symbol", "text", { maxlength: 3 }, "Shown in results."],
];
const TITLES = { printer: "Printer", filament: "Filament", costs: "Costs and selling" };

function load() {
  if (cache) return cache;
  const d = fresh();
  cache = d;
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s?.v === 2) {
      cache = {
        ...d, ...s,
        printers: s.printers?.length ? s.printers.map((p) => ({ ...d.printers[0], ...p })) : d.printers,
        filaments: s.filaments?.length ? s.filaments.map((f) => ({ ...d.filaments[0], ...f })) : d.filaments,
        costs: { ...d.costs, ...s.costs },
      };
    }
  } catch { /* storage blocked or corrupt: use defaults */ }
  return cache;
}

function save(st) {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* settings last for this visit only */ }
}

const active = (st) => ({
  printer: st.printers.find((p) => p.id === st.activePrinter) || st.printers[0],
  filament: st.filaments.find((f) => f.id === st.activeFilament) || st.filaments[0],
  costs: st.costs,
});

// The flat view every tool reads.
function flatten(st) {
  const { printer: p, filament: f, costs } = active(st);
  return {
    printerName: p.name, printerWatts: p.watts, bedX: p.bedX, bedY: p.bedY, bedZ: p.bedZ,
    filamentName: f.name, filamentPricePerKg: f.pricePerKg, emptySpoolGrams: f.emptySpoolGrams, ...costs,
  };
}

export const loadSettings = () => flatten(load());

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

// A fixed, hand-authored icon — never built from user input, so innerHTML is safe here.
const PRINTER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M6 16v5h12v-5"/><circle cx="17.3" cy="12.2" r=".6" fill="currentColor" stroke="none"/></svg>';
const icon = (svg) => {
  const span = document.createElement("span");
  span.innerHTML = svg; // fixed constant above, not derived from any variable
  return span.firstElementChild;
};

// Shows a compact "My setup" card; its Edit button opens the full form in a dialog.
// Calls onChange(settings) after every edit. Returns { open } so a page can open the dialog too.
export function mountSettings(container, onChange = () => {}) {
  const st = load();

  const card = el("div", "card setup-card");
  const iconWrap = el("span", "setup-icon");
  iconWrap.append(icon(PRINTER_ICON));
  const chips = el("div", "setup-chips");
  const edit = el("button", "btn btn-sm btn-outline-light edit-btn", "Edit setup");
  edit.type = "button";
  card.append(iconWrap, chips, edit);

  const chip = (label, value) => {
    const wrap = el("span", "setup-chip");
    wrap.append(el("span", "label", label + " "), el("span", "value", value));
    return wrap;
  };
  const sep = () => el("span", "sep d-none d-sm-inline", "·");

  const paint = () => {
    const s = flatten(st);
    chips.replaceChildren(
      chip("Printer", s.printerName || "Unnamed"), sep(),
      chip("Bed", `${s.bedX}×${s.bedY}×${s.bedZ} mm`), sep(),
      chip("Filament", s.filamentName || "Unnamed"), sep(),
      chip("Material", `${s.currency}${s.filamentPricePerKg}/kg`), sep(),
      chip("Power", `${s.currency}${s.electricityRate}/kWh`),
    );
  };

  const dlg = el("dialog", "setup-dialog");
  dlg.setAttribute("aria-labelledby", "setupTitle");
  const body = el("div", "dialog-body");
  const title = el("h2", "h5", "My setup");
  title.id = "setupTitle";
  body.append(title, el("p", "small text-secondary", "Saved in this browser. The starting values are placeholders, so change them to match your printer and filament."));
  let group = null, grid = null;
  for (const [g, prop, label, type, attrs, hint] of FIELDS) {
    if (g !== group) {
      group = g;
      grid = el("div", "row g-3");
      body.append(el("h3", "h6 mt-3", TITLES[g]), grid);
    }
    const col = el("div", "col-sm-6");
    const lab = el("label", "form-label", label);
    lab.htmlFor = `set-${g}-${prop}`;
    const input = el("input", "form-control");
    input.id = lab.htmlFor;
    input.type = type;
    for (const [k, v] of Object.entries(attrs)) input.setAttribute(k, v);
    input.value = active(st)[g][prop];
    input.addEventListener("input", () => {
      if (type !== "number") {
        active(st)[g][prop] = input.value.slice(0, Number(attrs.maxlength) || 40);
        setFieldFeedback(input, null);
        save(st);
        paint();
        onChange(flatten(st));
        return;
      }
      const min = attrs.min !== undefined ? Number(attrs.min) : 0;
      const max = attrs.max !== undefined ? Number(attrs.max) : Infinity;
      const parsed = parseNumber(input.value, { min, max, label });
      setFieldFeedback(input, parsed.error);
      // Empty = soft incomplete: keep last saved value. Invalid: do not save or clamp.
      if (parsed.status !== "ok") return;
      active(st)[g][prop] = parsed.value;
      save(st);
      paint();
      onChange(flatten(st));
    });
    col.append(lab, input, el("div", "form-text", hint));
    grid.append(col);
  }
  const done = el("button", "btn btn-primary mt-4", "Done");
  done.type = "button";
  done.addEventListener("click", () => dlg.close());
  body.append(done);
  dlg.append(body);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  edit.addEventListener("click", () => dlg.showModal());

  paint();
  container.replaceChildren(card, dlg);
  return { open: () => dlg.showModal() };
}
