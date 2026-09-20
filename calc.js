const num = (v, min = 0, max = Infinity) => Math.min(max, Math.max(min, Number.isFinite(+v) ? +v : 0));

// s = saved settings, job = { grams, hours, laborMinutes, otherCost }
export function calcCost(s, job) {
  const grams = num(job.grams), hours = num(job.hours);
  const filament = (grams / 1000) * num(s.filamentPricePerKg);
  const electricity = (num(s.printerWatts) / 1000) * hours * num(s.electricityRate);
  const f = num(s.failureRate, 0, 90) / 100;
  const failures = (filament + electricity) * (f / (1 - f)); // expected cost of reprints
  const labor = (num(job.laborMinutes) / 60) * num(s.laborRate);
  const other = num(job.otherCost);
  const cost = filament + electricity + failures + labor + other;

  // Price so that after marketplace fees you keep `margin` of the price as profit.
  const fee = num(s.feePercent, 0, 50) / 100;
  const margin = num(s.marginPercent, 0, 90) / 100;
  const keep = 1 - fee - margin;
  const parts = { filament, electricity, failures, labor, other, cost };
  if (keep <= 0) return { ...parts, price: null, fees: null, profit: null };
  const price = cost / keep;
  return { ...parts, price, fees: price * fee, profit: price * margin };
}

// Will a model fit the bed at a given scale? bed/model are {x,y,z} in mm, scalePct e.g. 150.
export function calcFit(bed, model, scalePct) {
  const m = [num(model.x), num(model.y), num(model.z)];
  const b = [num(bed.x), num(bed.y), num(bed.z)];
  const k = num(scalePct) / 100;
  if (m.some((v) => v === 0) || k === 0) return null;
  const scaled = { x: m[0] * k, y: m[1] * k, z: m[2] * k };
  const fitsAsIs = scaled.x <= b[0] && scaled.y <= b[1] && scaled.z <= b[2];
  const fitsTurned = scaled.y <= b[0] && scaled.x <= b[1] && scaled.z <= b[2]; // turned 90 degrees on the bed
  const maxScale = Math.max(Math.min(b[0] / m[0], b[1] / m[1], b[2] / m[2]), Math.min(b[0] / m[1], b[1] / m[0], b[2] / m[2])) * 100;
  // Solid prints grow with the cube of the scale, thin-walled ones closer to the square.
  const sq = k * k, cube = k * k * k;
  return { scaled, fits: fitsAsIs || fitsTurned, rotated: !fitsAsIs && fitsTurned, maxScale, weightLow: Math.min(sq, cube), weightHigh: Math.max(sq, cube) };
}

// Is there enough filament left on a spool? All weights in grams.
export function calcSpool({ weighed, empty, print, bufferPct }) {
  const p = num(print);
  if (p === 0 || num(weighed) === 0) return null;
  const remaining = Math.max(0, num(weighed) - num(empty));
  const needed = p * (1 + num(bufferPct, 0, 100) / 100);
  return { remaining, needed, spare: remaining - needed, enough: remaining >= needed, printsLeft: Math.floor(remaining / needed) };
}
