import { useState, useRef } from 'react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

const G_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

function openGoogleOAuth() {
  const params = new URLSearchParams({
    client_id:     G_CLIENT_ID,
    redirect_uri:  window.location.origin + '/auth/google/callback',
    response_type: 'id_token',
    scope:         'openid email profile',
    nonce:         Math.random().toString(36).slice(2),
    prompt:        'select_account',
  });
  const w = 500, h = 600;
  const left = window.screenX + (window.outerWidth  - w) / 2;
  const top  = window.screenY + (window.outerHeight - h) / 2;
  return window.open(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    'google-oauth',
    `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
  );
}

export default function AuthPage() {
  const { saveAuth }    = useAuth();
  const [tab, setTab]   = useState('login');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const pendingEmail    = useRef('');

  const handleGoogle = () => {
    setErr('');
    const popup = openGoogleOAuth();
    if (!popup) { setErr('يرجى السماح بالـ popups للمتصفح'); return; }

    const timer = setInterval(async () => {
      try {
        if (popup.closed) { clearInterval(timer); return; }
        const hash = popup.location.hash;
        if (!hash) return;
        clearInterval(timer);
        popup.close();

        const p = new URLSearchParams(hash.slice(1));
        const idToken = p.get('id_token');
        if (!idToken) { setErr('لم يتم الحصول على token من Google'); return; }

        setBusy(true);
        const { data } = await authApi.signupGoogle(idToken);
        const t = data.data.accessToken || data.token;
        const payload = decodeToken(t);
        saveAuth(t, {
          username: payload.username,
          email:    payload.email || '',
        });
      } catch (e) {
        if (e instanceof DOMException) return;
        setErr(e.response?.data?.message || 'خطأ في تسجيل الدخول بـ Google');
        clearInterval(timer);
      } finally { setBusy(false); }
    }, 300);
  };

  const [lEmail, setLEmail] = useState('');
  const [lPass,  setLPass]  = useState('');

  const doLogin = async () => {
    setErr('');
    if (!lEmail || !lPass) { setErr('يرجى ملء جميع الحقول'); return; }
    setBusy(true);
    try {
      const { data } = await authApi.login({ email: lEmail, password: lPass });
      const t = data.data.accessToken || data.token;

      const payload = decodeToken(t);
      saveAuth(t, {
        username: payload.username,
        email:    lEmail,
      });
    } catch (e) {
      setErr(e.response?.data?.message || 'بيانات غير صحيحة');
    } finally { setBusy(false); }
  };
  const [sName,   setSName]   = useState('');
  const [sEmail,  setSEmail]  = useState('');
  const [sPhone,  setSPhone]  = useState('');
  const [sPass,   setSPass]   = useState('');
  const [sGender, setSGender] = useState('');
  const [sDob,    setSDob]    = useState('');

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?.&_\-#])[A-Za-z\d@$!%?.&_\-#]{8,}$/;

  const doSignup = async () => {
    setErr('');
    if (!sName || !sEmail || !sPass) {
      setErr('يرجى ملء الحقول المطلوبة'); return;
    }
    if (!passwordRegex.test(sPass)) {
      setErr('كلمة المرور لازم تكون 8 حروف على الأقل + حرف كبير + حرف صغير + رقم + رمز خاص');
      return;
    }
    setBusy(true);
    try {
      await authApi.signup({
        username:        sName,
        email:       sEmail,
        phoneNumber:       sPhone,
        password:    sPass,
        gender:      sGender,
        dateBirth: sDob,
      });
      pendingEmail.current = sEmail;
      setTab('otp');
      setErr('');
    } catch (e) {
      setErr(e.response?.data?.message || 'خطأ في إنشاء الحساب');
    } finally { setBusy(false); }
  };

  const [otp, setOtp] = useState(['','','','','','']);
  const otpRefs = useRef([]);

  const handleOtpInput = (val, idx) => {
    const v = val.replace(/[^a-zA-Z0-9]/g, '').slice(-1);
    const next = [...otp]; next[idx] = v;
    setOtp(next);
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  const doOtp = async () => {
    setErr('');
    const code = otp.join('');
    if (code.length < 6) { setErr('أدخل الكود كاملاً'); return; }
    setBusy(true);
    try {
      await authApi.confirmEmail({ email: pendingEmail.current, OTP: code });
      setTab('login');
      setErr('');
    } catch (e) {
      setErr(e.response?.data?.message || 'كود غير صحيح');
    } finally { setBusy(false); }
  };

  const doResend = async () => {
    try { await authApi.resendOtp(pendingEmail.current); } catch {}
  };

  const switchTab = (t) => { setErr(''); setTab(t); };

  return (
    <div className={styles.overlay}>
      <div className={styles.split}>

        {/* ── Left panel — branding ── */}
        <div className={styles.brand}>
          <div className={styles.brandInner}>
            <div className={styles.brandIcon}>✦</div>
            <h1 className={styles.brandTitle}>ChatAI</h1>
            <p className={styles.brandDesc}>
              مساعدك الذكي — اسأل، اكتشف، أنجز.
            </p>
            <div className={styles.brandFeatures}>
              <div className={styles.feat}><span>⚡</span> ردود فورية</div>
              <div className={styles.feat}><span>💬</span> محادثات محفوظة</div>
              <div className={styles.feat}><span>🔒</span> آمن وخاص</div>
            </div>
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div className={styles.formPanel}>
          <div className={styles.formInner}>

            {tab !== 'otp' && (
              <>
                <h2 className={styles.formTitle}>
                  {tab === 'login' ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
                </h2>
                <p className={styles.formSub}>
                  {tab === 'login' ? 'سجّل دخولك للمتابعة' : 'انضم إلينا اليوم'}
                </p>

                {/* Google Button */}
                <button className={styles.googleBtn} onClick={handleGoogle} disabled={busy}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  المتابعة بحساب Google
                </button>

                <div className={styles.divider}><span>أو</span></div>

                <div className={styles.tabs}>
                  <button className={`${styles.tab} ${tab==='login'?styles.active:''}`}
                    onClick={()=>switchTab('login')}>دخول</button>
                  <button className={`${styles.tab} ${tab==='signup'?styles.active:''}`}
                    onClick={()=>switchTab('signup')}>حساب جديد</button>
                </div>
              </>
            )}

            {/* ── Login Form ── */}
            {tab === 'login' && (
              <div className={styles.fields}>
                <Field label="البريد الإلكتروني">
                  <input type="email" value={lEmail} onChange={e=>setLEmail(e.target.value)}
                    placeholder="example@mail.com" autoComplete="email" />
                </Field>
                <Field label="كلمة المرور">
                  <input type="password" value={lPass} onChange={e=>setLPass(e.target.value)}
                    placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&doLogin()} />
                </Field>
                {err && <p className={styles.err}>{err}</p>}
                <button className={styles.btn} onClick={doLogin} disabled={busy}>
                  {busy ? <span className={styles.spinner}/> : null}
                  {busy ? 'جاري الدخول...' : 'دخول'}
                </button>
              </div>
            )}

            {/* ── Signup Form ── */}
            {tab === 'signup' && (
              <div className={styles.fields}>
                <div className={styles.row2}>
                  <Field label="الاسم">
                    <input type="text" value={sName} onChange={e=>setSName(e.target.value)} placeholder="الاسم الكامل" />
                  </Field>
                  <Field label="رقم الجوال">
                    <input type="tel" value={sPhone} onChange={e=>setSPhone(e.target.value)} placeholder="+201234567890" />
                  </Field>
                </div>
                <div className={styles.row2}>
                  <Field label="النوع">
                    <select value={sGender} onChange={e=>setSGender(e.target.value)} className={styles.select}>
                      <option value="">اختر النوع</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </Field>
                  <Field label="تاريخ الميلاد">
                    <input type="date" value={sDob} onChange={e=>setSDob(e.target.value)} />
                  </Field>
                </div>
                <Field label="البريد الإلكتروني">
                  <input type="email" value={sEmail} onChange={e=>setSEmail(e.target.value)} placeholder="example@mail.com" />
                </Field>
                <Field label="كلمة المرور">
                  <input type="password" value={sPass} onChange={e=>setSPass(e.target.value)} placeholder="••••••••" />
                </Field>
                {err && <p className={styles.err}>{err}</p>}
                <button className={styles.btn} onClick={doSignup} disabled={busy}>
                  {busy ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </button>
              </div>
            )}

            {/* ── OTP ── */}
            {tab === 'otp' && (
              <div className={styles.otpWrap}>
                <div className={styles.otpIcon}>✉</div>
                <h2 className={styles.formTitle}>تحقق من بريدك</h2>
                <p className={styles.formSub}>
                  أرسلنا كود التحقق إلى<br />
                  <strong style={{fontSize:" 13px",
    fontFamily: "monospace"}}>{pendingEmail.current}</strong>
                </p>
                <div className={styles.otpRow}>
                  {otp.map((v, i) => (
                    <input key={i} type="text" inputMode="numeric" maxLength={1}
                      value={v}
                      ref={el => otpRefs.current[i] = el}
                      onChange={e => handleOtpInput(e.target.value, i)}
                      onKeyDown={e => handleOtpKey(e, i)}
                      className={styles.otpInput} />
                  ))}
                </div>
                {err && <p className={styles.err}>{err}</p>}
                <button style={{marginBlock:"40px"}} className={styles.btn} onClick={doOtp} disabled={busy} >
                  {busy ? 'جاري التحقق...' : 'تأكيد الكود'}
                </button>
                <p className={styles.resend}>
                  لم يصل الكود؟ <span onClick={doResend}>إعادة إرسال</span>
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14, width: '100%' }}>
      <label style={{ display:'block', fontSize:18, fontWeight:600, wordSpacing:'4px',
        color:'var(--text2)', marginBottom:6 }}>{label}</label>
      {children}
    </div>
  );
}