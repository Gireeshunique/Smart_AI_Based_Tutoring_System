import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./PDFViewer.css";

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

const getWordArray = (text) => {
  if (!text || typeof text !== "string") return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/);
};

function PDFViewer({ setPdfText, words, setWords, activeWord }) {
  const [pdfUrl, setPdfUrl]                 = useState(null);
  const [isReady, setIsReady]               = useState(false);
  const [currentPage, setCurrentPage]       = useState(1);
  const [totalPages, setTotalPages]         = useState(0);
  const [pageBoundaries, setPageBoundaries] = useState([]);
  const [fileName, setFileName]             = useState("");

  const fileInputRef  = useRef(null);
  const scrollBoxRef  = useRef(null);
  const activeSpanRef = useRef(null);

  /* ── UPLOAD ── */
  const uploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsReady(false);
    setWords([]);
    setPdfText("");
    setCurrentPage(1);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPdfUrl(res.data.pdf_url);
      setTotalPages(res.data.pages.length);

      const pageWordCounts = res.data.pages.map((p) =>
        getWordArray(cleanExtractedText(p.text)).length
      );

      let cumulative = 0;
      const boundaries = pageWordCounts.map((count) => {
        cumulative += count;
        return cumulative;
      });

      setPageBoundaries(boundaries);

      const rawText     = res.data.pages.map((p) => p.text).join(" ");
      const cleanedText = cleanExtractedText(rawText);

      setPdfText(cleanedText);
      setWords(getWordArray(cleanedText));
      setIsReady(true);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  /* ── AUTOSCROLL ── */
  useEffect(() => {
    if (!isReady || activeWord < 0 || activeWord >= words.length) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = scrollBoxRef.current;
        const el        = activeSpanRef.current;
        if (!container || !el) return;

        const containerRect = container.getBoundingClientRect();
        const elRect        = el.getBoundingClientRect();
        const target        = container.scrollTop
                            + (elRect.top - containerRect.top)
                            - container.clientHeight / 2
                            + el.offsetHeight / 2;

        container.scrollTo({ top: target, behavior: "smooth" });
      });
    });
  }, [activeWord, isReady, words.length]);

  /* ── PAGE TRACKING ── */
  useEffect(() => {
    if (!isReady || !pageBoundaries.length) return;
    const pageIndex = pageBoundaries.findIndex((b) => activeWord < b);
    if (pageIndex !== -1) {
      const newPage = pageIndex + 1;
      if (newPage !== currentPage) setCurrentPage(newPage);
    }
  }, [activeWord, pageBoundaries, isReady, currentPage]);

  return (
    <div className="pdf-container">
      <h2>📄 AI PDF Reader</h2>

      {/* UPLOAD ROW */}
      <div className="file-upload-wrapper">
        <label
          className="file-upload-label"
          onClick={() => fileInputRef.current?.click()}
        >
          📂 Choose File
        </label>
        <input
          type="file"
          accept=".pdf,.docx,.ppt,.pptx"
          onChange={uploadPDF}
          ref={fileInputRef}
        />
        {fileName && (
          <span className="file-name-badge" title={fileName}>
            📎 {fileName}
          </span>
        )}
      </div>

      {/* PDF PREVIEW */}
      <div className="pdf-inner">
        {pdfUrl ? (
          <iframe
            key={currentPage}
            src={`${pdfUrl}#page=${currentPage}`}
            title="Preview"
            className="pdf-frame"
          />
        ) : (
          <div className="pdf-placeholder">
            <div className="placeholder-icon">📑</div>
            <p>Upload a document to preview</p>
          </div>
        )}
      </div>

      {/* PAGE BADGE */}
      {isReady && totalPages > 0 && (
        <div className="page-badge">
          📖 Page {currentPage} / {totalPages}
        </div>
      )}

      {/* WORD TEXT */}
      {isReady && (
        <div className="pdf-text-outside" ref={scrollBoxRef}>
          {words.map((word, i) => {
            const isActive = i === activeWord;
            return (
              <span
                key={`${i}-${activeWord}`}
                ref={isActive ? activeSpanRef : null}
                className={isActive ? "word-active" : "word-inactive"}
              >
                {word}{" "}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PDFViewer;