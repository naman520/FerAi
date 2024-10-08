let chart;
const video = document.getElementById('video');
const overlay = document.getElementById('emotion-overlay');
const debugInfo = document.getElementById('debug-info');

document.getElementById('feedbackYes').addEventListener('click', () => provideFeedback(true));
document.getElementById('feedbackNo').addEventListener('click', () => provideFeedback(false));

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => console.error("Error accessing the camera", err));

function initChart() {
    const ctx = document.getElementById('emotion-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral'],
            datasets: [{
                label: 'Emotion Probability',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(199, 199, 199, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });
}

function detectEmotion() {
    const startTime = performance.now();
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    canvas.getContext('2d').drawImage(video, 0, 0, 48, 48);
    
    canvas.toBlob(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'capture.jpg');

        fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            updateOverlay(data);
            updateChart(data);
            const endTime = performance.now();
            updateDebugInfo(endTime - startTime);
        })
        .catch(error => {
            console.error('Error:', error);
            debugInfo.textContent = `Error: ${error.message}`;
        });
    }, 'image/jpeg');
}

function updateOverlay(data) {
    const topEmotion = Object.entries(data).reduce((a, b) => a[1] > b[1] ? a : b);
    overlay.textContent = `Top Emotion: ${topEmotion[0]} (${(topEmotion[1] * 100).toFixed(2)}%)`;
    video.style.borderColor = getEmotionColor(topEmotion[0]);
}

function updateChart(data) {
    chart.data.datasets[0].data = Object.values(data);
    chart.update();
}

function updateDebugInfo(processingTime) {
    debugInfo.textContent = `Processing time: ${processingTime.toFixed(2)}ms`;
}

function getEmotionColor(emotion) {
    const colors = {
        'Angry': '#ff6384',
        'Disgust': '#4bc0c0',
        'Fear': '#ffce56',
        'Happy': '#36a2eb',
        'Sad': '#9966ff',
        'Surprise': '#ff9f40',
        'Neutral': '#c7c7c7'
    };
    return colors[emotion] || '#cccccc';
}

function provideFeedback(isCorrect) {
    console.log(`User feedback: Emotion detection ${isCorrect ? 'correct' : 'incorrect'}`);
    alert(`Thank you for your feedback! ${isCorrect ? 'Great!' : 'We\'ll work on improving.'}`);
}

video.addEventListener('loadedmetadata', () => {
    initChart();
    setInterval(detectEmotion, 1000); // Detect emotion every second
});