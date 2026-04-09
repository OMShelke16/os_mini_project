# Page Replacement Algorithm Simulator
**Operating Systems — Mini Project**

---

## How to Run
1. Unzip the folder
2. Open `index.html` in any browser (Chrome, Firefox, Edge)
3. No installation needed

---

## Project Structure
```
page-replacement-simulator/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── algorithms.js   ← FIFO, LRU, Optimal logic
│   ├── simulator.js    ← Step-by-step UI
│   ├── compare.js      ← Comparison mode
│   └── app.js          ← Tab navigation
└── README.md
```

---

## Features

**Simulator Tab**
- Choose FIFO, LRU, or Optimal
- Set number of frames (1–7)
- Enter custom reference string or generate random
- Step through one page at a time, or auto-run
- Visual frame display (green = hit, red = fault)
- Full trace table with step-by-step explanations
- Live hit/fault statistics

**Theory Tab**
- What is page replacement and why it matters
- How each algorithm works with pros and cons
- Bélády's Anomaly explained
- Key terminology table

**Compare Tab**
- Run all 3 algorithms on the same input
- Side-by-side results and mini trace
- Bar chart of fault counts
- Written verdict explaining which algorithm performed better and why

---

## Algorithms

| Algorithm | Evicts | Practical? | Bélády's Anomaly |
|-----------|--------|------------|------------------|
| FIFO | Oldest loaded page | Yes | Yes |
| LRU | Least recently used | Yes (with hardware) | No |
| Optimal | Farthest future use | No (theoretical) | No |

---

## Example
Reference string: `7 0 1 2 0 3 0 4 2 3 0 3 2` | Frames: 3

| Algorithm | Faults | Hits | Hit Ratio |
|-----------|--------|------|-----------|
| FIFO | 9 | 4 | 30.8% |
| LRU | 8 | 5 | 38.5% |
| Optimal | 7 | 6 | 46.2% |
