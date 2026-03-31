import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --purple:       #7c3aed;
    --purple-dark:  #6d28d9;
    --purple-light: #a78bfa;
    --purple-pale:  #ddd6fe;
    --pink:         #ec4899;
    --rose:         #f43f5e;
    --text:         #1a1a2e;
    --muted:        #6b7280;
    --error:        #e07070;
    --white85:      rgba(255,255,255,0.85);
    --surface:      rgba(255,255,255,0.75);
  }

  body {
    font-family: "Poppins", sans-serif;
    background: linear-gradient(135deg,
      #d4f5e9 0%, #e8f5f0 15%, #f0f4ff 35%,
      #ede9fe 60%, #e0f0ff 80%, #d4eeff 100%
    );
    background-size: 400% 400%;
    animation: bg-shift 12s ease infinite;
    min-height: 100vh;
    color: var(--text);
  }

  @keyframes bg-shift {
    0%   { background-position: 0% 50%;   }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%;   }
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  @keyframes slide-down {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0);     }
  }

  @keyframes pop-in {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1);   }
  }

  @keyframes shimmer {
    0%   { left: -100%; }
    60%  { left: 150%;  }
    100% { left: 150%;  }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg);      }
    33%       { transform: translateY(-12px) rotate(-3deg); }
    66%       { transform: translateY(-6px)  rotate(3deg);  }
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .scene {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
  }

  /* TOP RAINBOW BAR */
  .scene::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--purple), var(--purple-light), var(--pink), var(--rose));
    z-index: 10;
  }

  /* LEFT PANEL */
  .left {
    position: relative;
    display: flex; align-items: center; justify-content: center;
    padding: 60px; overflow: hidden;
    background: rgba(255,255,255,0.25);
    backdrop-filter: blur(10px);
    animation: fade-in 0.6s ease both;
  }

  .left::after {
    content: '';
    position: absolute; top: 0; right: 0;
    width: 1px; height: 100%;
    background: linear-gradient(to bottom, transparent, rgba(221,214,254,0.6), transparent);
  }

  .grid-lines {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .brand {
    position: relative; z-index: 2;
    text-align: center;
    animation: fade-in 0.8s ease 0.2s both;
  }

  .brand-symbol {
    width: 80px; height: 80px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, var(--purple), var(--purple-dark));
    border-radius: 24px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 36px rgba(109,40,217,0.35);
    font-size: 2.2rem;
    animation: float 4s ease-in-out infinite;
  }

  .brand-name {
    font-size: 2.2rem; font-weight: 800;
    color: var(--text); letter-spacing: -1px;
    margin-bottom: 6px;
    animation: slide-down 0.5s ease both;
  }

  .brand-name span {
    background: linear-gradient(135deg, var(--purple), var(--pink));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .brand-tagline {
    font-size: 0.7rem; font-weight: 500;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--purple); margin-bottom: 28px;
  }

  .brand-divider {
    width: 48px; height: 3px;
    background: linear-gradient(90deg, var(--purple), var(--pink));
    border-radius: 999px; margin: 0 auto 22px;
  }

  .brand-quote {
    font-size: 0.88rem; font-weight: 400;
    color: var(--muted); max-width: 290px;
    line-height: 1.8; margin-bottom: 28px;
  }

  /* Stats */
  .stat-row {
    display: flex; gap: 10px;
    justify-content: center; margin-bottom: 24px;
  }

  .stat-card {
    background: var(--white85);
    backdrop-filter: blur(6px);
    border: 1.5px solid var(--purple-pale);
    border-radius: 14px; padding: 11px 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(109,40,217,0.08);
    animation: pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .stat-card:nth-child(2) { animation-delay: 0.08s; }
  .stat-card:nth-child(3) { animation-delay: 0.16s; }

  .stat-num {
    font-size: 1.3rem; font-weight: 800;
    color: var(--purple); line-height: 1; margin-bottom: 2px;
  }

  .stat-lbl {
    font-size: 0.55rem; font-weight: 600;
    color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em;
  }

  /* Feature pills */
  .feature-pills {
    display: flex; flex-direction: column;
    gap: 9px; align-items: center;
  }

  .pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 18px;
    background: var(--white85);
    border: 1.5px solid var(--purple-pale);
    border-radius: 999px;
    font-size: 0.72rem; font-weight: 600;
    color: var(--purple-dark);
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(109,40,217,0.08);
    animation: pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    transition: transform 0.2s, background 0.2s;
  }

  .pill:hover { transform: translateX(4px); background: rgba(221,214,254,0.5); }
  .pill:nth-child(2) { animation-delay: 0.1s; }
  .pill:nth-child(3) { animation-delay: 0.2s; }

  .pill-dot {
    width: 7px; height: 7px;
    background: linear-gradient(135deg, var(--purple), var(--pink));
    border-radius: 50%;
  }

  /* Corner decorations */
  .corner { position: absolute; width: 40px; height: 40px; opacity: 0.25; }
  .corner-tl { top: 24px; left: 24px; border-top: 2px solid var(--purple); border-left: 2px solid var(--purple); border-radius: 4px 0 0 0; }
  .corner-br { bottom: 24px; right: 24px; border-bottom: 2px solid var(--purple); border-right: 2px solid var(--purple); border-radius: 0 0 4px 0; }

  /* RIGHT PANEL */
  .right {
    display: flex; align-items: center; justify-content: center;
    padding: 60px 72px;
    animation: fade-in 0.6s ease 0.1s both;
  }

  .form-container { width: 100%; max-width: 400px; }

  /* ROLE TABS */
  .role-row { display: flex; gap: 8px; margin-bottom: 18px; }

  .role-btn {
    flex: 1; padding: 10px 6px;
    background: var(--white85);
    backdrop-filter: blur(6px);
    border: 1.5px solid var(--purple-pale);
    border-radius: 14px;
    font-family: "Poppins", sans-serif;
    font-size: 0.7rem; font-weight: 600; color: var(--muted);
    cursor: pointer; transition: all 0.22s;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
  }

  .role-btn .r-icon { font-size: 1.2rem; }

  .role-btn:hover {
    border-color: var(--purple-light);
    color: var(--purple);
    background: rgba(237,233,254,0.7);
  }

  .role-btn.active {
    border-color: var(--purple);
    background: rgba(237,233,254,0.85);
    color: var(--purple);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }

  /* CARD */
  .form-card {
    background: var(--white85);
    backdrop-filter: blur(12px);
    border-radius: 24px; padding: 36px 32px;
    border: 1.5px solid rgba(221,214,254,0.6);
    box-shadow: 0 8px 32px rgba(109,40,217,0.10), 0 2px 8px rgba(0,0,0,0.04);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }

  .form-card:hover {
    box-shadow: 0 12px 40px rgba(109,40,217,0.18);
    transform: translateY(-2px);
  }

  .form-header { margin-bottom: 26px; }

  .form-eyebrow {
    font-size: 0.65rem; font-weight: 600;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--purple); margin-bottom: 10px;
    display: flex; align-items: center; gap: 10px;
  }

  .form-eyebrow::after {
    content: ''; flex: 1; height: 1.5px;
    background: linear-gradient(90deg, var(--purple-pale), transparent);
    border-radius: 999px;
  }

  .form-title {
    font-size: 1.8rem; font-weight: 800;
    color: var(--text); letter-spacing: -0.5px; margin-bottom: 4px;
  }

  .form-subtitle {
    font-size: 0.78rem; font-weight: 400; color: var(--muted);
  }

  /* FIELDS */
  .field { margin-bottom: 20px; }

  .field label {
    display: block;
    font-size: 0.7rem; font-weight: 600;
    letter-spacing: 0.05em; color: var(--text); margin-bottom: 8px;
  }

  .input-wrap { position: relative; }

  .input-wrap input {
    width: 100%;
    background: rgba(255,255,255,0.9);
    border: 1.5px solid var(--purple-pale);
    border-radius: 12px;
    padding: 12px 16px;
    font-family: "Poppins", sans-serif;
    font-size: 0.85rem; font-weight: 500; color: var(--text);
    outline: none;
    transition: border-color 0.25s, box-shadow 0.25s;
  }

  .input-wrap input::placeholder { color: #c4b5fd; font-weight: 400; }

  .input-wrap input:focus {
    border-color: var(--purple);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }

  .input-wrap input.error-input {
    border-color: var(--error);
    box-shadow: 0 0 0 3px rgba(224,112,112,0.12);
  }

  .input-line { display: none; }

  .toggle-pass {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none;
    color: var(--purple-light); cursor: pointer;
    font-family: "Poppins", sans-serif;
    font-size: 0.62rem; font-weight: 600;
    letter-spacing: 0.05em; text-transform: uppercase;
    padding: 4px; transition: color 0.2s;
  }

  .toggle-pass:hover { color: var(--purple); }

  .field-error {
    font-size: 0.65rem; font-weight: 500;
    color: var(--error); margin-top: 6px;
  }

  /* OPTIONS */
  .options-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px;
  }

  .checkbox-wrap {
    display: flex; align-items: center; gap: 8px;
    cursor: pointer; user-select: none;
  }

  .checkbox-wrap input { display: none; }

  .checkbox-box {
    width: 16px; height: 16px;
    border: 1.5px solid var(--purple-pale); border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.2s, background 0.2s;
  }

  .checkbox-wrap:hover .checkbox-box { border-color: var(--purple); }

  .checkbox-check {
    width: 8px; height: 8px;
    background: linear-gradient(135deg, var(--purple), var(--purple-dark));
    border-radius: 2px;
    transform: scale(0);
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }

  .checkbox-wrap input:checked ~ .checkbox-box {
    border-color: var(--purple);
    background: rgba(124,58,237,0.06);
  }

  .checkbox-wrap input:checked ~ .checkbox-box .checkbox-check {
    transform: scale(1);
  }

  .checkbox-label { font-size: 0.72rem; font-weight: 500; color: var(--muted); }

  .forgot-link {
    background: none; border: none; padding: 0;
    font-family: "Poppins", sans-serif;
    font-size: 0.72rem; font-weight: 600; color: var(--purple);
    cursor: pointer; transition: opacity 0.2s;
  }

  .forgot-link:hover { opacity: 0.7; }

  /* BUTTON */
  .submit-btn {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, var(--purple), var(--purple-dark));
    border: none; border-radius: 12px;
    color: #fff; font-family: "Poppins", sans-serif;
    font-size: 0.88rem; font-weight: 700;
    letter-spacing: 0.02em; cursor: pointer;
    position: relative; overflow: hidden;
    box-shadow: 0 4px 16px rgba(109,40,217,0.35);
    transition: transform 0.25s, box-shadow 0.25s;
    margin-bottom: 18px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }

  .submit-btn::after {
    content: '';
    position: absolute; top: 0; left: -100%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 2.5s ease infinite;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 10px 28px rgba(109,40,217,0.5);
  }

  .submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-spinner {
    width: 15px; height: 15px; flex-shrink: 0;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.65s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* DIVIDER */
  .or-divider {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 14px;
    font-size: 0.65rem; font-weight: 600;
    color: #c4b5fd; letter-spacing: 0.1em;
  }

  .or-divider::before, .or-divider::after {
    content: ''; flex: 1; height: 1px;
    background: var(--purple-pale); border-radius: 999px;
  }

  .register-row {
    text-align: center;
    font-size: 0.75rem; font-weight: 500; color: var(--muted);
  }

  .register-link {
    background: none; border: none; padding: 0;
    color: var(--purple); font-family: "Poppins", sans-serif;
    font-size: 0.75rem; font-weight: 700;
    cursor: pointer; transition: opacity 0.2s;
  }

  .register-link:hover { opacity: 0.7; }

  /* SUCCESS */
  .success-flash {
    position: fixed; inset: 0;
    background: linear-gradient(135deg, #d4f5e9, #ede9fe, #d4eeff);
    background-size: 400% 400%;
    animation: bg-shift 6s ease infinite, fadeIn 0.5s ease;
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
  }

  .success-inner { text-align: center; }

  .success-mark {
    width: 76px; height: 76px;
    background: linear-gradient(135deg, var(--purple), var(--pink));
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 2rem; margin: 0 auto 20px;
    box-shadow: 0 8px 32px rgba(109,40,217,0.35);
    animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .success-text {
    font-size: 2rem; font-weight: 800;
    color: var(--text); letter-spacing: -0.5px; margin-bottom: 6px;
  }

  .success-sub { font-size: 0.8rem; font-weight: 500; color: var(--purple); }

  @media (max-width: 768px) {
    .scene { grid-template-columns: 1fr; }
    .left  { display: none; }
    .right { padding: 32px 20px; }
    .form-card { padding: 28px 20px; }
  }
`;

const ROLES = [
  { id: "student", icon: "🎓", label: "Student"  },
  { id: "teacher", icon: "🧑‍🏫", label: "Teacher" },
  { id: "parent",  icon: "👨‍👧", label: "Parent"  },
];

export default function LoginPage({ onLogin }) {
  const [role,     setRole]     = useState("student");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const validate = () => {
    const e = {};
    if (!email)                            e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    if (!password)                         e.password = "Password is required";
    else if (password.length < 6)          e.password = "Min. 6 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { if (onLogin) onLogin(); }, 1400);
  };

  if (success) {
    return (
      <>
        <style>{styles}</style>
        <div className="success-flash">
          <div className="success-inner">
            <div className="success-mark">🎓</div>
            <div className="success-text">Let's Start Learning!</div>
            <div className="success-sub">Loading your AI study workspace…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="scene">

        {/* ── LEFT ── */}
        <div className="left">
          <div className="grid-lines" />
          <div className="corner corner-tl" />
          <div className="corner corner-br" />
          <div className="brand">

            <div className="brand-symbol">🤖</div>
            <div className="brand-name">Tutor<span>AI</span></div>
            <div className="brand-tagline">Smart AI Tutoring System</div>
            <div className="brand-divider" />
            <div className="brand-quote">
              Your personalized AI companion that adapts to how you learn —
              faster progress, deeper understanding, better results.
            </div>

            <div className="stat-row">
              <div className="stat-card">
                <div className="stat-num">50K+</div>
                <div className="stat-lbl">Students</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">98%</div>
                <div className="stat-lbl">Pass Rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">200+</div>
                <div className="stat-lbl">Topics</div>
              </div>
            </div>

            <div className="feature-pills">
              <div className="pill"><span className="pill-dot" />Adaptive AI Lessons</div>
              <div className="pill"><span className="pill-dot" />Real-Time Feedback</div>
              <div className="pill"><span className="pill-dot" />Progress Analytics</div>
            </div>

          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="right">
          <div className="form-container">

            {/* Role selector */}
            <div className="role-row">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`role-btn${role === r.id ? " active" : ""}`}
                  onClick={() => setRole(r.id)}
                >
                  <span className="r-icon">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="form-card">
              <div className="form-header">
                <div className="form-eyebrow">Welcome Back</div>
                <div className="form-title">Sign In</div>
                <div className="form-subtitle">Continue your learning journey 🚀</div>
              </div>

              {/* Email */}
              <div className="field">
                <label>
                  {role === "student" ? "Student" : role === "teacher" ? "Teacher" : "Parent"} Email
                </label>
                <div className="input-wrap">
                  <input
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={errors.email ? "error-input" : ""}
                  />
                  <span className="input-line" />
                </div>
                {errors.email && <div className="field-error">⚠ {errors.email}</div>}
              </div>

              {/* Password */}
              <div className="field">
                <label>Password</label>
                <div className="input-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={errors.password ? "error-input" : ""}
                  />
                  <span className="input-line" />
                  <button type="button" className="toggle-pass" onClick={() => setShowPass(v => !v)}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && <div className="field-error">⚠ {errors.password}</div>}
              </div>

              {/* Options */}
              <div className="options-row">
                <label className="checkbox-wrap">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <span className="checkbox-box"><span className="checkbox-check" /></span>
                  <span className="checkbox-label">Keep me signed in</span>
                </label>
                <button type="button" className="forgot-link">Forgot password?</button>
              </div>

              {/* ✅ Sign In & Start Learning button */}
              <button
                type="button"
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <><div className="btn-spinner" />Signing in…</>
                  : <>🎓 Sign In &amp; Start Learning</>
                }
              </button>

              <div className="or-divider">OR</div>

              <div className="register-row">
                New to TutorAI?{" "}
                <button type="button" className="register-link">Create free account ✨</button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}