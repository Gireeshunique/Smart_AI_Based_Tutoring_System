import { useState } from "react";
import PDFViewer from "./PDFViewer";
import AIVoiceAssistant from "./AIVoiceAssistant";

function App() {
  const [pdfText, setPdfText] = useState("");
  const [words, setWords] = useState([]);
  const [activeWord, setActiveWord] = useState(-1);

  return (
    <>
      <PDFViewer
        setPdfText={setPdfText}
        words={words}
        setWords={setWords}
        activeWord={activeWord}
      />

      <AIVoiceAssistant
        pdfText={pdfText}
        setActiveWord={setActiveWord}
      />
    </>
  );
}

export default App;
