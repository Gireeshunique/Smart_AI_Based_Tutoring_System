import { useRef, useState } from "react";
import "./AIVoiceAssistant.css";


const getWordArray = (text) => {
  if (!text || typeof text !== "string") return [];
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim().split(/\s+/);
};

function AIVoiceAssistant({ pdfText, setActiveWord, onComplete }) {
  const [voiceType, setVoiceType]   = useState("female");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);
  const [avatarSrc,  setAvatarSrc]  = useState(
    "https://api.dicebear.com/7.x/fun-emoji/png?seed=voice&backgroundColor=7c3aed"
  );

  const currentWordIndexRef = useRef(0);
  const avatarInputRef      = useRef(null);

  /* ── AVATAR UPLOAD ── */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarSrc(url);
  };

  /* ── VOICE HELPERS ── */
  const waitForVoices = () =>
    new Promise((resolve) => {
      const v = speechSynthesis.getVoices();
      if (v.length) resolve(v);
      speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    });

  const getVoice = (voices) =>
    voices.find((v) =>
      voiceType === "female"
        ? v.name.toLowerCase().includes("female")
        : v.name.toLowerCase().includes("male")
    ) || voices[0];

  /* ── SPEAK ── */
  const speakFromIndex = async (startIndex) => {
    if (!pdfText) return;
    speechSynthesis.cancel();
    const voices        = await waitForVoices();
    const allWords      = getWordArray(pdfText);
    const remainingText = allWords.slice(startIndex).join(" ");
    const utterance     = new SpeechSynthesisUtterance(remainingText);
    utterance.voice     = getVoice(voices);
    utterance.rate      = 0.85;
    utterance.pitch     = 1;

    utterance.onboundary = (e) => {
      if (typeof e.charIndex === "number") {
        const spoken = getWordArray(remainingText.substring(0, e.charIndex));
        const idx    = startIndex + spoken.length;
        currentWordIndexRef.current = idx;
        setActiveWord(idx);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveWord(-1);
      currentWordIndexRef.current = 0;
      if (onComplete) onComplete();
    };

    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const startReading  = () => {
    currentWordIndexRef.current = 0;
    setActiveWord(-1);
    setIsPaused(false);
    speakFromIndex(0);
  };
  const pauseReading  = () => { speechSynthesis.cancel(); setIsSpeaking(false); setIsPaused(true); };
  const resumeReading = () => { setIsPaused(false); speakFromIndex(currentWordIndexRef.current); };
  const stopReading   = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveWord(-1);
    currentWordIndexRef.current = 0;
  };

  const statusText  = isSpeaking ? "Reading aloud" : isPaused ? "Paused" : pdfText ? "Ready" : "No document";
  const statusClass = isSpeaking ? "speaking" : isPaused ? "paused" : "";

  return (
    <div className="ai-panel">
      <p className="ai-panel-title">🎙 Voice Reader</p>
      <div className="ai-divider" />

      {/* ── AVATAR + WAVE ── */}
      <div className="avatar-section">

        {/* Avatar with click-to-upload */}
        <div
          className={`avatar-img-wrapper ${isSpeaking ? "is-speaking" : ""}`}
          onClick={() => avatarInputRef.current?.click()}
          title="Click to change avatar"
        >
          <img
            src={avatarSrc}
            alt="AI Assistant"
            className="avatar-img"
          />
          {/* camera overlay icon */}
          <div className="avatar-upload-overlay">
            <span>📷</span>
          </div>
        </div>

        {/* hidden file input — accepts png, jpg, jpeg */}
        <input
          type="file"
          accept="image/png, image/jpg, image/jpeg"
          ref={avatarInputRef}
          onChange={handleAvatarChange}
          style={{ display: "none" }}
        />

        <p className="avatar-hint">Click image to change</p>

        {/* 9-bar audio wave */}
        <div className={`audio-wave ${isSpeaking ? "active" : ""}`}>
          <span /><span /><span /><span /><span />
          <span /><span /><span /><span />
        </div>

        <p className={`status-label ${statusClass}`}>{statusText}</p>
      </div>

      <div className="ai-divider" />

      {/* Voice selector — no emojis */}
      <select
        value={voiceType}
        onChange={(e) => setVoiceType(e.target.value)}
        disabled={isSpeaking}
      >
        <option value="female">Female Voice</option>
        <option value="male">Male Voice</option>
      </select>

      {/* Control buttons */}
      <div className="btn-group">
        <button className="btn-start"  onClick={startReading}  disabled={!pdfText || isSpeaking}>▶ Start</button>
        <button className="btn-pause"  onClick={pauseReading}  disabled={!isSpeaking}>⏸ Pause</button>
        <button className="btn-resume" onClick={resumeReading} disabled={!isPaused}>↩ Resume</button>
        <button className="btn-stop"   onClick={stopReading}   disabled={!isSpeaking && !isPaused}>⏹ Stop</button>
      </div>

      {/* Tips */}
      <div className="tips-card">
        <strong>How to use</strong>
        Upload a PDF or DOCX, press Start. Each word highlights as it is read aloud.
      </div>
    </div>
  );
}

export default AIVoiceAssistant;