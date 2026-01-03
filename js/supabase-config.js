// js/supabase-config.js
// بيانات المشروع من Supabase (Settings -> API)
const SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
const SUPABASE_ANON_KEY = 'حط_هنا_الـ_ANON_KEY_حقك';

// تهيئة العميل
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// وظائف مساعدة عامة
window.ironHelper = {
    // دالة تحويل السعر من هللة إلى ريال للعرض
    formatPrice(price) {
        return (price / 100).toFixed(0);
    },
    // دالة حفظ بيانات المنتج قبل الدفع
    saveToSession(product) {
        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
    }
};
