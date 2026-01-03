// login.js - منطق تسجيل الدخول
document.addEventListener('DOMContentLoaded', function() {
    // التحقق إذا كان هناك منتج محدد في الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    if (productId) {
        localStorage.setItem('pending_product', productId);
    }
});

async function sendOTP() {
    const phone = document.getElementById('phoneNumber').value;
    const messageDiv = document.getElementById('loginMessage');
    
    messageDiv.style.display = 'none';
    
    if (!phone || !phone.startsWith('05') || phone.length !== 10) {
        showMessage('يرجى إدخال رقم جوال صحيح (يبدأ بـ 05 و 10 أرقام)', 'error');
        return;
    }
    
    try {
        const result = await window.ironPlus.loginWithPhone(phone);
        
        if (result.success) {
            // الانتقال لخطوة إدخال الرمز
            document.getElementById('phoneStep').style.display = 'none';
            document.getElementById('otpStep').style.display = 'block';
            
            showMessage('تم إرسال رمز التحقق لرقمك', 'success');
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        showMessage('حدث خطأ في إرسال رمز التحقق', 'error');
    }
}

async function verifyOTP() {
    const phone = document.getElementById('phoneNumber').value;
    const otp = document.getElementById('otpCode').value;
    const messageDiv = document.getElementById('loginMessage');
    
    messageDiv.style.display = 'none';
    
    if (!otp || otp.length !== 6) {
        showMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام', 'error');
        return;
    }
    
    try {
        const result = await window.ironPlus.verifyOTP(phone, otp);
        
        if (result.success) {
            showMessage('تم تسجيل الدخول بنجاح', 'success');
            
            // التحقق إذا كان هناك منتج معلق للشراء
            const pendingProduct = localStorage.getItem('pending_product');
            
            setTimeout(() => {
                if (pendingProduct) {
                    // توجيه للصفحة الرئيسية مع المنتج المحدد
                    localStorage.removeItem('pending_product');
                    window.location.href = `index.html?product=${pendingProduct}`;
                } else {
                    // توجيه لصفحة الملف الشخصي
                    window.location.href = 'profile.html';
                }
            }, 1000);
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showMessage('حدث خطأ في التحقق من الرمز', 'error');
    }
}

function goBackToPhone() {
    document.getElementById('otpStep').style.display = 'none';
    document.getElementById('phoneStep').style.display = 'block';
    document.getElementById('loginMessage').style.display = 'none';
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('loginMessage');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}
