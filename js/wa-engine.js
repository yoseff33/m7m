const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');

// --- إعدادات سوبابيس (بياناتك التي أرفقتها) ---
const SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cmVjYWVha3Fic2p6ZWJjc3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjcxMDIsImV4cCI6MjA4Mjk0MzEwMn0.F0ro8tPzGP9-pDxEQV3RtSpxiCbtPZE5dlpSJDiyAZc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- إعدادات عميل الواتساب ---
const client = new Client({
    authStrategy: new LocalAuth(), // لحفظ الجلسة وعدم طلب QR كل مرة
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    }
});

// إظهار كود الـ QR في التيرمينال
client.on('qr', (qr) => {
    console.log('اربط جوالك الآن عبر مسح الكود التالي:');
    qrcode.generate(qr, { small: true });
});

// عند جاهزية الواتساب
client.on('ready', () => {
    console.log('🦾 نظام IRON+ جاهز للإرسال 24 ساعة!');
    listenToOTPRequests();
});

// --- وظيفة مراقبة الطلبات من سوبابيس ---
async function listenToOTPRequests() {
    console.log('👀 جاري مراقبة جدول otp_requests...');

    supabase
        .channel('otp_events')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'otp_requests' 
        }, async (payload) => {
            const { id, phone, code } = payload.new;

            try {
                // تنسيق الرقم السعودي (تحويل 05xxxx إلى 9665xxxx)
                let formattedPhone = phone.trim();
                if (formattedPhone.startsWith('0')) {
                    formattedPhone = '966' + formattedPhone.substring(1);
                }
                const chatId = formattedPhone + '@c.us';

                console.log(`📩 جاري إرسال كود (${code}) إلى الرقم: ${formattedPhone}`);

                // إرسال الرسالة
                await client.sendMessage(chatId, `كود التحقق الخاص بك لمتجر IRON+ هو: ${code} 🦾\nلا تشارك هذا الكود مع أي أحد.`);

                // تحديث الحالة في سوبابيس لضمان عدم التكرار
                await supabase
                    .from('otp_requests')
                    .update({ status: 'sent' })
                    .eq('id', id);

                console.log(`✅ تم الإرسال بنجاح للرقم: ${formattedPhone}`);

            } catch (error) {
                console.error('❌ خطأ في الإرسال:', error);
                await supabase
                    .from('otp_requests')
                    .update({ status: 'error' })
                    .eq('id', id);
            }
        })
        .subscribe();
}

// تشغيل المحرك
client.initialize();
