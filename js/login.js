// ========================================
// صفحة تسجيل الدخول لـ Iron Plus - نظام OTP عبر الواتساب
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Jarvis: Real OTP system initializing... 🦾');
    
    // 1. إدارة التوجيه (وين يروح المستخدم بعد الدخول)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || 'profile.html';
    localStorage.setItem('login_redirect', redirectUrl);
    
    // 2. التحقق من الجلسة النشطة (إذا مسجل دخول من قبل يوجهه فوراً)
    if (localStorage.getItem('iron_user_phone')) {
        console.log('Active session detected. Redirecting...');
        window.location.href = redirectUrl;
        return;
    }
    
    setupEventListeners();
});

// إعداد مستمعي الأحداث للوحة المفاتيح وتنسيق الأرقام
function setupEventListeners() {
    const phoneInput = document.getElementById('phoneNumber');
    const otpInput = document.getElementById('otpInput');

    if (phoneInput) {
        // ضغط زر Enter في خانة الجوال يرسل الكود
        phoneInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendOTP(); });
        
        // تنسيق تلقائي للرقم (يمنع الحروف ويجبر البداية بـ 05)
        phoneInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, ''); 
            if (val.length > 0 && !val.startsWith('05')) val = '05' + val;
            if (val.length > 10) val = val.substring(0, 10);
            e.target.value = val;
        });
    }

    if (otpInput) {
        // ضغط زر Enter في خانة الكود يتحقق من الصحة
        otpInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') verifyOTP(); });
    }
}

// --- أولاً: وظيفة إرسال الكود إلى Supabase ---
async function sendOTP() {
    const phoneInput = document.getElementById('phoneNumber');
    const phone = phoneInput.value.trim();
    
    // التحقق من صحة الرقم قبل الإرسال
    if (!phone || phone.length !== 10 || !phone.startsWith('05')) {
        showStatus('يرجى إدخال رقم جوال صحيح يبدأ بـ 05', 'error');
        return;
    }

    // توليد كود عشوائي من 4 أرقام
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    showStatus('<i class="fas fa-spinner fa-spin"></i> جاري إرسال الكود لواتسابك...', 'info');

    try {
        // إرسال الطلب لجدول otp_requests في سوبابيس
        // السكربت الموجود على السيرفر (wa-engine.js) هو اللي بيلقط الطلب ويرسل الواتساب
        const { error } = await window.supabaseClient
            .from('otp_requests')
            .insert([{ 
                phone: phone, 
                code: generatedCode,
                status: 'pending' 
            }]);

        if (error) throw error;

        // حفظ البيانات مؤقتاً في المتصفح للتحقق منها لاحقاً
        localStorage.setItem('temp_phone', phone);
        localStorage.setItem('temp_otp', generatedCode);

        showStatus('✅ تم إرسال الكود! تفقد رسائل الواتساب وأدخله هنا:', 'success');
        
        // --- تبديل الواجهة للمرحلة الثانية ---
        document.getElementById('phoneStep').style.display = 'none'; // إخفاء خانة الجوال
        document.getElementById('otpStep').style.display = 'block';   // إظهار خانة الكود
        
        if (document.getElementById('otpInput')) {
            document.getElementById('otpInput').focus(); // وضع الماوس تلقائياً في خانة الكود
        }

    } catch (error) {
        console.error('OTP Send Error:', error);
        showStatus('فشل في إرسال الكود، تأكد من اتصالك وحاول مرة أخرى.', 'error');
    }
}

// --- ثانياً: وظيفة التحقق من الكود الذي أدخله المستخدم ---
async function verifyOTP() {
    const otpInput = document.getElementById('otpInput');
    const userEnteredCode = otpInput.value.trim();
    const correctCode = localStorage.getItem('temp_otp');
    const phone = localStorage.getItem('temp_phone');

    if (!userEnteredCode) {
        showStatus('أدخل الكود المكون من 4 أرقام', 'error');
        return;
    }

    // مقارنة الكود المدخل بالكود اللي أرسلناه لسوبابيس
    if (userEnteredCode === correctCode) {
        showStatus('🦾 تم التحقق بنجاح! جاري الدخول...', 'success');
        
        // حفظ تسجيل الدخول النهائي في المتصفح (عشان ما يطلب دخول مرة ثانية)
        localStorage.setItem('iron_user_phone', phone);
        
        // تنظيف البيانات المؤقتة لزيادة الأمان
        localStorage.removeItem('temp_otp');
        localStorage.removeItem('temp_phone');

        // التوجيه لصفحة الحساب
        const redirectUrl = localStorage.getItem('login_redirect') || 'profile.html';
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);
    } else {
        showStatus('❌ الكود غير صحيح، تأكد من الرسالة في واتساب أو اطلب كود جديد.', 'error');
    }
}

// --- الخدمات المساعدة لإظهار الرسائل ---
function showStatus(msg, type) {
    const messageDiv = document.getElementById('loginMessage');
    if (messageDiv) {
        messageDiv.innerHTML = msg;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }
}
