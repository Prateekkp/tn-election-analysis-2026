document.addEventListener('DOMContentLoaded', () => {
  initDashboard().catch((error) => {
    const status = document.getElementById('loadStatus');
    if (status) {
      status.innerHTML = `
        <strong>Unable to load the dashboard data.</strong><br />
        ${escapeHtml(error.message || String(error))}<br /><br />
        Open this page through a local static server so the CSV files in the data folder can be fetched.
      `;
      status.classList.add('error-state');
    }
  });
});

const MAJOR_PARTIES = ['TVK', 'DMK', 'AIADMK'];
const PARTY_COLORS = {
  TVK: '#f0b35f',
  DMK: '#68d4c6',
  AIADMK: '#7fa8ff',
  Others: '#9aa6b2',
};

async function initDashboard() {
  const [masterRows, rows2021, rows2026] = await Promise.all([
    loadCsv('./data/constituency_master.csv'),
    loadCsv('./data/tn_2021_results.csv'),
    loadCsv('./data/tn_2026_results.csv'),
  ]);

  const masterByAc = new Map(
    masterRows.map((row) => [String(row.ac_number), normalizeMasterRow(row)]),
  );

  const results2021 = enrichResults(rows2021, masterByAc, 2021);
  const results2026 = enrichResults(rows2026, masterByAc, 2026);

  const winners2021 = pickWinners(results2021);
  const winners2026 = pickWinners(results2026);
  const allWinners = [...winners2021, ...winners2026];

  const regions = Array.from(new Set(masterRows.map((row) => row.region)));
  const totalAssemblySeats = masterRows.length;

  const regionPartyCounts2021 = buildRegionPartyCounts(winners2021);
  const regionPartyCounts2026 = buildRegionPartyCounts(winners2026);

  const partyRegionalSeatCounts = buildRegionalPartyComparison(regions, regionPartyCounts2021, regionPartyCounts2026);
  const regionalShiftSummary = buildRegionalShiftSummary(partyRegionalSeatCounts);
  const dominantPartyRows = buildDominantPartyRows(regions, regionPartyCounts2021, regionPartyCounts2026);
  const heatmapRows = buildHeatmapRows(regions, regionPartyCounts2021, regionPartyCounts2026, totalAssemblySeats);
  const partyShiftRows = buildPartyShiftRows(partyRegionalSeatCounts);
  const largestGain = partyShiftRows.filter((row) => row.seatChange > 0).sort((a, b) => b.seatChange - a.seatChange)[0];
  const largestLoss = partyShiftRows.filter((row) => row.seatChange < 0).sort((a, b) => a.seatChange - b.seatChange)[0];

  renderMetrics({
    totalAssemblySeats,
    totalRegions: regions.length,
    totalParties: new Set(allWinners.map((row) => row.party)).size,
    biggestShiftRegion: regionalShiftSummary[0],
    dominantChanges: dominantPartyRows.filter((row) => row.shifted).length,
  });

  renderInsights({
    biggestShiftRegion: regionalShiftSummary[0],
    largestGain,
    largestLoss,
  });

  renderRegionShiftChart(regionalShiftSummary);
  renderPartyShiftChart(partyShiftRows);
  renderDominanceTable(dominantPartyRows);
  renderHeatmap(heatmapRows);
  renderSummaryCards({
    regionalShiftSummary,
    dominantPartyRows,
    partyShiftRows,
  });

  const status = document.getElementById('loadStatus');
  if (status) {
    status.innerHTML = `
      <strong>Data loaded successfully.</strong><br />
      The dashboard is based on the 2021 and 2026 result CSVs plus the constituency master file.
    `;
  }
}

async function loadCsv(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path} (${response.status})`);
  }

  const text = await response.text();
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (parsed.errors?.length) {
    throw new Error(`CSV parsing failed for ${path}: ${parsed.errors[0].message}`);
  }

  return parsed.data;
}

function normalizeMasterRow(row) {
  return {
    ...row,
    ac_number: Number(row.ac_number),
    constituency: row.constituency,
    region: row.region,
  };
}

function enrichResults(rows, masterByAc, year) {
  return rows.map((row) => {
    const acNumber = Number(row.ac_number);
    const masterRow = masterByAc.get(String(acNumber)) || {};

    return {
      ...row,
      year,
      ac_number: acNumber,
      votes: Number(row.votes) || 0,
      constituency: masterRow.constituency || row.constituency,
      region: masterRow.region || row.region || 'Unknown',
      candidate: row.candidate || '',
      party: row.party || 'Independent',
    };
  });
}

function pickWinners(rows) {
  const winners = new Map();

  rows.forEach((row) => {
    const currentWinner = winners.get(row.ac_number);
    if (!currentWinner || row.votes > currentWinner.votes) {
      winners.set(row.ac_number, row);
    }
  });

  return Array.from(winners.values());
}

function buildRegionPartyCounts(winners) {
  const counts = new Map();

  winners.forEach((row) => {
    if (!counts.has(row.region)) {
      counts.set(row.region, new Map());
    }

    const regionCounts = counts.get(row.region);
    regionCounts.set(row.party, (regionCounts.get(row.party) || 0) + 1);
  });

  return counts;
}

function buildRegionalPartyComparison(regions, counts2021, counts2026) {
  const rows = [];

  regions.forEach((region) => {
    const region2021 = counts2021.get(region) || new Map();
    const region2026 = counts2026.get(region) || new Map();
    const parties = new Set([...region2021.keys(), ...region2026.keys(), ...MAJOR_PARTIES]);
    const total2021 = sumMap(region2021);
    const total2026 = sumMap(region2026);

    parties.forEach((party) => {
      const seats2021 = region2021.get(party) || 0;
      const seats2026 = region2026.get(party) || 0;
      rows.push({
        region,
        party,
        seats2021,
        seats2026,
        seatChange: seats2026 - seats2021,
        share2021: total2021 ? (seats2021 / total2021) * 100 : 0,
        share2026: total2026 ? (seats2026 / total2026) * 100 : 0,
      });
    });
  });

  return rows;
}

function buildRegionalShiftSummary(rows) {
  const byRegion = new Map();

  rows.forEach((row) => {
    byRegion.set(row.region, (byRegion.get(row.region) || 0) + Math.abs(row.seatChange));
  });

  return Array.from(byRegion.entries())
    .map(([region, absSeatChange]) => ({ region, absSeatChange }))
    .sort((a, b) => b.absSeatChange - a.absSeatChange);
}

function buildDominantPartyRows(regions, counts2021, counts2026) {
  return regions.map((region) => {
    const total2021 = sumMap(counts2021.get(region) || new Map());
    const total2026 = sumMap(counts2026.get(region) || new Map());
    const dominant2021 = dominantParty(counts2021.get(region) || new Map(), total2021);
    const dominant2026 = dominantParty(counts2026.get(region) || new Map(), total2026);

    return {
      region,
      party2021: dominant2021.party,
      share2021: dominant2021.share,
      party2026: dominant2026.party,
      share2026: dominant2026.share,
      shifted: dominant2021.party !== dominant2026.party,
    };
  });
}

function dominantParty(counts, totalSeats) {
  if (!counts.size || !totalSeats) {
    return { party: 'N/A', share: 0 };
  }

  const [party, seats] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return { party, share: (seats / totalSeats) * 100 };
}

function buildHeatmapRows(regions, counts2021, counts2026, totalAssemblySeats) {
  return regions.map((region) => {
    const seats2021 = counts2021.get(region) || new Map();
    const seats2026 = counts2026.get(region) || new Map();
    const total2021 = sumMap(seats2021);
    const total2026 = sumMap(seats2026);

    const regionRow = { region };

    MAJOR_PARTIES.forEach((party) => {
      regionRow[party] = (seats2026.get(party) || 0) - (seats2021.get(party) || 0);
    });

    const major2021 = MAJOR_PARTIES.reduce((sum, party) => sum + (seats2021.get(party) || 0), 0);
    const major2026 = MAJOR_PARTIES.reduce((sum, party) => sum + (seats2026.get(party) || 0), 0);
    regionRow.Others = (total2026 - major2026) - (total2021 - major2021);
    regionRow.totalSeats = totalAssemblySeats;

    return regionRow;
  });
}

function buildPartyShiftRows(rows) {
  return [...rows]
    .map((row) => ({
      ...row,
      label: `${row.region} - ${row.party}`,
    }))
    .filter((row) => row.party === 'Others' || MAJOR_PARTIES.includes(row.party))
    .sort((a, b) => Math.abs(b.seatChange) - Math.abs(a.seatChange));
}

function renderMetrics({ totalAssemblySeats, totalRegions, totalParties, biggestShiftRegion, dominantChanges }) {
  const target = document.getElementById('metricsGrid');
  if (!target) return;

  const cards = [
    {
      label: 'Assembly seats covered',
      value: totalAssemblySeats,
      detail: 'All 234 constituencies are included in the regional comparison.',
    },
    {
      label: 'Regions tracked',
      value: totalRegions,
      detail: 'The dashboard groups constituencies into the six regional clusters.',
    },
    {
      label: 'Winning parties',
      value: totalParties,
      detail: 'Distinct parties that won at least one constituency across both years.',
    },
    {
      label: 'Dominance changes',
      value: dominantChanges,
      detail: biggestShiftRegion ? `${biggestShiftRegion.region} had the largest regional seat movement.` : 'No shift data available.',
    },
  ];

  target.innerHTML = cards
    .map(
      (card) => `
        <article class="metric">
          <div class="label">${escapeHtml(String(card.label))}</div>
          <div class="value">${escapeHtml(String(card.value))}</div>
          <div class="detail">${escapeHtml(card.detail)}</div>
        </article>
      `,
    )
    .join('');
}

function renderInsights({ biggestShiftRegion, largestGain, largestLoss }) {
  const target = document.getElementById('insightStrip');
  if (!target) return;

  const insights = [
    {
      title: 'Largest regional movement',
      body: biggestShiftRegion
        ? `${biggestShiftRegion.region} shows the highest absolute seat movement at ${biggestShiftRegion.absSeatChange}.`
        : 'No regional movement data available.',
    },
    {
      title: 'Biggest gain',
      body: largestGain
        ? `${largestGain.party} in ${largestGain.region} recorded the largest positive net change (${formatSigned(largestGain.seatChange)}).`
        : 'No gain data available.',
    },
    {
      title: 'Biggest loss',
      body: largestLoss
        ? `${largestLoss.party} in ${largestLoss.region} recorded the largest negative net change (${formatSigned(largestLoss.seatChange)}).`
        : 'No loss data available.',
    },
  ];

  target.innerHTML = insights
    .map(
      (insight) => `
        <div class="insight-card">
          <strong>${escapeHtml(insight.title)}</strong>
          <span>${escapeHtml(insight.body)}</span>
        </div>
      `,
    )
    .join('');
}

function renderRegionShiftChart(rows) {
  const canvas = document.getElementById('regionShiftChart');
  if (!canvas) return;

  const labels = rows.map((row) => row.region);
  const values = rows.map((row) => row.absSeatChange);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Absolute seat change',
          data: values,
          borderRadius: 12,
          backgroundColor: values.map((value) => `rgba(104, 212, 198, ${0.3 + Math.min(value / 20, 0.55)})`),
          borderColor: '#68d4c6',
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.parsed.x} seat shifts`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#5f6b7d' },
          grid: { color: 'rgba(15,23,42,0.08)' },
        },
        y: {
          ticks: { color: '#132238' },
          grid: { display: false },
        },
      },
    },
  });
}

function renderPartyShiftChart(rows) {
  const canvas = document.getElementById('partyShiftChart');
  if (!canvas) return;

  const topRows = rows.slice(0, 18);
  const labels = topRows.map((row) => row.label);
  const data = topRows.map((row) => row.seatChange);
  const colors = topRows.map((row) => {
    if (row.party === 'TVK') return PARTY_COLORS.TVK;
    if (row.party === 'DMK') return PARTY_COLORS.DMK;
    if (row.party === 'AIADMK') return PARTY_COLORS.AIADMK;
    return PARTY_COLORS.Others;
  });

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Net seat change',
          data,
          borderRadius: 10,
          backgroundColor: data.map((value, index) =>
            value >= 0 ? colors[index] : 'rgba(255, 118, 118, 0.8)',
          ),
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${formatSigned(context.parsed.x)} seats`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#5f6b7d' },
          grid: { color: 'rgba(15,23,42,0.08)' },
        },
        y: {
          ticks: { color: '#132238' },
          grid: { display: false },
        },
      },
    },
  });
}

function renderDominanceTable(rows) {
  const tbody = document.querySelector('#dominanceTable tbody');
  if (!tbody) return;

  tbody.innerHTML = rows
    .map((row) => {
      const shiftLabel = row.shifted
        ? '<span class="change-pill change-negative">Changed</span>'
        : '<span class="change-pill change-positive">Held</span>';

      return `
        <tr>
          <td>${escapeHtml(row.region)}</td>
          <td>${escapeHtml(row.party2021)}</td>
          <td>${formatPercentage(row.share2021)}</td>
          <td>${escapeHtml(row.party2026)}</td>
          <td>${formatPercentage(row.share2026)}</td>
          <td>${shiftLabel}</td>
        </tr>
      `;
    })
    .join('');
}

function renderHeatmap(rows) {
  const container = document.getElementById('heatmapContainer');
  if (!container) return;

  const headers = ['Region', ...MAJOR_PARTIES, 'Others'];
  const magnitudes = rows
    .flatMap((row) => [row.TVK, row.DMK, row.AIADMK, row.Others])
    .map((value) => Math.abs(Number(value) || 0));
  const maxMagnitude = Math.max(1, ...magnitudes);

  const table = document.createElement('table');
  table.className = 'heatmap';
  table.innerHTML = `
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  tbody.innerHTML = rows
    .map((row) => {
      const cells = headers
        .map((header, index) => {
          if (index === 0) {
            return `<td class="row-label">${escapeHtml(row.region)}</td>`;
          }

          const value = Number(row[header]) || 0;
          const normalized = Math.abs(value) / maxMagnitude;
          const intensity = Math.min(0.96, 0.38 + normalized * 0.5);
          const background = value >= 0
            ? `rgba(15, 157, 138, ${intensity})`
            : `rgba(194, 65, 65, ${intensity})`;

          return `<td class="heat-cell" data-label="${formatSigned(value)}" style="background:${background}"></td>`;
        })
        .join('');

      return `<tr>${cells}</tr>`;
    })
    .join('');

  container.innerHTML = '';
  container.appendChild(table);
}

function renderSummaryCards({ regionalShiftSummary, dominantPartyRows, partyShiftRows }) {
  const target = document.getElementById('summaryGrid');
  if (!target) return;

  const biggestRegion = regionalShiftSummary[0];
  const mostChangedRegion = biggestRegion
    ? `${biggestRegion.region} recorded ${biggestRegion.absSeatChange} seat-level shifts across parties.`
    : 'No regional shift data was available.';

  const dominantChangeCount = dominantPartyRows.filter((row) => row.shifted).length;
  const dominanceSummary = dominantChangeCount
    ? `${dominantChangeCount} regions changed their leading party between 2021 and 2026.`
    : 'No region changed dominant party between the two years.';

  const topMovement = partyShiftRows[0]
    ? `${partyShiftRows[0].label} posted the strongest net seat movement at ${formatSigned(partyShiftRows[0].seatChange)}.`
    : 'No party movement data available.';

  target.innerHTML = [
    {
      title: 'Most active region',
      body: mostChangedRegion,
    },
    {
      title: 'Dominance changes',
      body: dominanceSummary,
    },
    {
      title: 'Largest single move',
      body: topMovement,
    },
  ]
    .map(
      (card) => `
        <article class="summary-card">
          <h3>${escapeHtml(card.title)}</h3>
          <p>${escapeHtml(card.body)}</p>
        </article>
      `,
    )
    .join('');
}

function sumMap(map) {
  return Array.from(map.values()).reduce((sum, value) => sum + value, 0);
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}