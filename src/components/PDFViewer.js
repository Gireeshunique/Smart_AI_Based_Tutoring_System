import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./PDFViewer.css";

/* ===============================
   TEXT CLEANER
================================ */
const cleanExtractedText = (text) =>
  text
    .replace(/\r?\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/-\s+/g, "")
    .replace(/\f/g, " ")
    .trim();

/* ===============================
   WORD NORMALIZER
================================ */
const normalizeWords = (text) =>
  text
    .replace(/[.,!?;:()"']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");

function PDFViewer({ setPdfText, words, setWords, activeWord }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const wordRefs = useRef([]);
  const prevWordRef = useRef(null);

  /* ========== UPLOAD PDF ========== */
  const uploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsReady(false);
    setWords([]);
    setPdfText("");
    wordRefs.current = [];

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(
      "http://localhost:5000/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setPdfUrl(res.data.pdf_url);

    const rawText = res.data.pages.map((p) => p.text).join(" ");
    const cleanedText = cleanExtractedText(rawText);

    setPdfText(cleanedText);
    setWords(normalizeWords(cleanedText));
    setIsReady(true);
  };

  /* ========== WORD HIGHLIGHT + SCROLL ========== */
  useEffect(() => {
    if (!isReady || activeWord < 0 || activeWord >= words.length) return;

    const el = wordRefs.current[activeWord];
    if (!el) return;

    prevWordRef.current?.classList.remove("word-highlight");
    el.classList.add("word-highlight");
    prevWordRef.current = el;

    el.scrollIntoView({
  behavior: "smooth",
  block: "center",
  inline: "nearest",
});

  }, [activeWord, isReady, words.length]);

  return (
    <div className="pdf-container">
      <h2>📄 AI PDF Reader</h2>

      <input
        type="file"
        accept=".pdf,.docx,.ppt,.pptx"
        onChange={uploadPDF}
      />

      <div className="pdf-inner">
        {pdfUrl ? (
          <iframe src={pdfUrl} title="Preview" className="pdf-frame" />
        ) : (
          <div className="pdf-placeholder">
            Upload a document to preview
          </div>
        )}
      </div>

      {isReady && (
        <div className="pdf-text-outside">
          {words.map((word, i) => (
            <span key={i} ref={(el) => (wordRefs.current[i] = el)}>
              {word}{" "}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default PDFViewer;
