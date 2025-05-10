// ✅ Initialize camera
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const imagePreview = document.getElementById('image-preview');
const capturedImage = document.getElementById('captured-image');
const diseaseInput = document.getElementById('disease');
const browseImage = document.getElementById("browse-image");
const predictbtn = document.getElementById("predict-btn");


navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing camera:', error);
        alert("Camera access denied. Please allow camera permissions.");
    });

captureBtn.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');

    capturedImage.src = imageData;
    capturedImage.style.display = 'block';
    imagePreview.style.display = 'flex';

    diseaseInput.placeholder = "Enter detected disease manually";
    diseaseInput.readOnly = false;

    fetch('/upload-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imageData })
    })
    .then(response => response.json())
    .then(data => console.log(data.message || data.error))
    .catch(error => console.error('Upload error:', error));
});

browseImage.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageData = e.target.result;

            capturedImage.src = imageData;
            imagePreview.style.display = "block";

            // diseaseInput.placeholder = "Enter detected disease manually";
            // diseaseInput.readOnly = false;

            // ✅ Upload browsed image to server
            fetch('/upload-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imageData })
            })
            .then(response => response.json())
            .then(data => console.log(data.message || data.error))
            .catch(error => console.error('Upload error:', error));
        };
        reader.readAsDataURL(file);
    }
});



function fetchWeatherData() {
    const apiKey = "c763cc19dd77c522caa714fa9779cd9a";
    const city = "Kolkata";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch weather data");
            }
            return response.json();
        })
        .then(data => {

            const temperature = data.main.temp;
            const humidity = data.main.humidity;
            const rainfall = data.rain ? data.rain["1h"] || 0 : 0;

            // Update UI
            document.getElementById("temperature").value = `${temperature} °C`;
            document.getElementById("humidity").value = `${humidity} %`;
            document.getElementById("rainfall").value = `${rainfall} mm`;
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
            document.getElementById("weather-details").innerHTML = "<strong>Error fetching weather data.</strong>";
        });
}

document.addEventListener("DOMContentLoaded", fetchWeatherData);

predictbtn.addEventListener("click", predictDisease);

function predictDisease() {
    const imageSrc = capturedImage.src;
    if (!imageSrc || !imageSrc.startsWith("data:image")) {
        alert("Please capture or upload an image first.");
        return;
    }
    fetch("/predict-disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc })
    })
    .then(response => response.json())
    .then(data => {
        if (data.predicted_disease) {
            diseaseInput.value = data.predicted_disease;
            diseaseInput.readOnly = true;
        } else if (data.error) {
            alert("Prediction error: " + data.error);
        }
    })
    .catch(error => {
        console.error("Prediction request failed:", error);
        alert("Prediction failed. Check the console for details.");
    });
}

function getRecommendation() {
    const tempElement = document.getElementById("temperature");
    const humidityElement = document.getElementById("humidity");
    const rainfallElement = document.getElementById("rainfall");

    if (!tempElement || !humidityElement || !rainfallElement) {
        console.error("Error: Weather data elements are missing.");
        alert("Weather parameters are not available. Please check the page.");
        return;
    }

    const temperature = tempElement.value;
    const humidity = humidityElement.value;
    const rainfall = rainfallElement.value;
    const disease = diseaseInput.value.trim();

    if (!disease) {
        alert("Please enter the disease name manually.");
        return;
    }

    document.getElementById("suggestion").innerHTML = "<strong>Fetching recommendation, please wait...</strong>";

    fetch("http://localhost:5000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather: { temperature, humidity, rainfall }, disease })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Server response not OK");
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("suggestion").innerHTML = "";

            if (data.error) {
                document.getElementById("suggestion").innerHTML = `<strong>Error:</strong> ${data.error}`;
                return;
            }

            const suggestions = data.suggestion.split("\n");
            let numberedList = "<strong>Suggestion:</strong><ol>";
            suggestions.forEach(suggestion => {
                if (suggestion.trim() !== "") {
                    numberedList += `<li>${suggestion.replace(/^\d+\.\s*/, "")}</li>`;
                }
            });
            numberedList += "</ol>";

            document.getElementById("suggestion").innerHTML = numberedList;
        })
        .catch(error => {
            console.error("Error fetching recommendation:", error);
            document.getElementById("suggestion").innerHTML = "<strong>Error fetching recommendation. Try again.</strong>";
        });
}

