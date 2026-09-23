# Loadprint

Private, browser-only electricity usage dashboard for supplier CSV exports.

## Run

No install or build required. Open `index.html` in a modern browser.

If your browser restricts local file behaviour, run a tiny local server from this folder:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## CSV format

Expected headings:

```text
Consumption (kwh), Estimated Cost Inc. Tax (p), Standing Charge Inc. Tax (p), Start, End
```

Dates may be ISO formatted or UK day-first values such as `23/09/2026 08:30`.

## Privacy

CSV parsing and analysis happen entirely in your browser. No data is uploaded or stored.

## Analysis

- Arbitrary time windows, including overnight windows
- Daily, weekly, and monthly trends
- Average 24-hour load profile
- Weekday/hour heatmap
- Recurring peak and variability observations
- CSV export of filtered summaries
