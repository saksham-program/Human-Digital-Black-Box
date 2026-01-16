// Chart.js initialization (kept separate for code clarity)
let heartRateChartInstance = null;
let stressChartInstance = null;
let sleepChartInstance = null;
let safetyChartInstance = null;
let activityChartInstance = null;

function chartTheme() {
  return {
    gridColor: 'rgba(255,255,255,0.08)',
    tickColor: 'rgba(255,255,255,0.65)',
    labelColor: 'rgba(255,255,255,0.85)',
    gradientA: '#8a2be2',
    gradientB: '#4169e1'
  };
}

function makeLineChart(ctx, labels, data, label) {
  const t = chartTheme();
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: t.gradientB,
        backgroundColor: 'rgba(138, 43, 226, 0.18)',
        tension: 0.35,
        fill: true,
        pointRadius: 2,
        pointBackgroundColor: t.gradientA
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: t.labelColor } }
      },
      scales: {
        x: { grid: { color: t.gridColor }, ticks: { color: t.tickColor } },
        y: { grid: { color: t.gridColor }, ticks: { color: t.tickColor } }
      }
    }
  });
}

function makeBarChart(ctx, labels, data, label) {
  const t = chartTheme();
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: 'rgba(65, 105, 225, 0.35)',
        borderColor: t.gradientB,
        borderWidth: 1,
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: t.labelColor } }
      },
      scales: {
        x: { grid: { color: t.gridColor }, ticks: { color: t.tickColor } },
        y: { grid: { color: t.gridColor }, ticks: { color: t.tickColor } }
      }
    }
  });
}

async function renderHealthCharts() {
  const res = await healthApi();
  const { labels6h, hr, labels24h, stress, labels7d, sleep } = res.series;

  const hrCtx = document.getElementById('heartRateChart')?.getContext('2d');
  const stressCtx = document.getElementById('stressChart')?.getContext('2d');
  const sleepCtx = document.getElementById('sleepChart')?.getContext('2d');

  if (hrCtx) {
    if (heartRateChartInstance) heartRateChartInstance.destroy();
    heartRateChartInstance = makeLineChart(hrCtx, labels6h, hr, 'Heart Rate (BPM)');
  }

  if (stressCtx) {
    if (stressChartInstance) stressChartInstance.destroy();
    stressChartInstance = makeLineChart(stressCtx, labels24h, stress, 'Stress (1-10)');
  }

  if (sleepCtx) {
    if (sleepChartInstance) sleepChartInstance.destroy();
    sleepChartInstance = makeBarChart(sleepCtx, labels7d, sleep, 'Sleep Hours');
  }
}

async function renderStatsCharts() {
  const res = await statsApi();
  const { labels30, safety, labels7, activity } = res.charts;

  const safetyCtx = document.getElementById('safetyChart')?.getContext('2d');
  const activityCtx = document.getElementById('activityChart')?.getContext('2d');

  if (safetyCtx) {
    if (safetyChartInstance) safetyChartInstance.destroy();
    safetyChartInstance = makeLineChart(safetyCtx, labels30, safety, 'Safety Score (0-100)');
  }

  if (activityCtx) {
    if (activityChartInstance) activityChartInstance.destroy();
    activityChartInstance = makeBarChart(activityCtx, labels7, activity, 'Activity Level');
  }
}
