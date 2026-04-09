/**
 * algorithms.js
 * FIFO, LRU, and Optimal page replacement algorithms.
 * Returns step-by-step trace with plain-English explanations.
 */

const Algorithms = {

  fifo(pages, frameCount) {
    const frames = new Array(frameCount).fill(null);
    const queue = []; // { page, frameIdx }
    const steps = [];
    let faults = 0, hits = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      if (frames.includes(page)) {
        hits++;
        steps.push({
          step: i + 1, page, frames: [...frames],
          fault: false, evicted: null, evictedFrame: -1,
          explanation: `Step ${i+1}: Page ${page} is already in memory (Frame ${frames.indexOf(page)+1}). PAGE HIT — no replacement needed.`
        });
      } else {
        faults++;
        if (frames.includes(null)) {
          const idx = frames.indexOf(null);
          frames[idx] = page;
          queue.push({ page, frameIdx: idx });
          steps.push({
            step: i + 1, page, frames: [...frames],
            fault: true, evicted: null, evictedFrame: idx,
            explanation: `Step ${i+1}: Page ${page} is not in memory. PAGE FAULT — but Frame ${idx+1} is empty, so page ${page} is loaded there. Queue: [${queue.map(q=>q.page).join(' → ')}]`
          });
        } else {
          const oldest = queue.shift();
          frames[oldest.frameIdx] = page;
          queue.push({ page, frameIdx: oldest.frameIdx });
          steps.push({
            step: i + 1, page, frames: [...frames],
            fault: true, evicted: oldest.page, evictedFrame: oldest.frameIdx,
            explanation: `Step ${i+1}: Page ${page} is not in memory. PAGE FAULT — All frames full. FIFO removes the oldest page: ${oldest.page} (from Frame ${oldest.frameIdx+1}). Page ${page} loaded into Frame ${oldest.frameIdx+1}. Queue: [${queue.map(q=>q.page).join(' → ')}]`
          });
        }
      }
    }

    return this._summary(steps, faults, hits, pages.length);
  },

  lru(pages, frameCount) {
    const frames = new Array(frameCount).fill(null);
    const lastUsed = {};
    const steps = [];
    let faults = 0, hits = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      if (frames.includes(page)) {
        hits++;
        lastUsed[page] = i;
        steps.push({
          step: i + 1, page, frames: [...frames],
          fault: false, evicted: null, evictedFrame: -1,
          explanation: `Step ${i+1}: Page ${page} is in memory (Frame ${frames.indexOf(page)+1}). PAGE HIT — LRU counter for page ${page} updated to time ${i+1}.`
        });
      } else {
        faults++;
        if (frames.includes(null)) {
          const idx = frames.indexOf(null);
          frames[idx] = page;
          lastUsed[page] = i;
          steps.push({
            step: i + 1, page, frames: [...frames],
            fault: true, evicted: null, evictedFrame: idx,
            explanation: `Step ${i+1}: Page ${page} not in memory. PAGE FAULT — Frame ${idx+1} is empty. Page ${page} loaded. LRU counter set to ${i+1}.`
          });
        } else {
          let lruPage = frames[0], lruTime = lastUsed[frames[0]] ?? -1;
          for (const f of frames) {
            const t = lastUsed[f] ?? -1;
            if (t < lruTime) { lruTime = t; lruPage = f; }
          }
          const idx = frames.indexOf(lruPage);
          frames[idx] = page;
          lastUsed[page] = i;
          steps.push({
            step: i + 1, page, frames: [...frames],
            fault: true, evicted: lruPage, evictedFrame: idx,
            explanation: `Step ${i+1}: Page ${page} not in memory. PAGE FAULT — LRU finds page ${lruPage} was used least recently (at time ${lruTime+1}). Evicts page ${lruPage} from Frame ${idx+1}. Page ${page} loaded there.`
          });
        }
      }
    }

    return this._summary(steps, faults, hits, pages.length);
  },

  optimal(pages, frameCount) {
    const frames = new Array(frameCount).fill(null);
    const steps = [];
    let faults = 0, hits = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      if (frames.includes(page)) {
        hits++;
        steps.push({
          step: i + 1, page, frames: [...frames],
          fault: false, evicted: null, evictedFrame: -1,
          explanation: `Step ${i+1}: Page ${page} found in Frame ${frames.indexOf(page)+1}. PAGE HIT.`
        });
      } else {
        faults++;
        if (frames.includes(null)) {
          const idx = frames.indexOf(null);
          frames[idx] = page;
          steps.push({
            step: i + 1, page, frames: [...frames],
            fault: true, evicted: null, evictedFrame: idx,
            explanation: `Step ${i+1}: Page ${page} not in memory. PAGE FAULT — Frame ${idx+1} is empty. Page ${page} loaded.`
          });
        } else {
          let farthestPage = frames[0], farthestDist = -1, farthestIdx = 0;
          const nextUse = {};
          for (let f = 0; f < frames.length; f++) {
            const fp = frames[f];
            let dist = Infinity;
            for (let j = i + 1; j < pages.length; j++) {
              if (pages[j] === fp) { dist = j; break; }
            }
            nextUse[fp] = dist;
            if (dist > farthestDist) { farthestDist = dist; farthestPage = fp; farthestIdx = f; }
          }
          frames[farthestIdx] = page;
          const futureInfo = Object.entries(nextUse)
            .filter(([p]) => p != farthestPage)
            .map(([p, d]) => `page ${p} at step ${d === Infinity ? 'never' : d+1}`)
            .join(', ');
          steps.push({
            step: i + 1, page, frames: [...frames],
            fault: true, evicted: farthestPage, evictedFrame: farthestIdx,
            explanation: `Step ${i+1}: Page ${page} not in memory. PAGE FAULT — Optimal looks at future: ${futureInfo}. Page ${farthestPage} is used ${farthestDist === Infinity ? 'never again' : `farthest in the future (step ${farthestDist+1})`}, so it is evicted from Frame ${farthestIdx+1}.`
          });
        }
      }
    }

    return this._summary(steps, faults, hits, pages.length);
  },

  _summary(steps, faults, hits, total) {
    return {
      steps, faults, hits, total,
      hitRatio: ((hits / total) * 100).toFixed(1),
      faultRate: ((faults / total) * 100).toFixed(1)
    };
  },

  parsePages(input) {
    return input.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n >= 0);
  },

  randomPages(len = 14, max = 7) {
    return Array.from({ length: len }, () => Math.floor(Math.random() * max)).join(' ');
  }
};
