const KEY = "bv.settings.v1";

// [key, label, input type, extra attributes, plain-language hint]
const FIELDS = [
  ["printerName", "Printer name", "text", { maxlength: 40, placeholder: "e.g. Ender 3" }, "Just a label for you."],
  ["printerWatts", "Average printer power (W)", "number", { min: 0, step: 1 }, "Electricity used while printing. Check the spec sheet, or measure with a plug-in power meter."],
  ["bedX", "Bed width (mm)", "number", { min: 0, step: 1 }, "The largest size your printer can print, from its spec sheet."],
  ["bedY", "Bed depth (mm)", "number", { min: 0, step: 1 }, "Front to back."],
  ["bedZ", "Max print height (mm)", "number", { min: 0, step: 1 }, "How tall a print can be."],
  ["filamentName", "Filament", "text", { maxlength: 40, placeholder: "e.g. PLA, black" }, "Just a label for you."],
  ["filamentPricePerKg", "Filament price per kg", "number", { min: 0, step: 0.01 }, "The price of a spool divided by its weight in kg."],
  ["electricityRate", "Electricity price per kWh", "number", { min: 0, step: 0.01 }, "On your electric bill, listed per kWh."],
  ["failureRate", "Failed prints (%)", "number", { min: 0, max: 90, step: 1 }, "Out of 100 prints, how many go wrong and get thrown away. 5 is a fair guess to start."],
  ["laborRate", "Your time per hour", "number", { min: 0, step: 0.5 }, "What an hour of your time is worth. Use 0 for a hobby."],
  ["feePercent", "Marketplace fees (%)", "number", { min: 0, max: 50, step: 0.1 }, "The cut a marketplace like Etsy takes. Use 0 if you sell directly."],
  ["marginPercent", "Profit you want to keep (%)", "number", { min: 0, max: 90, step: 1 }, "The share of the sale price left as profit after costs and fees."],
  ["currency", "Currency symbol", "text", { maxlength: 3 }, "Shown in results."],
];

// Starting values are placeholders, not recommendations.
export const DEFAULTS = {
  printerName: "", printerWatts: 120, bedX: 220, bedY: 220, bedZ: 250, filamentName: "", filamentPricePerKg: 20,
  electricityRate: 0.15, failureRate: 5, laborRate: 15, feePercent: 0, marginPercent: 30, currency: "$",
};

export function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return { ...DEFAULTS }; }
}

function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked: settings last for this visit only */ }
}

// Builds the settings form inside `container`; calls onChange(settings) after every edit.
export function mountSettings(container, onChange = () => {}) {
  const s = loadSettings();
  const grid = document.createElement("div");
  grid.className = "row g-3";
  for (const [key, label, type, attrs, hint] of FIELDS) {
    const col = document.createElement("div");
    col.className = "col-sm-6";
    const lab = document.createElement("label");
    lab.className = "form-label";
    lab.htmlFor = `set-${key}`;
    lab.textContent = label;
    const input = document.createElement("input");
    input.className = "form-control";
    input.id = `set-${key}`;
    input.type = type;
    for (const [name, value] of Object.entries(attrs)) input.setAttribute(name, value);
    input.value = s[key];
    input.addEventListener("input", () => {
      if (type === "number") {
        const n = parseFloat(input.value);
        s[key] = Number.isFinite(n) ? n : 0;
      } else {
        s[key] = input.value.slice(0, 40);
      }
      saveSettings(s);
      onChange({ ...s });
    });
    const note = document.createElement("div");
    note.className = "form-text";
    note.textContent = hint;
    col.append(lab, input, note);
    grid.append(col);
  }
  container.replaceChildren(grid);
}
