// ========================================
// إعدادات Supabase لنظام Iron Plus - النسخة الكاملة الشاملة
// ========================================

// 1. التهيئة الأساسية
const SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_N4uzz2OJdyvbcfiyl8dmoQ_mEmAJgG1';

// تهيئة عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabase; // للتوافق مع الأكواد الأخرى

// متغير حالة المصادقة
let currentUser = null;

// ========================================
// دوال المصادقة والتحقق (Authentication)
// ========================================

async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) { console.error('Auth check error:', error); return null; }
        currentUser = session?.user || null;
        return currentUser;
    } catch (error) {
        console.error('Check auth error:', error);
        return null;
    }
}

async function loginWithPhone(phone) {
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('05') || cleanPhone.length !== 10) {
            return { success: false, message: 'رقم الهاتف غير صالح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' };
        }
        const { data, error } = await supabase.auth.signInWithOtp({
            phone: `+966${cleanPhone.substring(1)}`,
            options: { channel: 'sms', shouldCreateUser: true }
        });
        if (error) throw error;
        return { success: true, message: 'تم إرسال رمز التحقق إلى هاتفك' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: error.message || 'فشل في إرسال رمز التحقق' };
    }
}

async function verifyOTP(phone, token) {
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        const { data, error } = await supabase.auth.verifyOtp({
            phone: `+966${cleanPhone.substring(1)}`,
            token: token,
            type: 'sms'
        });
        if (error) throw error;
        
        // حفظ البيانات محلياً
        localStorage.setItem('iron_user_phone', cleanPhone);
        localStorage.setItem('iron_user_token', data.session.access_token);
        localStorage.setItem('iron_user_id', data.user.id);
        
        await recordLogin(cleanPhone);
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('OTP verification error:', error);
        return { success: false, message: error.message || 'رمز التحقق غير صحيح' };
    }
}

async function adminLogin(username, password) {
    try {
        const { data, error } = await supabase.rpc('verify_password', {
            p_username: username,
            p_password: password
        });
        if (error) throw error;
        if (data) {
            localStorage.setItem('iron_admin', 'true');
            localStorage.setItem('admin_username', username);
            localStorage.setItem('admin_login_time', new Date().toISOString());
            return { success: true };
        } else {
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
    } catch (error) {
        console.error('Admin login error:', error);
        return { success: false, message: 'حدث خطأ في الاتصال بالسيرفر' };
    }
}

function logout() {
    localStorage.removeItem('iron_user_phone');
    localStorage.removeItem('iron_user_token');
    localStorage.removeItem('iron_user_id');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_login_time');
    window.location.href = 'index.html';
}

function logoutAdmin() {
    localStorage.removeItem('iron_admin');
    localStorage.removeItem('admin_username');
    window.location.href = 'admin.html';
}

// ========================================
// دوال المنتجات (Products)
// ========================================

async function getProducts() {
    try {
        const { data, error } = await supabase
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
}

async function getProduct(productId) {
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
        if (error) throw error;
        return { success: true, product: data };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function addProduct(productData) {
    try {
        if (productData.price) productData.price = Math.round(productData.price * 100);
        if (productData.features && typeof productData.features === 'string') {
            productData.features = productData.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
        }
        const { data, error } = await supabase.from('products').insert([productData]).select().single();
        if (error) throw error;
        return { success: true, product: data, message: 'تم إضافة المنتج بنجاح' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function updateProduct(productId, updates) {
    try {
        if (updates.price) updates.price = Math.round(updates.price * 100);
        if (updates.features && typeof updates.features === 'string') {
            updates.features = updates.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
        }
        const { data, error } = await supabase.from('products').update(updates).eq('id', productId).select().single();
        if (error) throw error;
        return { success: true, product: data };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function deleteProduct(productId) {
    try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;
        return { success: true, message: 'تم حذف المنتج بنجاح' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ========================================
// دوال الطلبات (Orders)
// ========================================

async function getUserOrders(phone) {
    try {
        const { data, error } = await supabase.from('orders').select('*, products (*)').eq('customer_phone', phone).order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, orders: data || [] };
    } catch (error) {
        return { success: false, orders: [] };
    }
}

async function getAllOrders(filters = {}) {
    try {
        let query = supabase.from('orders').select('*, products (*)').order('created_at', { ascending: false });
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.phone) query = query.ilike('customer_phone', `%${filters.phone}%`);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, orders: data || [] };
    } catch (error) {
        return { success: false, orders: [] };
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select().single();
        if (error) throw error;
        return { success: true, order: data };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ========================================
// دوال أكواد التفعيل (Activation Codes)
// ========================================

async function getAvailableCodes(productId) {
    try {
        const { data, error } = await supabase.from('activation_codes').select('*').eq('product_id', productId).eq('is_used', false);
        if (error) throw error;
        return { success: true, codes: data || [] };
    } catch (error) {
        return { success: false, codes: [] };
    }
}

async function uploadBulkCodes(productId, codesText) {
    try {
        const codesArray = codesText.split('\n').map(code => code.trim()).filter(code => code.length > 0)
            .map(code => ({ product_id: productId, code: code, is_used: false }));
        if (codesArray.length === 0) return { success: false, message: 'لا توجد أكواد' };
        const { data, error } = await supabase.from('activation_codes').insert(codesArray);
        if (error) throw error;
        return { success: true, count: codesArray.length };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function assignActivationCode(orderId, productId) {
    try {
        const { data: codeData, error: codeError } = await supabase.from('activation_codes').select('id, code').eq('product_id', productId).eq('is_used', false).limit(1).single();
        if (codeError || !codeData) return { success: false, message: 'لا توجد أكواد متاحة' };
        
        await supabase.from('activation_codes').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', codeData.id);
        await supabase.from('orders').update({ activation_code_id: codeData.id, status: 'completed' }).eq('id', orderId);
        
        return { success: true, code: codeData.code };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ========================================
// دوال الإحصائيات (Analytics & Visits)
// ========================================

async function getSiteStats() {
    try {
        const { data: sales } = await supabase.rpc('get_total_sales');
        const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
        const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        return { success: true, stats: { totalSales: sales || 0, activeProducts: pCount || 0, totalOrders: oCount || 0 } };
    } catch (error) {
        return { success: false, stats: {} };
    }
}

async function recordVisit(page) {
    try {
        const ip = await getClientIP();
        await supabase.from('site_visits').insert([{ page_visited: page, ip_address: ip }]);
    } catch (e) { console.warn('Record visit failed'); }
}

async function recordLogin(phone) {
    try {
        await supabase.from('users').upsert({ phone: phone, updated_at: new Date().toISOString() }, { onConflict: 'phone' });
    } catch (e) { console.warn('Record login failed'); }
}

async function getClientIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (e) { return null; }
}

// ========================================
// دوال مساعدة (Utilities)
// ========================================

function formatPrice(amount) { return (amount / 100).toFixed(2); }
function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ========================================
// التصدير النهائي (The Bridge)
// ========================================

// تعريف الكائن العالمي ironPlus وربطه بكل الدوال السابقة
window.ironPlus = {
    // المصادقة (مع تغيير الأسماء لتناسب index.js)
    isLoggedIn: () => localStorage.getItem('iron_user_phone') !== null,
    getUserPhone: () => localStorage.getItem('iron_user_phone'),
    isAdminLoggedIn: () => localStorage.getItem('iron_admin') === 'true',
    
    checkAuth,
    loginWithPhone,
    verifyOTP,
    adminLogin,
    logout,
    logoutAdmin,
    
    // المنتجات
    getProducts,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    
    // الطلبات
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    
    // أكواد التفعيل
    getAvailableCodes,
    uploadBulkCodes,
    assignActivationCode,
    
    // الإحصائيات
    getSiteStats,
    recordVisit,
    
    // الأدوات
    formatPrice,
    formatDate,

    // دالة إنشاء الدفع (إضافة جديدة لربط index.js ببايلنك)
    async createPayment(productId, phone, amount) {
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/create_paylink`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId, customer_phone: phone, amount: amount })
            });
            const data = await response.json();
            return { success: true, data: data };
        } catch (e) {
            return { success: false, message: "جاري تجهيز بوابة الدفع..." };
        }
    }
};

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    await window.ironPlus.recordVisit(page);
    console.log('Iron Plus System: Fully Armed and Operational 🦾');
});
