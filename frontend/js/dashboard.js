async function loadDashboard() {
    try {
        const result = await Api.getMediaList();
        
        if (result.code === 0) {
            const data = result.data || [];
            document.getElementById('streamCount').textContent = data.length;
            
            let totalViewers = 0;
            data.forEach(stream => {
                totalViewers += stream.readerCount || 0;
            });
            document.getElementById('viewerCount').textContent = totalViewers;
            document.getElementById('trafficCount').textContent = '计算中...';
        } else {
            document.getElementById('streamCount').textContent = '0';
            document.getElementById('viewerCount').textContent = '0';
            document.getElementById('trafficCount').textContent = '-';
        }
        
        await loadVersion();
        await loadStatistic();
        await loadThreadsLoad();
        await loadWorkThreadsLoad();
        loadSystemResources();
    } catch (error) {
        showToast('加载数据失败: ' + error.message, 'error');
    }
}

async function loadVersion() {
    try {
        const result = await Api.getVersion();
        if (result.code === 0) {
            const data = result.data || {};
            
            const branchName = data.branchName || '-';
            const buildTime = data.buildTime || '-';
            const commitHash = data.commitHash || '-';
            
            document.getElementById('versionInfo').textContent = `服务版本: ${commitHash}`;
            document.getElementById('branchInfo').textContent = `分支: ${branchName}`;
            document.getElementById('buildInfo').textContent = `编译时间: ${buildTime}`;
        } else {
            document.getElementById('versionInfo').textContent = '服务版本: -';
            document.getElementById('branchInfo').textContent = '分支: -';
            document.getElementById('buildInfo').textContent = '编译时间: -';
        }
    } catch (error) {
        console.error('获取版本信息失败:', error);
        document.getElementById('versionInfo').textContent = '服务版本: -';
        document.getElementById('branchInfo').textContent = '分支: -';
        document.getElementById('buildInfo').textContent = '编译时间: -';
    }
}

async function loadStatistic() {
    try {
        const result = await Api.getStatistic();
        if (result.code === 0) {
            const data = result.data || {};
            drawStatisticChart(data);
        }
    } catch (error) {
        showToast('加载对象统计失败: ' + error.message, 'error');
    }
}

function drawStatisticChart(data) {
    const ctx = document.getElementById('statisticChart').getContext('2d');
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    if (window.statisticChart && typeof window.statisticChart.destroy === 'function') {
        window.statisticChart.destroy();
    }
    
    window.statisticChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '对象个数',
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        rotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

async function loadThreadsLoad() {
    try {
        const result = await Api.getThreadsLoad();
        if (result.code === 0) {
            const data = result.data || [];
            drawThreadsLoadChart(data);
        }
    } catch (error) {
        showToast('加载线程负载失败: ' + error.message, 'error');
    }
}

async function loadWorkThreadsLoad() {
    try {
        const result = await Api.getWorkThreadsLoad();
        if (result.code === 0) {
            const data = result.data || [];
            drawWorkThreadsLoadChart(data);
        }
    } catch (error) {
        showToast('加载工作线程负载失败: ' + error.message, 'error');
    }
}

function drawThreadsLoadChart(data) {
    const ctx = document.getElementById('threadsLoadChart').getContext('2d');
    
    const labels = data.map(item => item.name || '未命名');
    const loadData = data.map(item => (item.load || 0));
    const delayData = data.map(item => item.delay || 0);
    const fdCountData = data.map(item => item.fd_count || 0);
    
    const maxDelay = Math.max(...delayData, 100);
    const yMax = maxDelay > 100 ? maxDelay * 1.2 : 100;
    
    const maxFdCount = Math.max(...fdCountData, 1);
    const fdCountScaled = fdCountData.map(val => (val / maxFdCount) * 90);
    
    if (window.threadsLoadChart && typeof window.threadsLoadChart.destroy === 'function') {
        window.threadsLoadChart.destroy();
    }
    
    window.threadsLoadChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '负载',
                    data: loadData,
                    type: 'line',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: '延迟',
                    data: delayData,
                    type: 'line',
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'FD数量',
                    data: fdCountScaled,
                    type: 'line',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '延迟',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    beginAtZero: true,
                    max: yMax,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        callback: function(value) {
                            return value + ' ms';
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '负载',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    beginAtZero: true,
                    max: 110,
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        callback: function(value) {
                            return value + ' %';
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        rotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'FD数量') {
                                return 'FD数量: ' + fdCountData[context.dataIndex];
                            }
                            return context.dataset.label + ': ' + context.parsed.y;
                        }
                    }
                }
            },
            animation: {
                onComplete: function() {
                    const chart = this;
                    const ctx = chart.ctx;
                    
                    chart.data.datasets.forEach(function(dataset, i) {
                        if (dataset.label === 'FD数量') {
                            const meta = chart.getDatasetMeta(i);
                            meta.data.forEach(function(point, index) {
                                const data = fdCountData[index];
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                                ctx.font = '10px Inter, system-ui, sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(data, point.x, point.y - 5);
                            });
                        }
                    });
                }
            }
        }
    });
}

function drawWorkThreadsLoadChart(data) {
    const ctx = document.getElementById('workThreadsLoadChart').getContext('2d');
    
    const labels = data.map(item => item.name || '未命名');
    const loadData = data.map(item => (item.load || 0));
    const delayData = data.map(item => item.delay || 0);
    const fdCountData = data.map(item => item.fd_count || 0);
    
    const maxDelay = Math.max(...delayData, 100);
    const yMax = maxDelay > 100 ? maxDelay * 1.2 : 100;
    
    const maxFdCount = Math.max(...fdCountData, 1);
    const fdCountScaled = fdCountData.map(val => (val / maxFdCount) * 90);
    
    if (window.workThreadsLoadChart && typeof window.workThreadsLoadChart.destroy === 'function') {
        window.workThreadsLoadChart.destroy();
    }
    
    window.workThreadsLoadChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '负载',
                    data: loadData,
                    type: 'line',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: '延迟',
                    data: delayData,
                    type: 'line',
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'FD数量',
                    data: fdCountScaled,
                    type: 'line',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '延迟',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    beginAtZero: true,
                    max: yMax,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        callback: function(value) {
                            return value + ' ms';
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '负载',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    beginAtZero: true,
                    max: 110,
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        callback: function(value) {
                            return value + ' %';
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        rotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'FD数量') {
                                return 'FD数量: ' + fdCountData[context.dataIndex];
                            }
                            return context.dataset.label + ': ' + context.parsed.y;
                        }
                    }
                }
            },
            animation: {
                onComplete: function() {
                    const chart = this;
                    const ctx = chart.ctx;
                    
                    chart.data.datasets.forEach(function(dataset, i) {
                        if (dataset.label === 'FD数量') {
                            const meta = chart.getDatasetMeta(i);
                            meta.data.forEach(function(point, index) {
                                const data = fdCountData[index];
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                                ctx.font = '10px Inter, system-ui, sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(data, point.x, point.y - 5);
                            });
                        }
                    });
                }
            }
        }
    });
}

function loadSystemResources() {
    drawCpuChart();
    drawMemoryChart();
}

function drawCpuChart() {
    const ctx = document.getElementById('cpuChart').getContext('2d');
    
    const labels = ['12:00', '12:05', '12:10', '12:15', '12:20', '12:25', '12:30'];
    const data = [15, 18, 16, 19, 17, 16, 18];
    
    if (window.cpuChart && typeof window.cpuChart.destroy === 'function') {
        window.cpuChart.destroy();
    }
    
    window.cpuChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'CPU',
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function drawMemoryChart() {
    const ctx = document.getElementById('memoryChart').getContext('2d');
    
    const data = [12, 12, 12, 12, 12, 12, 12];
    
    if (window.memoryChart && typeof window.memoryChart.destroy === 'function') {
        window.memoryChart.destroy();
    }
    
    window.memoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['已使用', '已使用', '已使用', '已使用', '已使用', '已使用', '已使用'],
            datasets: [{
                label: '已使用',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 24,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8',
                        callback: function(value) {
                            return value + ' GB';
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
