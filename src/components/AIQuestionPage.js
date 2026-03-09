import { useState } from "react";
import axios from "axios";
import "./AIQuestionPage.css";

function AIQuestionPage({ pdfText }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const TIPS = [
    "Summarize this document",
    "What are the key points?",
    "Explain in simple terms",
    "Give me 5 quiz questions",
  ];

  /* ===============================
     VOICE INPUT
  ================================= */
  const startVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Voice input is not supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setIsListening(true);
    setError("");

    recognition.onresult = (event) => {
      setQuestion(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      setError("Voice input failed: " + event.error);
      setIsListening(false);
    };
  };

  /* ===============================
     SPEAK ANSWER
  ================================= */
  const speakAnswer = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  /* ===============================
     ASK QUESTION (with 503 retry)
  ================================= */
  const askQuestion = async (retryAfter = 0) => {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setError("");
    setAnswer("");

    if (retryAfter > 0) {
      setAnswer(`⏳ Model is loading, retrying in ${retryAfter} seconds...`);
      await new Promise((res) => setTimeout(res, retryAfter * 1000));
    }

    setIsLoading(true);
    setAnswer("");

    try {
      const res = await axios.post("http://localhost:5000/ask", {
        question :question
        
      });

      const aiAnswer = res.data.answer;
      setAnswer(aiAnswer);
      speakAnswer(aiAnswer);

    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.error || "Something went wrong.";

      if (status === 503) {
        const wait = Math.ceil(err.response?.data?.estimated_time || 20);
        askQuestion(wait);
        return;
      }

      setError(status === 429
        ? "⚠️ Rate limit hit. Please wait a moment and try again."
        : `❌ Error: ${message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ===============================
     RENDER
  ================================= */
  return (
    <div className="qa-container">

      {/* Header */}
      <div className="ai-icon">🤖</div>
      <div className="qa-badge">✨ AI Study Assistant</div>
      <h2>Ask Questions From Your PDF</h2>
      <p className="qa-subtitle">Upload your notes and get instant answers 🎓</p>

      {/* Quick tip chips */}
      <div className="qa-tips">
        {TIPS.map((tip) => (
          <span
            key={tip}
            className="qa-tip"
            onClick={() => { setQuestion(tip); setError(""); }}
          >
            {tip}
          </span>
        ))}
      </div>

      {/* Input card */}
      <div className="qa-input-card">
        <div className="qa-input">
          <input
            type="text"
            value={question}
            onChange={(e) => { setQuestion(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && askQuestion()}
            placeholder="Ask something about the document..."
            disabled={isLoading}
            maxLength={300}
          />
          <button onClick={startVoiceInput} disabled={isListening || isLoading}>
            🎤 {isListening ? "Listening..." : "Voice"}
          </button>
          <button
            className="btn-ask"
            onClick={() => askQuestion()}
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? "..." : "Ask"}
          </button>
        </div>

        {/* Character counter */}
        <div className={`qa-char-count ${question.length > 250 ? "warn" : ""}`}>
          {question.length}/300
        </div>
      </div>

      {/* Loading dots */}
      {isLoading && (
        <div className="qa-loading">
          <div className="qa-dots">
            <span /><span /><span />
          </div>
          Thinking...
        </div>
      )}

      {/* Error */}
      {error && <div className="qa-error">⚠️ {error}</div>}

      {/* Answer */}
      {answer && (
        <div className="qa-answer">
          <div className="qa-answer-header">
            <h3>💡 Answer</h3>
            <button
              className={`speak-btn ${isSpeaking ? "active" : ""}`}
              onClick={isSpeaking ? stopSpeaking : () => speakAnswer(answer)}
            >
              {isSpeaking ? "🔇 Stop" : "🔊 Speak"}
            </button>
          </div>
          <p>{answer}</p>
        </div>
      )}

    </div>
  );
}

export default AIQuestionPage;