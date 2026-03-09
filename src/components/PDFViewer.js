import { useEffect, useRef, useState, useCallback } from "react";
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
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageBoundaries, setPageBoundaries] = useState([]);
  const [fileName, setFileName] = useState("");

  const wordRefs = useRef([]);
  const fileInputRef = useRef(null);
  const scrollTimerRef = useRef(null);
  // Track last page we set so we don't trigger unnecessary iframe reloads
  const lastPageRef = useRef(1);

  const uploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsReady(false);
    setWords([]);
    setPdfText("");
    wordRefs.current = [];

    // ✅ Reset to page 1 on every new upload
    setCurrentPage(1);
    lastPageRef.current = 1;
    setPageBoundaries([]);
    setPdfUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // ✅ Set URL first, then page = 1 explicitly
      setPdfUrl(res.data.pdf_url);
      setTotalPages(res.data.pages.length);
      setCurrentPage(1);
      lastPageRef.current = 1;

      const pageWordCounts = res.data.pages.map((p) =>
        getWordArray(cleanExtractedText(p.text)).length
      );

      // Build cumulative word boundaries per page
      // boundaries[i] = total word count up to and including page i+1
      let cumulative = 0;
      const boundaries = pageWordCounts.map((count) => {
        cumulative += count;
        return cumulative;
      });

      setPageBoundaries(boundaries);

      const rawText = res.data.pages.map((p) => p.text).join(" ");
      const cleanedText = cleanExtractedText(rawText);

      setPdfText(cleanedText);
      setWords(getWordArray(cleanedText));
      setIsReady(true);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // ✅ FIX: Scroll the text highlight smoothly
  useEffect(() => {
    if (!isReady || activeWord < 0 || activeWord >= words.length) return;

    if (scrollTimerRef.current) {
      cancelAnimationFrame(scrollTimerRef.current);
    }

    scrollTimerRef.current = requestAnimationFrame(() => {
      setTimeout(() => {
        const el = wordRefs.current[activeWord];
        if (!el) return;
        el.getBoundingClientRect(); // force reflow
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    });

    return () => {
      if (scrollTimerRef.current) {
        cancelAnimationFrame(scrollTimerRef.current);
      }
    };
  }, [activeWord, isReady, words.length]);

  // ✅ FIX: Only advance PDF page when AI finishes reading the LAST word of a page
  useEffect(() => {
    if (!isReady || !pageBoundaries.length) return;
    if (activeWord < 0) return;

    // pageBoundaries[i] = total words read after completing page i+1
    // We advance to page N+1 only when activeWord === pageBoundaries[N-1]
    // i.e. the AI just read the very last word of page N
    for (let i = 0; i < pageBoundaries.length - 1; i++) {
      const lastWordOfPage = pageBoundaries[i] - 1;
      if (activeWord === lastWordOfPage) {
        const nextPage = i + 2; // advance to next page
        if (nextPage !== lastPageRef.current) {
          lastPageRef.current = nextPage;
          setCurrentPage(nextPage);
        }
        break;
      }
    }
  }, [activeWord, pageBoundaries, isReady]);

  const setWordRef = useCallback((el, i) => {
    wordRefs.current[i] = el;
  }, []);

  return (
    <div className="pdf-container">
      <h2>📄 AI PDF Reader</h2>

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

      <div className="pdf-inner">
        {pdfUrl ? (
          <iframe
            // ✅ key changes only when page changes → triggers iframe reload to new page
            key={`page-${currentPage}`}
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

      {isReady && totalPages > 0 && (
        <div className="page-badge">
          📖 Page {currentPage} / {totalPages}
        </div>
      )}

      {isReady && (
        <div className="pdf-text-outside">
          {words.map((word, i) => (
            <span
              key={i}
              ref={(el) => setWordRef(el, i)}
              className={i === activeWord ? "word-highlight" : ""}
              data-active={i === activeWord ? "true" : undefined}
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
