# Tamil Nadu Election Analysis 2026

## Data-Driven Dashboard and Election Briefing

This project presents a data-driven analysis of the 2026 Tamil Nadu Assembly Election, with comparisons against the 2021 election to understand regional seat redistribution, constituency-level flips, and vote-share realignment.

**Live dashboard:** [https://tn-election-analysis-2026.vercel.app/](https://tn-election-analysis-2026.vercel.app/)

![Tamil Nadu Election Analysis 2026 dashboard landing page](assets/landing-page.png)

---

## Project Overview

The dashboard and supporting analysis are designed as a newsroom-style election briefing. The project focuses on evidence-backed insights, clear visual storytelling, and constituency-level comparison between the 2021 and 2026 Tamil Nadu Assembly election results.

The analysis explores:

- Regional seat redistribution across Tamil Nadu
- Constituency-level winning-party flips
- Statewide and regional vote-share shifts
- The emergence and geographic expansion of TVK

---

## Analytical Questions

### 1. Regional Redistribution

How did seat distribution change across Tamil Nadu's six editorial regions between 2021 and 2026?

**Focus areas:** regional gains and losses, concentration of shifts, and party-wise expansion or contraction zones.

**Key insight:** Seat redistribution in 2026 was regionally concentrated, with Chennai Metro, North, and South showing the sharpest changes.

### 2. Constituency Flip Story

How many constituencies changed winning party between 2021 and 2026, and what transfer patterns emerged?

**Focus areas:** flipped seats, stable seats, transfer flows, and directional movement between formations.

**Key insight:** 163 constituencies flipped, with TVK emerging as the largest recipient of flipped seats.

### 3. Vote-Share Realignment

Where did TVK's vote share gains overlap with contractions among established parties?

**Focus areas:** statewide vote-share redistribution, regional overlap patterns, and correlation between gains and losses.

**Key insight:** TVK's rise coincided with vote-share contractions across multiple established formations, notably DMK and AIADMK.

---

## Dataset Information

The analysis uses three canonical CSV datasets stored in `public/data/` for deployment readiness.

| File | Description |
| --- | --- |
| `tn_2021_results.csv` | Tamil Nadu Assembly Election results for 2021 |
| `tn_2026_results.csv` | Tamil Nadu Assembly Election results for 2026 |
| `constituency_master.csv` | Constituency-to-region mapping |

---

## Data Modeling Decisions

- **Primary key:** `ac_number`, used to merge and compare constituencies across election years.
- **Regional grouping:** six editorial regions: Chennai Metro, North, Central, Kongu, Delta, and South.
- **Party aggregation:** major formations are kept separate, while smaller formations are grouped under `Others`.

---

## Data Preparation Workflow

1. **Data audit:** validate dataset shape, missing values, and expected columns.
2. **Winner extraction:** convert candidate-level records into one winner row per constituency.
3. **Regional mapping:** merge constituency winners with `constituency_master.csv`.
4. **Vote-share standardization:** compute statewide and regional vote shares and swings.
5. **Dashboard preparation:** structure outputs for interactive charts and deployment.

---

## Visual Analysis

## Analysis Preview

The dashboard includes three main analytical sections with extended visual outputs:

| Section | Preview |
| --- | --- |
| Regional Redistribution | [View screenshot](assets/q1.png) |
| Constituency Flip Story | [View screenshot](assets/q2.png) |
| Vote-Share Realignment | [View screenshot](assets/q3.png) |

---

### Regional Redistribution

**Visuals:** regional gain/loss heatmap and biggest regional shift bar chart.

**Metrics:** net seat change, regional concentration, and party-wise expansion or contraction.

**Finding:** Chennai Metro recorded the sharpest redistribution, TVK gained seats across all six regions, and AIADMK losses were concentrated in Kongu and South.

### Constituency Flips

**Visuals:** Sankey diagram and top transfer-flow chart.

**Metrics:** flipped constituencies, stable constituencies, and largest directional transfers.

**Finding:** 163 constituencies flipped, 71 remained with the same formation, and the largest transfer flow was from DMK to TVK.

### Vote-Share Redistribution

**Visuals:** statewide vote-share comparison and regional vote-share swing heatmap.

**Metrics:** vote-share gain/loss, regional swing, and overlap between party gains and contractions.

**Finding:** TVK recorded the largest statewide vote-share gain, while DMK experienced the sharpest statewide decline.

---

## Executive Summary

- Redistribution was regionally concentrated rather than evenly spread across the state.
- Constituency transfers were directional, with TVK as the primary beneficiary.
- Vote-share realignment was multi-source, with TVK's gains corresponding to contractions across multiple formations.
- Regional analysis adds important context that statewide numbers alone cannot capture.

---

## Tech Stack

| Category | Tools |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Data analysis | Python, Pandas, NumPy |
| Visualization | Matplotlib, Seaborn, Plotly |
| Notebook environment | Jupyter Notebook |
| Deployment | Vercel |

---

## Project Highlights

- Interactive live election dashboard
- Regional analytical storytelling
- Constituency-level transfer analysis using Sankey flows
- Vote-share overlap interpretation
- Deployment-ready public data structure

---

## Data Limitations

This analysis uses constituency-level results and aggregated vote shares. It does not include booth-level data, voter surveys, demographic segmentation, or turnout-behavior analysis.

As a result:

- Vote-share overlap should not be interpreted as direct voter migration.
- Correlation should not be treated as causation.
- Behavioral inferences are limited without survey or booth-level evidence.

---

## Author

**Prateek Kumar Prasad**  
B.Tech CSE (Data Science), K.R. Mangalam University

**Submission date:** 20 May 2026

---

## Final Editorial Summary

The 2026 Tamil Nadu Assembly Election reflected concentrated regional redistribution, directional constituency transfers, and broad vote-share realignment across major political formations.
