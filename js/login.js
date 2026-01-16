// ========================================
// صفحة تسجيل الدخول لـ Iron Plus - نظام OTP عبر الواتساب
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Jarvis: Real OTP system initializing... 🦾');
    
    // إدارة التوجيه
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || 'profile.html';
    localStorage.setItem('login_redirect', redirectUrl);
    
    // التحقق من الجلسة النشطة
    if (localStorage.getItem('iron_user_phone')) {
        console.log('Active session detected. Redirecting...');
        window.location.href = redirectUrl;
        return;
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    const phoneInput = document.getElementById('phoneNumber');
    const otpInput = document.getElementById('otpInput'); // تأكد أن هذا الـ ID موجود في HTML

    if (phoneInput) {
        // ضغط Enter يرسل الكود
        phoneInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendOTP(); });
        
        // تنسيق الرقم
        phoneInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, ''); 
            if (val.length > 0 && !val.startsWith('05')) val = '05' + val;
            if (val.length > 10) val = val.substring(0, 10);
            e.target.value = val;
        });
    }

    if (otpInput) {
        otpInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') verifyOTP(); });
    }
}

// --- أولاً: إرسال الكود إلى Supabase ---
async function sendOTP() {
    const phoneInput = document.getElementById('phoneNumber');
    const phone = phoneInput.value.trim();
    
    if (!phone || phone.length !== 10 || !phone.startsWith('05')) {
        showStatus('يرجى إدخال رقم جوال صحيح يبدأ بـ 05', 'error');
        return;
    }

    // توليد كود عشوائي من 4 أرقام
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    showStatus('<i class="fas fa-spinner fa-spin"></i> جاري إرسال الكود لواتسابك...', 'info');

    try {
        // إرسال الطلب لجدول otp_requests في سوبابيس
        // السكربت الموجود على السيرفر (PM2) سيقوم بالباقي
        const { error } = await window.supabaseClient
            .from('otp_requests')
            .insert([{ 
                phone: phone, 
                code: generatedCode,
                status: 'pending' 
            }]);

        if (error) throw error;

        // حفظ البيانات مؤقتاً للتحقق منها لاحقاً
        localStorage.setItem('temp_phone', phone);
        localStorage.setItem('temp_otp', generatedCode);

        showStatus('✅ تم إرسال الكود! تفقد رسائل الواتساب وأدخله هنا:', 'success');
        
        // إظهار قسم إدخال الكود (OTP Section)
        const otpSection = document.getElementById('otpSection');
        if (otpSection) {
            otpSection.style.display = 'block';
            phoneInput.disabled = true; // تعطيل تغيير الرقم مؤقتاً
        }

    } catch (error) {
        console.error('OTP Send Error:', error);
        showStatus('فشل في إرسال الكود، حاول مرة أخرى.', 'error');
    }
}

// --- ثانياً: التحقق من الكود الذي أدخله المستخدم ---
async function verifyOTP() {
    const otpInput = document.getElementById('otpInput');
    const userEnteredCode = otpInput.value.trim();
    const correctCode = localStorage.getItem('temp_otp');
    const phone = localStorage.getItem('temp_phone');

    if (!userEnteredCode) {
        showStatus('أدخل الكود المكون من 4 أرقام', 'error');
        return;
    }

    if (userEnteredCode === correctCode) {
        showStatus('🦾 تم التحقق بنجاح! جاري الدخول...', 'success');
        
        // حفظ تسجيل الدخول النهائي
        localStorage.setItem('iron_user_phone', phone);
        
        // تنظيف البيانات المؤقتة
        localStorage.removeItem('temp_otp');
        localStorage.removeItem('temp_phone');

        // التوجيه
        const redirectUrl = localStorage.getItem('login_redirect') || 'profile.html';
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);
    } else {
        showStatus('❌ الكود غير صحيح، تأكد من الرسالة في واتساب.', 'error');
    }
}

// --- الخدمات المساعدة ---
function showStatus(msg, type) {
    const messageDiv = document.getElementById('loginMessage');
    if (messageDiv) {
        messageDiv.innerHTML = msg;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }
}
