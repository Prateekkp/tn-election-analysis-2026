# Decoding the 2026 Tamil Nadu Assembly Election

## A Data-Driven Analysis of Regional Redistribution, Constituency Flips, and Vote-Share Realignment


## Project overview

This repository contains a detailed analysis of the **2026 Tamil Nadu Assembly Election**, comparing results with the **2021 election** to identify:

- **Regional seat redistribution patterns**
- **Constituency-level winning-party flips**
- **Statewide and regional vote-share realignment**
- **Emergence and geographic expansion of TVK**

The analysis is written as a newsroom-style briefing focused on evidence-backed insights and clear visual storytelling.

---

## Problem statements

The project addresses three core analytical questions:

### 1. The geographic story

How did seat distribution shift across Tamil Nadu’s six regions between 2021 and 2026? Where did major formations gain or lose ground?

**Focus areas:** regional redistribution, strongest expansion/contraction zones, regional concentration patterns.

**Key insight:** seat redistribution in 2026 was **regionally concentrated**, with **Chennai Metro**, **North**, and **South** showing the sharpest shifts.

### 2. The flip story

How many constituencies changed the winning party between 2021 and 2026, and what movement patterns emerged?

**Focus areas:** constituency-level transfer flows, stable vs flipped seats, directional movement between formations.

**Key insight:** **163 constituencies flipped**, with **TVK** emerging as the largest recipient of flipped seats.

### 3. The vote-share story

Where did TVK’s votes come from — DMK, AIADMK, both, or previously non-voting populations?

**Focus areas:** statewide vote-share redistribution, regional overlap patterns, correlation between gains and contractions.

**Key insight:** TVK’s rise coincided with vote-share contractions across multiple established formations, notably **DMK** and **AIADMK**.

---

## Dataset information

The analysis uses three canonical CSV datasets:

| File | Description |
| --- | --- |
| **tn_2021_results.csv** | Tamil Nadu Assembly Election results — 2021 |
| **tn_2026_results.csv** | Tamil Nadu Assembly Election results — 2026 |
| **constituency_master.csv** | Constituency-to-region mapping |

Files are located in `public/data/` for deployment-readiness.

---

## Key data-modeling decisions

- **Primary key:** `ac_number` (used for merging and per-constituency comparisons).
- **Regional grouping:** six editorial regions — Chennai Metro, North, Central, Kongu, Delta, South.
- **Party aggregation:** minor formations are grouped as **Others**; major formations kept separate (`TVK`, `DMK`, `AIADMK`).

---

## Data preparation workflow

1. **Data audit** — shape checks, missing-value inspection, column validation.
2. **Winner extraction** — convert candidate-level data into one row per constituency with winners for 2021 and 2026.
3. **Regional mapping** — merge winners with `constituency_master.csv`.
4. **Vote-share standardization** — compute statewide and regional vote shares and swings.

---

## Analytical approach and visuals

### Question 1 — Regional redistribution

**Visuals:** regional gain/loss heatmap, biggest regional shift bar chart.

**Metrics:** net seat change, regional concentration, sharpest expansion/contraction.

**Findings:** · **Chennai Metro** recorded the sharpest redistribution · **TVK** gained seats across all six regions · **AIADMK** losses concentrated in **Kongu** and **South**.

### Question 2 — Constituency flip story

**Visuals:** Sankey diagram, top transfer-flow chart.

**Metrics:** flipped constituencies, stable constituencies, largest directional transfer.

**Findings:** **163 constituencies flipped**; **71** remained with the same formation; largest transfer flow: **DMK → TVK**.

### Question 3 — Vote-share redistribution

**Visuals:** statewide vote-share comparison, regional vote-share swing heatmap.

**Metrics:** vote-share gain/loss, regional overlap patterns.

**Findings:** **TVK** recorded the largest statewide vote-share gain; **DMK** experienced the sharpest statewide decline; **AIADMK** showed meaningful regional contractions.

---

## Key insights (executive summary)

- **Redistribution was regionally concentrated** rather than evenly distributed across the state.
- **Constituency transfers were directional; TVK was the primary beneficiary.**
- **Vote-share realignment was multi-source; TVK’s gains correspond with contractions across multiple formations.**

---

## Data limitations

This analysis uses constituency-level results and aggregated vote shares. It does **not** include booth-level data, voter surveys, demographic segmentation, or turnout-behavior analysis. Therefore:

- Vote-share overlap should not be interpreted as direct voter migration.
- Correlation is not causation; behavioral inferences are limited.

---

## Tech stack

| Category | Tools |
| --- | --- |
| Programming | Python |
| Data analysis | Pandas, NumPy |
| Visualization | Matplotlib, Seaborn, Plotly |
| Presentation | PowerPoint |
| Notebook environment | Jupyter Notebook |

---

## Project highlights

- Regional analytical storytelling
- Sankey-based constituency transfer analysis
- Vote-share overlap interpretation
- Executive-style presentation design

---

## Author

**Prateek Kumar Prasad** — B.Tech CSE (Data Science), K.R. Mangalam University

**Submission date:** 20 May 2026

---

**Final editorial summary:** The 2026 Tamil Nadu election reflected concentrated regional redistribution, directional constituency transfers, and broad vote-share realignment across major formations.
