import os
import uuid
import base64
import logging

import cv2
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from ultralytics import YOLO
import google.generativeai as genai

# ---------------------------------------------------------------------------
# Bootstrap: resolve paths relative to this file so CWD does not matter.
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
MODEL_PATH = os.path.join(BASE_DIR, "models", "best.pt")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "api_uploads")
PROCESSED_FOLDER = os.path.join(BASE_DIR, "api_processed")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

load_dotenv(ENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
PLACEHOLDER_KEY = "your_actual_api_key_here"

if not GEMINI_API_KEY or GEMINI_API_KEY == PLACEHOLDER_KEY:
    logger.warning(
        "GEMINI_API_KEY is missing or still set to the placeholder. "
        "Update backend/.env before requesting maintenance recommendations."
    )
else:
    logger.info("GEMINI_API_KEY loaded from backend/.env")

app = Flask(__name__)

logger.info("Loading YOLO model from %s", MODEL_PATH)
model = YOLO(MODEL_PATH)
logger.info("YOLO model loaded successfully.")

genai.configure(api_key=GEMINI_API_KEY)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
genai_model = genai.GenerativeModel(GEMINI_MODEL)
logger.info("Gemini model configured: %s", GEMINI_MODEL)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)


def get_highest_confidence_detection(result):
    """Return the box with the highest confidence, or None if no boxes exist."""
    boxes = result.boxes
    if boxes is None or len(boxes) == 0:
        return None, None, 0

    confidences = boxes.conf.cpu().numpy()
    top_index = int(confidences.argmax())
    top_box = boxes[top_index]
    class_index = int(top_box.cls)
    class_name = result.names[class_index]
    confidence_pct = float(top_box.conf) * 100
    return top_box, class_name, confidence_pct


def get_llm_recommendation(hazard_type, bounding_boxes_count, confidence):
    """Query Gemini for a facilities maintenance recommendation."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == PLACEHOLDER_KEY:
        return (
            "Maintenance recommendation unavailable: GEMINI_API_KEY is not configured. "
            "Add your key to backend/.env and restart the Flask server."
        )

    system_prompt = f"""
You are an AI Campus Facilities Management Assistant for Universiti Putra Malaysia (UPM).
A mobile hazard scanner has detected a physical safety issue on campus.

DETECTED HAZARD: {hazard_type}
INSTANCE COUNT: {bounding_boxes_count}
DETECTION CONFIDENCE: {confidence:.1f}%

Based solely on this data, generate a concise, practical, and prioritized list
of immediate maintenance actions required to fix or secure this hazard on campus.
Use a professional tone suitable for a facilities report. Keep the response under 200 words.
"""

    try:
        logger.info(
            "Querying Gemini for hazard='%s' count=%s confidence=%.1f%%",
            hazard_type,
            bounding_boxes_count,
            confidence,
        )
        response = genai_model.generate_content(system_prompt)
        return response.text
    except Exception as exc:
        logger.exception("Gemini API call failed: %s", exc)
        error_text = str(exc)
        if "API_KEY_INVALID" in error_text or "API key not valid" in error_text:
            return (
                "Maintenance recommendation unavailable: the Gemini API key in backend/.env "
                "is invalid. Create a new key at https://aistudio.google.com/apikey, "
                "paste it into GEMINI_API_KEY, and restart the server."
            )
        if "404" in error_text and "not found" in error_text.lower():
            return (
                "Maintenance recommendation unavailable: the configured Gemini model "
                f"({GEMINI_MODEL}) is retired or unavailable. Update GEMINI_MODEL in "
                "backend/.env (e.g. gemini-2.5-flash) and restart the server."
            )
        return (
            "Maintenance recommendation is temporarily unavailable. "
            "Check the Flask server logs for details."
        )


@app.route("/detect-hazard", methods=["POST"])
def detect_hazard():
    logger.info("POST /detect-hazard — incoming request received.")

    if "image" not in request.files:
        logger.warning("Request rejected: no 'image' field in multipart form-data.")
        return jsonify({"error": "No image file found in the request"}), 400

    file = request.files["image"]
    if file.filename == "":
        logger.warning("Request rejected: empty filename.")
        return jsonify({"error": "Empty image filename"}), 400

    unique_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}_input.jpg")
    output_path = os.path.join(PROCESSED_FOLDER, f"{unique_id}_annotated.jpg")

    try:
        file.save(input_path)
        logger.info("Image saved to %s — running YOLO inference.", input_path)

        results = model(input_path)
        logger.info("YOLO inference complete. Result set size: %d", len(results))

        if len(results) == 0:
            logger.info("Empty inference array — no result objects returned.")
            return jsonify(
                {
                    "status": "no_detection",
                    "error": "No hazards detected in this image. Try zooming in or retaking the photo.",
                }
            ), 200

        result = results[0]
        top_box, class_name, confidence_pct = get_highest_confidence_detection(result)

        if top_box is None:
            logger.info("Inference returned zero bounding boxes.")
            return jsonify(
                {
                    "status": "no_detection",
                    "error": "No hazards detected in this image. Try zooming in or retaking the photo.",
                }
            ), 200

        num_objects = len(result.boxes)
        logger.info(
            "Top detection: class='%s' confidence=%.1f%% total_boxes=%d",
            class_name,
            confidence_pct,
            num_objects,
        )

        annotated_image_bgr = result.plot()
        cv2.imwrite(output_path, annotated_image_bgr)
        logger.info("Annotated image written to %s", output_path)

        recommendation = get_llm_recommendation(
            hazard_type=class_name,
            bounding_boxes_count=num_objects,
            confidence=confidence_pct,
        )

        with open(output_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode("utf-8")

        logger.info("Response payload assembled — returning success to client.")
        return jsonify(
            {
                "status": "success",
                "annotated_image_base64": encoded_image,
                "final_class": class_name,
                "confidence": f"{confidence_pct:.1f}%",
                "detected_count": num_objects,
                "recommendation": recommendation,
            }
        )

    except Exception as exc:
        logger.exception("Unhandled error during hazard detection: %s", exc)
        return jsonify({"error": f"Server processing error: {exc}"}), 500

    finally:
        for path in (input_path, output_path):
            if os.path.exists(path):
                os.remove(path)
                logger.info("Cleaned up temporary file: %s", path)


if __name__ == "__main__":
    # Windows multiprocessing guard — required when YOLO spawns worker processes.
    logger.info("Starting Flask server on 0.0.0.0:5000 (threaded).")
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)
