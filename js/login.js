// ========================================
// صفحة تسجيل الدخول لـ Iron Plus - نظام التحقق المطوّر
// ========================================

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('Jarvis: Login systems initializing... 🦾');
    
    // 1. إدارة التوجيه (Redirect Logic)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || 'profile.html';
    localStorage.setItem('login_redirect', redirectUrl);
    
    // 2. التحقق إذا كان المستخدم مسجلاً بالفعل (تعديل الاسم ليتوافق مع الـ Config)
    if (window.ironPlus && window.ironPlus.isLoggedIn()) {
        console.log('Active session detected. Redirecting...');
        window.location.href = redirectUrl;
        return;
    }
    
    // 3. إعداد مستمعي الأحداث
    setupEventListeners();
});

// --- أولاً: إعداد مستمعي الأحداث (Event Listeners) ---

function setupEventListeners() {
    // أزرار التحكم
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const backBtn = document.getElementById('backBtn');
    
    if (sendOtpBtn) sendOtpBtn.addEventListener('click', sendOTP);
    if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', verifyOTP);
    if (backBtn) backBtn.addEventListener('click', () => window.history.back());

    // حقل رقم الهاتف (تنسيق وقيود)
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendOTP(); });
        
        phoneInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, ''); // منع الحروف
            if (val.length > 0 && !val.startsWith('05')) val = '05' + val; // إجبار البداية بـ 05
            if (val.length > 10) val = val.substring(0, 10); // الحد الأقصى 10 أرقام
            e.target.value = val;
        });
    }

    // حقل رمز التحقق (OTP)
    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
        otpInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') verifyOTP(); });
        
        otpInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
            // تحقق تلقائي عند اكتمال الـ 6 أرقام
            if (e.target.value.length === 6) verifyOTP();
        });
    }
}

// --- ثانياً: منطق إرسال الرمز (Send OTP) ---

async function sendOTP() {
    const phoneInput = document.getElementById('phoneInput');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    
    if (!phoneInput || !sendOtpBtn) return;
    
    const phone = phoneInput.value.trim();
    
    // فحص صحة الرقم
    if (!phone || !phone.startsWith('05') || phone.length !== 10) {
        showError('يرجى إدخال رقم جوال صحيح (05XXXXXXXX)');
        return;
    }
    
    // حالة التحميل
    const originalText = sendOtpBtn.innerHTML;
    sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري طلب الرمز...';
    sendOtpBtn.disabled = true;
    
    clearMessages();
    
    try {
        // نداء دالة الإرسال من ملف الـ Config
        const result = await window.ironPlus.loginWithPhone(phone);
        
        if (result.success) {
            showSuccess(result.message || 'تم إرسال رمز التحقق لواتسابك ✅');
            
            // تبديل الأقسام في الواجهة
            document.getElementById('phoneSection').style.display = 'none';
            document.getElementById('otpSection').style.display = 'block';
            
            const otpInput = document.getElementById('otpInput');
            if (otpInput) otpInput.focus();
            
            // تشغيل عداد إعادة الإرسال
            startResendTimer(phone);
            
        } else {
            showError(result.message || 'عذراً، فشل إرسال الرمز');
        }
    } catch (error) {
        console.error('OTP Request Error:', error);
        showError('حدث خطأ في الاتصال بالأنظمة');
    } finally {
        sendOtpBtn.innerHTML = originalText;
        sendOtpBtn.disabled = false;
    }
}

// --- ثالثاً: منطق التحقق من الرمز (Verify OTP) ---

async function verifyOTP() {
    const phoneInput = document.getElementById('phoneInput');
    const otpInput = document.getElementById('otpInput');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    
    if (!phoneInput || !otpInput || !verifyOtpBtn) return;
    
    const phone = phoneInput.value.trim();
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        showError('أدخل الرمز المكون من 6 أرقام');
        return;
    }
    
    const originalText = verifyOtpBtn.innerHTML;
    verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري فحص الشفرة...';
    verifyOtpBtn.disabled = true;
    
    clearError();
    
    try {
        // نداء دالة التحقق من ملف الـ Config
        const result = await window.ironPlus.verifyOTP(phone, otp);
        
        if (result.success) {
            showSuccess('تمت المصادقة بنجاح! جاري تشغيل واجهتك... 🦾');
            
            const redirectUrl = localStorage.getItem('login_redirect') || 'profile.html';
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
            
        } else {
            showError(result.message || 'الرمز غير صحيح، حاول مرة أخرى');
            otpInput.classList.add('shake'); // تأثير اهتزاز عند الخطأ
            setTimeout(() => otpInput.classList.remove('shake'), 500);
        }
    } catch (error) {
        console.error('Verification Error:', error);
        showError('حدث خطأ أثناء عملية التحقق');
    } finally {
        verifyOtpBtn.innerHTML = originalText;
        verifyOtpBtn.disabled = false;
    }
}

// --- رابعاً: الخدمات المساعدة (UI Helpers) ---

function startResendTimer(phone) {
    const resendBtn = document.getElementById('resendBtn');
    const timerSpan = document.getElementById('resendTimer');
    
    if (!resendBtn || !timerSpan) return;
    
    let timeLeft = 60;
    resendBtn.disabled = true;
    resendBtn.style.display = 'none';
    timerSpan.style.display = 'inline';
    
    const timer = setInterval(() => {
        timeLeft--;
        timerSpan.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            resendBtn.disabled = false;
            resendBtn.style.display = 'inline';
            timerSpan.style.display = 'none';
            timerSpan.textContent = '60';
        }
    }, 1000);
}

function showError(msg) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        errorDiv.style.display = 'block';
    }
}

function showSuccess(msg) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
        successDiv.style.display = 'block';
    }
}

function clearMessages() {
    const err = document.getElementById('errorMessage');
    const succ = document.getElementById('successMessage');
    if (err) err.style.display = 'none';
    if (succ) succ.style.display = 'none';
}

function clearError() {
    const err = document.getElementById('errorMessage');
    if (err) err.style.display = 'none';
}
