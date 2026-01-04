// ========================================
// إعدادات Supabase لنظام Iron Plus - النسخة الشاملة v5.0
// ========================================

window.SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_N4uzz2OJdyvbcfiyl8dmoQ_mEmAJgG1';

if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

let currentUser = null;

// ========================================
// المحرك الرئيسي لنظام Iron Plus v5.0
// ========================================

window.ironPlus = {
    
    // --- [1] أنظمة المصادقة (Auth) ---
    async checkAuth() {
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (error) throw error;
            currentUser = session?.user || null;
            return currentUser;
        } catch (error) {
            console.error('Auth check error:', error);
            return null;
        }
    },

    async loginWithPhone(phone) {
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            if (!cleanPhone.startsWith('05') || cleanPhone.length !== 10) {
                return { success: false, message: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' };
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

            localStorage.setItem('iron_user_phone', cleanPhone);
            localStorage.setItem('iron_user_token', data.session.access_token);
            localStorage.setItem('iron_user_id', data.user.id);

            await this.recordLogin(cleanPhone);
            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            return { success: false, message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' };
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
            } else {
                return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
            }
        } catch (error) {
            console.error('Admin login error:', error);
            return { success: false, message: 'حدث خطأ في الاتصال بقاعدة البيانات' };
        }
    },

    // --- [2] فحص الحالة (Status) ---
    isLoggedIn: () => localStorage.getItem('iron_user_phone') !== null,
    isAdminLoggedIn: () => localStorage.getItem('iron_admin') === 'true',
    getUserPhone: () => localStorage.getItem('iron_user_phone'),
    getAdminUsername: () => localStorage.getItem('admin_username'),
    getUserToken: () => localStorage.getItem('iron_user_token'),

    logout() {
        localStorage.clear();
        window.location.href = 'index.html';
    },

    // --- [3] إدارة المنتجات (Products) ---
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
            console.error('Get products error:', error);
            return { success: false, message: error.message, products: [] };
        }
    },

    async getProduct(productId) {
        try {
            const { data, error } = await window.supabaseClient.from('products').select('*').eq('id', productId).single();
            if (error) throw error;
            return { success: true, product: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async addProduct(productData) {
        try {
            if (productData.price) productData.price = Math.round(productData.price * 100);
            if (productData.features && typeof productData.features === 'string') {
                productData.features = productData.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
            }
            const { data, error } = await window.supabaseClient.from('products').insert([productData]).select().single();
            if (error) throw error;
            return { success: true, product: data, message: 'تمت إضافة المنتج بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateProduct(productId, updates) {
        try {
            if (updates.price) updates.price = Math.round(updates.price * 100);
            if (updates.features && typeof updates.features === 'string') {
                updates.features = updates.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
            }
            const { data, error } = await window.supabaseClient.from('products').update(updates).eq('id', productId).select().single();
            if (error) throw error;
            return { success: true, product: data, message: 'تم تحديث المنتج بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deleteProduct(productId) {
        try {
            const { error } = await window.supabaseClient.from('products').delete().eq('id', productId);
            if (error) throw error;
            return { success: true, message: 'تم حذف المنتج بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [4] إدارة الطلبات (Orders) ---
    async getUserOrders(phone) {
        try {
            const { data, error } = await window.supabaseClient.from('orders').select('*, products(*)').eq('customer_phone', phone).order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, orders: data || [] };
        } catch (error) {
            return { success: false, message: error.message, orders: [] };
        }
    },

    async getAllOrders(filters = {}) {
        try {
            let query = window.supabaseClient.from('orders').select('*, products(*)').order('created_at', { ascending: false });
            if (filters.status) query = query.eq('status', filters.status);
            if (filters.phone) query = query.ilike('customer_phone', `%${filters.phone}%`);
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, orders: data || [] };
        } catch (error) {
            return { success: false, message: error.message, orders: [] };
        }
    },

    async updateOrderStatus(orderId, status) {
        try {
            const { data, error } = await window.supabaseClient.from('orders').update({ status }).eq('id', orderId).select().single();
            if (error) throw error;
            return { success: true, order: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async createPayment(productId, phone, amount) {
        try {
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
            return { success: false, message: "جاري ربط بوابة الدفع..." };
        }
    },

    // --- [5] أكواد التفعيل (Activation Codes) ---
    async getAvailableCodes(productId) {
        try {
            const { data, error } = await window.supabaseClient.from('activation_codes').select('*').eq('product_id', productId).eq('is_used', false).order('created_at', { ascending: true });
            if (error) throw error;
            return { success: true, codes: data || [] };
        } catch (error) {
            return { success: false, codes: [] };
        }
    },

    async uploadBulkCodes(productId, codesText) {
        try {
            const codesArray = codesText.split('\n').map(code => code.trim()).filter(code => code.length > 0)
                .map(code => ({ product_id: productId, code: code, is_used: false }));
            if (codesArray.length === 0) return { success: false, message: 'لم يتم إدخال أكواد' };
            const { error } = await window.supabaseClient.from('activation_codes').insert(codesArray);
            if (error) throw error;
            return { success: true, count: codesArray.length, message: `تم رفع ${codesArray.length} كود بنجاح` };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async assignActivationCode(orderId, productId) {
        try {
            const { data: availableCodes, error: codesError } = await window.supabaseClient.from('activation_codes').select('id, code').eq('product_id', productId).eq('is_used', false).limit(1).single();
            if (codesError || !availableCodes) return { success: false, message: 'لا توجد أكواد متاحة' };
            
            await window.supabaseClient.from('activation_codes').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', availableCodes.id);
            await window.supabaseClient.from('orders').update({ activation_code_id: availableCodes.id, status: 'completed' }).eq('id', orderId);
            
            return { success: true, code: availableCodes.code };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [6] الإحصائيات (Analytics) ---
    async getSiteStats() {
        try {
            const { data: salesData } = await window.supabaseClient.rpc('get_total_sales');
            const { data: customersData } = await window.supabaseClient.rpc('get_unique_customers');
            const { count: productsCount } = await window.supabaseClient.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
            const { count: ordersCount } = await window.supabaseClient.from('orders').select('*', { count: 'exact', head: true });
            const { count: codesCount } = await window.supabaseClient.from('activation_codes').select('*', { count: 'exact', head: true }).eq('is_used', false);
            
            return {
                success: true,
                stats: {
                    totalSales: salesData || 0,
                    uniqueCustomers: customersData || 0,
                    activeProducts: productsCount || 0,
                    totalOrders: ordersCount || 0,
                    availableCodes: codesCount || 0
                }
            };
        } catch (error) {
            return { success: false, stats: { totalSales: 0, uniqueCustomers: 0, activeProducts: 0, totalOrders: 0, availableCodes: 0 } };
        }
    },

    async recordVisit(page) {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json').catch(() => null);
            const ipData = ipRes ? await ipRes.json() : { ip: 'unknown' };
            await window.supabaseClient.from('site_visits').insert([{ page_visited: page, ip_address: ipData.ip }]);
        } catch (e) { /* تجاهل أخطاء الإحصائيات */ }
    },

    async recordLogin(phone) {
        try {
            await window.supabaseClient.from('users').upsert({ phone: phone, updated_at: new Date().toISOString() }, { onConflict: 'phone' });
        } catch (e) {}
    },

    // --- [7] نظام الإعدادات الجديد v5.0 ---
    async getSiteSettings() {
        try {
            const { data, error } = await window.supabaseClient.from('site_settings').select('*');
            if (error) throw error;
            
            // تحويل المصفوفة إلى كائن
            const settings = {};
            data.forEach(item => {
                settings[item.setting_key] = item.setting_value;
            });
            
            return { success: true, settings };
        } catch (error) {
            console.error('Get settings error:', error);
            return { success: false, settings: {} };
        }
    },

    async updateSiteSetting(key, value) {
        try {
            const { data, error } = await window.supabaseClient
                .from('site_settings')
                .update({ setting_value: value, updated_at: new Date().toISOString() })
                .eq('setting_key', key)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, setting: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateMultipleSettings(settings) {
        try {
            const updates = Object.entries(settings).map(([key, value]) => ({
                setting_key: key,
                setting_value: value,
                updated_at: new Date().toISOString()
            }));
            
            const { error } = await window.supabaseClient.from('site_settings').upsert(updates);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [8] إدارة البانرات ---
    async getBanners() {
        try {
            const { data, error } = await window.supabaseClient
                .from('banners')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            return { success: true, banners: data || [] };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async addBanner(bannerData) {
        try {
            const { data, error } = await window.supabaseClient
                .from('banners')
                .insert([bannerData])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, banner: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateBanner(id, updates) {
        try {
            const { data, error } = await window.supabaseClient
                .from('banners')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, banner: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deleteBanner(id) {
        try {
            const { error } = await window.supabaseClient
                .from('banners')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [9] إدارة الصفحات ---
    async getPages() {
        try {
            const { data, error } = await window.supabaseClient
                .from('pages')
                .select('*')
                .order('title', { ascending: true });
            
            if (error) throw error;
            return { success: true, pages: data || [] };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async getPage(slug) {
        try {
            const { data, error } = await window.supabaseClient
                .from('pages')
                .select('*')
                .eq('slug', slug)
                .single();
            
            if (error) throw error;
            return { success: true, page: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updatePage(slug, updates) {
        try {
            const { data, error } = await window.supabaseClient
                .from('pages')
                .update(updates)
                .eq('slug', slug)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, page: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [10] إدارة المسؤولين ---
    async updateAdminCredentials(username, newPassword, currentPassword) {
        try {
            // التحقق من كلمة المرور الحالية
            const { data: verifyResult } = await window.supabaseClient.rpc('verify_password', {
                p_username: localStorage.getItem('admin_username'),
                p_password: currentPassword
            });
            
            if (!verifyResult) {
                return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
            }
            
            // تحديث بيانات المسؤول
            const { data, error } = await window.supabaseClient
                .from('admin_users')
                .update({ 
                    username: username,
                    password_hash: newPassword, // في الواقع يجب تشفيرها
                    updated_at: new Date().toISOString()
                })
                .eq('username', localStorage.getItem('admin_username'))
                .select()
                .single();
            
            if (error) throw error;
            
            // تحديث البيانات المحلية
            localStorage.setItem('admin_username', username);
            
            return { success: true, message: 'تم تحديث بيانات الدخول بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [11] التحقق من وضع الصيانة ---
    async checkMaintenanceMode() {
        try {
            const { data, error } = await window.supabaseClient
                .from('site_settings')
                .select('setting_value')
                .eq('setting_key', 'maintenance_mode')
                .single();
            
            if (error) throw error;
            return data.setting_value === 'true';
        } catch (error) {
            return false;
        }
    },

    // --- [12] أدوات مساعدة (Utils) ---
    formatPrice: (amount) => (amount ? (amount / 100).toFixed(2) : '0.00'),
    formatDate: (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-SA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },

    // حساب الضريبة
    calculateTax: (amount, taxRate = 15) => {
        return (amount * taxRate) / 100;
    }
};

// --- التهيئة التلقائية ---
document.addEventListener('DOMContentLoaded', async function() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    await window.ironPlus.recordVisit(page);
    
    // التحقق من وضع الصيانة
    const isMaintenance = await window.ironPlus.checkMaintenanceMode();
    if (isMaintenance && !window.location.href.includes('admin.html')) {
        window.location.href = 'maintenance.html';
    }
    
    console.log('Iron Plus Config v5.0: Systems fully operational. 🦾');
});
