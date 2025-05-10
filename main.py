from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import base64
from datetime import datetime
from PIL import Image
from io import BytesIO
import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
import json
import google.generativeai as genai


app = Flask(__name__)
CORS(app)

genai.configure(api_key="AIzaSyARxaxsTyYLR_FWrVjsZi8YyHdloUomsd4")
model = genai.GenerativeModel("gemini-1.5-pro")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        data = request.get_json()
        image_data = data['image'] 
        image_data = image_data.split(",")[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"captured_{timestamp}.png"
        filepath = os.path.join('static/uploads', filename)

        image.save(filepath)

        return jsonify({"message": f"Image saved successfully as {filename}"})

    except Exception as e:
        return jsonify({"error": str(e)})

# model_path = 'model/best_model.h5'
# mapping_path = 'model/class_mapping.json'

# model_dl = load_model(model_path)
# with open(mapping_path, 'r') as f:
#     class_mapping = json.load(f)

@app.route('/predict-disease', methods=['POST'])
# def predict_disease():
#     try:
#         data = request.get_json()
#         image_data = data['image'].split(",")[1]
#         image_bytes = base64.b64decode(image_data)
#         image = Image.open(BytesIO(image_bytes)).convert("RGB")
#         image = image.resize((256, 256))  

#         image_array = img_to_array(image) / 255.0
#         image_array = np.expand_dims(image_array, axis=0)

#         prediction = model_dl.predict(image_array)
#         predicted_class = np.argmax(prediction[0])
#         predicted_label = class_mapping[str(predicted_class)].replace("_", " ")
#         print(predicted_label)
#         return jsonify({'predicted_disease': predicted_label})

#     except Exception as e:
#         return jsonify({'error': f"Prediction error: {str(e)}"})

def predict_disease():
    try:
        data = request.get_json()
        image_data = data['image'].split(",")[1]
        image_bytes = base64.b64decode(image_data)

        image_part = {
            "mime_type" : "image/png",
            "data" : image_bytes
        }
        prompt = (
            "You are an expert in plant pathology. Analyze this leaf image and predict the disease it shows. "
            "If the leaf appears healthy, respond with just 'Healthy'. Otherwise, respond with the name of the disease."
        )

        response = model.generate_content(
            [prompt, image_part],
            generation_config={"temperature": 0.3})

        predicted_label = response.text.strip()
        return jsonify({'predicted_disease': predicted_label})

    except Exception as e:
        return jsonify({'error': f"Gemini prediction error: {str(e)}"})


@app.route('/recommend', methods=['POST'])
def recommend():
    """Generates a recommendation based on user input."""
    data = request.get_json()
    crop_disease = data['disease']

    prompt = f"""
    Provide a concise and practical recommendation for managing the crop disease: {crop_disease}.
    Keep the response limited to 3-4 actionable points, avoiding lengthy explanations.
    """

    try:
        response = model.generate_content(prompt)
        suggestion = response.text.strip()
        return jsonify({"suggestion": suggestion})

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)







# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# .\venv310\Scripts\Activate
