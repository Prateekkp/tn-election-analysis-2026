# Tamil Nadu Election Analysis 2026

Professional board-ready dashboards analyzing the 2021 vs. 2026 Tamil Nadu elections.

## Project Structure

```
├── public/                          # Vercel deployment folder
│   ├── index.html                   # Landing page
│   ├── q1.html                      # Q1: Regional Seat Shifts
│   ├── q2.html                      # Q2: Winning Party Flips
│   ├── q3.html                      # Q3: TVK Vote Origins
│   ├── css/
│   │   ├── main.css                 # Q1 styles (base design system)
│   │   ├── q2.css                   # Q2 styles
│   │   └── q3.css                   # Q3 styles
│   ├── js/
│   │   ├── q1.js                    # Q1 data processing & rendering
│   │   ├── q2.js                    # Q2 Sankey & transfer analysis
│   │   └── q3.js                    # Q3 vote-share analysis
│   └── data/
│       ├── constituency_master.csv
│       ├── tn_2021_results.csv
│       └── tn_2026_results.csv
├── vercel.json                      # Vercel deployment config
├── .gitignore                       # Git ignore rules
├── README.md                        # This file
└── [legacy files in root]           # Original files (can be deleted after verification)
```

## Dashboards

### Q1: Regional Seat Shifts
- Constituency winner changes across regions
- Regional seat movement heatmaps
- Party dominance shifts
- 2021 vs. 2026 comparison

**File:** `public/q1.html`

### Q2: Winning Party Flips
- Sankey diagram of party-to-party transfers
- Transfer matrix analysis
- Stable voting blocs
- Flip counts by party

**File:** `public/q2.html`

### Q3: TVK Vote Origins
- Vote-share comparison (2021 vs. 2026)
- Regional vote-share heatmaps
- Top movers (gainers/losers)
- Vote-origin tracking

**File:** `public/q3.html`

## Local Development

### Prerequisites
- Python 3.7+ (for static server)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Running Locally

```bash
cd "c:\PK\Projects\GitHub Projects\tn-election-analysis-2026"
python -m http.server 8000
```

Then open: `http://localhost:8000/public/index.html`

## Vercel Deployment

### Option 1: Connect GitHub Repository (Recommended)

1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New..." → "Project"
4. Import the GitHub repository
5. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `.` (root)
   - **Build Command:** `echo 'Static site'`
   - **Output Directory:** `public`
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

### After Deployment

Your dashboards will be live at:
- Landing: `https://your-project.vercel.app/`
- Q1: `https://your-project.vercel.app/q1`
- Q2: `https://your-project.vercel.app/q2`
- Q3: `https://your-project.vercel.app/q3`

## Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Data:** CSV (PapaParse)
- **Visualization:** Chart.js, Plotly
- **Typography:** Google Fonts (Fraunces, Manrope)
- **Hosting:** Vercel (static site)

## CSV Data Format

### constituency_master.csv
- `ac_number` — Assembly constituency ID
- `region` — Region name
- `district` — District name

### tn_2021_results.csv & tn_2026_results.csv
- `ac_number` — Assembly constituency ID
- `party` — Party name
- `candidate` — Candidate name
- `votes` — Vote count
- `region` — Region name

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- All dashboards load CSV data dynamically on page load
- Charts render client-side using Chart.js
- No backend server required (pure static site)
- Typical page load: < 2 seconds

## License

© 2026 Tamil Nadu Election Analysis

## Contact

For questions or issues, please refer to the project documentation.
