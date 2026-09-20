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
