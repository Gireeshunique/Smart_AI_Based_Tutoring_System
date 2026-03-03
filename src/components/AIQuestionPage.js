import { useState } from "react";
import axios from "axios";
import "./AIQuestionPage.css";

function AIQuestionPage({ pdfText }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);

  /* ===============================
     VOICE INPUT
  ================================= */
  const startVoiceInput = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };
  };

  /* ===============================
     ASK QUESTION
  ================================= */
  const askQuestion = async () => {
    try {
      const res = await axios.post("http://localhost:5000/ask", {
        question,
        context: pdfText,
      });

      setAnswer(res.data.answer);

      // 🔥 SPEAK ANSWER
      const utterance = new SpeechSynthesisUtterance(res.data.answer);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="qa-container">
      <div className="ai-icon">🤖</div>

      <h2>Ask Questions From Uploaded PDF</h2>

      <div className="qa-input">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something about the document..."
        />

        <button onClick={startVoiceInput}>
          🎤 {isListening ? "Listening..." : "Voice"}
        </button>

        <button onClick={askQuestion}>
          Ask
        </button>
      </div>

      {answer && (
        <div className="qa-answer">
          <h3>AI Answer:</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default AIQuestionPage;