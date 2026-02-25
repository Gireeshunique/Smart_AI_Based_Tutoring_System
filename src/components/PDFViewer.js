import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./PDFViewer.css";

/* ===============================
   TEXT CLEANER
================================ */
const cleanExtractedText = (text) => {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/\f/g, " ")
    .replace(/-\s*\n\s*/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s([.,!?;:])/g, "$1")
    .trim();
};

/* ===============================
   SHARED WORD EXTRACTOR
   (IMPORTANT - MUST MATCH AI FILE)
================================ */
const getWordArray = (text) => {
  if (!text || typeof text !== "string") return [];

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/);
};

function PDFViewer({ setPdfText, words, setWords, activeWord }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const wordRefs = useRef([]);

  /* ===============================
     UPLOAD PDF
  ================================= */
  const uploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsReady(false);
    setWords([]);
    setPdfText("");
    wordRefs.current = [];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setPdfUrl(res.data.pdf_url);

      const rawText = res.data.pages.map((p) => p.text).join(" ");
      const cleanedText = cleanExtractedText(rawText);

      setPdfText(cleanedText);
      setWords(getWordArray(cleanedText));
      setIsReady(true);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  /* ===============================
     AUTO SCROLL TO ACTIVE WORD
  ================================= */
  useEffect(() => {
    if (!isReady) return;
    if (activeWord < 0 || activeWord >= words.length) return;

    const el = wordRefs.current[activeWord];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
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
            <span
              key={i}
              ref={(el) => (wordRefs.current[i] = el)}
              className={i === activeWord ? "word-highlight" : ""}
            >
              {word}{" "}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default PDFViewer;