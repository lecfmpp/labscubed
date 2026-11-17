/* LcWebinarSurvey — the LabsCubed Webinar client survey (client:only), served at /survey/lc-webinar/.
 *
 * Copy is Client Survey 1.2 (Mo'min). It goes to clients and contacts who already know
 * LabsCubed, so the page is built for no friction:
 *   - one question per screen, every question moves on with Continue;
 *   - no contact form: name/email/company arrive in the link Mo'min sends
 *     (?email=&name=&company=&src=), and are only asked for on the last screen if missing
 *     AND the person wants us to follow up;
 *   - no site header, no links out. In particular it does NOT link to the webinar page:
 *     the only job here is to answer. The follow-up choice is recorded and the team acts on it.
 *
 * Answers are posted when Q7 is submitted (so they count even if the tab closes), then
 * again with the follow-up choice; netlify/functions/lc-webinar-survey.mjs upserts both on
 * client_id. */
import React from 'react';
import { track } from '../lib/track';

const ENDPOINT = '/api/survey/lc-webinar';
const TEAL = '#17ddc5';
const TEAL_D = '#0d9488';
const INK = '#1d1d1f';
const MUTED = '#6e6e73';

type Opt = { id: string; label: string; other?: boolean; exclusive?: boolean };
type Q = { key: string; title: string; hint: string; multi?: number; opts: Opt[] };

const QUESTIONS: Q[] = [
  { key: 'role', title: 'What best describes your role?', hint: 'Pick one', opts: [
    { id: 'technician', label: 'Lab technician or test engineer' },
    { id: 'lab-manager', label: 'Lab or quality manager' },
    { id: 'production', label: 'Production or process engineer' },
    { id: 'rnd', label: 'R&D or material development' },
    { id: 'executive', label: 'Executive or business leader' },
    { id: 'other', label: 'Other', other: true },
  ] },
  { key: 'ai_stage', title: 'Where is your organization with AI today?', hint: 'Pick one', opts: [
    { id: 'using', label: 'Already using it' },
    { id: 'piloting', label: 'Testing or piloting it' },
    { id: 'exploring', label: 'Exploring, nothing in place yet' },
    { id: 'not-exploring', label: 'Not exploring it yet' },
    { id: 'unsure', label: 'Not sure' },
  ] },
  { key: 'ai_help', title: 'Where could AI help you most?', hint: 'Pick up to 3', multi: 3, opts: [
    { id: 'interpret', label: 'Interpreting test results automatically' },
    { id: 'anomalies', label: 'Spotting unusual results and variation' },
    { id: 'reports', label: 'Writing test reports and documentation' },
    { id: 'trends', label: 'Finding trends in historical data' },
    { id: 'predict', label: 'Predicting material properties' },
    { id: 'production', label: 'Catching production problems earlier' },
    { id: 'connect', label: 'Connecting equipment and software' },
    { id: 'unsure', label: 'Not sure yet', exclusive: true },
    { id: 'other', label: 'Other', other: true },
  ] },
  { key: 'concerns', title: 'What concerns you most about AI?', hint: 'Pick up to 3', multi: 3, opts: [
    { id: 'security', label: 'Keeping our data confidential and secure' },
    { id: 'accuracy', label: 'Results being wrong or misleading' },
    { id: 'standards', label: 'Meeting testing standards' },
    { id: 'fit', label: 'Fitting with our equipment and software' },
    { id: 'data', label: 'Our data is scattered or inconsistent' },
    { id: 'cost', label: 'Cost to set up and run' },
    { id: 'worth', label: "Not sure it's worth the investment" },
    { id: 'skills', label: 'We lack the skills in house' },
    { id: 'none', label: 'No major concerns', exclusive: true },
  ] },
  { key: 'comfort', title: 'What would make you comfortable using AI?', hint: 'Pick up to 3', multi: 3, opts: [
    { id: 'on-prem', label: 'Running it on our own systems' },
    { id: 'no-training', label: "A guarantee our data won't train outside AI models" },
    { id: 'validated', label: 'Proof of validated, reliable results' },
    { id: 'demos', label: 'Demos on real testing data' },
    { id: 'roi', label: 'A clear return on investment' },
    { id: 'training', label: 'Training for our team' },
    { id: 'it-docs', label: 'Documentation our IT team can approve' },
  ] },
  { key: 'topics', title: 'Which webinar topics interest you most?', hint: 'Pick up to 3', multi: 3, opts: [
    { id: 'data-ready', label: 'Getting your test data ready for AI' },
    { id: 'auto-analysis', label: 'Automated test analysis and reporting' },
    { id: 'anomalies', label: 'Catching anomalies and improving consistency' },
    { id: 'validation', label: 'Validating AI results against testing standards' },
    { id: 'predict', label: 'Predicting material properties' },
    { id: 'qc', label: 'AI for production quality control' },
    { id: 'security', label: 'Keeping your data secure (cloud vs local)' },
    { id: 'roi', label: 'Measuring the return on AI' },
  ] },
];

const FOLLOWUP: Opt[] = [
  { id: 'invites', label: 'Yes, send me invites' },
  { id: 'chat', label: "Yes, and I'm open to a short chat" },
  { id: 'no', label: 'No, thanks' },
];

const TOTAL = QUESTIONS.length + 1; // + open-text question
const uid = () => (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const labelOf = (q: Q, id: string) => q.opts.find((o) => o.id === id)?.label ?? id;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function LcWebinarSurvey() {
  const params = React.useMemo(() => new URLSearchParams(typeof location !== 'undefined' ? location.search : ''), []);
  // Email links pre-fill name/email via merge tags. When a tag is not filled in
  // (a test send, a preview, or a link copied from Trello) the raw "{{{...}}}"
  // text arrives instead, so anything that is still a tag or is not a valid
  // email is dropped rather than pre-filled.
  const clean = (v: string | null) => { const t = (v || '').trim(); return /[{}]/.test(t) ? '' : t; };
  const preEmail = clean(params.get('email'));
  const known = { name: clean(params.get('name')), email: EMAIL_RE.test(preEmail) ? preEmail : '', company: clean(params.get('company')), source: clean(params.get('src')) };
  const clientId = React.useRef(uid());

  const [step, setStep] = React.useState(0); // 0 intro, 1..6 questions, 7 open text, 8 done
  const [ans, setAns] = React.useState<Record<string, any>>({});
  const [wish, setWish] = React.useState('');
  const [followup, setFollowup] = React.useState('');
  const [email, setEmail] = React.useState(known.email);
  const [name, setName] = React.useState(known.name);
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const labels = () => {
    const out: Record<string, any> = {};
    QUESTIONS.forEach((q) => {
      const v = ans[q.key];
      if (Array.isArray(v)) out[q.key] = v.map((id) => (id === 'other' ? `Other: ${ans[q.key + '_other'] || '—'}` : labelOf(q, id)));
      else if (v) out[q.key] = v === 'other' ? `Other: ${ans[q.key + '_other'] || '—'}` : labelOf(q, v);
    });
    if (followup) out.followup = FOLLOWUP.find((f) => f.id === followup)?.label;
    return out;
  };

  const post = async (withFollowup: boolean) => {
    const body = {
      client_id: clientId.current, name, email, company: known.company, source: known.source,
      answers: { ...ans, wish }, followup: withFollowup ? followup : '', labels: labels(),
    };
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (r.ok) return true;
        if (r.status < 500) return false;
      } catch { /* retry */ }
      await new Promise((res) => setTimeout(res, 800 * (i + 1)));
    }
    return false;
  };

  const q = step >= 1 && step <= QUESTIONS.length ? QUESTIONS[step - 1] : null;
  const val = q ? ans[q.key] : undefined;
  const selected = (id: string) => (q?.multi ? (val || []).includes(id) : val === id);
  const needsOther = q && (q.multi ? (val || []).includes('other') : val === 'other');
  const canNext = q ? (q.multi ? (val || []).length > 0 : !!val) && (!needsOther || !!(ans[q.key + '_other'] || '').trim()) : true;

  const pick = (o: Opt) => {
    if (!q) return;
    if (!q.multi) {
      setAns((a) => ({ ...a, [q.key]: o.id }));
      return;
    }
    setAns((a) => {
      let cur: string[] = a[q.key] || [];
      if (cur.includes(o.id)) cur = cur.filter((x) => x !== o.id);
      else if (o.exclusive) cur = [o.id];
      else {
        cur = cur.filter((x) => !q.opts.find((p) => p.id === x)?.exclusive);
        if (cur.length >= (q.multi || 99)) return a;
        cur = [...cur, o.id];
      }
      return { ...a, [q.key]: cur };
    });
  };

  const submitAnswers = async () => {
    setBusy(true);
    track('lc_survey_answers', {});
    post(false); // fire and forget; the follow-up post upserts the same row
    setBusy(false);
    setStep(QUESTIONS.length + 2);
  };

  const submitFollowup = async () => {
    if (followup !== 'no' && !email.trim()) { setError('Add your email so we can reach you.'); return; }
    if (followup !== 'no' && email && !EMAIL_RE.test(email.trim())) { setError('That email doesn’t look right.'); return; }
    setError(''); setBusy(true);
    const ok = await post(true);
    setBusy(false);
    if (ok) { setSent(true); track('lc_survey_complete', { followup }); }
    else setError('Something went wrong. Please try again.');
  };

  const progress = step === 0 ? 0 : Math.min(step, TOTAL) / TOTAL;
  const firstName = (name || '').split(/\s+/)[0];

  return (
    <div className="lcs">
      <header className="lcs-top">
        <img src="/assets/img/assessment/kiosk/logo.png" alt="LabsCubed" height={28} />
        {step > 0 && step <= TOTAL && <span className="lcs-count">{step} of {TOTAL}</span>}
      </header>
      <div className="lcs-bar"><span style={{ width: `${progress * 100}%` }} /></div>

      <main className="lcs-main">
        {step === 0 && (
          <section className="lcs-card">
            <p className="lcs-eyebrow">LabsCubed Webinar · 3-minute survey</p>
            <h1>{firstName ? `${firstName}, AI is changing material testing.` : 'AI is changing material testing.'}</h1>
            <p className="lcs-lead">Tell us where you stand, and we'll build a free webinar series around what matters most to you.</p>
            <button className="lcs-primary" onClick={() => { track('lc_survey_start', {}); setStep(1); }}>Start →</button>
          </section>
        )}

        {q && (
          <section className="lcs-card" key={q.key}>
            <h2>{q.title}</h2>
            <p className="lcs-hint">{q.hint}{q.multi ? ` · ${(val || []).length}/${q.multi}` : ''}</p>
            <div className="lcs-opts">
              {q.opts.map((o) => {
                const on = selected(o.id);
                const full = !!q.multi && !on && !o.exclusive && (val || []).length >= q.multi;
                return (
                  <button key={o.id} className={`lcs-opt${on ? ' on' : ''}`} disabled={full} onClick={() => pick(o)} aria-pressed={on}>
                    <span className={`lcs-mark${q.multi ? ' sq' : ''}`}>{on ? '✓' : ''}</span>{o.label}
                  </button>
                );
              })}
            </div>
            {needsOther && (
              <input className="lcs-input" autoFocus placeholder="Please specify" value={ans[q.key + '_other'] || ''}
                onChange={(e) => setAns((a) => ({ ...a, [q.key + '_other']: e.target.value }))} />
            )}
            <nav className="lcs-nav">
              <button className="lcs-back" onClick={() => setStep((s) => s - 1)}>← Back</button>
              <button className="lcs-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Continue →</button>
            </nav>
          </section>
        )}

        {step === QUESTIONS.length + 1 && (
          <section className="lcs-card">
            <h2>Is there one task you'd love AI to take off your plate?</h2>
            <p className="lcs-hint">Optional</p>
            <textarea className="lcs-input lcs-area" rows={4} value={wish} onChange={(e) => setWish(e.target.value)}
              placeholder="For example: writing test reports, tracking down a failed result, or comparing results between material lots." />
            <nav className="lcs-nav">
              <button className="lcs-back" onClick={() => setStep((s) => s - 1)}>← Back</button>
              <button className="lcs-primary" disabled={busy} onClick={submitAnswers}>Submit answers →</button>
            </nav>
          </section>
        )}

        {step === QUESTIONS.length + 2 && !sent && (
          <section className="lcs-card">
            <p className="lcs-eyebrow">✓ Answers received</p>
            <h2>Thank you{firstName ? `, ${firstName}` : ''}! Would you like to pre-register for the webinar?</h2>
            <div className="lcs-opts">
              {FOLLOWUP.map((o) => (
                <button key={o.id} className={`lcs-opt${followup === o.id ? ' on' : ''}`} onClick={() => setFollowup(o.id)} aria-pressed={followup === o.id}>
                  <span className="lcs-mark">{followup === o.id ? '✓' : ''}</span>{o.label}
                </button>
              ))}
            </div>
            {followup && followup !== 'no' && !known.email && (
              <div className="lcs-contact">
                <input className="lcs-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                <input className="lcs-input" type="email" inputMode="email" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            )}
            {error && <p className="lcs-error">{error}</p>}
            <nav className="lcs-nav">
              <span />
              <button className="lcs-primary" disabled={!followup || busy} onClick={submitFollowup}>{busy ? 'Sending…' : 'Done'}</button>
            </nav>
          </section>
        )}

        {sent && (
          <section className="lcs-card lcs-done">
            <div className="lcs-check">✓</div>
            <h2>All set{firstName ? `, ${firstName}` : ''}.</h2>
            <p className="lcs-lead">
              {followup === 'invites' && "We'll send you the invites as soon as the sessions are scheduled."}
              {followup === 'chat' && "We'll send you the invites, and someone from our team will reach out to find a time to chat."}
              {followup === 'no' && 'Thanks for helping us shape the series. You can close this page.'}
            </p>
          </section>
        )}
      </main>

      <style>{`
        .lcs{min-height:100vh;background:#f5f5f7;color:${INK};font-family:Inter,system-ui,-apple-system,sans-serif}
        .lcs-top{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;background:#0b1213}
        .lcs-top img{height:28px;width:auto}
        .lcs-count{color:#fff;opacity:.7;font-size:14px;font-weight:600}
        .lcs-bar{height:4px;background:#dedee3}.lcs-bar span{display:block;height:100%;background:${TEAL};transition:width .3s}
        .lcs-main{max-width:640px;margin:0 auto;padding:40px 20px 80px}
        .lcs-card{background:#fff;border-radius:20px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,.06);animation:lcsIn .25s ease}
        @keyframes lcsIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .lcs-eyebrow{color:${TEAL_D};font-weight:700;font-size:14px;letter-spacing:.02em;margin:0 0 10px}
        .lcs h1{font-size:34px;line-height:1.15;font-weight:800;margin:0 0 14px}
        .lcs h2{font-size:24px;line-height:1.25;font-weight:800;margin:0 0 6px}
        .lcs-lead{font-size:18px;line-height:1.55;color:${MUTED};margin:0 0 28px}
        .lcs-hint{color:${MUTED};font-size:15px;margin:0 0 20px}
        .lcs-opts{display:grid;gap:10px}
        .lcs-opt{display:flex;align-items:center;gap:14px;text-align:left;width:100%;padding:16px 18px;border-radius:14px;border:1.5px solid #e3e3e8;background:#fff;font:inherit;font-size:17px;color:${INK};cursor:pointer;transition:border-color .15s,background .15s}
        .lcs-opt:hover:not(:disabled){border-color:${TEAL}}
        .lcs-opt.on{border-color:${TEAL};background:#e6faf7;font-weight:600}
        .lcs-opt:disabled{opacity:.45;cursor:not-allowed}
        .lcs-mark{flex:none;width:22px;height:22px;border-radius:50%;border:2px solid #c7c7cc;display:grid;place-items:center;font-size:13px;color:#fff;font-weight:800}
        .lcs-mark.sq{border-radius:6px}
        .lcs-opt.on .lcs-mark{background:${TEAL_D};border-color:${TEAL_D}}
        .lcs-input{width:100%;box-sizing:border-box;margin-top:12px;padding:14px 16px;border-radius:12px;border:1.5px solid #d2d2d7;font:inherit;font-size:17px}
        .lcs-input:focus{outline:none;border-color:${TEAL}}
        .lcs-area{resize:vertical;margin-top:4px}
        .lcs-contact{margin-top:8px}
        .lcs-nav{display:flex;justify-content:space-between;align-items:center;margin-top:28px}
        .lcs-primary{background:${INK};color:#fff;border:0;border-radius:999px;padding:14px 28px;font:inherit;font-size:17px;font-weight:700;cursor:pointer}
        .lcs-primary:disabled{background:#dedee3;color:#8e8e93;cursor:not-allowed}
        .lcs-back{background:none;border:0;color:${MUTED};font:inherit;font-size:16px;cursor:pointer;padding:8px 0}
        .lcs-error{color:#c4221a;margin:12px 0 0;font-size:15px}
        .lcs-done{text-align:center}.lcs-done .lcs-lead{margin:0}
        .lcs-check{width:64px;height:64px;border-radius:50%;background:#e6faf7;color:${TEAL_D};font-size:32px;font-weight:800;display:grid;place-items:center;margin:0 auto 18px}
        @media (max-width:560px){.lcs-card{padding:28px 20px}.lcs h1{font-size:28px}.lcs h2{font-size:21px}.lcs-main{padding:20px 14px 60px}}
      `}</style>
    </div>
  );
}
