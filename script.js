
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioContext, analyser, audioSource, dataArray, audioElement;
let painting = false;
let lastPosition = { x: 0, y: 0 };
let positions = [];
let isPlaying = false;

function handleAudioFile(event) {
    const file = event.target.files[0];
    const audioURL = URL.createObjectURL(file);

    if (audioContext) {
        audioContext.close();
    }

    // Initialize audio context and analyser
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Frequency resolution
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Create an audio element to load the file
    audioElement = new Audio(audioURL);
    audioElement.controls = true;
    document.body.appendChild(audioElement);

    // Create a source from the audio element and connect to analyser
    audioSource = audioContext.createMediaElementSource(audioElement);
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);

    // Set up the timeline slider and update max value
    audioElement.onloadedmetadata = function() {
        document.getElementById("timeline").max = audioElement.duration;
    };

    // Play the audio file once it's loaded
    audioElement.play();
    isPlaying = true;
    animateBrush(); 
}

function getAudioData() {
    analyser.getByteFrequencyData(dataArray);
    const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length*5; // Average volume
    const pitch = dataArray.indexOf(Math.max(...dataArray)); // Peak frequency index
    return { volume, pitch };
}

function animateBrush() {
    if (!audioContext || audioContext.state === 'suspended') return;
    requestAnimationFrame(animateBrush);

    // Get current audio data
    const { volume, pitch } = getAudioData();

    // Use volume to control brush size, opacity, and color
    const thickness = Math.max(2, volume/2.5);
    const opacity = Math.min(1, pitch);
    const brushColor = getColorFromAudio(opacity);

    ctx.lineWidth = thickness;
    ctx.strokeStyle = brushColor;
}

function getColorFromAudio(opacity) {
analyser.getByteFrequencyData(dataArray);
let hue = 0;
    for (let i = 0; i < dataArray.length; i++) {
    hue += dataArray[i] * (i / dataArray.length*2);
    }
    hue = hue % 360;
    return `hsla(${hue}, 90%, 80%, ${opacity})`;
}



function toggleAudio() {
    if (isPlaying) {
        audioElement.pause();
    } else {
        audioElement.play();
    }
    isPlaying = !isPlaying;
}

function seekAudio() {
    const timeline = document.getElementById("timeline");
    audioElement.currentTime = timeline.value;
}

function updateTimeline() {
    const timeline = document.getElementById("timeline");
    if (!audioElement.ended) {
        timeline.value = audioElement.currentTime;
    }
}

canvas.addEventListener("mousedown", (event) => {
  painting = true;
  positions = [{ x: event.clientX, y: event.clientY }]; // Reset positions
});
canvas.addEventListener("mouseup", () => { painting = false; ctx.beginPath(); });
canvas.addEventListener("mousemove", draw);

function draw(event) {
    if (!painting) return;

    // Add the current mouse position to the positions array
    positions.push({ x: event.clientX, y: event.clientY });

    // Limit the array size for smoother performance
    if (positions.length > 5) 
    positions.shift();

    if (positions.length > 1) {
        const [prev, curr] = positions;
        const midX = (prev.x + curr.x) /2;
        const midY = (prev.y + curr.y) /2;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        if (brushType === "default") {
            ctx.lineTo(curr.x, curr.y);
        } else if (brushType === "splatter") {
            for (let i = 0; i < 3; i++) {
                let offsetX = (Math.random() - 0.5) * 2;
                let offsetY = (Math.random() - 0.5) * 2;
                ctx.lineTo(curr.x + offsetX, curr.y + offsetY);
            }
        } else if (brushType === "wave") {
          let frequency = 0.2;  // Lower value for smoother waves
    let amplitude = 10;   // Wave height

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);

    for (let i = 0; i <= 1; i += 0.1) {  // Creates multiple points
        let waveX = prev.x + (curr.x - prev.x) * i;
        let waveY = prev.y + (curr.y - prev.y) * i + Math.cos(i * Math.PI * 2 * frequency) * amplitude;
        ctx.shadowBlur = 25;  // Glow intensity
        ctx.shadowColor = "#111111";  // Glow color
        ctx.lineTo(waveX, waveY);
    }
  }
        ctx.shadowBlur = 25;  // Glow intensity
        ctx.shadowColor = "#000000";  // Glow color
        ctx.stroke();
    }
}


function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clears canvas
}

function changeBrushType() {
    brushType = document.getElementById("brushType").value;
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

setInterval(updateTimeline, 100); // Update timeline every 10th of sec
