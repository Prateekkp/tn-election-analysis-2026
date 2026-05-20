// Q3 — Client-side processing and charts for TVK vote-origin analysis
const DATA_PATH_2021 = './data/tn_2021_results.csv';
const DATA_PATH_2026 = './data/tn_2026_results.csv';

const PARTY_COLORS = {
  TVK: '#f0b35f',
  DMK: '#68d4c6',
  AIADMK: '#7fa8ff',
  Others: '#9aa6b2',
};

const PARTY_MAP = {
  'dmk': 'DMK', 'dmk (alliance)': 'DMK', 'dravida munnetra kazhagam': 'DMK',
  'aiadmk': 'AIADMK', 'aiadmk (ammt)': 'AIADMK', 'all india anna dravida munnetra kazhagam': 'AIADMK',
  'tvmk': 'TVK', 'tvk': 'TVK','tamilviksam katchi': 'TVK',
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function standardize(p){
  if(!p) return 'Others';
  let key = p.trim().toLowerCase();
  if(PARTY_MAP[key]) return PARTY_MAP[key];
  if(key.includes('independent')|| key.includes('indep') || key.length<3) return 'Others';
  if(key.match(/(others|other|other parties)/)) return 'Others';
  return p;
}

function loadCsv(path) {
  return new Promise((resolve, reject) => {
    Papa.parse(path, {download:true, header:true, dynamicTyping:false,
      complete: r => resolve(r.data), error: e=>reject(e)});
  });
}

function sumBy(rows, keyFn){
  return rows.reduce((acc,r)=>{const k=keyFn(r);acc[k]=(acc[k]||0)+ (+r.votes || 0);return acc;}, {});
}

function toPercent(v, total){ return total? (v/total*100) : 0 }

async function init(){
  const status = document.getElementById('loadStatus');
  try{
    if (status) status.textContent = 'Processing election data...';
    const [r21, r26] = await Promise.all([loadCsv(DATA_PATH_2021), loadCsv(DATA_PATH_2026)]);
    const clean21 = r21.map(r=>({...r, party: standardize(r.party), region: r.region||r.region_name||r.district, votes: +r.votes||0}));
    const clean26 = r26.map(r=>({...r, party: standardize(r.party), region: r.region||r.region_name||r.district, votes: +r.votes||0}));

    // Filter to only TVK, DMK, AIADMK, Others
    const mainParties = ['TVK', 'DMK', 'AIADMK', 'Others'];
    const filterParties = (rows) => rows.map(r => ({...r, party: mainParties.includes(r.party) ? r.party : 'Others'}));
    const filtered21 = filterParties(clean21);
    const filtered26 = filterParties(clean26);

    // Statewide totals per party
    const ws21 = sumBy(filtered21, r=>r.party);
    const ws26 = sumBy(filtered26, r=>r.party);
    const total21 = Object.values(ws21).reduce((a,b)=>a+b,0);
    const total26 = Object.values(ws26).reduce((a,b)=>a+b,0);

    const parties = ['DMK', 'AIADMK', 'TVK', 'Others'];
    const statewide = parties.map(p=>({party:p, v2021: ws21[p]||0, v2026: ws26[p]||0}));
    statewide.forEach(s=>{s.pct21 = toPercent(s.v2021,total21); s.pct26 = toPercent(s.v2026,total26); s.change = s.pct26 - s.pct21});

    renderMetrics(total21, total26, statewide);
    renderInsights(statewide);
    renderStatewideChart(statewide);
    const regions = Array.from(new Set([...filtered21.map(r=>r.region), ...filtered26.map(r=>r.region)])).filter(x=>x);
    const regional = regions.map(region=>{
      const rows21 = filtered21.filter(r=>r.region===region);
      const rows26 = filtered26.filter(r=>r.region===region);
      const s21 = sumBy(rows21, r=>r.party);
      const s26 = sumBy(rows26, r=>r.party);
      const tot21 = Object.values(s21).reduce((a,b)=>a+b,0);
      const tot26 = Object.values(s26).reduce((a,b)=>a+b,0);
      const detail = parties.map(p=>({party:p, pct21: toPercent(s21[p]||0, tot21), pct26: toPercent(s26[p]||0, tot26), change: toPercent(s26[p]||0,tot26)-toPercent(s21[p]||0,tot21)}));
      return {region, detail, tot21, tot26};
    });

    renderHeatmap(regional, parties);
    renderTopChange(statewide);
    renderRegionalTable(regional);
    populateSummary(statewide, regional);
    // Clear the transient load status so the hero remains clean for presentation
    if (status) status.textContent = '';
  }catch(err){
    if (status) {
      status.innerHTML = `<strong>Unable to load the dashboard data.</strong><br />${escapeHtml(err.message || String(err))}<br /><br />Open this page through a local static server so the CSV files in the data folder can be fetched.`;
      status.classList.add('error-state');
    } else {
      console.error('Unable to load the dashboard data:', err);
    }
  }
}

function renderMetrics(total21, total26, statewide){
  const grid = document.getElementById('metricsGrid');
  grid.innerHTML = '';
  const totalChange = ((total26 - total21)/ (total21||1) *100).toFixed(1);
  const metrics = [
    {label:'Total votes 2021', value:total21.toLocaleString()},
    {label:'Total votes 2026', value:total26.toLocaleString()},
    {label:'Total vote change', value: totalChange + '%'},
    {label:'Tracked parties', value: statewide.length}
  ];
  metrics.forEach(m=>{const el=document.createElement('div');el.className='metric';el.innerHTML=`<div class="label">${m.label}</div><div class="value">${m.value}</div>`;grid.appendChild(el)});
}

function renderInsights(statewide) {
  const target = document.getElementById('insightStrip');
  if (!target) return;

  const topGainer = statewide.slice().sort((a,b)=>b.change-a.change)[0];
  const topLoser = statewide.slice().sort((a,b)=>a.change-b.change)[0];
  const tvkParty = statewide.find(s => s.party === 'TVK');
  const totalTracked = statewide.length;

  const insights = [
    {
      title: 'Largest gainer',
      body: topGainer ? `${topGainer.party} gained ${Math.abs(topGainer.change).toFixed(2)}% vote-share state-wide.` : 'No data available.',
    },
    {
      title: 'Largest loser',
      body: topLoser ? `${topLoser.party} lost ${Math.abs(topLoser.change).toFixed(2)}% vote-share state-wide.` : 'No data available.',
    },
    {
      title: 'TVK performance',
      body: tvkParty ? `TVK changed by ${tvkParty.change.toFixed(2)}% (2021: ${tvkParty.pct21.toFixed(2)}% → 2026: ${tvkParty.pct26.toFixed(2)}%).` : 'TVK data not found.',
    },
    {
      title: 'Parties tracked',
      body: `${totalTracked} major party groupings analysed across the state.`,
    },
  ];

  target.innerHTML = insights.map((insight) => `
    <div class="insight-card">
      <strong>${escapeHtml(insight.title)}</strong>
      <span>${escapeHtml(insight.body)}</span>
    </div>
  `).join('');
}

function renderStatewideChart(statewide){
  const ctx = document.getElementById('statewideChart').getContext('2d');
  
  // Create one dataset per party for accurate legend matching
  const datasets = statewide.map(s => ({
    label: s.party,
    data: [s.pct21, s.pct26],
    backgroundColor: [
      PARTY_COLORS[s.party] + '66',  // 2021: 40% opacity
      PARTY_COLORS[s.party]           // 2026: full opacity
    ],
  }));
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['2021', '2026'],
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { ticks: { color: '#132238' } },
        y: { ticks: { color: '#132238' }, beginAtZero: true }
      }
    }
  });
}

function renderHeatmap(regional, parties){
  // build table-style heatmap inside #heatmapContainer
  const container = document.getElementById('heatmapContainer');
  container.innerHTML = '';
  const table = document.createElement('table');
  table.className='data-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.appendChild(td('Region','th'));
  parties.forEach(p=> headRow.appendChild(td(p,'th')));
  thead.appendChild(headRow); table.appendChild(thead);
  
  // Calculate max magnitude for color intensity scaling
  const allMagnitudes = regional.flatMap(r => r.detail.map(d => Math.abs(d.change)));
  const maxMagnitude = Math.max(1, ...allMagnitudes);
  
  const tbody = document.createElement('tbody');
  regional.forEach((r,i)=>{
    const row = document.createElement('tr');
    row.appendChild(td(r.region,'td'));
    const map = Object.fromEntries(r.detail.map(d=>[d.party,d.change]));
    parties.forEach(p=>{
      const val = +(map[p]||0).toFixed(2);
      const cell = td((val>0?'+':'')+val.toFixed(2)+'%', 'td');
      const normalized = Math.abs(val) / maxMagnitude;
      const intensity = Math.min(0.96, 0.38 + normalized * 0.5);
      cell.style.background = val>0 ? `rgba(15,157,138,${intensity})` : `rgba(194,65,65,${intensity})`;
      cell.style.color = intensity>0.45?'#fff':'#132238';
      row.appendChild(cell);
    });
    if(i % 2 === 0) row.style.background = '#fbfcfe';
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function td(txt, tag='td'){const e=document.createElement(tag);e.textContent=txt;return e}

function renderTopChange(statewide){
  const sorted = [...statewide].sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)).slice(0,6);
  const ctx = document.getElementById('topChangeBar').getContext('2d');
  const colors = sorted.map(s => s.change>0 ? PARTY_COLORS[s.party] : 'rgba(255,118,118,0.8)');
  new Chart(ctx,{type:'bar',data:{labels:sorted.map(s=>s.party),datasets:[{label:'% change (26-21)',data:sorted.map(s=>s.change),backgroundColor:colors}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{color:'#132238'}}}}});
}

function renderRegionalTable(regional){
  const tbody = document.querySelector('#regionalTable tbody'); tbody.innerHTML='';
  regional.forEach(r=>{
    const top = [...r.detail].sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)).slice(0,3);
    top.forEach((t,i)=>{
      const changeColor = t.change>0 ? '#22c55e' : '#ff7676';
      const tr=document.createElement('tr'); 
      tr.innerHTML=`<td>${i===0? r.region:''}</td><td>${t.party}</td><td>${t.pct21.toFixed(2)}%</td><td>${t.pct26.toFixed(2)}%</td><td style="color:${changeColor};font-weight:600">${t.change.toFixed(2)}%</td>`; 
      tbody.appendChild(tr)
    })
  });
}

function populateSummary(statewide, regional){
  const grid = document.getElementById('summaryGrid');
  if (!grid) return;

  const topGainer = statewide.slice().sort((a,b)=>b.change-a.change)[0];
  const topLoser = statewide.slice().sort((a,b)=>a.change-b.change)[0];
  const totalRegions = regional.length;

  const gainSummary = topGainer 
    ? `${topGainer.party} posted the strongest vote-share gain at +${topGainer.change.toFixed(2)}% across the state.`
    : 'No party vote-share gain data available.';

  const loseSummary = topLoser
    ? `${topLoser.party} recorded the largest vote-share loss at ${topLoser.change.toFixed(2)}% across the state.`
    : 'No party vote-share loss data available.';

  const regionsSummary = `Analyzed vote-share patterns across ${totalRegions} regions between the 2021 and 2026 elections.`;

  grid.innerHTML = [
    {
      title: 'Top gainer',
      body: gainSummary,
    },
    {
      title: 'Top loser',
      body: loseSummary,
    },
    {
      title: 'Coverage',
      body: regionsSummary,
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

document.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
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
