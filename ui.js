// Shows a colored verdict plus a short list of lines. Uses textContent only.
export function showResult(id, { kind, headline, lines }) {
  const alert = document.createElement("div");
  alert.className = `alert alert-${kind} mb-3`;
  alert.textContent = headline;
  const ul = document.createElement("ul");
  ul.className = "mb-0";
  for (const line of lines) {
    const li = document.createElement("li");
    li.textContent = line;
    ul.append(li);
  }
  document.getElementById(id).replaceChildren(alert, ul);
}

// Parses a raw input string. Empty → soft incomplete. Invalid / out of range → hard error.
// Does not clamp: values outside min/max are errors.
export function parseNumber(raw, { min = 0, max = Infinity, label = "Value", integer = false } = {}) {
  const text = String(raw ?? "").trim();
  if (text === "") return { status: "empty", value: null, error: null };
  const n = Number(text);
  if (!Number.isFinite(n)) return { status: "error", value: null, error: `${label} must be a number.` };
  if (integer && !Number.isInteger(n)) {
    return { status: "error", value: null, error: `${label} must be a whole number.` };
  }
  if (n < min) {
    return { status: "error", value: null, error: min === 0 ? `${label} can't be negative.` : `${label} must be at least ${min}.` };
  }
  if (n > max) {
    return { status: "error", value: null, error: `${label} must be at most ${max}.` };
  }
  return { status: "ok", value: n, error: null };
}

// Shows or clears Bootstrap invalid feedback next to an input. Empty soft state clears the error.
export function setFieldFeedback(input, error) {
  if (!input) return;
  const invalid = Boolean(error);
  input.classList.toggle("is-invalid", invalid);
  input.setAttribute("aria-invalid", invalid ? "true" : "false");
  let fb = input.parentElement?.querySelector(":scope > .invalid-feedback");
  if (!fb) {
    fb = document.createElement("div");
    fb.className = "invalid-feedback";
    input.insertAdjacentElement("afterend", fb);
  }
  fb.textContent = error || "";
}

export function hoursFromParts(hours, minutes) {
  return hours + minutes / 60;
}

export function splitDecimalHours(totalHours) {
  const totalMin = Math.round(Number(totalHours) * 60);
  if (!Number.isFinite(totalMin) || totalMin < 0) return { hours: 0, minutes: 0 };
  return { hours: Math.floor(totalMin / 60), minutes: totalMin % 60 };
}
