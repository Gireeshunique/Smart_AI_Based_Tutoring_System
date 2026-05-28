from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
import math
import re
from werkzeug.utils import secure_filename
from google.cloud import texttospeech
from file_converter import docx_to_pdf, pptx_to_pdf
from speech import speech_to_text
from ai_engine import explain_pdf
from database import save_pdf, get_all_content
from pdf_utils import extract_text_by_page
import requests
import ollama

OLLAMA_MODEL = "gemma2:2b"

# ------------------------------------------------
# APP SETUP
# ------------------------------------------------
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
AUDIO_DIR = os.path.join(BASE_DIR, "static", "audio")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

sys.path.insert(0, BASE_DIR)

# ------------------------------------------------
# VOICE CONFIG
# Supported gender values: "female" | "male"
# Each entry: (language_code, voice_name, ssml_gender)
# ------------------------------------------------
VOICE_OPTIONS = {
    "female": [
        ("en-IN", "en-IN-Wavenet-A", texttospeech.SsmlVoiceGender.FEMALE),
        ("en-US", "en-US-Wavenet-F", texttospeech.SsmlVoiceGender.FEMALE),
        ("en-GB", "en-GB-Wavenet-A", texttospeech.SsmlVoiceGender.FEMALE),
        ("en-AU", "en-AU-Wavenet-A", texttospeech.SsmlVoiceGender.FEMALE),
    ],
    "male": [
        ("en-IN", "en-IN-Wavenet-B", texttospeech.SsmlVoiceGender.MALE),
        ("en-US", "en-US-Wavenet-D", texttospeech.SsmlVoiceGender.MALE),
        ("en-GB", "en-GB-Wavenet-B", texttospeech.SsmlVoiceGender.MALE),
        ("en-AU", "en-AU-Wavenet-B", texttospeech.SsmlVoiceGender.MALE),
    ],
}

DEFAULT_SPEAKING_RATE = 0.95


def get_tts_voice_params(gender: str):
    """
    Return (VoiceSelectionParams, AudioConfig) for the requested gender.
    Falls back to female if gender not recognised.
    Tries each voice in the list until one succeeds (handles unavailable voices).
    Returns (voice_params, audio_config, error_str | None).
    """
    gender = gender.lower() if gender else "female"
    if gender not in VOICE_OPTIONS:
        gender = "female"

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=DEFAULT_SPEAKING_RATE,
    )

    options = VOICE_OPTIONS[gender]
    for lang_code, voice_name, ssml_gender in options:
        voice = texttospeech.VoiceSelectionParams(
            language_code=lang_code,
            name=voice_name,
            ssml_gender=ssml_gender,
        )
        return voice, audio_config, None  # return first candidate; fallback happens per-sentence

    # Should never reach here
    return None, None, "No voice options configured"


# ------------------------------------------------
# UPLOAD PDF / DOCX / PPTX
# ------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    if not file.filename:
        return jsonify({"error": "Filename is empty"}), 400

    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    allowed_exts = ["pdf", "docx", "ppt", "pptx"]
    if ext not in allowed_exts:
        return jsonify({"error": f"Unsupported file type '.{ext}'. Allowed: PDF, DOCX, PPT, PPTX"}), 400

    upload_path = os.path.join(UPLOAD_DIR, filename)
    file.save(upload_path)

    pdf_path = None

    try:
        if ext == "docx":
            pdf_path = upload_path.replace(".docx", ".pdf")
            docx_to_pdf(upload_path, pdf_path)

        elif ext in ["ppt", "pptx"]:
            pdf_path = upload_path.rsplit(".", 1)[0] + ".pdf"
            pptx_to_pdf(upload_path, pdf_path)

        elif ext == "pdf":
            pdf_path = upload_path

        if not os.path.exists(pdf_path):
            return jsonify({"error": "File conversion failed — PDF not generated"}), 500

        pages = extract_text_by_page(pdf_path)
        if not pages:
            pages = []

        full_text = "\n".join(
            p["text"] for p in pages if p.get("text", "").strip()
        )

        save_pdf(
            filename=os.path.basename(pdf_path),
            full_text=full_text,
        )

        return jsonify({
            "message": "File uploaded successfully",
            "filename": os.path.basename(pdf_path),
            "pdf_url": f"http://localhost:5000/pdf/{os.path.basename(pdf_path)}",
            "pages": pages,
        })

    except Exception as e:
        if upload_path and os.path.exists(upload_path):
            os.remove(upload_path)
        print(f"Error during upload: {e}")
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500


# ------------------------------------------------
# SERVE PDF
# ------------------------------------------------
@app.route("/pdf/<path:filename>")
def serve_pdf(filename):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=False)


# ------------------------------------------------
# GET FULL TEXT
# ------------------------------------------------
@app.route("/get_pdf_text")
def get_pdf_text():
    docs = get_all_content()
    if not docs:
        return jsonify({"text": ""})
    return jsonify({"text": docs[0].get("content", "")})


# ------------------------------------------------
# GET PAGE-WISE TEXT
# ------------------------------------------------
@app.route("/pdf_text_pages")
def get_pdf_text_pages():
    docs = get_all_content()
    if not docs:
        return jsonify([])
    return jsonify(docs[0].get("pages", []))


# ------------------------------------------------
# AI EXPLANATION
# ------------------------------------------------
@app.route("/explain_pdf")
def explain_pdf_api():
    try:
        result = explain_pdf()
        return jsonify({"sentences": result})
    except Exception as e:
        return jsonify({"error": f"Explanation failed: {str(e)}"}), 500


# ------------------------------------------------
# GOOGLE NEURAL TTS  — now accepts ?gender=male|female
# ------------------------------------------------
@app.route("/read_pdf")
def read_pdf():
    # Read gender from query param; default = female
    gender = request.args.get("gender", "female").lower().strip()
    if gender not in ("male", "female"):
        gender = "female"

    docs = get_all_content()
    if not docs:
        return jsonify({"error": "No PDF found"}), 400

    text = docs[0].get("content", "").strip()
    if not text:
        return jsonify({"error": "Document has no readable text"}), 400

    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

    if not sentences:
        return jsonify({"error": "No readable sentences found in document"}), 400

    # Build TTS client once
    try:
        client = texttospeech.TextToSpeechClient()
    except Exception as e:
        return jsonify({"error": f"TTS client init failed: {str(e)}"}), 500

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=DEFAULT_SPEAKING_RATE,
    )

    # Ordered list of (lang_code, voice_name, ssml_gender) to try
    voice_candidates = VOICE_OPTIONS[gender]

    response_data = []

    for i, sentence in enumerate(sentences):
        audio_file = f"sentence_{i}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_file)
        synthesized = False

        for lang_code, voice_name, ssml_gender in voice_candidates:
            try:
                voice = texttospeech.VoiceSelectionParams(
                    language_code=lang_code,
                    name=voice_name,
                    ssml_gender=ssml_gender,
                )
                tts_response = client.synthesize_speech(
                    input=texttospeech.SynthesisInput(text=sentence),
                    voice=voice,
                    audio_config=audio_config,
                )
                with open(audio_path, "wb") as f:
                    f.write(tts_response.audio_content)
                synthesized = True
                break  # success — stop trying fallbacks

            except Exception as e:
                print(f"TTS voice '{voice_name}' failed for sentence {i}: {e}")
                continue  # try next candidate

        if not synthesized:
            print(f"All TTS voices failed for sentence {i}, skipping.")
            continue

        duration = max(1, math.ceil(len(sentence.split()) / 2.2))
        response_data.append({
            "id": i,
            "sentence": sentence,
            "audio": f"/static/audio/{audio_file}",
            "duration": duration,
        })

    if not response_data:
        return jsonify({"error": "TTS generation failed for all sentences"}), 500

    return jsonify(response_data)


# ------------------------------------------------
# SERVE AUDIO
# ------------------------------------------------
@app.route("/static/audio/<path:filename>")
def serve_audio(filename):
    filepath = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "Audio file not found"}), 404
    return send_from_directory(AUDIO_DIR, filename)


# ------------------------------------------------
# SHARED HELPER — Ollama query
# ------------------------------------------------
def query_ollama_model(question: str, context: str, model: str = OLLAMA_MODEL):
    prompt = (
        f"Read the following document carefully and answer the question.\n\n"
        f"Document:\n{context}\n\n"
        f"Question: {question}\n\n"
        f"Instructions:\n"
        f"- Answer in plain sentences only.\n"
        f"- No bullet points, no asterisks, no markdown.\n"
        f"- Write in clear paragraphs.\n"
        f"- Be concise and direct.\n\n"
        f"Answer:"
    )
    try:
        response = ollama.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        answer = response["message"]["content"].strip()
        answer = answer.replace("**", "").replace("*", "").replace("##", "").replace("#", "")
        return answer or "Answer not found in document.", None

    except ollama.ResponseError as e:
        return None, (jsonify({"error": f"Ollama error: {str(e)}"}), 500)

    except Exception as e:
        return None, (jsonify({"error": f"Unexpected error: {str(e)}"}), 500)


# ------------------------------------------------
# COMBINED VOICE + TEXT ROUTE
# ------------------------------------------------
@app.route("/ask", methods=["POST"])
def ask():
    question = None

    # --- VOICE INPUT ---
    if "audio" in request.files:
        audio = request.files.get("audio")
        path = os.path.join(BASE_DIR, "voice.wav")
        audio.save(path)

        try:
            question = speech_to_text(path)
        except Exception as e:
            return jsonify({"error": f"Speech recognition failed: {str(e)}"}), 500

        if not question or not question.strip():
            return jsonify({"error": "Could not transcribe audio. Please speak clearly."}), 400

    # --- TEXT INPUT ---
    else:
        data = request.json
        if not data:
            return jsonify({"error": "Request body must be JSON or audio file"}), 400

        question = data.get("question", "").strip()
        if not question:
            return jsonify({"error": "Question is required"}), 400

    # --- COMMON: GET DOCUMENT & ANSWER ---
    try:
        docs = get_all_content()
        if not docs:
            return jsonify({
                "question": question,
                "error": "No document uploaded. Please upload a PDF first.",
            }), 400

        content = docs[0].get("content", "")
        if not content.strip():
            return jsonify({
                "question": question,
                "error": "Document has no readable content.",
            }), 400

        answer, err = query_ollama_model(question, content[:1500])
        if err:
            return err

        return jsonify({"question": question, "answer": answer})

    except Exception as e:
        print("Error in /ask:", e)
        return jsonify({"error": str(e)}), 500


# ------------------------------------------------
# RUN
# ------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)
