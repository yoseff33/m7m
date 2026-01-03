// ========================================
// صفحة تسجيل الدخول لـ Iron Plus - نظام الدخول السريع (Bypass)
// ========================================

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('Jarvis: Login systems initializing... 🦾');
    
    // 1. إدارة التوجيه (Redirect Logic)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || 'profile.html';
    localStorage.setItem('login_redirect', redirectUrl);
    
    // 2. التحقق إذا كان المستخدم مسجلاً بالفعل
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
    // حقل رقم الهاتف (تنسيق وقيود)
    const phoneInput = document.getElementById('phoneNumber'); // تم تعديله ليتطابق مع login.html
    if (phoneInput) {
        phoneInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendOTP(); });
        
        phoneInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, ''); // منع الحروف
            if (val.length > 0 && !val.startsWith('05')) val = '05' + val; // إجبار البداية بـ 05
            if (val.length > 10) val = val.substring(0, 10); // الحد الأقصى 10 أرقام
            e.target.value = val;
        });
    }
}

// --- ثانياً: منطق الدخول المباشر (تجاوز الـ OTP) ---

async function sendOTP() {
    const phoneInput = document.getElementById('phoneNumber');
    const loginMessage = document.getElementById('loginMessage');
    
    if (!phoneInput) return;
    
    const phone = phoneInput.value.trim();
    
    // فحص صحة الرقم
    if (!phone || !phone.startsWith('05') || phone.length !== 10) {
        showStatus('يرجى إدخال رقم جوال صحيح (05XXXXXXXX)', 'error');
        return;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    showStatus('<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...', 'info');
    
    try {
        // --- تعديل التجاوز (Bypass) ---
        // 1. تخزين رقم الجوال مباشرة في المتصفح
        localStorage.setItem('iron_user_phone', cleanPhone);
        
        // 2. تسجيل الدخول في قاعدة البيانات للتوثيق (اختياري)
        if (window.ironPlus && window.ironPlus.recordLogin) {
            await window.ironPlus.recordLogin(cleanPhone);
        }
        
        showStatus('تمت المصادقة بنجاح! جاري تشغيل واجهتك... 🦾', 'success');
        
        // 3. التوجيه الفوري لصفحة الحساب أو صفحة الدفع
        const redirectUrl = localStorage.getItem('login_redirect') || 'profile.html';
        
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1200);
        
    } catch (error) {
        console.error('Login Error:', error);
        // حتى في حال وجود خطأ في الاتصال، نسمح له بالدخول محلياً
        localStorage.setItem('iron_user_phone', cleanPhone);
        window.location.href = 'profile.html';
    }
}

// --- ثالثاً: الخدمات المساعدة (UI Helpers) ---

function showStatus(msg, type) {
    const messageDiv = document.getElementById('loginMessage');
    if (messageDiv) {
        messageDiv.innerHTML = msg;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }
}

// دالة verifyOTP أصبحت غير ضرورية الآن ولكن تركناها فارغة لتجنب أخطاء الاستدعاء إن وجدت
async function verifyOTP() {
    console.log("OTP Verification bypassed.");
}

function clearMessages() {
    const messageDiv = document.getElementById('loginMessage');
    if (messageDiv) messageDiv.style.display = 'none';
}
