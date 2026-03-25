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



import os, requests

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

# ✅ FIX 4: sys.path.append should come BEFORE local imports (moved to top)
sys.path.insert(0, BASE_DIR)


# ------------------------------------------------
# UPLOAD PDF / DOCX / PPTX
# ------------------------------------------------
@app.route("/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    # ✅ FIX 5: Handle empty filename
    if file.filename == "" or file.filename is None:
        return jsonify({"error": "Filename is empty"}), 400

    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    # ✅ FIX 6: Validate extension BEFORE saving to disk
    allowed_exts = ["pdf", "docx", "ppt", "pptx"]
    if ext not in allowed_exts:
        return jsonify({"error": f"Unsupported file type '.{ext}'. Allowed: PDF, DOCX, PPT, PPTX"}), 400

    upload_path = os.path.join(UPLOAD_DIR, filename)
    file.save(upload_path)

    pdf_path = None

    try:
        # -------- CONVERT TO PDF --------
        if ext == "docx":
            pdf_path = upload_path.replace(".docx", ".pdf")
            docx_to_pdf(upload_path, pdf_path)

        elif ext in ["ppt", "pptx"]:
            pdf_path = upload_path.rsplit(".", 1)[0] + ".pdf"
            pptx_to_pdf(upload_path, pdf_path)

        elif ext == "pdf":
            pdf_path = upload_path

        # ✅ FIX 7: Verify converted PDF actually exists before proceeding
        if not os.path.exists(pdf_path):
            return jsonify({"error": "File conversion failed — PDF not generated"}), 500

        # -------- PAGE-WISE TEXT --------
        pages = extract_text_by_page(pdf_path)

        # ✅ FIX 8: Guard against None return from extract_text_by_page
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
            "pages": pages
        })

    except Exception as e:
        # ✅ FIX 9: Clean up uploaded file on error to avoid orphaned files
        if upload_path and os.path.exists(upload_path):
            os.remove(upload_path)
        print(f"Error during upload: {e}")
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500


# ------------------------------------------------
# SERVE PDF
# ------------------------------------------------
@app.route("/pdf/<path:filename>")
def serve_pdf(filename):
    # ✅ FIX 10: Check file exists before serving (prevents 500, gives clean 404)
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
    # ✅ FIX 11: Safe key access — use .get() to avoid KeyError
    return jsonify({"text": docs[0].get("content", "")})


# ------------------------------------------------
# GET PAGE-WISE TEXT
# ------------------------------------------------
@app.route("/pdf_text_pages")
def get_pdf_text_pages():
    docs = get_all_content()
    if not docs:
        return jsonify([])
    # ✅ FIX 12: Safe key access
    return jsonify(docs[0].get("pages", []))


# ------------------------------------------------
# AI EXPLANATION
# ------------------------------------------------
@app.route("/explain_pdf")
def explain_pdf_api():
    # ✅ FIX 13: Wrap in try/except — explain_pdf() can throw if no doc loaded
    try:
        result = explain_pdf()
        return jsonify({"sentences": result})
    except Exception as e:
        return jsonify({"error": f"Explanation failed: {str(e)}"}), 500


# ------------------------------------------------
# GOOGLE NEURAL TTS
# ------------------------------------------------
@app.route("/read_pdf")
def read_pdf():
    docs = get_all_content()
    if not docs:
        return jsonify({"error": "No PDF found"}), 400

    text = docs[0].get("content", "").strip()

    # ✅ FIX 14: Guard against empty content
    if not text:
        return jsonify({"error": "Document has no readable text"}), 400

    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences = [s for s in sentences if len(s.strip()) > 10]

    # ✅ FIX 15: Guard against no sentences found
    if not sentences:
        return jsonify({"error": "No readable sentences found in document"}), 400

    try:
        client = texttospeech.TextToSpeechClient()
    except Exception as e:
        return jsonify({"error": f"TTS client init failed: {str(e)}"}), 500

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-IN",
        name="en-IN-Wavenet-A",
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=0.95
    )

    response_data = []

    for i, sentence in enumerate(sentences):
        # ✅ FIX 16: Wrap each TTS call — one bad sentence shouldn't kill the whole response
        try:
            tts_response = client.synthesize_speech(
                input=texttospeech.SynthesisInput(text=sentence),
                voice=voice,
                audio_config=audio_config
            )

            audio_file = f"sentence_{i}.mp3"
            audio_path = os.path.join(AUDIO_DIR, audio_file)

            with open(audio_path, "wb") as f:
                f.write(tts_response.audio_content)

            duration = max(1, math.ceil(len(sentence.split()) / 2.2))

            response_data.append({
                "id": i,
                "sentence": sentence,
                "audio": f"/static/audio/{audio_file}",
                "duration": duration
            })

        except Exception as e:
            print(f"TTS failed for sentence {i}: {e}")
            # Skip failed sentence, continue with rest
            continue

    if not response_data:
        return jsonify({"error": "TTS generation failed for all sentences"}), 500

    return jsonify(response_data)


# ------------------------------------------------
# SERVE AUDIO
# ------------------------------------------------
@app.route("/static/audio/<path:filename>")
def serve_audio(filename):
    # ✅ FIX 17: Check file exists before serving
    filepath = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "Audio file not found"}), 404
    return send_from_directory(AUDIO_DIR, filename)



# ------------------------------------------------
# SHARED HELPER
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
            messages=[{"role": "user", "content": prompt}]
        )
        answer = response["message"]["content"].strip()

        # Strip any remaining markdown symbols
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
                "error": "No document uploaded. Please upload a PDF first."
            }), 400

        content = docs[0].get("content", "")
        if not content.strip():
            return jsonify({
                "question": question,
                "error": "Document has no readable content."
            }), 400

        answer, err = query_ollama_model(question, content[:1500])
        if err:
            return err

        return jsonify({
            "question": question,
            "answer": answer
        })

    except Exception as e:
        print("Error in /ask:", e)
        return jsonify({"error": str(e)}), 500
    

# ------------------------------------------------
# RUN
# ------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)