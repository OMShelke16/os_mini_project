/**
 * compare.js — runs all 3 algorithms and shows side-by-side results
 */

const Compare = (() => {
  const cmpInput       = document.getElementById('cmp-input');
  const cmpFrameSlider = document.getElementById('cmp-frame-slider');
  const cmpFrameVal    = document.getElementById('cmp-frame-val');
  const cmpRunBtn      = document.getElementById('cmp-run-btn');
  const cmpRandomBtn   = document.getElementById('cmp-random-btn');
  const cmpResults     = document.getElementById('cmp-results');
  const cmpChartCard   = document.getElementById('cmp-chart-card');
  const cmpChart       = document.getElementById('cmp-chart');
  const cmpVerdict     = document.getElementById('cmp-verdict');
  const cmpVerdictText = document.getElementById('cmp-verdict-text');

  function init() {
    cmpFrameSlider.addEventListener('input', () => { cmpFrameVal.textContent = cmpFrameSlider.value; });
    cmpRunBtn.addEventListener('click', run);
    cmpRandomBtn.addEventListener('click', () => { cmpInput.value = Algorithms.randomPages(); });
  }

  function run() {
    const pages = Algorithms.parsePages(cmpInput.value);
    if (!pages.length) { alert('Enter a valid reference string.'); return; }
    const frames = +cmpFrameSlider.value;

    const results = {
      fifo:    Algorithms.fifo(pages, frames),
      lru:     Algorithms.lru(pages, frames),
      optimal: Algorithms.optimal(pages, frames)
    };

    renderCards(pages, frames, results);
    renderChart(results);
    renderVerdict(results);
  }

  function renderCards(pages, frames, results) {
    cmpResults.innerHTML = '';
    const configs = [
      { key: 'fifo',    label: 'FIFO',    cls: 'fifo' },
      { key: 'lru',     label: 'LRU',     cls: 'lru' },
      { key: 'optimal', label: 'Optimal', cls: 'opt' }
    ];
    configs.forEach(({ key, label, cls }) => {
      const r = results[key];
      const card = document.createElement('div');
      card.className = `cmp-card ${cls}`;
      card.innerHTML = `
        <div class="cmp-card-header">${label}</div>
        <div class="cmp-stats">
          <div class="cmp-row"><span class="cmp-key">Page Faults</span><span class="cmp-val" style="color:#c5221f">${r.faults}</span></div>
          <div class="cmp-row"><span class="cmp-key">Page Hits</span><span class="cmp-val" style="color:#2d7a46">${r.hits}</span></div>
          <div class="cmp-row"><span class="cmp-key">Hit Ratio</span><span class="cmp-val">${r.hitRatio}%</span></div>
          <div class="cmp-row"><span class="cmp-key">Fault Rate</span><span class="cmp-val">${r.faultRate}%</span></div>
        </div>
        <div class="cmp-trace-section">
          <h4>Trace</h4>
          <div class="mini-trace">${buildMiniTrace(r, frames)}</div>
        </div>
      `;
      cmpResults.appendChild(card);
    });
  }

  function buildMiniTrace(result, frames) {
    return result.steps.map(step => {
      let cells = `<span class="mini-page">${step.page}</span>`;
      for (let i = 0; i < frames; i++) {
        const val = step.frames[i];
        const isNew = step.fault && step.evictedFrame === i;
        const isHit = !step.fault && val === step.page;
        const cls = val === null ? '' : isNew ? 'filled m-fault' : isHit ? 'filled m-hit' : 'filled';
        cells += `<div class="mini-cell ${cls}">${val === null ? '' : val}</div>`;
      }
      cells += step.fault
        ? `<span class="mini-badge f">F</span>`
        : `<span class="mini-badge h">H</span>`;
      return `<div class="mini-row">${cells}</div>`;
    }).join('');
  }

  function renderChart(results) {
    const { fifo, lru, optimal } = results;
    const max = Math.max(fifo.faults, lru.faults, optimal.faults, 1);
    const maxH = 120;

    cmpChartCard.style.display = 'block';
    cmpChart.innerHTML = `
      <div class="bar-group">
        <div class="bar-item" style="height:${Math.round(fifo.faults/max*maxH)}px;background:#1a73e8">${fifo.faults}</div>
        <div class="bar-label" style="color:#1a73e8">FIFO</div>
      </div>
      <div class="bar-group">
        <div class="bar-item" style="height:${Math.round(lru.faults/max*maxH)}px;background:#9334ea">${lru.faults}</div>
        <div class="bar-label" style="color:#9334ea">LRU</div>
      </div>
      <div class="bar-group">
        <div class="bar-item" style="height:${Math.round(optimal.faults/max*maxH)}px;background:#0f9d58">${optimal.faults}</div>
        <div class="bar-label" style="color:#0f9d58">Optimal</div>
      </div>
    `;
  }

  function renderVerdict(results) {
    const { fifo, lru, optimal } = results;
    const min = Math.min(fifo.faults, lru.faults, optimal.faults);
    let msg = '';

    if (optimal.faults === min && fifo.faults > min && lru.faults > min) {
      const better = lru.faults <= fifo.faults ? `LRU (${lru.faults} faults)` : `FIFO (${fifo.faults} faults)`;
      msg = `Optimal has the fewest page faults (${optimal.faults}), as expected — it always achieves the theoretical minimum. However, Optimal cannot be used in real systems since future page requests are unknown. Among practical algorithms, ${better} performs better here.`;
    } else if (fifo.faults === min && lru.faults === min) {
      msg = `FIFO and LRU tie with ${min} faults each. Optimal achieves ${optimal.faults} faults. In practice, LRU is preferred since it doesn't suffer from Bélády's Anomaly.`;
    } else if (fifo.faults === lru.faults && fifo.faults === optimal.faults) {
      msg = `All three algorithms produce the same result (${min} faults) for this reference string and frame count. This is a special case where the reference pattern doesn't differentiate the algorithms.`;
    } else if (lru.faults <= fifo.faults) {
      msg = `LRU performs better than FIFO here (${lru.faults} vs ${fifo.faults} faults). Optimal achieves ${optimal.faults} faults. This is the typical case — LRU's use of recency gives it an advantage over FIFO's simple arrival order.`;
    } else {
      msg = `Interestingly, FIFO performs better than LRU here (${fifo.faults} vs ${lru.faults} faults). This is not the usual case — it may be due to the specific pattern of this reference string. Optimal still achieves the minimum of ${optimal.faults} faults.`;
    }

    cmpVerdict.style.display = 'block';
    cmpVerdictText.textContent = msg;
  }

  return { init };
})();
