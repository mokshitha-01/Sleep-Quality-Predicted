// static/script.js - COMPLETE Sleep Predictor Frontend
// Copy-paste → Works instantly!

class SleepPredictor {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStressDisplay();
        console.log('🚀 Sleep Predictor initialized!');
    }

    bindEvents() {
        // Main prediction form
        const form = document.getElementById('sleepForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.predictSleepQuality();
            });
        }

        // Stress slider live update
        const stressSlider = document.getElementById('stress_level');
        if (stressSlider) {
            stressSlider.addEventListener('input', () => {
                this.updateStressDisplay();
            });
        }

        // Reset button
        const resetBtn = document.querySelector('.reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetForm();
                this.hideResults();
            });
        }

        // Hide results when user types
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                this.hideResults();
            });
        });

        // Dashboard auto-refresh
        if (document.getElementById('sleepTrendChart')) {
            this.loadDashboardData();
            setInterval(this.loadDashboardData.bind(this), 30000); // Refresh every 30s
        }
    }

    updateStressDisplay() {
        const slider = document.getElementById('stress_level');
        const valueSpan = document.getElementById('stress_value');
        if (!slider || !valueSpan) return;
        
        const value = slider.value;
        valueSpan.textContent = value;
        
        // Color-coded stress levels
        const colors = { 
            '0': '#10b981', '1': '#10b981', '2': '#10b981', '3': '#f59e0b',
            '4': '#f59e0b', '5': '#f59e0b', '6': '#ef4444', 
            '7': '#ef4444', '8': '#dc2626', '9': '#dc2626', '10': '#b91c1c'
        };
        valueSpan.style.color = colors[value] || '#6b7280';
    }

    collectFormData() {
        return {
            sleep_duration: parseFloat(document.getElementById('sleep_duration').value) || 7,
            exercise_duration: parseFloat(document.getElementById('exercise_duration').value) || 30,
            screen_time: parseFloat(document.getElementById('screen_time').value) || 60,
            caffeine_intake: document.getElementById('caffeine_intake').value || 'None',
            stress_level: parseFloat(document.getElementById('stress_level').value) || 5,
            mood: document.getElementById('mood').value || 'Neutral',
            interruptions: document.getElementById('interruptions').checked ? 'Yes' : 'No'
        };
    }

    async predictSleepQuality() {
        const formData = this.collectFormData();
        this.showLoading();
        
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Prediction failed');
            
            const result = await response.json();
            this.displayResults(result);
            this.showPersonalizedTips(result.quality, formData);
            this.showResults();
            
        } catch (error) {
            console.error('Prediction error:', error);
            this.showError('Prediction failed. Please check your inputs.');
        }
    }

    displayResults(result) {
        const resultDiv = document.getElementById('predictionResult');
        const quality = result.quality;
        const confidence = result.confidence;
        
        const qualityConfig = {
            'Good': { 
                color: '#10b981', 
                icon: '🌙✨', 
                emoji: '😊', 
                label: 'Excellent Sleep!' 
            },
            'Average': { 
                color: '#f59e0b', 
                icon: '😴⚡', 
                emoji: '😐', 
                label: 'Fair Sleep' 
            },
            'Poor': { 
                color: '#ef4444', 
                icon: '😴💤', 
                emoji: '😴', 
                label: 'Poor Sleep' 
            }
        };
        
        const config = qualityConfig[quality];
        
        resultDiv.innerHTML = `
            <div class="prediction-header" style="border-color: ${config.color}">
                <div class="quality-icon" style="background: ${config.color}">${config.icon}</div>
                <div>
                    <h2 style="color: ${config.color}">${quality}</h2>
                    <p>${config.emoji} ${config.label}</p>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidence}%"></div>
                    </div>
                    <span class="confidence-text">${confidence.toFixed(1)}% Confidence</span>
                </div>
            </div>
            <div class="probabilities">
                <h4>Prediction Breakdown:</h4>
                <div class="prob-grid">
                    <div><strong>Poor:</strong> ${result.probabilities.Poor}</div>
                    <div><strong>Average:</strong> ${result.probabilities.Average}</div>
                    <div><strong>Good:</strong> ${result.probabilities.Good}</div>
                </div>
            </div>
        `;
    }

    showPersonalizedTips(quality, data) {
        const tipsDiv = document.getElementById('tipsSection');
        let tips = [];

        // Smart personalized tips
        if (parseFloat(data.screen_time) > 90) tips.push("📱 Reduce screen time before bed");
        if (parseFloat(data.sleep_duration) < 7) tips.push("⏰ Aim for 7-9 hours sleep");
        if (parseFloat(data.stress_level) > 6) tips.push("🧘 Try relaxation or meditation");
        if (parseFloat(data.exercise_duration) < 20) tips.push("🏃 Add 20+ min daily exercise");
        if (data.caffeine_intake !== 'None') tips.push("☕ No caffeine after 2 PM");
        if (data.interruptions === 'Yes') tips.push("🌙 Improve sleep environment");

        const qualityTips = {
            'Good': 'Keep up the excellent habits! 🌟',
            'Average': 'Small changes = big improvements!',
            'Poor': 'Focus on top tips to improve!'
        };

        tipsDiv.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> Personalized Tips</h3>
            <div class="tips-list">
                ${tips.slice(0, 4).map(tip => `<div class="tip-item">${tip}</div>`).join('')}
                <div class="general-tip">${qualityTips[quality]}</div>
            </div>
        `;
    }

    showLoading() {
        const resultDiv = document.getElementById('predictionResult');
        resultDiv.innerHTML = `
            <div class="loading" style="text-align:center;padding:40px">
                <div class="spinner"></div>
                <p>🔮 Analyzing your sleep patterns...</p>
            </div>
        `;
    }

    showResults() {
        const resultsSection = document.getElementById('resultsSection');
        const inputSection = document.querySelector('.input-section');
        if (resultsSection) resultsSection.classList.remove('hidden');
        if (inputSection) inputSection.style.opacity = '0.7';
    }

    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        const inputSection = document.querySelector('.input-section');
        if (resultsSection) resultsSection.classList.add('hidden');
        if (inputSection) inputSection.style.opacity = '1';
        
        // Clear content
        const resultDiv = document.getElementById('predictionResult');
        const tipsDiv = document.getElementById('tipsSection');
        if (resultDiv) resultDiv.innerHTML = '';
        if (tipsDiv) tipsDiv.innerHTML = '';
    }

    showError(message) {
        const resultDiv = document.getElementById('predictionResult');
        resultDiv.innerHTML = `
            <div class="error-message" style="color:#ef4444;text-align:center;padding:40px">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem;margin-bottom:15px"></i>
                <p>${message}</p>
            </div>
        `;
    }

    resetForm() {
        // Reset all form fields
        document.getElementById('sleepForm').reset();
        
        // Set default values
        document.getElementById('sleep_duration').value = '7';
        document.getElementById('exercise_duration').value = '30';
        document.getElementById('screen_time').value = '60';
        document.getElementById('caffeine_intake').value = 'None';
        document.getElementById('mood').value = 'Neutral';
        document.getElementById('stress_level').value = '5';
        document.getElementById('stress_value').textContent = '5';
        document.getElementById('interruptions').checked = false;
        
        // Update display
        this.updateStressDisplay();
        console.log('✅ Form completely reset!');
    }

    // Dashboard functions
    async loadDashboardData() {
        const historyList = document.getElementById('historyList');
        const goodCountEl = document.getElementById('goodCount');
        const averageCountEl = document.getElementById('averageCount');
        const poorCountEl = document.getElementById('poorCount');
        const chartCanvas = document.getElementById('sleepTrendChart');
        
        if (!historyList) return;
        
        try {
            const response = await fetch('/history');
            const history = await response.json();
            
            // Update stats
            if (goodCountEl) goodCountEl.textContent = history.filter(h => h.prediction.quality === 'Good').length;
            if (averageCountEl) averageCountEl.textContent = history.filter(h => h.prediction.quality === 'Average').length;
            if (poorCountEl) poorCountEl.textContent = history.filter(h => h.prediction.quality === 'Poor').length;
            
            // Update history list
            historyList.innerHTML = history.slice(-7).map(h => {
                const q = h.prediction.quality;
                const color = q === 'Good' ? '#10b981' : q === 'Average' ? '#f59e0b' : '#ef4444';
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:15px;background:#f8fafc;margin:5px 0;border-left:4px solid ${color};border-radius:8px">
                        <span style="font-size:0.9rem">${new Date(h.date).toLocaleString()}</span>
                        <strong style="color:${color};padding:5px 12px;border-radius:15px">${q}</strong>
                        <span>${h.features.sleep_duration}h sleep</span>
                    </div>
                `;
            }).join('') || '<p>No predictions yet. Try predicting first! 👆</p>';
            
            // Update chart
            if (chartCanvas) this.updateChart(history);
            
        } catch (error) {
            console.error('Dashboard error:', error);
            historyList.innerHTML = '<p>Make some predictions to see your trends!</p>';
        }
    }

    updateChart(history) {
        const canvas = document.getElementById('sleepTrendChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const recent = history.slice(-14).reverse();
        const labels = recent.map((_, i) => `Day ${i + 1}`);
        const data = recent.map(h => {
            return h.prediction.quality === 'Good' ? 2 : h.prediction.quality === 'Average' ? 1 : 0;
        });
        
        // Destroy existing chart
        if (window.sleepChart) window.sleepChart.destroy();
        
        window.sleepChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Sleep Quality',
                    data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: data.map(d => d === 2 ? '#10b981' : d === 1 ? '#f59e0b' : '#ef4444'),
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 2,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return ['Poor', 'Average', 'Good'][value];
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SleepPredictor();
    console.log(' Sleep Predictor fully loaded!');
});
