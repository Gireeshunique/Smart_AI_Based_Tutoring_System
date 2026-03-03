import { useState } from "react";
import PDFViewer from "./components/PDFViewer";
import AIVoiceAssistant from "./components/AIVoiceAssistant";
import AIQuestionPage from "./components/AIQuestionPage";

function App() {
  const [pdfText, setPdfText] = useState("");
  const [words, setWords] = useState([]);
  const [activeWord, setActiveWord] = useState(-1);

  const [showQA, setShowQA] = useState(false); // 🔥 Controls interface switching

  return (
    <>
      {!showQA ? (
        <div className="app-layout">
          <PDFViewer
            setPdfText={setPdfText}
            words={words}
            setWords={setWords}
            activeWord={activeWord}
          />

          <AIVoiceAssistant
            pdfText={pdfText}
            setActiveWord={setActiveWord}
            onComplete={() => setShowQA(true)}   // 🔥 Switch page when reading ends
          />
        </div>
      ) : (
        <AIQuestionPage pdfText={pdfText} />
      )}
    </>
  );
}

export default App;