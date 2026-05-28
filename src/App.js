import { useState } from "react";
import PDFViewer from "./components/PDFViewer";
import AIVoiceAssistant from "./components/AIVoiceAssistant";
import AIQuestionPage from "./components/AIQuestionPage";
import LoginPage from "./components/LoginPage"; // 👈 import your login page

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [words, setWords] = useState([]);
  const [activeWord, setActiveWord] = useState(-1);
  const [showQA, setShowQA] = useState(false);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

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
            onComplete={() => setShowQA(true)}
          />
        </div>
      ) : (
        <AIQuestionPage pdfText={pdfText} />
      )}
    </>
  );
}

export default App;
