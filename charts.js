(function(){
    let scoreChart, timeChart, trendChart, supervisorChart, marketChart, scatterChart;

    // Define a color palette for supervisors
    const colorPalette = [
        { bg: 'rgba(255, 99, 132, 0.5)', border: 'rgb(255, 99, 132)' },
        { bg: 'rgba(54, 162, 235, 0.5)', border: 'rgb(54, 162, 235)' },
        { bg: 'rgba(255, 206, 86, 0.5)', border: 'rgb(255, 206, 86)' },
        { bg: 'rgba(75, 192, 192, 0.5)', border: 'rgb(75, 192, 192)' },
        { bg: 'rgba(153, 102, 255, 0.5)', border: 'rgb(153, 102, 255)' },
        { bg: 'rgba(255, 159, 64, 0.5)', border: 'rgb(255, 159, 64)' },
        { bg: 'rgba(123, 239, 178, 0.5)', border: 'rgb(123, 239, 178)' },
        { bg: 'rgba(238, 130, 238, 0.5)', border: 'rgb(238, 130, 238)' },
        { bg: 'rgba(64, 224, 208, 0.5)', border: 'rgb(64, 224, 208)' },
        { bg: 'rgba(255, 182, 193, 0.5)', border: 'rgb(255, 182, 193)' }
    ];
  
    // --- 1. Score Distribution (Bar Chart) ---
    function initScoreChart() {
        const ctx = document.getElementById('scoreChart');
        if (!ctx) return;
        scoreChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%'],
                datasets: [{
                    label: 'Score Distribution',
                    data: Array(10).fill(0),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.33, // 4:3 aspect ratio for non-circular charts
                layout: {
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5
                    }
                }
            }
        });
    }
    
    function updateScoreChart(data) {
        if (!scoreChart) return;
        let buckets = Array(10).fill(0);
        data.forEach(item => {
            const pct = item.score_value * 100;
            const index = Math.min(Math.floor(pct / 10), 9);
            buckets[index]++;
        });
        scoreChart.data.datasets[0].data = buckets;
        scoreChart.update();
    }
  
    // --- 2. Time Taken Distribution (Pie Chart) ---
    function initTimeChart() {
        const ctx = document.getElementById('timeChart');
        if (!ctx) return;
        timeChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['<10 mins', '10-20 mins', '>20 mins'],
                datasets: [{
                    label: 'Time Taken Distribution',
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(255, 205, 86, 0.5)',
                        'rgba(255, 99, 132, 0.5)'
                    ],
                    borderColor: [
                        'rgb(75, 192, 192)',
                        'rgb(255, 205, 86)',
                        'rgb(255, 99, 132)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1,  // This ensures a perfect circle
                layout: {
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5
                    }
                }
            }
        });
    }
    
    function updateTimeChart(data) {
        if (!timeChart) return;
        let bucket1 = 0, bucket2 = 0, bucket3 = 0;
        data.forEach(item => {
            const minutes = item.time_taken / 60;
            if (minutes < 10) bucket1++;
            else if (minutes < 20) bucket2++;
            else bucket3++;
        });
        timeChart.data.datasets[0].data = [bucket1, bucket2, bucket3];
        timeChart.update();
    }
  
    // --- 3. Trend Over Time (Line Chart) ---
    function initTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        trendChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average Score (%)',
                    data: [],
                    fill: false,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.33,
                layout: {
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day' },
                        title: { display: true, text: 'Date' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Average Score (%)' }
                    }
                }
            }
        });
    }
    
    function updateTrendChart(data) {
        if (!trendChart) return;
        const groups = {};
        data.forEach(item => {
            const date = new Date(item.date_of_test).toISOString().split('T')[0];
            if (!groups[date]) groups[date] = [];
            groups[date].push(item.score_value * 100);
        });
        const labels = [];
        const averages = [];
        Object.keys(groups).sort().forEach(date => {
            labels.push(date);
            const scores = groups[date];
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            averages.push(avg.toFixed(2));
        });
        trendChart.data.labels = labels;
        trendChart.data.datasets[0].data = averages;
        trendChart.update();
    }
  
    // --- 4. Supervisor Performance (Bar Chart) ---
    function initSupervisorChart() {
        const ctx = document.getElementById('supervisorChart');
        if (!ctx) return;

        supervisorChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average Score (%)',
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.33,
                layout: {
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Average Score (%)' }
                    }
                }
            }
        });
    }
    
    function updateSupervisorChart(data) {
        if (!supervisorChart) return;
        const groups = {};
        data.forEach(item => {
            const sup = item.supervisor;
            if (!groups[sup]) groups[sup] = [];
            groups[sup].push(item.score_value * 100);
        });
        const labels = [];
        const averages = [];
        const backgroundColors = [];
        const borderColors = [];

        Object.keys(groups).sort().forEach((sup, index) => {
            labels.push(sup);
            const scores = groups[sup];
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            averages.push(avg.toFixed(2));
            
            // Assign colors from palette, cycling through if more supervisors than colors
            const colorIndex = index % colorPalette.length;
            backgroundColors.push(colorPalette[colorIndex].bg);
            borderColors.push(colorPalette[colorIndex].border);
        });

        supervisorChart.data.labels = labels;
        supervisorChart.data.datasets[0].data = averages;
        supervisorChart.data.datasets[0].backgroundColor = backgroundColors;
        supervisorChart.data.datasets[0].borderColor = borderColors;
        supervisorChart.update();
    }
  
    // --- 5. Market Distribution (Doughnut Chart) ---
    function initMarketChart() {
        const ctx = document.getElementById('marketChart');
        if (!ctx) return;
        marketChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    label: 'Number of Tests',
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1,  // This ensures a perfect circle
                layout: {
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5
                    }
                }
            }
        });
    }
    
    function updateMarketChart(data) {
        if (!marketChart) return;
        const counts = {};
        data.forEach(item => {
            const market = item.market;
            counts[market] = (counts[market] || 0) + 1;
        });
        const labels = Object.keys(counts).sort();
        const datasetData = labels.map(label => counts[label]);
        const backgroundColors = [];
        const borderColors = [];

        // Assign colors from palette
        labels.forEach((market, index) => {
            const colorIndex = index % colorPalette.length;
            backgroundColors.push(colorPalette[colorIndex].bg);
            borderColors.push(colorPalette[colorIndex].border);
        });

        marketChart.data.labels = labels;
        marketChart.data.datasets[0].data = datasetData;
        marketChart.data.datasets[0].backgroundColor = backgroundColors;
        marketChart.data.datasets[0].borderColor = borderColors;
        marketChart.update();
    }
  
    // --- 6. Time Taken vs. Score Scatter Plot ---
    function initScatterChart() {
        const ctx = document.getElementById('scatterChart');
        if (!ctx) return;
        scatterChart = new Chart(ctx.getContext('2d'), {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Time vs. Score',
                    data: [],
                    backgroundColor: 'rgba(255, 159, 64, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.33,
                layout: {
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: { display: true, text: 'Time Taken (minutes)' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Score (%)' }
                    }
                }
            }
        });
    }
    
    function updateScatterChart(data) {
        if (!scatterChart) return;
        const points = data.map(item => ({
            x: parseFloat((item.time_taken / 60).toFixed(2)),
            y: parseFloat((item.score_value * 100).toFixed(2))
        }));
        scatterChart.data.datasets[0].data = points;
        scatterChart.update();
    }
    
    // --- Combined Initialization and Update Functions ---
    function initAllCharts() {
        initScoreChart();
        initTimeChart();
        initTrendChart();
        initSupervisorChart();
        initMarketChart();
        initScatterChart();
    }
    
    function updateAllCharts(data) {
        updateScoreChart(data);
        updateTimeChart(data);
        updateTrendChart(data);
        updateSupervisorChart(data);
        updateMarketChart(data);
        updateScatterChart(data);
    }
    
    // Expose the combined functions to the global scope so dashboard.js can call them.
    window.initCharts = initAllCharts;
    window.updateCharts = updateAllCharts;
    
    // Auto-initialize charts. If the DOM is already loaded, call immediately.
    if(document.readyState !== 'loading') {
        initAllCharts();
    } else {
        document.addEventListener('DOMContentLoaded', initAllCharts);
    }
})();
