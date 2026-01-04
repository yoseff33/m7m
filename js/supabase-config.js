// ========================================
// إعدادات Supabase لنظام Iron Plus - النسخة الشاملة v5.5
// ========================================

// 1. التعريفات العالمية (لضمان وصول جميع الملفات لها)
window.SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_N4uzz2OJdyvbcfiyl8dmoQ_mEmAJgG1';

// 2. تهيئة العميل (تجنب خطأ Identifier has already been declared)
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

// متغير مصادقة محلي
let currentUser = null;

// ========================================
// المحرك الرئيسي لنظام Iron Plus v5.5
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
            // استدعاء RPC verify_password
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

    async createOrder(productId, phone, amount, couponCode = null) {
        try {
            // التحقق من الكوبون إذا كان موجودًا
            let finalAmount = amount;
            let couponId = null;
            if (couponCode) {
                const couponRes = await this.validateCoupon(couponCode, productId);
                if (!couponRes.success) {
                    return couponRes; // خطأ في الكوبون
                }
                finalAmount = couponRes.finalAmount;
                couponId = couponRes.couponId;
            }

            // إنشاء الطلب
            const orderData = {
                product_id: productId,
                customer_phone: phone,
                amount: finalAmount,
                original_amount: amount,
                status: finalAmount === 0 ? 'completed' : 'pending', // إذا كان المبلغ النهائي 0، فالطلب مكتمل
                coupon_id: couponId
            };

            const { data, error } = await window.supabaseClient.from('orders').insert([orderData]).select().single();
            if (error) throw error;

            // إذا كان الطلب مكتمل (مبلغ 0) نقوم بتعيين كود التفعيل مباشرة
            if (finalAmount === 0) {
                const assignRes = await this.assignActivationCode(data.id, productId);
                if (assignRes.success) {
                    data.activation_code = assignRes.code;
                }
            }

            return { success: true, order: data, finalAmount: finalAmount };
        } catch (error) {
            return { success: false, message: error.message };
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

    // --- [6] الكوبونات (Coupons) ---

    async getCoupons() {
        try {
            const { data, error } = await window.supabaseClient.from('coupons').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, coupons: data || [] };
        } catch (error) {
            return { success: false, message: error.message, coupons: [] };
        }
    },

    async getCoupon(couponId) {
        try {
            const { data, error } = await window.supabaseClient.from('coupons').select('*').eq('id', couponId).single();
            if (error) throw error;
            return { success: true, coupon: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async validateCoupon(code, productId) {
        try {
            const { data, error } = await window.supabaseClient.from('coupons').select('*').eq('code', code).eq('is_active', true).single();
            if (error) throw error;

            // التحقق من تاريخ الصلاحية
            const now = new Date();
            const validFrom = new Date(data.valid_from);
            const validTo = new Date(data.valid_to);
            if (now < validFrom || now > validTo) {
                return { success: false, message: 'الكوبون منتهي الصلاحية أو غير فعال حالياً' };
            }

            // التحقق من المنتج إذا كان الكوبون خاصاً بمنتج معين
            if (data.product_id && data.product_id !== productId) {
                return { success: false, message: 'هذا الكوبون غير صالح لهذا المنتج' };
            }

            // حساب المبلغ بعد الخصم
            let finalAmount = 0;
            if (data.discount_type === 'percentage') {
                finalAmount = data.original_amount - (data.original_amount * data.discount_value / 100);
            } else if (data.discount_type === 'fixed') {
                finalAmount = data.original_amount - data.discount_value;
            }
            if (finalAmount < 0) finalAmount = 0;

            return { success: true, finalAmount: finalAmount, couponId: data.id };
        } catch (error) {
            return { success: false, message: 'كود الخصم غير صحيح' };
        }
    },

    async addCoupon(couponData) {
        try {
            const { data, error } = await window.supabaseClient.from('coupons').insert([couponData]).select().single();
            if (error) throw error;
            return { success: true, coupon: data, message: 'تمت إضافة الكوبون بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateCoupon(couponId, updates) {
        try {
            const { data, error } = await window.supabaseClient.from('coupons').update(updates).eq('id', couponId).select().single();
            if (error) throw error;
            return { success: true, coupon: data, message: 'تم تحديث الكوبون بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deleteCoupon(couponId) {
        try {
            const { error } = await window.supabaseClient.from('coupons').delete().eq('id', couponId);
            if (error) throw error;
            return { success: true, message: 'تم حذف الكوبون بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [7] الإعدادات (Site Settings) ---

    async getSiteSettings() {
        try {
            const { data, error } = await window.supabaseClient.from('site_settings').select('*');
            if (error) throw error;

            // تحويل البيانات من صفيف إلى كائن
            const settings = {};
            data.forEach(item => {
                settings[item.key] = item.value;
            });
            return { success: true, settings: settings };
        } catch (error) {
            return { success: false, message: error.message, settings: {} };
        }
    },

    async updateSiteSettings(settings) {
        try {
            // تحويل الكائن إلى صفيف من السجلات
            const updates = Object.keys(settings).map(key => ({
                key: key,
                value: settings[key]
            }));

            // استخدام upsert لتحديث الإعدادات
            const { error } = await window.supabaseClient.from('site_settings').upsert(updates, { onConflict: 'key' });
            if (error) throw error;
            return { success: true, message: 'تم تحديث الإعدادات بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [8] البانرات (Banners) ---

    async getBanners() {
        try {
            const { data, error } = await window.supabaseClient.from('banners').select('*').order('sort_order', { ascending: true });
            if (error) throw error;
            return { success: true, banners: data || [] };
        } catch (error) {
            return { success: false, message: error.message, banners: [] };
        }
    },

    async getBanner(bannerId) {
        try {
            const { data, error } = await window.supabaseClient.from('banners').select('*').eq('id', bannerId).single();
            if (error) throw error;
            return { success: true, banner: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async addBanner(bannerData) {
        try {
            const { data, error } = await window.supabaseClient.from('banners').insert([bannerData]).select().single();
            if (error) throw error;
            return { success: true, banner: data, message: 'تمت إضافة البانر بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateBanner(bannerId, updates) {
        try {
            const { data, error } = await window.supabaseClient.from('banners').update(updates).eq('id', bannerId).select().single();
            if (error) throw error;
            return { success: true, banner: data, message: 'تم تحديث البانر بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deleteBanner(bannerId) {
        try {
            const { error } = await window.supabaseClient.from('banners').delete().eq('id', bannerId);
            if (error) throw error;
            return { success: true, message: 'تم حذف البانر بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [9] الصفحات (Pages) ---

    async getPages() {
        try {
            const { data, error } = await window.supabaseClient.from('pages').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, pages: data || [] };
        } catch (error) {
            return { success: false, message: error.message, pages: [] };
        }
    },

    async getPage(pageId) {
        try {
            const { data, error } = await window.supabaseClient.from('pages').select('*').eq('id', pageId).single();
            if (error) throw error;
            return { success: true, page: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async getPageBySlug(slug) {
        try {
            const { data, error } = await window.supabaseClient.from('pages').select('*').eq('slug', slug).single();
            if (error) throw error;
            return { success: true, page: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async addPage(pageData) {
        try {
            const { data, error } = await window.supabaseClient.from('pages').insert([pageData]).select().single();
            if (error) throw error;
            return { success: true, page: data, message: 'تمت إضافة الصفحة بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updatePage(pageId, updates) {
        try {
            const { data, error } = await window.supabaseClient.from('pages').update(updates).eq('id', pageId).select().single();
            if (error) throw error;
            return { success: true, page: data, message: 'تم تحديث الصفحة بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deletePage(pageId) {
        try {
            const { error } = await window.supabaseClient.from('pages').delete().eq('id', pageId);
            if (error) throw error;
            return { success: true, message: 'تم حذف الصفحة بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [10] الإحصائيات (Analytics) ---

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

    // --- [11] أدوات مساعدة (Utils) ---

    formatPrice: (amount) => (amount ? (amount / 100).toFixed(2) : '0.00'),
    formatDate: (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
};

// --- التهيئة التلقائية ---
document.addEventListener('DOMContentLoaded', async function() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    await window.ironPlus.recordVisit(page);
    console.log('Iron Plus Config v5.5: Systems fully operational. 🦾');
});
