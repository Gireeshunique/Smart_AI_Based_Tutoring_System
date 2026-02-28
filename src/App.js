import { useState } from "react";
import PDFViewer from "./components/PDFViewer";
import AIVoiceAssistant from "./components/AIVoiceAssistant";

function App() {
  const [pdfText, setPdfText] = useState("");
  const [words, setWords] = useState([]);
  const [activeWord, setActiveWord] = useState(-1);
  
  return (
    <><div className="app-layout">
      <PDFViewer
        setPdfText={setPdfText}
        words={words}
        setWords={setWords}
        activeWord={activeWord}
      />
      <AIVoiceAssistant
        pdfText={pdfText}
        setActiveWord={setActiveWord}
      /></div>
    </>
  );
}

export default App;
