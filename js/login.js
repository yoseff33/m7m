// js/login.js
async function sendOTP() {
    const phone = document.getElementById('userPhone').value;
    if (!phone.startsWith('05')) return alert('حط رقم جوال سعودي صح');

    // استدعاء الـ Edge Function اللي سويناها
    const { data, error } = await supabaseClient.functions.invoke('send-whatsapp-otp', {
        body: { phone: phone }
    });

    if (!error) {
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
        localStorage.setItem('temp_phone', phone);
    } else {
        alert('فشل إرسال الواتساب، تأكد من تشغيل السيرفر');
    }
}

async function verifyOTP() {
    const code = document.getElementById('otpCode').value;
    const phone = localStorage.getItem('temp_phone');

    const { data, error } = await supabaseClient.auth.verifyOtp({
        phone: phone,
        token: code,
        type: 'sms'
    });

    if (!error) {
        localStorage.setItem('iron_user_phone', phone);
        window.location.href = 'profile.html';
    } else {
        alert('الرمز غلط، حاول مرة ثانية');
    }
}
