// ========================================
// إعدادات Supabase لنظام Iron Plus - النسخة العالمية المصححة
// ========================================

// تعريف الثوابت على مستوى المتصفح لضمان وصول كل الملفات لها
window.SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_N4uzz2OJdyvbcfiyl8dmoQ_mEmAJgG1';

// تهيئة العميل باسم فريد لتجنب خطأ SyntaxError
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

// بناء كائن ironPlus الشامل (The Brain)
window.ironPlus = {
    // --- أنظمة التحقق ---
    isLoggedIn: () => localStorage.getItem('iron_user_phone') !== null,
    isAdminLoggedIn: () => localStorage.getItem('iron_admin') === 'true',
    getUserPhone: () => localStorage.getItem('iron_user_phone'),
    getAdminUsername: () => localStorage.getItem('admin_username'),

    // --- إدارة المنتجات ---
    async getProducts() {
        try {
            const { data, error } = await window.supabaseClient
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });
            if (error) throw error;
            return { success: true, products: data || [] };
        } catch (e) { return { success: false, message: e.message }; }
    },

    async getProduct(id) {
        try {
            const { data, error } = await window.supabaseClient.from('products').select('*').eq('id', id).single();
            if (error) throw error;
            return { success: true, product: data };
        } catch (e) { return { success: false, message: e.message }; }
    },

    // --- إدارة الطلبات والدفع ---
    async createPayment(productId, phone, amount) {
        try {
            const response = await fetch(`${window.SUPABASE_URL}/functions/v1/create_paylink`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId, customer_phone: phone, amount: amount })
            });
            const data = await response.json();
            return { success: true, data: data };
        } catch (e) { return { success: false, message: "بوابة الدفع قيد التشغيل" }; }
    },

    async getUserOrders(phone) {
        try {
            const { data, error } = await window.supabaseClient.from('orders').select('*, products(*)').eq('customer_phone', phone).order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, orders: data || [] };
        } catch (e) { return { success: false, orders: [] }; }
    },

    // --- إدارة الأكواد ---
    async uploadBulkCodes(productId, codesText) {
        try {
            const codes = codesText.split('\n').map(c => c.trim()).filter(c => c !== "")
                .map(c => ({ product_id: productId, code: c, is_used: false }));
            const { error } = await window.supabaseClient.from('activation_codes').insert(codes);
            if (error) throw error;
            return { success: true, count: codes.length };
        } catch (e) { return { success: false, message: e.message }; }
    },

    async assignActivationCode(orderId, productId) {
        try {
            const { data: codeData, error: cErr } = await window.supabaseClient.from('activation_codes').select('id, code').eq('product_id', productId).eq('is_used', false).limit(1).single();
            if (cErr || !codeData) return { success: false, message: 'لا توجد أكواد' };
            await window.supabaseClient.from('activation_codes').update({ is_used: true, used_at: new Date() }).eq('id', codeData.id);
            await window.supabaseClient.from('orders').update({ activation_code_id: codeData.id, status: 'completed' }).eq('id', orderId);
            return { success: true, code: codeData.code };
        } catch (e) { return { success: false, message: e.message }; }
    },

    // --- الإحصائيات والزيارات ---
    async getSiteStats() {
        try {
            const { data: sales } = await window.supabaseClient.rpc('get_total_sales');
            const { count: pCount } = await window.supabaseClient.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
            const { count: oCount } = await window.supabaseClient.from('orders').select('*', { count: 'exact', head: true });
            const { count: cCount } = await window.supabaseClient.from('activation_codes').select('*', { count: 'exact', head: true }).eq('is_used', false);
            return { success: true, stats: { totalSales: sales || 0, activeProducts: pCount || 0, totalOrders: oCount || 0, availableCodes: cCount || 0 } };
        } catch (e) { return { success: false, stats: {} }; }
    },

    async recordVisit(page) {
        try {
            await window.supabaseClient.from('site_visits').insert([{ page_visited: page }]);
        } catch (e) { /* صمت */ }
    },

    // --- الأدوات ---
    formatPrice: (val) => (val / 100).toFixed(2),
    formatDate: (str) => str ? new Date(str).toLocaleDateString('ar-SA') : '',
    logout: () => { localStorage.clear(); window.location.href = 'index.html'; }
};

console.log('Iron Plus Config: Systems fully operational. 🦾');
