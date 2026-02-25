import { useRef, useState } from "react";
import "./AIVoiceAssistant.css";

/* ===============================
   SAME WORD EXTRACTOR
   (MUST MATCH PDF FILE)
================================ */
const getWordArray = (text) => {
  if (!text || typeof text !== "string") return [];

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/);
};

function AIVoiceAssistant({ pdfText, setActiveWord }) {
  const [voiceType, setVoiceType] = useState("female");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentWordIndexRef = useRef(0);

  const waitForVoices = () =>
    new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length) resolve(voices);
      speechSynthesis.onvoiceschanged = () =>
        resolve(speechSynthesis.getVoices());
    });

  const getVoice = (voices) =>
    voices.find((v) =>
      voiceType === "female"
        ? v.name.toLowerCase().includes("female")
        : v.name.toLowerCase().includes("male")
    ) || voices[0];

  /* ===============================
     SPEAK FUNCTION
  ================================= */
const speakFromIndex = async (startIndex) => {
  if (!pdfText) return;

  speechSynthesis.cancel();

  const voices = await waitForVoices();

  // 🔥 Split full words
  const allWords = getWordArray(pdfText);

  // 🔥 Get remaining words from paused index
  const remainingWords = allWords.slice(startIndex);

  const remainingText = remainingWords.join(" ");

  const utterance = new SpeechSynthesisUtterance(remainingText);

  utterance.voice = getVoice(voices);
  utterance.rate = 0.85;
  utterance.pitch = 1;

  utterance.onboundary = (event) => {
    if (typeof event.charIndex === "number") {

      const spokenText = remainingText.substring(0, event.charIndex);

      const spokenWords = getWordArray(spokenText);

      const index = startIndex + spokenWords.length;

      currentWordIndexRef.current = index;
      setActiveWord(index);
    }
  };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveWord(-1);
      currentWordIndexRef.current = 0;
    };

    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  /* ▶ START */
  const startReading = () => {
    currentWordIndexRef.current = 0;
    setActiveWord(-1);
    setIsPaused(false);
    speakFromIndex(0);
  };

  /* ⏸ PAUSE */
  const pauseReading = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(true);
  };

  /* ▶ RESUME */
  const resumeReading = () => {
    setIsPaused(false);
    speakFromIndex(currentWordIndexRef.current);
  };

  /* ⏹ STOP */
  const stopReading = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveWord(-1);
    currentWordIndexRef.current = 0;
  };

  return (
    <div className="ai-panel">
      <select
        value={voiceType}
        onChange={(e) => setVoiceType(e.target.value)}
        disabled={isSpeaking}
      >
        <option value="female">Female Voice</option>
        <option value="male">Male Voice</option>
      </select>

      <button onClick={startReading} disabled={!pdfText || isSpeaking}>
        ▶ Start
      </button>

      <button onClick={pauseReading} disabled={!isSpeaking}>
        ⏸ Pause
      </button>

      <button onClick={resumeReading} disabled={!isPaused}>
        ▶ Resume
      </button>

      <button onClick={stopReading} disabled={!isSpeaking && !isPaused}>
        ⏹ Stop
      </button>
    </div>
  );
}

export default AIVoiceAssistant;