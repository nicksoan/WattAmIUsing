"use strict";

const EXPECTED_HEADERS = {
  consumption: "consumption (kwh)",
  cost: "estimated cost inc. tax (p)",
  standing: "standing charge inc. tax (p)",
  start: "start",
  end: "end"
};

const state = {
  rows: [],
  sourceName: "",
  minDate: null,
  maxDate: null,
  selected: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseDate(value) {
  const source = String(value || "").trim();
  const dayFirst = source.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dayFirst) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] = dayFirst;
    const date = new Date(+year, +month - 1, +day, +hour, +minute, +second);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseNumber(value) {
  const cleaned = String(value ?? "").replace(/[£,\s]/g, "").trim();
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function normaliseHeader(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, " ");
}

function transformCsv(text) {
  const csv = parseCsv(text);
  if (csv.length < 2) throw new Error("CSV has no data rows.");

  const headers = csv[0].map(normaliseHeader);
  const indexes = Object.fromEntries(
    Object.entries(EXPECTED_HEADERS).map(([key, header]) => [key, headers.indexOf(header)])
  );
  const missing = Object.entries(indexes).filter(([, index]) => index < 0).map(([key]) => EXPECTED_HEADERS[key]);
  if (missing.length) throw new Error(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);

  const rows = csv.slice(1).map((cells) => {
    const start = parseDate(cells[indexes.start]);
    const end = parseDate(cells[indexes.end]);
    if (!start || !end || end <= start) return null;
    return {
      consumption: parseNumber(cells[indexes.consumption]),
      cost: parseNumber(cells[indexes.cost]),
      standing: parseNumber(cells[indexes.standing]),
      start,
      end
    };
  }).filter(Boolean).sort((a, b) => a.start - b.start);

  if (!rows.length) throw new Error("No valid readings found. Check Start and End date values.");
  return rows;
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateFromInput(value, endOfDay = false) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
}

function minutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function overlapsWindow(row, startMinute, endMinute) {
  const duration = row.end - row.start;
  if (duration <= 0) return 0;
  let overlapMs = 0;
  const cursor = new Date(row.start);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < 4; i += 1) {
    const windowStart = new Date(cursor);
    windowStart.setMinutes(startMinute);
    const windowEnd = new Date(cursor);
    if (startMinute === endMinute) {
      windowEnd.setDate(windowEnd.getDate() + 1);
    } else if (endMinute < startMinute) {
      windowEnd.setDate(windowEnd.getDate() + 1);
      windowEnd.setMinutes(endMinute);
    } else {
      windowEnd.setMinutes(endMinute);
    }
    overlapMs += Math.max(0, Math.min(row.end, windowEnd) - Math.max(row.start, windowStart));
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.min(1, overlapMs / duration);
}

function groupKey(date, group) {
  if (group === "month") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (group === "week") {
    const monday = new Date(date);
    const offset = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - offset);
    return localDateKey(monday);
  }
  return localDateKey(date);
}

function groupLabel(key, group) {
  if (group === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  }
  const date = dateFromInput(key);
  return date.toLocaleDateString("en-GB", group === "week"
    ? { day: "numeric", month: "short" }
    : { day: "numeric", month: "short" });
}

function selectData() {
  const dateStart = dateFromInput($("#date-start").value);
  const dateEnd = dateFromInput($("#date-end").value, true);
  const timeStart = minutes($("#time-start").value);
  const timeEnd = minutes($("#time-end").value);
  const group = $('input[name="group"]:checked').value;
  const inDateRange = state.rows.filter((row) => row.start <= dateEnd && row.end >= dateStart);
  const selected = inDateRange.map((row) => ({ ...row, fraction: overlapsWindow(row, timeStart, timeEnd) }))
    .filter((row) => row.fraction > 0);
  return { dateStart, dateEnd, timeStart, timeEnd, group, inDateRange, selected };
}

function sum(rows, field, fraction = false) {
  return rows.reduce((total, row) => total + row[field] * (fraction ? row.fraction : 1), 0);
}

function standingChargeTotal(rows) {
  const byDay = new Map();
  rows.forEach((row) => {
    const day = localDateKey(row.start);
    byDay.set(day, Math.max(byDay.get(day) || 0, row.standing));
  });
  return [...byDay.values()].reduce((total, value) => total + value, 0);
}

function formatKwh(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} kWh`;
}

function formatCost(pence) {
  if (!Number.isFinite(pence)) return "—";
  return pence >= 100 ? `£${(pence / 100).toFixed(2)}` : `${pence.toFixed(1)}p`;
}

function hourFraction(row, hourStart) {
  const hourEnd = new Date(hourStart);
  hourEnd.setHours(hourEnd.getHours() + 1);
  return Math.max(0, Math.min(row.end, hourEnd) - Math.max(row.start, hourStart)) / (row.end - row.start);
}

function hourlyMatrix(rows) {
  const totals = Array.from({ length: 7 }, () => Array(24).fill(0));
  const days = Array.from({ length: 7 }, () => new Set());
  rows.forEach((row) => {
    const cursor = new Date(row.start);
    cursor.setMinutes(0, 0, 0);
    while (cursor < row.end) {
      const fraction = hourFraction(row, cursor);
      const day = cursor.getDay();
      totals[day][cursor.getHours()] += row.consumption * fraction;
      days[day].add(localDateKey(cursor));
      cursor.setHours(cursor.getHours() + 1);
    }
  });
  return totals.map((hours, day) => hours.map((value) => value / Math.max(1, days[day].size)));
}

function svgEl(name, attrs = {}, text = "") {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  if (text) element.textContent = text;
  return element;
}

function baseChart(container, height = 270) {
  container.textContent = "";
  const width = 1000;
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, "aria-hidden": "true" });
  container.append(svg);
  return { svg, width, height, plot: { left: 50, right: 18, top: 18, bottom: 35 } };
}

function drawGrid(chart, max, rows = 4) {
  const { svg, width, height, plot } = chart;
  const plotHeight = height - plot.top - plot.bottom;
  for (let i = 0; i <= rows; i += 1) {
    const y = plot.top + (plotHeight / rows) * i;
    svg.append(svgEl("line", { x1: plot.left, y1: y, x2: width - plot.right, y2: y, class: "grid-line" }));
    svg.append(svgEl("text", { x: plot.left - 8, y: y + 4, "text-anchor": "end" }, (max * (1 - i / rows)).toFixed(2)));
  }
  svg.append(svgEl("line", {
    x1: plot.left, y1: height - plot.bottom, x2: width - plot.right, y2: height - plot.bottom, class: "axis-line"
  }));
}

function renderProfile(rows, timeStart, timeEnd) {
  const matrix = hourlyMatrix(rows);
  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const values = matrix.map((day) => day[hour]).filter((value) => value > 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  });
  const max = Math.max(...hourly, .1) * 1.12;
  const chart = baseChart($("#profile-chart"), 260);
  drawGrid(chart, max);
  const { svg, width, height, plot } = chart;
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const slot = plotWidth / 24;

  hourly.forEach((value, hour) => {
    const hourMinute = hour * 60;
    const inWindow = timeStart === timeEnd
      || (timeStart < timeEnd ? hourMinute >= timeStart && hourMinute < timeEnd : hourMinute >= timeStart || hourMinute < timeEnd);
    const barHeight = value / max * plotHeight;
    const rect = svgEl("rect", {
      x: plot.left + hour * slot + 2,
      y: height - plot.bottom - barHeight,
      width: Math.max(2, slot - 4),
      height: barHeight,
      class: `profile-bar${inWindow ? " in-window" : ""}`
    });
    rect.append(svgEl("title", {}, `${String(hour).padStart(2, "0")}:00 — ${formatKwh(value)} average`));
    svg.append(rect);
    if (hour % 3 === 0) {
      svg.append(svgEl("text", {
        x: plot.left + hour * slot + slot / 2, y: height - 11, "text-anchor": "middle"
      }, String(hour).padStart(2, "0")));
    }
  });
}

function aggregateTrend(selected, group) {
  const groups = new Map();
  selected.forEach((row) => {
    const key = groupKey(row.start, group);
    const current = groups.get(key) || { key, consumption: 0, cost: 0 };
    current.consumption += row.consumption * row.fraction;
    current.cost += row.cost * row.fraction;
    groups.set(key, current);
  });
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function renderTrend(data, group) {
  const container = $("#trend-chart");
  if (!data.length) {
    container.innerHTML = '<p class="empty-chart">No readings overlap this time window and date range.</p>';
    return;
  }
  const max = Math.max(...data.map((item) => item.consumption), .1) * 1.12;
  const chart = baseChart(container, 285);
  drawGrid(chart, max);
  const { svg, width, height, plot } = chart;
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const step = data.length === 1 ? plotWidth : plotWidth / (data.length - 1);
  const points = data.map((item, index) => ({
    x: plot.left + (data.length === 1 ? plotWidth / 2 : step * index),
    y: height - plot.bottom - item.consumption / max * plotHeight,
    item
  }));
  const area = `M ${points[0].x} ${height - plot.bottom} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points.at(-1).x} ${height - plot.bottom} Z`;
  const line = `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}`;
  svg.append(svgEl("path", { d: area, class: "trend-area" }));
  svg.append(svgEl("path", { d: line, class: "trend-line" }));
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  points.forEach((point, index) => {
    const circle = svgEl("circle", { cx: point.x, cy: point.y, r: 4.5, class: "trend-point" });
    circle.append(svgEl("title", {}, `${groupLabel(point.item.key, group)} — ${formatKwh(point.item.consumption)}, ${formatCost(point.item.cost)}`));
    svg.append(circle);
    if (index % labelEvery === 0 || index === points.length - 1) {
      svg.append(svgEl("text", { x: point.x, y: height - 11, "text-anchor": "middle" }, groupLabel(point.item.key, group)));
    }
  });
}

function renderHeatmap(rows) {
  const matrix = hourlyMatrix(rows);
  const max = Math.max(...matrix.flat(), .01);
  const container = $("#heatmap");
  container.textContent = "";
  container.append(document.createElement("span"));
  for (let hour = 0; hour < 24; hour += 1) {
    const label = document.createElement("span");
    label.className = "hour-label";
    label.textContent = hour % 3 === 0 ? String(hour).padStart(2, "0") : "";
    container.append(label);
  }
  [1, 2, 3, 4, 5, 6, 0].forEach((day) => {
    const label = document.createElement("span");
    label.className = "day-label";
    label.textContent = SHORT_DAYS[day];
    container.append(label);
    matrix[day].forEach((value, hour) => {
      const ratio = Math.min(1, value / max);
      const cell = document.createElement("div");
      cell.className = "heat-cell";
      cell.style.background = heatColour(ratio);
      cell.title = `${DAY_NAMES[day]} ${String(hour).padStart(2, "0")}:00 — ${formatKwh(value)} average`;
      container.append(cell);
    });
  });
}

function heatColour(ratio) {
  const colours = ["#edf1df", "#dbe99d", "#c8f135", "#82a92a", "#304522"];
  return colours[Math.min(colours.length - 1, Math.floor(ratio * colours.length))];
}

function renderFindings(selection) {
  const { selected, inDateRange } = selection;
  const list = $("#findings-list");
  const matrix = hourlyMatrix(inDateRange);
  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const average = matrix.reduce((total, day) => total + day[hour], 0) / 7;
    return { hour, average };
  }).sort((a, b) => b.average - a.average);

  const byWeekday = Array.from({ length: 7 }, (_, day) => ({ day, consumption: 0, dates: new Set() }));
  selected.forEach((row) => {
    const day = row.start.getDay();
    byWeekday[day].consumption += row.consumption * row.fraction;
    byWeekday[day].dates.add(localDateKey(row.start));
  });
  byWeekday.forEach((item) => { item.average = item.consumption / Math.max(1, item.dates.size); });
  byWeekday.sort((a, b) => b.average - a.average);

  const daily = aggregateTrend(selected, "day");
  const mean = daily.length ? sum(daily, "consumption") / daily.length : 0;
  const deviation = daily.length
    ? Math.sqrt(daily.reduce((total, item) => total + (item.consumption - mean) ** 2, 0) / daily.length)
    : 0;
  const variability = mean ? deviation / mean : 0;
  const consistencyText = variability < .25
    ? "This pattern is highly consistent, suggesting a routine or always-on load."
    : variability < .55
      ? "This pattern recurs with moderate variation."
      : "Usage varies substantially, suggesting occasional rather than fixed activity.";

  const peak = hourly[0] || { hour: 0, average: 0 };
  const second = hourly[1] || peak;
  const peakRange = second.hour === peak.hour + 1
    ? `${String(peak.hour).padStart(2, "0")}:00–${String(second.hour + 1).padStart(2, "0")}:00`
    : `${String(peak.hour).padStart(2, "0")}:00–${String(peak.hour + 1).padStart(2, "0")}:00`;

  list.innerHTML = `
    <article class="finding">
      <strong>Highest recurring hour: <b>${peakRange}</b></strong>
      <p>Averages ${formatKwh(peak.average)} per hour across selected dates. Check heating, cooking, laundry, or charging routines in this period.</p>
    </article>
    <article class="finding">
      <strong>${byWeekday[0] ? DAY_NAMES[byWeekday[0].day] : "No weekday"} leads this window</strong>
      <p>${byWeekday[0] ? `${formatKwh(byWeekday[0].average)} on an average ${DAY_NAMES[byWeekday[0].day]}.` : "No matching data."} Compare what changes in the household on that day.</p>
    </article>
    <article class="finding">
      <strong>${variability < .25 ? "Routine-like repetition" : variability < .55 ? "A repeatable but variable pattern" : "Large day-to-day swings"}</strong>
      <p>${consistencyText}</p>
    </article>`;
}

function render() {
  if (!state.rows.length) return;
  const selection = selectData();
  state.selected = selection;
  const { selected, inDateRange, timeStart, timeEnd, group } = selection;
  const selectedConsumption = sum(selected, "consumption", true);
  const selectedCost = sum(selected, "cost", true);
  const totalConsumption = sum(inDateRange, "consumption");
  const activeDays = new Set(selected.map((row) => localDateKey(row.start))).size;
  const dailyAverage = selectedConsumption / Math.max(1, activeDays);
  const dailyCost = selectedCost / Math.max(1, activeDays);
  const timeLabel = `${$("#time-start").value}–${$("#time-end").value}`;

  $("#window-label").textContent = timeLabel;
  $("#avg-day").textContent = formatKwh(dailyAverage);
  $("#avg-day-cost").textContent = `${formatCost(dailyCost)} estimated energy cost`;
  $("#window-total").textContent = formatKwh(selectedConsumption);
  $("#window-cost").textContent = `${formatCost(selectedCost)} estimated energy cost`;
  $("#usage-share").textContent = totalConsumption ? `${(selectedConsumption / totalConsumption * 100).toFixed(1)}%` : "—";

  const weekdays = Array.from({ length: 7 }, (_, day) => ({ day, total: 0, dates: new Set() }));
  selected.forEach((row) => {
    const entry = weekdays[row.start.getDay()];
    entry.total += row.consumption * row.fraction;
    entry.dates.add(localDateKey(row.start));
  });
  weekdays.forEach((entry) => { entry.average = entry.total / Math.max(1, entry.dates.size); });
  weekdays.sort((a, b) => b.average - a.average);
  const overallWeekdayAverage = weekdays.reduce((total, entry) => total + entry.average, 0) / 7;
  $("#top-weekday").textContent = weekdays[0].average ? DAY_NAMES[weekdays[0].day] : "—";
  $("#weekday-delta").textContent = weekdays[0].average && overallWeekdayAverage
    ? `${Math.max(0, (weekdays[0].average / overallWeekdayAverage - 1) * 100).toFixed(0)}% above weekday average`
    : "No matching readings";

  $("#trend-subtitle").textContent = `${group[0].toUpperCase() + group.slice(1)} consumption attributed to ${timeLabel}.`;
  renderProfile(inDateRange, timeStart, timeEnd);
  renderTrend(aggregateTrend(selected, group), group);
  renderHeatmap(inDateRange);
  renderFindings(selection);

  const standing = standingChargeTotal(inDateRange);
  $("#standing-note").textContent = standing
    ? `Standing charges in selected date range: ${formatCost(standing)}. Kept separate because standing charges are not caused by time-of-day usage.`
    : "Standing charges are kept separate from time-of-day analysis.";
}

function initialiseRows(rows, sourceName) {
  state.rows = rows;
  state.sourceName = sourceName;
  state.minDate = new Date(Math.min(...rows.map((row) => row.start)));
  state.maxDate = new Date(Math.max(...rows.map((row) => row.end)));
  $("#date-start").value = localDateKey(state.minDate);
  $("#date-end").value = localDateKey(state.maxDate);
  $("#date-start").min = $("#date-end").min = localDateKey(state.minDate);
  $("#date-start").max = $("#date-end").max = localDateKey(state.maxDate);
  $("#row-count").textContent = `${rows.length.toLocaleString()} readings / ${sourceName}`;
  $("#date-coverage").textContent = `${state.minDate.toLocaleDateString("en-GB")} → ${state.maxDate.toLocaleDateString("en-GB")}`;
  $("#intake").hidden = true;
  $("#workspace").hidden = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function notify(message, error = false) {
  const element = $("#file-state");
  element.textContent = message;
  element.classList.toggle("error", error);
  element.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { element.hidden = true; }, error ? 7000 : 3500);
}

async function handleFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".csv")) {
    notify("Choose a .csv file exported by your energy supplier.", true);
    return;
  }
  try {
    const rows = transformCsv(await file.text());
    initialiseRows(rows, file.name);
    notify(`${rows.length.toLocaleString()} readings loaded. Data stayed in this browser.`);
  } catch (error) {
    notify(error.message, true);
  }
}

function syntheticRows() {
  const rows = [];
  const start = new Date();
  start.setDate(start.getDate() - 89);
  start.setHours(0, 0, 0, 0);
  for (let day = 0; day < 90; day += 1) {
    for (let slot = 0; slot < 48; slot += 1) {
      const rowStart = new Date(start);
      rowStart.setDate(rowStart.getDate() + day);
      rowStart.setMinutes(slot * 30);
      const rowEnd = new Date(rowStart);
      rowEnd.setMinutes(rowEnd.getMinutes() + 30);
      const hour = rowStart.getHours() + rowStart.getMinutes() / 60;
      const weekday = rowStart.getDay();
      const morning = hour >= 6.5 && hour < 9 ? .19 : 0;
      const evening = hour >= 17 && hour < 21 ? .29 : 0;
      const night = hour >= 0 && hour < 5 ? .035 : .065;
      const weekend = (weekday === 0 || weekday === 6) && hour >= 10 && hour < 14 ? .11 : 0;
      const variation = 0.82 + ((day * 17 + slot * 7) % 31) / 100;
      const consumption = (night + morning + evening + weekend) * variation;
      rows.push({ start: rowStart, end: rowEnd, consumption, cost: consumption * 27.1, standing: slot === 0 ? 53.4 : 0 });
    }
  }
  return rows;
}

function exportSummary() {
  if (!state.selected) return;
  const { selected, group } = state.selected;
  const trend = aggregateTrend(selected, group);
  const lines = [["Period", "Consumption (kWh)", "Estimated Cost (p)"]];
  trend.forEach((item) => lines.push([item.key, item.consumption.toFixed(4), item.cost.toFixed(2)]));
  const csv = lines.map((row) => row.join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = `wattamiusing-${group}-summary.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

$("#choose-file").addEventListener("click", () => $("#file-input").click());
$("#replace-file").addEventListener("click", () => $("#file-input").click());
$("#file-input").addEventListener("change", (event) => handleFile(event.target.files[0]));
$("#load-demo").addEventListener("click", () => initialiseRows(syntheticRows(), "synthetic example"));
$("#download-summary").addEventListener("click", exportSummary);

["dragenter", "dragover"].forEach((eventName) => {
  $("#drop-zone").addEventListener(eventName, (event) => {
    event.preventDefault();
    $("#drop-zone").classList.add("dragging");
  });
});
["dragleave", "drop"].forEach((eventName) => {
  $("#drop-zone").addEventListener(eventName, (event) => {
    event.preventDefault();
    $("#drop-zone").classList.remove("dragging");
  });
});
$("#drop-zone").addEventListener("drop", (event) => handleFile(event.dataTransfer.files[0]));

$$("[data-time]").forEach((button) => button.addEventListener("click", () => {
  const [start, end] = button.dataset.time.split(",");
  $("#time-start").value = start;
  $("#time-end").value = end;
  $$("[data-time]").forEach((item) => item.classList.toggle("active", item === button));
  render();
}));

$$("[data-range]").forEach((button) => button.addEventListener("click", () => {
  const value = button.dataset.range;
  const start = new Date(state.minDate);
  if (value !== "all") {
    start.setTime(state.maxDate.getTime());
    start.setDate(start.getDate() - (+value - 1));
    if (start < state.minDate) start.setTime(state.minDate.getTime());
  }
  $("#date-start").value = localDateKey(start);
  $("#date-end").value = localDateKey(state.maxDate);
  $$("[data-range]").forEach((item) => item.classList.toggle("active", item === button));
  render();
}));

["#time-start", "#time-end", "#date-start", "#date-end"].forEach((selector) => {
  $(selector).addEventListener("change", render);
});
$$('input[name="group"]').forEach((input) => input.addEventListener("change", render));
window.addEventListener("resize", () => {
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(render, 150);
});

if (new URLSearchParams(window.location.search).has("demo")) {
  initialiseRows(syntheticRows(), "synthetic example");
}
