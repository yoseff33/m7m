// ========================================
// إعدادات Supabase لنظام Iron Plus - النسخة النهائية الشاملة
// ========================================

// 1. التعريفات العالمية (Global Constants)
// جعلناها في window لضمان وصول ملف index.js و admin.js لها بدون ReferenceError
window.SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_N4uzz2OJdyvbcfiyl8dmoQ_mEmAJgG1';

// 2. تهيئة العميل (Client Initialization)
// استخدام window.supabaseClient لتجنب خطأ "Identifier has already been declared"
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

// متغير الحالة المحلي
let currentUser = null;

// ========================================
// المحرك الرئيسي (Iron Plus Core Engine)
// ========================================

window.ironPlus = {
    
    // --- [1] المصادقة والتحقق (Auth) ---

    async checkAuth() {
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (error) throw error;
            currentUser = session?.user || null;
            return currentUser;
        } catch (error) {
            console.error('Auth error:', error);
            return null;
        }
    },

    async loginWithPhone(phone) {
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            if (!cleanPhone.startsWith('05') || cleanPhone.length !== 10) {
                return { success: false, message: 'رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' };
            }
            const { error } = await window.supabaseClient.auth.signInWithOtp({
                phone: `+966${cleanPhone.substring(1)}`,
                options: { channel: 'sms', shouldCreateUser: true }
            });
            if (error) throw error;
            return { success: true, message: 'تم إرسال رمز التحقق بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async verifyOTP(phone, token) {
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const { data, error } = await window.supabaseClient.auth.verifyOtp({
                phone: `+966${cleanPhone.substring(1)}`,
                token: token,
                type: 'sms'
            });
            if (error) throw error;

            // حفظ البيانات محلياً
            localStorage.setItem('iron_user_phone', cleanPhone);
            localStorage.setItem('iron_user_token', data.session.access_token);
            localStorage.setItem('iron_user_id', data.user.id);

            await this.recordLogin(cleanPhone);
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, message: 'رمز التحقق غير صحيح' };
        }
    },

    async adminLogin(username, password) {
        try {
            const { data, error } = await window.supabaseClient.rpc('verify_password', {
                p_username: username,
                p_password: password
            });
            if (error) throw error;

            if (data === true) {
                localStorage.setItem('iron_admin', 'true');
                localStorage.setItem('admin_username', username);
                localStorage.setItem('admin_login_time', new Date().toISOString());
                return { success: true };
            }
            return { success: false, message: 'بيانات الدخول غير صحيحة' };
        } catch (error) {
            return { success: false, message: 'خطأ في الاتصال بقاعدة البيانات' };
        }
    },

    logout() {
        localStorage.clear();
        window.location.href = 'index.html';
    },

    logoutAdmin() {
        localStorage.removeItem('iron_admin');
        localStorage.removeItem('admin_username');
        window.location.href = 'admin.html';
    },

    // --- [2] فحص الحالة (Status Helpers) ---

    isLoggedIn: () => localStorage.getItem('iron_user_phone') !== null,
    isAdminLoggedIn: () => localStorage.getItem('iron_admin') === 'true',
    getUserPhone: () => localStorage.getItem('iron_user_phone'),
    getAdminUsername: () => localStorage.getItem('admin_username'),

    // --- [3] المنتجات (Products) ---

    async getProducts() {
        try {
            const { data, error } = await window.supabaseClient
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });
            if (error) throw error;
            return { success: true, products: data || [] };
        } catch (error) {
            return { success: false, products: [] };
        }
    },

    async getProduct(productId) {
        try {
            const { data, error } = await window.supabaseClient.from('products').select('*').eq('id', productId).single();
            if (error) throw error;
            return { success: true, product: data };
        } catch (error) {
            return { success: false };
        }
    },

    async addProduct(productData) {
        if (productData.price) productData.price = Math.round(productData.price * 100);
        const { data, error } = await window.supabaseClient.from('products').insert([productData]).select().single();
        return error ? { success: false, message: error.message } : { success: true, product: data };
    },

    async updateProduct(productId, updates) {
        if (updates.price) updates.price = Math.round(updates.price * 100);
        const { data, error } = await window.supabaseClient.from('products').update(updates).eq('id', productId).select().single();
        return error ? { success: false, message: error.message } : { success: true, product: data };
    },

    async deleteProduct(productId) {
        const { error } = await window.supabaseClient.from('products').delete().eq('id', productId);
        return error ? { success: false } : { success: true };
    },

    // --- [4] الطلبات والدفع (Orders & Payments) ---

    async getUserOrders(phone) {
        const { data, error } = await window.supabaseClient.from('orders').select('*, products(*)').eq('customer_phone', phone).order('created_at', { ascending: false });
        return error ? { success: false, orders: [] } : { success: true, orders: data };
    },

    async getAllOrders(filters = {}) {
        let query = window.supabaseClient.from('orders').select('*, products(*)').order('created_at', { ascending: false });
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.phone) query = query.ilike('customer_phone', `%${filters.phone}%`);
        const { data, error } = await query;
        return error ? { success: false, orders: [] } : { success: true, orders: data };
    },

    async updateOrderStatus(orderId, status) {
        const { data, error } = await window.supabaseClient.from('orders').update({ status }).eq('id', orderId).select().single();
        return error ? { success: false } : { success: true, order: data };
    },

    async createPayment(productId, phone, amount) {
        try {
            // استدعاء Edge Function الخاص بـ Paylink
            const response = await fetch(`${window.SUPABASE_URL}/functions/v1/create_paylink`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ product_id: productId, customer_phone: phone, amount: amount })
            });
            const data = await response.json();
            return { success: true, data: data };
        } catch (e) {
            return { success: false, message: "بوابة الدفع غير متاحة حالياً" };
        }
    },

    // --- [5] الأكواد (Activation Codes) ---

    async getAvailableCodes(productId) {
        const { data, error } = await window.supabaseClient.from('activation_codes').select('*').eq('product_id', productId).eq('is_used', false);
        return error ? { success: false, codes: [] } : { success: true, codes: data };
    },

    async uploadBulkCodes(productId, codesText) {
        const codes = codesText.split('\n').map(c => c.trim()).filter(c => c.length > 0)
            .map(c => ({ product_id: productId, code: c, is_used: false }));
        const { error } = await window.supabaseClient.from('activation_codes').insert(codes);
        return error ? { success: false } : { success: true, count: codes.length };
    },

    async assignActivationCode(orderId, productId) {
        const { data: code, error: cErr } = await window.supabaseClient.from('activation_codes').select('id, code').eq('product_id', productId).eq('is_used', false).limit(1).single();
        if (cErr || !code) return { success: false, message: 'نفذت الأكواد' };
        
        await window.supabaseClient.from('activation_codes').update({ is_used: true, used_at: new Date() }).eq('id', code.id);
        await window.supabaseClient.from('orders').update({ activation_code_id: code.id, status: 'completed' }).eq('id', orderId);
        return { success: true, code: code.code };
    },

    // --- [6] الإحصائيات والزيارات (Stats) ---

    async getSiteStats() {
        try {
            const { data: sales } = await window.supabaseClient.rpc('get_total_sales');
            const { count: pCount } = await window.supabaseClient.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
            const { count: oCount } = await window.supabaseClient.from('orders').select('*', { count: 'exact', head: true });
            const { count: cCount } = await window.supabaseClient.from('activation_codes').select('*', { count: 'exact', head: true }).eq('is_used', false);
            return { success: true, stats: { totalSales: sales || 0, activeProducts: pCount || 0, totalOrders: oCount || 0, availableCodes: cCount || 0 } };
        } catch (e) { return { success: false, stats: { totalSales: 0, activeProducts: 0, totalOrders: 0, availableCodes: 0 } }; }
    },

    async recordVisit(page) {
        try {
            await window.supabaseClient.from('site_visits').insert([{ page_visited: page }]);
        } catch (e) { console.warn('Analytics offline'); }
    },

    async recordLogin(phone) {
        try {
            await window.supabaseClient.from('users').upsert({ phone: phone, updated_at: new Date() }, { onConflict: 'phone' });
        } catch (e) {}
    },

    // --- [7] الأدوات (Utilities) ---

    formatPrice: (val) => (val / 100).toFixed(2),
    formatDate: (str) => str ? new Date(str).toLocaleDateString('ar-SA', { year:'numeric', month:'long', day:'numeric' }) : ''
};

// التهيئة التلقائية عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    window.ironPlus.recordVisit(page);
    console.log('Iron Plus Config: Systems fully operational. 🦾');
});
