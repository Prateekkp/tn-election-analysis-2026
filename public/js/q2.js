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

const MAIN_PARTIES = ['TVK', 'DMK', 'AIADMK'];
const PARTY_COLORS = {
  TVK: '#8b5cf6',
  DMK: '#ef4444',
  AIADMK: '#2563eb',
  Others: '#94a3b8',
};

async function initDashboard() {
  const [masterRows, rows2021, rows2026] = await Promise.all([
    loadCsv('./data/constituency_master.csv'),
    loadCsv('./data/tn_2021_results.csv'),
    loadCsv('./data/tn_2026_results.csv'),
  ]);

  const masterByAc = new Map(masterRows.map((row) => [String(row.ac_number), row]));
  const winners2021 = pickWinners(rows2021, masterByAc, 2021);
  const winners2026 = pickWinners(rows2026, masterByAc, 2026);
  const flips = buildFlipTable(winners2021, winners2026, masterByAc);
  const flippedRows = flips.filter((row) => row.flipped);
  const stableRows = flips.filter((row) => !row.flipped);
  const sankeyData = buildSankeyData(flippedRows);
  const transferCounts = buildTransferCounts(flippedRows);
  const stableBlocCounts = buildStableBlocCounts(stableRows);
  const totalConstituencies = masterRows.length;

  renderMetrics({
    totalConstituencies,
    flippedCount: flippedRows.length,
    stableCount: stableRows.length,
    uniqueTransfers: sankeyData.nodes.length,
  });

  renderInsights({
    flippedRows,
    transferCounts,
    stableBlocCounts,
  });

  renderSankey(sankeyData);
  renderTransferBarChart(transferCounts);
  renderTransferTable(transferCounts);
  renderStableTable(stableBlocCounts);
  renderSummaryCards({ flippedRows, transferCounts, stableBlocCounts });

  const status = document.getElementById('loadStatus');
  if (status) {
    status.innerHTML = `
      <strong>Data loaded successfully.</strong><br />
      The dashboard compares all constituencies across 2021 and 2026 and highlights every winning-party change.
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

function pickWinners(rows, masterByAc, year) {
  const winners = new Map();

  rows.forEach((row) => {
    const acNumber = Number(row.ac_number);
    const currentWinner = winners.get(acNumber);
    const normalizedRow = {
      ac_number: acNumber,
      party: row.party || 'Others',
      constituency: masterByAc.get(String(acNumber))?.constituency || row.constituency || '',
      region: masterByAc.get(String(acNumber))?.region || row.region || 'Unknown',
      votes: Number(row.votes) || 0,
      year,
    };

    if (!currentWinner || normalizedRow.votes > currentWinner.votes) {
      winners.set(acNumber, normalizedRow);
    }
  });

  return Array.from(winners.values());
}

function buildFlipTable(winners2021, winners2026, masterByAc) {
  const winner2021ByAc = new Map(winners2021.map((row) => [row.ac_number, row]));
  const winner2026ByAc = new Map(winners2026.map((row) => [row.ac_number, row]));
  const allAcNumbers = Array.from(new Set([...winner2021ByAc.keys(), ...winner2026ByAc.keys()])).sort((a, b) => a - b);

  return allAcNumbers.map((acNumber) => {
    const row2021 = winner2021ByAc.get(acNumber) || {};
    const row2026 = winner2026ByAc.get(acNumber) || {};
    const masterRow = masterByAc.get(String(acNumber)) || {};
    const flipped = (row2021.party || '') !== (row2026.party || '');

    return {
      ac_number: acNumber,
      constituency: masterRow.constituency || row2021.constituency || row2026.constituency || '',
      region: masterRow.region || row2021.region || row2026.region || 'Unknown',
      winner_2021: row2021.party || 'N/A',
      winner_2026: row2026.party || 'N/A',
      flipped,
    };
  });
}

function buildSankeyData(flippedRows) {
  const categorized = flippedRows.map((row) => ({
    winner_2021_cat: categorizeParty(row.winner_2021),
    winner_2026_cat: categorizeParty(row.winner_2026),
  }));

  const transferMap = new Map();
  categorized.forEach((row) => {
    const key = `${row.winner_2021_cat}||${row.winner_2026_cat}`;
    transferMap.set(key, (transferMap.get(key) || 0) + 1);
  });

  const flows = Array.from(transferMap.entries()).map(([key, value]) => {
    const [source, target] = key.split('||');
    return { source, target, value };
  });

  const nodes = Array.from(new Set([
    ...flows.map((row) => row.source),
    ...flows.map((row) => row.target),
  ]));

  return { nodes, flows };
}

function buildTransferCounts(flippedRows) {
  const counts = new Map();

  flippedRows.forEach((row) => {
    const source = categorizeParty(row.winner_2021);
    const target = categorizeParty(row.winner_2026);
    const key = `${source} -> ${target}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([transfer, constituencies]) => {
      const [fromParty, toParty] = transfer.split(' -> ');
      return { fromParty, toParty, transfer, constituencies };
    })
    .sort((a, b) => b.constituencies - a.constituencies);
}

function buildStableBlocCounts(stableRows) {
  const counts = new Map();
  stableRows.forEach((row) => {
    counts.set(row.winner_2021, (counts.get(row.winner_2021) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([party, stable_constituencies]) => ({ party, stable_constituencies }))
    .sort((a, b) => b.stable_constituencies - a.stable_constituencies);
}

function categorizeParty(party) {
  return MAIN_PARTIES.includes(party) ? party : 'Others';
}

function renderMetrics({ totalConstituencies, flippedCount, stableCount, uniqueTransfers }) {
  const target = document.getElementById('metricsGrid');
  if (!target) return;

  const cards = [
    { label: 'Constituencies covered', value: totalConstituencies, detail: 'All assembly seats included in the comparison.' },
    { label: 'Flipped constituencies', value: flippedCount, detail: 'Seats where the winning party changed between the two elections.' },
    { label: 'Stable constituencies', value: stableCount, detail: 'Seats retained by the same winning party across both years.' },
    { label: 'Transfer patterns', value: uniqueTransfers, detail: 'Distinct winning-party movement paths seen in the flip set.' },
  ];

  target.innerHTML = cards.map((card) => `
    <article class="metric">
      <div class="label">${escapeHtml(card.label)}</div>
      <div class="value">${escapeHtml(String(card.value))}</div>
      <div class="detail">${escapeHtml(card.detail)}</div>
    </article>
  `).join('');
}

function renderInsights({ flippedRows, transferCounts, stableBlocCounts }) {
  const target = document.getElementById('insightStrip');
  if (!target) return;

  const mostFlippedParty = flippedRows.length
    ? topCount(flippedRows.map((row) => row.winner_2021), 'lost')
    : null;
  const mostGainedParty = flippedRows.length
    ? topCount(flippedRows.map((row) => row.winner_2026), 'gained')
    : null;
  const biggestTransfer = transferCounts[0];
  const mostStableParty = stableBlocCounts[0];

  const insights = [
    {
      title: 'Largest losing party',
      body: mostFlippedParty ? `${mostFlippedParty.party} lost ${mostFlippedParty.count} flipped constituencies.` : 'No flip data available.',
    },
    {
      title: 'Largest gaining party',
      body: mostGainedParty ? `${mostGainedParty.party} gained ${mostGainedParty.count} flipped constituencies.` : 'No flip data available.',
    },
    {
      title: 'Strongest transfer path',
      body: biggestTransfer ? `${biggestTransfer.transfer} appears most often with ${biggestTransfer.constituencies} constituencies.` : 'No transfer data available.',
    },
    {
      title: 'Most stable bloc',
      body: mostStableParty ? `${mostStableParty.party} retained ${mostStableParty.stable_constituencies} constituencies.` : 'No stable bloc data available.',
    },
  ];

  target.innerHTML = insights.map((insight) => `
    <div class="insight-card">
      <strong>${escapeHtml(insight.title)}</strong>
      <span>${escapeHtml(insight.body)}</span>
    </div>
  `).join('');
}

function topCount(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const [party, count] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] || [];
  return party ? { party, count } : null;
}

function renderSankey({ nodes, flows }) {
  const target = document.getElementById('sankeyChart');
  if (!target || !window.Plotly) return;

  const nodeIndex = new Map(nodes.map((node, index) => [node, index]));
  const colors = {
    DMK: 'rgba(239, 68, 68, 0.55)',
    AIADMK: 'rgba(37, 99, 235, 0.55)',
    TVK: 'rgba(139, 92, 246, 0.55)',
    Others: 'rgba(148, 163, 184, 0.55)',
  };

  const figure = {
    data: [{
      type: 'sankey',
      arrangement: 'snap',
      node: {
        pad: 18,
        thickness: 20,
        line: { color: 'rgba(15, 23, 42, 0.12)', width: 1 },
        label: nodes,
        color: nodes.map((node) => colors[node] || colors.Others),
      },
      link: {
        source: flows.map((flow) => nodeIndex.get(flow.source)),
        target: flows.map((flow) => nodeIndex.get(flow.target)),
        value: flows.map((flow) => flow.value),
        color: flows.map((flow) => colors[flow.source] || colors.Others),
        hovertemplate: '%{source.label} → %{target.label}<br><b>%{value}</b> constituencies<extra></extra>',
      },
    }],
    layout: {
      margin: { l: 20, r: 20, t: 20, b: 20 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Manrope, sans-serif', size: 12, color: '#132238' },
      width: null,
      height: 560,
    },
  };

  Plotly.newPlot(target, figure.data, figure.layout, { responsive: true, displayModeBar: false });
}

function renderTransferBarChart(transferCounts) {
  const canvas = document.getElementById('transferBarChart');
  if (!canvas || !window.Chart) return;

  const topTransfers = transferCounts.slice(0, 10).reverse();
  const labels = topTransfers.map((row) => row.transfer);
  const values = topTransfers.map((row) => row.constituencies);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Constituencies',
        data: values,
        borderRadius: 12,
        backgroundColor: values.map((value) => `rgba(31, 111, 235, ${Math.min(0.35 + value / 15, 0.9)})`),
        borderColor: '#1f6feb',
        borderWidth: 1,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (context) => ` ${context.parsed.x} constituencies` } },
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

function renderTransferTable(transferCounts) {
  const tbody = document.querySelector('#transferTable tbody');
  if (!tbody) return;

  tbody.innerHTML = transferCounts
    .slice(0, 10)
    .map((row) => `
      <tr>
        <td>${escapeHtml(row.fromParty)}</td>
        <td>${escapeHtml(row.toParty)}</td>
        <td>${escapeHtml(String(row.constituencies))}</td>
      </tr>
    `)
    .join('');
}

function renderStableTable(stableBlocCounts) {
  const tbody = document.querySelector('#stableTable tbody');
  if (!tbody) return;

  tbody.innerHTML = stableBlocCounts
    .slice(0, 8)
    .map((row) => `
      <tr>
        <td>${escapeHtml(row.party)}</td>
        <td>${escapeHtml(String(row.stable_constituencies))}</td>
      </tr>
    `)
    .join('');
}

function renderSummaryCards({ flippedRows, transferCounts, stableBlocCounts }) {
  const target = document.getElementById('summaryGrid');
  if (!target) return;

  const largestTransfer = transferCounts[0];
  const stableLeader = stableBlocCounts[0];
  const flippedCount = flippedRows.length;
  const patternText = largestTransfer
    ? `${largestTransfer.transfer} is the dominant transfer path, which suggests flips were concentrated between a small set of party pairings rather than spread evenly.`
    : 'No transfer pattern could be determined.';

  const cards = [
    {
      title: 'Overall movement',
      body: `${flippedCount} constituencies changed their winning party between 2021 and 2026.`,
    },
    {
      title: 'Transfer pattern',
      body: patternText,
    },
    {
      title: 'Stable bloc',
      body: stableLeader ? `${stableLeader.party} remained strongest in ${stableLeader.stable_constituencies} unchanged constituencies.` : 'No stable bloc identified.',
    },
  ];

  target.innerHTML = cards.map((card) => `
    <article class="summary-card">
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.body)}</p>
    </article>
  `).join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
