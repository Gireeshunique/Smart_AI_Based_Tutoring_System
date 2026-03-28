import { useRef, useState, useCallback } from "react";
import "./AIVoiceAssistant.css";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const getWordArray = (text) => {
  if (!text || typeof text !== "string") return [];
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim().split(/\s+/);
};

const pickVoice = (voices, voiceType) => {
  const lower = (v) => v.name.toLowerCase();

  const FEMALE_NAMES =
    /\b(zira|samantha|victoria|karen|moira|fiona|tessa|ava|siri|female|woman|google uk english female|google us english)\b/i;
  const MALE_NAMES =
    /\b(david|mark|daniel|alex|fred|bruce|junior|rishi|google uk english male|google us english male)\b/i;

  const enVoices = voices.filter((v) => v.lang && v.lang.startsWith("en"));
  const pool     = enVoices.length ? enVoices : voices;

  if (voiceType === "female") {
    return (
      pool.find((v) => lower(v).includes("female")) ||
      pool.find((v) => FEMALE_NAMES.test(v.name)) ||
      pool.find((v) => v.gender === "female") ||
      pool[0] ||
      voices[0]
    );
  }

  return (
    pool.find((v) => lower(v).includes("male") && !lower(v).includes("female")) ||
    pool.find((v) => MALE_NAMES.test(v.name)) ||
    pool.find((v) => v.gender === "male") ||
    pool.find((v) => {
      const femaleVoice =
        pool.find((u) => lower(u).includes("female")) ||
        pool.find((u) => FEMALE_NAMES.test(u.name));
      return femaleVoice ? v.name !== femaleVoice.name : true;
    }) ||
    pool[1] ||
    pool[0] ||
    voices[0]
  );
};

const waitForVoices = () =>
  new Promise((resolve) => {
    const v = window.speechSynthesis.getVoices();
    if (v.length) return resolve(v);
    window.speechSynthesis.onvoiceschanged = () =>
      resolve(window.speechSynthesis.getVoices());
  });

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

function AIVoiceAssistant({ pdfText, setActiveWord, onComplete }) {
  const [voiceType,  setVoiceType]  = useState("female");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);
  const [avatarSrc,  setAvatarSrc]  = useState(
    "https://api.dicebear.com/7.x/fun-emoji/png?seed=voice&backgroundColor=7c3aed"
  );

  const currentWordIndexRef = useRef(0);
  const avatarInputRef      = useRef(null);
  const voiceTypeRef        = useRef(voiceType);

  // ── VOICE TYPE CHANGE ──────────────────────
  // Changing voice while active: cancel fully and reset.
  // Native pause/resume don't survive a voice swap.
  const handleVoiceTypeChange = (newType) => {
    voiceTypeRef.current = newType;
    setVoiceType(newType);

    if (isSpeaking || isPaused) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveWord(-1);
      currentWordIndexRef.current = 0;
    }
  };

  // ── AVATAR UPLOAD ──────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarSrc(URL.createObjectURL(file));
  };

  // ── SPEAK ──────────────────────────────────
  const speakFromIndex = useCallback(
    async (startIndex) => {
      if (!pdfText) return;

      // Always cancel any existing speech before starting fresh
      window.speechSynthesis.cancel();

      const voices      = await waitForVoices();
      const chosenVoice = pickVoice(voices, voiceTypeRef.current);

      const allWords      = getWordArray(pdfText);
      const remainingText = allWords.slice(startIndex).join(" ");

      const utterance = new SpeechSynthesisUtterance(remainingText);
      utterance.voice = chosenVoice;
      utterance.rate  = 0.85;
      utterance.pitch = 1;
      utterance.lang  = chosenVoice?.lang || "en-US";

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

      utterance.onerror = (e) => {
        // "interrupted" fires when we call cancel() intentionally — not a real error
        if (e.error === "interrupted") return;
        console.error("SpeechSynthesis error:", e.error);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
    },
    [pdfText, setActiveWord, onComplete]
  );

  // ── CONTROLS ───────────────────────────────

  const startReading = () => {
    currentWordIndexRef.current = 0;
    setActiveWord(-1);
    speakFromIndex(0);
  };

  /**
   * PAUSE — use native pause(), NOT cancel().
   * cancel() destroys the utterance; pause() suspends it in place.
   */
  const pauseReading = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
      setIsPaused(true);
    }
  };

  /**
   * RESUME — use native resume() to continue the suspended utterance.
   * Falls back to speakFromIndex if the browser dropped the utterance
   * (some mobile browsers clear it after a few seconds of pause).
   */
  const resumeReading = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
      setIsPaused(false);
    } else {
      // Fallback: browser dropped the paused utterance — restart from last known word
      speakFromIndex(currentWordIndexRef.current);
    }
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveWord(-1);
    currentWordIndexRef.current = 0;
  };

  // ── RENDER ─────────────────────────────────

  const statusText  = isSpeaking ? "Reading aloud" : isPaused ? "Paused" : pdfText ? "Ready" : "No document";
  const statusClass = isSpeaking ? "speaking" : isPaused ? "paused" : "";

  return (
    <div className="ai-panel">
      <p className="ai-panel-title">🎙 Voice Reader</p>
      <div className="ai-divider" />

      {/* AVATAR + WAVE */}
      <div className="avatar-section">
        <div
          className={`avatar-img-wrapper ${isSpeaking ? "is-speaking" : ""}`}
          onClick={() => avatarInputRef.current?.click()}
          title="Click to change avatar"
        >
          <img src={avatarSrc} alt="AI Assistant" className="avatar-img" />
          <div className="avatar-upload-overlay">
            <span>📷</span>
          </div>
        </div>

        <input
          type="file"
          accept="image/png, image/jpg, image/jpeg"
          ref={avatarInputRef}
          onChange={handleAvatarChange}
          style={{ display: "none" }}
        />

        <p className="avatar-hint">Click image to change</p>

        <div className={`audio-wave ${isSpeaking ? "active" : ""}`}>
          <span /><span /><span /><span /><span />
          <span /><span /><span /><span />
        </div>

        <p className={`status-label ${statusClass}`}>{statusText}</p>
      </div>

      <div className="ai-divider" />

      {/* VOICE SELECTOR */}
      <select
        value={voiceType}
        onChange={(e) => handleVoiceTypeChange(e.target.value)}
      >
        <option value="female">Female Voice</option>
        <option value="male">Male Voice</option>
      </select>

      {/* CONTROL BUTTONS */}
      <div className="btn-group">
        <button
          className="btn-start"
          onClick={startReading}
          disabled={!pdfText || isSpeaking}
        >
          ▶ Start
        </button>
        <button
          className="btn-pause"
          onClick={pauseReading}
          disabled={!isSpeaking}
        >
          ⏸ Pause
        </button>
        <button
          className="btn-resume"
          onClick={resumeReading}
          disabled={!isPaused}
        >
          ↩ Resume
        </button>
        <button
          className="btn-stop"
          onClick={stopReading}
          disabled={!isSpeaking && !isPaused}
        >
          ⏹ Stop
        </button>
      </div>

      {/* TIPS */}
      <div className="tips-card">
        <strong>How to use</strong>
        Upload a PDF or DOCX, press Start. Each word highlights as it is read aloud.
        Switch voice at any time — playback resets with the new voice.
      </div>
    </div>
  );
}

export default AIVoiceAssistant;
