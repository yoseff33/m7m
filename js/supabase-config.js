// js/supabase-config.js
const SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
const SUPABASE_ANON_KEY = 'حط_هنا_الـ_ANON_KEY_حقك';

// استخدام اسم فريد لتجنب التعارض مع المكتبة
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// جعل العميل متاحاً لكل الملفات الأخرى
window.supabaseClient = supabaseClient;

// وظيفة مساعدة لتحويل السعر من هللة لريال
window.ironFormat = (price) => (price / 100).toFixed(0);
