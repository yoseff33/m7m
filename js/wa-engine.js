const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');

// --- إعدادات سوبابيس (بياناتك الخاصة) ---
const SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
const SUPABASE_KEY = 'ضغ_هنا_مفتاح_service_role_الخاص_بك'; // استبدل هذا بالمفتاح الطويل من إعدادات سوبابيس

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- إعدادات عميل الواتساب ---
const client = new Client({
    authStrategy: new LocalAuth(), // لحفظ الجلسة وعدم طلب الكود كل مرة
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
        ]
    }
});

// طباعة كود الـ QR في التيرمينال للمسح
client.on('qr', (qr) => {
    console.log('يرجى مسح كود الـ QR التالي للربط:');
    qrcode.generate(qr, { small: true });
});

// عندما يصبح الواتساب جاهزاً
client.on('ready', () => {
    console.log('✅ تم تشغيل نظام الواتساب بنجاح وهو الآن جاهز لإرسال الأكواد!');
    listenToOTPRequests();
});

// وظيفة مراقبة الطلبات الجديدة في سوبابيس (Realtime)
async function listenToOTPRequests() {
    console.log('📡 جاري مراقبة جدول otp_requests بحثاً عن طلبات جديدة...');

    supabase
        .channel('any') // فتح قناة اتصال حية
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'otp_requests' 
        }, async (payload) => {
            const { id, phone, code } = payload.new;
            console.log(`📩 طلب جديد مكتشف للرقم: ${phone}`);

            try {
                // 1. تنظيف الرقم وتنسيقه (تحويل 05xxxxxxxx إلى 9665xxxxxxxx)
                let formattedPhone = phone.trim();
                if (formattedPhone.startsWith('0')) {
                    formattedPhone = '966' + formattedPhone.substring(1);
                }
                const chatId = formattedPhone + "@c.us";

                // 2. إرسال الرسالة
                const message = `كود التحقق الخاص بك لمتجر IRON+ هو: ${code} 🦾`;
                await client.sendMessage(chatId, message);
                console.log(`🚀 تم إرسال الكود [${code}] إلى الرقم [${formattedPhone}] بنجاح.`);

                // 3. تحديث حالة الطلب في سوبابيس إلى "تم الإرسال"
                const { error } = await supabase
                    .from('otp_requests')
                    .update({ status: 'sent' })
                    .eq('id', id);

                if (error) throw error;

            } catch (err) {
                console.error(`❌ فشل الإرسال للرقم ${phone}:`, err.message);
                
                // تحديث الحالة إلى خطأ في سوبابيس
                await supabase
                    .from('otp_requests')
                    .update({ status: 'error' })
                    .eq('id', id);
            }
        })
        .subscribe();
}

// تشغيل العميل
client.initialize();
