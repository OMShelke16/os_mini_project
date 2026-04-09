/**
 * simulator.js — handles the step-by-step simulation page
 */

const Simulator = (() => {
  let result = null;
  let currentStep = -1;
  let autoTimer = null;
  let simSpeed = 450;

  // DOM
  const frameSlider  = document.getElementById('frame-slider');
  const frameVal     = document.getElementById('frame-val');
  const pageInput    = document.getElementById('page-input');
  const btnRun       = document.getElementById('btn-run');
  const btnStep      = document.getElementById('btn-step');
  const btnReset     = document.getElementById('btn-reset');
  const btnRandom    = document.getElementById('btn-random');
  const refRow       = document.getElementById('ref-row');
  const framesDisp   = document.getElementById('frames-display');
  const traceThead   = document.getElementById('trace-thead');
  const traceTbody   = document.getElementById('trace-tbody');
  const explanation  = document.getElementById('explanation');
  const sFaults      = document.getElementById('s-faults');
  const sHits        = document.getElementById('s-hits');
  const sHitRatio    = document.getElementById('s-hitratio');
  const sFaultRate   = document.getElementById('s-faultrate');

  function init() {
    frameSlider.addEventListener('input', () => { frameVal.textContent = frameSlider.value; });

    document.querySelectorAll('input[name="speed"]').forEach(r => {
      r.addEventListener('change', () => { simSpeed = +r.value; });
    });

    btnRun.addEventListener('click', handleRun);
    btnStep.addEventListener('click', handleStep);
    btnReset.addEventListener('click', handleReset);
    btnRandom.addEventListener('click', () => { pageInput.value = Algorithms.randomPages(); });
  }

  function getAlgo() { return document.querySelector('input[name="algo"]:checked').value; }
  function getFrames() { return +frameSlider.value; }

  function prepare() {
    stopAuto();
    const pages = Algorithms.parsePages(pageInput.value);
    if (!pages.length) { explanation.textContent = 'Please enter a valid page reference string.'; return false; }
    const algo = getAlgo();
    const frames = getFrames();
    result = Algorithms[algo](pages, frames);
    currentStep = -1;
    buildRefRow(pages);
    buildFrameSlots(frames);
    buildTraceTable(frames);
    clearStats();
    explanation.textContent = `Ready. Algorithm: ${algo.toUpperCase()}, Frames: ${frames}, Total pages: ${pages.length}. Press Step or Run.`;
    return true;
  }

  function handleRun() {
    if (autoTimer) { stopAuto(); return; }
    if (!result || currentStep >= result.steps.length - 1) {
      if (!prepare()) return;
    }
    btnRun.textContent = '⏸ Pause';
    autoTimer = setInterval(() => {
      if (currentStep >= result.steps.length - 1) { stopAuto(); return; }
      advanceStep();
    }, simSpeed);
  }

  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
    btnRun.textContent = '▶ Run';
  }

  function handleStep() {
    if (!result) { if (!prepare()) return; }
    if (currentStep >= result.steps.length - 1) return;
    advanceStep();
  }

  function advanceStep() {
    currentStep++;
    renderStep(currentStep);
  }

  function renderStep(idx) {
    const step = result.steps[idx];
    const frames = getFrames();

    // Highlight ref row
    document.querySelectorAll('.ref-cell').forEach((cell, i) => {
      cell.classList.remove('active-cell', 'was-hit', 'was-fault', 'past');
      if (i === idx) {
        cell.classList.add('active-cell');
      } else if (i < idx) {
        cell.classList.add(result.steps[i].fault ? 'was-fault' : 'was-hit', 'past');
      }
    });

    // Update frame boxes
    step.frames.forEach((page, i) => {
      const box = document.getElementById(`fbox-${i}`);
      if (!box) return;
      box.classList.remove('occupied', 'just-loaded', 'just-hit');
      if (page === null) {
        box.textContent = '—';
      } else {
        box.textContent = page;
        if (step.fault && step.evictedFrame === i) {
          box.classList.add('just-loaded');
        } else if (!step.fault && page === step.page) {
          box.classList.add('just-hit');
        } else {
          box.classList.add('occupied');
        }
      }
    });

    // Highlight trace row
    document.querySelectorAll('#trace-tbody tr').forEach((row, i) => {
      row.classList.remove('row-active');
      if (i === idx) {
        row.classList.add('row-active');
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });

    // Update stats (cumulative)
    let h = 0, f = 0;
    for (let i = 0; i <= idx; i++) result.steps[i].fault ? f++ : h++;
    const total = idx + 1;
    sFaults.textContent = f;
    sHits.textContent = h;
    sHitRatio.textContent = ((h / total) * 100).toFixed(0) + '%';
    sFaultRate.textContent = ((f / total) * 100).toFixed(0) + '%';

    // Explanation
    explanation.textContent = step.explanation;
  }

  function buildRefRow(pages) {
    refRow.innerHTML = '';
    pages.forEach(p => {
      const cell = document.createElement('div');
      cell.className = 'ref-cell';
      cell.textContent = p;
      refRow.appendChild(cell);
    });
  }

  function buildFrameSlots(count) {
    framesDisp.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const col = document.createElement('div');
      col.className = 'frame-col';
      col.innerHTML = `<div class="frame-label">Frame ${i+1}</div><div class="frame-box" id="fbox-${i}">—</div>`;
      framesDisp.appendChild(col);
    }
  }

  function buildTraceTable(frameCount) {
    // Header
    let hRow = '<tr><th>Step</th><th>Page</th>';
    for (let i = 0; i < frameCount; i++) hRow += `<th>Frame ${i+1}</th>`;
    hRow += '<th>Result</th><th>Evicted</th></tr>';
    traceThead.innerHTML = hRow;

    // Body
    traceTbody.innerHTML = '';
    result.steps.forEach((step) => {
      const tr = document.createElement('tr');
      tr.className = step.fault ? 'row-fault' : 'row-hit';

      let cells = `<td>${step.step}</td><td><strong>${step.page}</strong></td>`;
      for (let i = 0; i < frameCount; i++) {
        const val = step.frames[i];
        const isNew = step.fault && step.evictedFrame === i;
        const isHit = !step.fault && val === step.page;
        let style = '';
        if (isNew) style = 'color:#c5221f;font-weight:700';
        else if (isHit) style = 'color:#2d7a46;font-weight:700';
        cells += `<td style="${style}">${val === null ? '—' : val}</td>`;
      }

      const badge = step.fault
        ? `<span class="badge badge-fault">FAULT</span>`
        : `<span class="badge badge-hit">HIT</span>`;
      cells += `<td>${badge}</td><td>${step.evicted !== null ? step.evicted : '—'}</td>`;
      tr.innerHTML = cells;
      traceTbody.appendChild(tr);
    });
  }

  function clearStats() {
    sFaults.textContent = '—'; sHits.textContent = '—';
    sHitRatio.textContent = '—'; sFaultRate.textContent = '—';
  }

  function handleReset() {
    stopAuto();
    result = null;
    currentStep = -1;
    refRow.innerHTML = '';
    framesDisp.innerHTML = '';
    traceThead.innerHTML = '';
    traceTbody.innerHTML = '';
    clearStats();
    explanation.textContent = 'Press Run or Step to start the simulation.';
  }

  return { init };
})();
