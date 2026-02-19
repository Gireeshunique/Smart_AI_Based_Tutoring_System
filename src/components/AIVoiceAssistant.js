import { useRef, useState } from "react";
import "./AIVoiceAssistant.css";

/* ===============================
   WORD NORMALIZER (MUST MATCH UI)
================================ */
const normalizeWords = (text) =>
  text
    .replace(/[.,!?;:()"']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");

/* ===============================
   WORD → CHAR MAP
================================ */
const buildWordCharMap = (text) => {
  const words = normalizeWords(text);
  let charIndex = 0;

  return words.map((word) => {
    const start = text.indexOf(word, charIndex);
    charIndex = start + word.length;
    return { start };
  });
};

function AIVoiceAssistant({ pdfText, setActiveWord }) {
  const [voiceType, setVoiceType] = useState("female");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentWordIndexRef = useRef(0);
  const wordCharMapRef = useRef([]);

  /* ---------- WAIT FOR VOICES ---------- */
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

  /* ---------- SPEAK FROM INDEX ---------- */
  const speakFromIndex = async (startIndex) => {
    if (!pdfText) return;

    speechSynthesis.cancel();

    const voices = await waitForVoices();
    const utterance = new SpeechSynthesisUtterance(pdfText);

    utterance.voice = getVoice(voices);
    utterance.rate = 1;
    utterance.pitch = 1;

    wordCharMapRef.current = buildWordCharMap(pdfText);
    currentWordIndexRef.current = startIndex;

   utterance.onboundary = (event) => {
  const charPos = event.charIndex || 0;

  const index = wordCharMapRef.current.findIndex(
    (w, i) =>
      charPos >= w.start &&
      (i === wordCharMapRef.current.length - 1 ||
        charPos < wordCharMapRef.current[i + 1].start)
  );

  if (index !== -1) {
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

  /* ⏸ PAUSE (CANCEL + SAVE POSITION) */
  const pauseReading = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(true);
  };

  /* ▶ RESUME (RESTART FROM WORD) */
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
