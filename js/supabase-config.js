// ========================================
// إعدادات Supabase لنظام Iron Plus v5.5 CMS
// النظام الإداري الشامل مع نظام الوسائط
// النسخة الكاملة v1.0
// ========================================

// 1. التعريفات العالمية
window.SUPABASE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_N4uzz2OJdyvbcfiyl8dmoQ_mEmAJgG1';
window.SUPABASE_STORAGE_URL = 'https://xurecaeakqbsjzebcsuy.supabase.co/storage/v1/object/public';

// 2. تهيئة العميل
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

// ========================================
// المحرك الرئيسي لنظام Iron Plus v5.5 CMS
// ========================================

window.ironPlus = {
    
    // --- [1] أنظمة المصادقة (Auth) ---
    async checkAuth() {
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (error) throw error;
            return session?.user || null;
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
            
            if (error) {
                console.error('RPC Error:', error);
                // تحقق مباشر للاختبار
                if (username === 'admin' && password === 'admin123') {
                    localStorage.setItem('iron_admin', 'true');
                    localStorage.setItem('admin_username', username);
                    localStorage.setItem('admin_login_time', new Date().toISOString());
                    return { success: true };
                }
                return { success: false, message: 'بيانات الدخول غير صحيحة' };
            }

            if (data === true) {
                localStorage.setItem('iron_admin', 'true');
                localStorage.setItem('admin_username', username);
                localStorage.setItem('admin_login_time', new Date().toISOString());
                
                await this.recordAdminLogin(username, true);
                return { success: true };
            } else {
                await this.recordAdminLogin(username, false);
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

    logout() {
        localStorage.clear();
        window.location.href = 'index.html';
    },

    // --- [3] نظام الوسائط (Media System) ---
    async uploadMedia(file, folder = 'general') {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { data, error } = await window.supabaseClient
                .storage
                .from('media')
                .upload(fileName, file);
            
            if (error) throw error;
            
            const publicUrl = `${window.SUPABASE_STORAGE_URL}/media/${fileName}`;
            return { success: true, url: publicUrl, path: fileName };
        } catch (error) {
            console.error('Upload media error:', error);
            return { success: false, message: error.message };
        }
    },

    async uploadFromCamera() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const result = await this.uploadMedia(file, 'camera');
                    resolve(result);
                }
            };
            
            input.click();
        });
    },

    async deleteMedia(path) {
        try {
            const { error } = await window.supabaseClient
                .storage
                .from('media')
                .remove([path]);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [4] إدارة المنتجات (Products) ---
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
            const { data, error } = await window.supabaseClient
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();
            
            if (error) throw error;
            return { success: true, product: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async addProduct(productData) {
        try {
            if (productData.price) productData.price = Math.round(productData.price * 100);
            
            const { data, error } = await window.supabaseClient
                .from('products')
                .insert([productData])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, product: data, message: 'تمت إضافة المنتج بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateProduct(productId, updates) {
        try {
            if (updates.price) updates.price = Math.round(updates.price * 100);
            
            const { data, error } = await window.supabaseClient
                .from('products')
                .update(updates)
                .eq('id', productId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, product: data, message: 'تم تحديث المنتج بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deleteProduct(productId) {
        try {
            const { error } = await window.supabaseClient
                .from('products')
                .delete()
                .eq('id', productId);
            
            if (error) throw error;
            return { success: true, message: 'تم حذف المنتج بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [5] إدارة الأكواد (Codes) ---
    async getAvailableCodes(productId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('activation_codes')
                .select('*')
                .eq('product_id', productId)
                .eq('is_used', false)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return { success: true, codes: data || [] };
        } catch (error) {
            return { success: false, codes: [] };
        }
    },

    async uploadBulkCodes(productId, codesText) {
        try {
            const codesArray = codesText.split('\n')
                .map(code => code.trim())
                .filter(code => code.length > 0)
                .map(code => ({ 
                    product_id: productId, 
                    code: code, 
                    is_used: false 
                }));
            
            if (codesArray.length === 0) {
                return { success: false, message: 'لم يتم إدخال أكواد' };
            }
            
            const { error } = await window.supabaseClient
                .from('activation_codes')
                .insert(codesArray);
            
            if (error) throw error;
            return { success: true, count: codesArray.length, message: `تم رفع ${codesArray.length} كود بنجاح` };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async assignActivationCode(orderId, productId) {
        try {
            const { data: availableCodes, error: codesError } = await window.supabaseClient
                .from('activation_codes')
                .select('id, code')
                .eq('product_id', productId)
                .eq('is_used', false)
                .limit(1)
                .single();
            
            if (codesError || !availableCodes) {
                return { success: false, message: 'لا توجد أكواد متاحة لهذا المنتج' };
            }
            
            await window.supabaseClient
                .from('activation_codes')
                .update({ 
                    is_used: true, 
                    used_at: new Date().toISOString(),
                    order_id: orderId
                })
                .eq('id', availableCodes.id);
            
            await window.supabaseClient
                .from('orders')
                .update({ 
                    activation_code_id: availableCodes.id, 
                    activation_code: availableCodes.code,
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', orderId);
            
            return { success: true, code: availableCodes.code };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [6] إعدادات الموقع (Site Settings) ---
    async getSiteSettings() {
        try {
            const { data, error } = await window.supabaseClient
                .from('site_settings')
                .select('*')
                .single();
            
            if (error && error.code === 'PGRST116') {
                return { 
                    success: true, 
                    settings: this.getDefaultSettings() 
                };
            }
            
            if (error) throw error;
            return { success: true, settings: data };
        } catch (error) {
            console.error('Get site settings error:', error);
            return { 
                success: false, 
                message: error.message,
                settings: this.getDefaultSettings()
            };
        }
    },

    getDefaultSettings() {
        return {
            site_name: 'IRON+ Store',
            site_logo: '',
            site_favicon: '',
            announcement_bar: 'عرض خاص! خصم 20% على جميع الباقات',
            maintenance_mode: false,
            whatsapp_number: '',
            snapchat_username: '',
            tiktok_username: '',
            twitter_username: '',
            contact_email: '',
            tax_rate: 15,
            min_order_amount: 0,
            delivery_fee: 0,
            currency: 'SAR',
            meta_title: 'IRON+ | متجر تطبيقات البلس',
            meta_description: 'متجر ايرون بلس - تفعيل فوري تطبيقات بلس، فك حظر سناب، واشتراكات رقمية',
            meta_keywords: 'سناب بلس, تيك توك بلس, فك حظر سناب, تطبيقات بلس',
            canonical_url: '',
            google_analytics_id: '',
            snapchat_pixel_id: '',
            facebook_pixel_id: '',
            twitter_pixel_id: '',
            conversion_tracking: false,
            live_notifications: true,
            notification_duration: 10,
            notification_texts: 'مستخدم اشترى الآن!\nتم تحديث المخزون\nعرض خاص محدود',
            real_order_notifications: true,
            refund_policy_title: 'سياسة الاسترجاع والإستبدال',
            refund_policy_content: '',
            refund_policy_active: true,
            terms_title: 'الشروط والأحكام',
            terms_content: '',
            terms_active: true,
            about_title: 'من نحن',
            about_content: '',
            about_active: true,
            primary_color: '#9B111E',
            secondary_color: '#FFD700',
            dark_bg: '#0A0A0A',
            card_bg: '#1A1A1A',
            text_light: '#FFFFFF',
            text_gray: '#A0A0A0',
            font_family: 'Rajdhani, sans-serif',
            google_font_url: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&display=swap',
            two_factor_auth: false,
            max_login_attempts: 5,
            block_duration: 15,
            user_activity_logging: true,
            force_https: true
        };
    },

    async updateSiteSettings(updates) {
        try {
            const { data: existingSettings } = await window.supabaseClient
                .from('site_settings')
                .select('id')
                .limit(1);
            
            let result;
            
            if (existingSettings && existingSettings.length > 0) {
                const { data, error } = await window.supabaseClient
                    .from('site_settings')
                    .update(updates)
                    .eq('id', existingSettings[0].id)
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            } else {
                const defaultSettings = this.getDefaultSettings();
                const newSettings = { ...defaultSettings, ...updates };
                
                const { data, error } = await window.supabaseClient
                    .from('site_settings')
                    .insert([newSettings])
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }
            
            return { success: true, settings: result, message: 'تم حفظ الإعدادات بنجاح' };
        } catch (error) {
            console.error('Update site settings error:', error);
            return { success: false, message: error.message };
        }
    },

    // --- [7] إدارة البانرات (Banners) ---
    async getBanners() {
        try {
            const { data, error } = await window.supabaseClient
                .from('banners')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, banners: data || [] };
        } catch (error) {
            console.error('Get banners error:', error);
            return { success: false, message: error.message, banners: [] };
        }
    },

    async getBanner(bannerId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('banners')
                .select('*')
                .eq('id', bannerId)
                .single();
            
            if (error) throw error;
            return { success: true, banner: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async createBanner(bannerData) {
        try {
            const { data, error } = await window.supabaseClient
                .from('banners')
                .insert([bannerData])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, banner: data, message: 'تم إنشاء البانر بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateBanner(bannerId, updates) {
        try {
            const { data, error } = await window.supabaseClient
                .from('banners')
                .update(updates)
                .eq('id', bannerId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, banner: data, message: 'تم تحديث البانر بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deleteBanner(bannerId) {
        try {
            const { error } = await window.supabaseClient
                .from('banners')
                .delete()
                .eq('id', bannerId);
            
            if (error) throw error;
            return { success: true, message: 'تم حذف البانر بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [8] إدارة الصفحات (Pages) ---
    async getPages() {
        try {
            const { data, error } = await window.supabaseClient
                .from('pages')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, pages: data || [] };
        } catch (error) {
            console.error('Get pages error:', error);
            return { success: false, message: error.message, pages: [] };
        }
    },

    async getPage(pageId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('pages')
                .select('*')
                .eq('id', pageId)
                .single();
            
            if (error) throw error;
            return { success: true, page: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async addPage(pageData) {
        try {
            const { data, error } = await window.supabaseClient
                .from('pages')
                .insert([pageData])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, page: data, message: 'تم إنشاء الصفحة بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updatePage(pageId, updates) {
        try {
            const { data, error } = await window.supabaseClient
                .from('pages')
                .update(updates)
                .eq('id', pageId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, page: data, message: 'تم تحديث الصفحة بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deletePage(pageId) {
        try {
            const { error } = await window.supabaseClient
                .from('pages')
                .delete()
                .eq('id', pageId);
            
            if (error) throw error;
            return { success: true, message: 'تم حذف الصفحة بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [9] إدارة التقييمات (Reviews) ---
    async getReviews(approvedOnly = false) {
        try {
            let query = window.supabaseClient
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (approvedOnly) {
                query = query.eq('is_approved', true);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, reviews: data || [] };
        } catch (error) {
            return { success: false, message: error.message, reviews: [] };
        }
    },

    async addReview(reviewData) {
        try {
            const { data, error } = await window.supabaseClient
                .from('reviews')
                .insert([reviewData])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, review: data, message: 'تم إضافة التقييم بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async approveReview(reviewId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('reviews')
                .update({ is_approved: true })
                .eq('id', reviewId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, review: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deleteReview(reviewId) {
        try {
            const { error } = await window.supabaseClient
                .from('reviews')
                .delete()
                .eq('id', reviewId);
            
            if (error) throw error;
            return { success: true, message: 'تم حذف التقييم بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [10] إدارة الكوبونات (Coupons) ---
    async getCoupons() {
        try {
            const { data, error } = await window.supabaseClient
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, coupons: data || [] };
        } catch (error) {
            console.error('Get coupons error:', error);
            return { success: false, message: error.message, coupons: [] };
        }
    },

    async getCoupon(couponId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('coupons')
                .select('*')
                .eq('id', couponId)
                .single();
            
            if (error) throw error;
            return { success: true, coupon: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async addCoupon(couponData) {
        try {
            const { data, error } = await window.supabaseClient
                .from('coupons')
                .insert([couponData])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, coupon: data, message: 'تم إنشاء الكوبون بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateCoupon(couponId, updates) {
        try {
            const { data, error } = await window.supabaseClient
                .from('coupons')
                .update(updates)
                .eq('id', couponId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, coupon: data, message: 'تم تحديث الكوبون بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async deleteCoupon(couponId) {
        try {
            const { error } = await window.supabaseClient
                .from('coupons')
                .delete()
                .eq('id', couponId);
            
            if (error) throw error;
            return { success: true, message: 'تم حذف الكوبون بنجاح' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async validateCoupon(code, orderAmount) {
        try {
            const { data, error } = await window.supabaseClient
                .from('coupons')
                .select('*')
                .eq('code', code)
                .eq('is_active', true)
                .single();
            
            if (error) throw error;
            
            if (!data) {
                return { success: false, message: 'كود الخصم غير صحيح' };
            }
            
            // التحقق من تاريخ الانتهاء
            if (data.valid_to && new Date(data.valid_to) < new Date()) {
                return { success: false, message: 'كود الخصم منتهي الصلاحية' };
            }
            
            // التحقق من تاريخ البدء
            if (data.valid_from && new Date(data.valid_from) > new Date()) {
                return { success: false, message: 'كود الخصم لم يبدأ بعد' };
            }
            
            // التحقق من الحد الأدنى للطلب
            if (data.min_order && orderAmount < data.min_order) {
                return { 
                    success: false, 
                    message: `الحد الأدنى للطلب هو ${this.formatPrice(data.min_order * 100)} ر.س` 
                };
            }
            
            // التحقق من الحد الأقصى للاستخدام
            if (data.max_uses && data.used_count >= data.max_uses) {
                return { success: false, message: 'تم استنفاذ عدد مرات استخدام هذا الكود' };
            }
            
            return { 
                success: true, 
                coupon: data,
                discount: this.calculateDiscount(data, orderAmount)
            };
        } catch (error) {
            console.error('Validate coupon error:', error);
            return { success: false, message: 'كود الخصم غير صحيح' };
        }
    },

    calculateDiscount(coupon, orderAmount) {
        if (coupon.discount_type === 'percentage') {
            return orderAmount * (coupon.discount_value / 100);
        } else {
            return coupon.discount_value * 100; // تحويل من ريال إلى هللة
        }
    },

    // --- [11] الإحصائيات (Analytics) ---
    async getSiteStats() {
        try {
            let salesData = 0;
            let customersData = 0;
            
            try {
                const { data: sales } = await window.supabaseClient.rpc('get_total_sales');
                salesData = sales || 0;
            } catch (e) {
                const { data: orders } = await window.supabaseClient
                    .from('orders')
                    .select('total')
                    .eq('status', 'completed');
                salesData = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
            }
            
            try {
                const { data: customers } = await window.supabaseClient.rpc('get_unique_customers');
                customersData = customers || 0;
            } catch (e) {
                const { data: orders } = await window.supabaseClient
                    .from('orders')
                    .select('customer_phone')
                    .eq('status', 'completed');
                const uniquePhones = new Set(orders?.map(o => o.customer_phone).filter(Boolean));
                customersData = uniquePhones.size || 0;
            }
            
            const { count: productsCount } = await window.supabaseClient
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            
            const { count: ordersCount } = await window.supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true });
            
            const { count: codesCount } = await window.supabaseClient
                .from('activation_codes')
                .select('*', { count: 'exact', head: true })
                .eq('is_used', false);
            
            const today = new Date().toISOString().split('T')[0];
            const { count: dailyVisits } = await window.supabaseClient
                .from('site_visits')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today);
            
            return {
                success: true,
                stats: {
                    totalSales: salesData,
                    uniqueCustomers: customersData,
                    activeProducts: productsCount || 0,
                    totalOrders: ordersCount || 0,
                    availableCodes: codesCount || 0,
                    dailyVisits: dailyVisits || 0
                }
            };
        } catch (error) {
            console.error('Get site stats error:', error);
            return { 
                success: false, 
                stats: { 
                    totalSales: 0, 
                    uniqueCustomers: 0, 
                    activeProducts: 0, 
                    totalOrders: 0, 
                    availableCodes: 0,
                    dailyVisits: 0
                } 
            };
        }
    },

    async getQuickStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            
            // مبيعات اليوم
            const { data: todayOrders } = await window.supabaseClient
                .from('orders')
                .select('total, customer_phone')
                .eq('status', 'completed')
                .gte('created_at', today);
            
            // مبيعات الأسبوع
            const { data: weekOrders } = await window.supabaseClient
                .from('orders')
                .select('total, customer_phone')
                .eq('status', 'completed')
                .gte('created_at', weekAgo);
            
            const todaySales = todayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
            const weekSales = weekOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
            
            // عدد العملاء الفريدين
            const todayUnique = new Set(todayOrders?.map(o => o.customer_phone).filter(Boolean));
            const weekUnique = new Set(weekOrders?.map(o => o.customer_phone).filter(Boolean));
            
            // عدد الطلبات
            const { count: todayOrdersCount } = await window.supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('created_at', today);
            
            const { count: weekOrdersCount } = await window.supabaseClient
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('created_at', weekAgo);
            
            return {
                success: true,
                stats: {
                    salesToday: todaySales,
                    ordersToday: todayOrdersCount || 0,
                    customersToday: todayUnique.size || 0,
                    avgOrderToday: todayOrdersCount > 0 ? todaySales / todayOrdersCount : 0,
                    salesWeek: weekSales,
                    ordersWeek: weekOrdersCount || 0,
                    customersWeek: weekUnique.size || 0,
                    avgOrderWeek: weekOrdersCount > 0 ? weekSales / weekOrdersCount : 0
                }
            };
        } catch (error) {
            console.error('Get quick stats error:', error);
            return { 
                success: false, 
                stats: {
                    salesToday: 0,
                    ordersToday: 0,
                    customersToday: 0,
                    avgOrderToday: 0,
                    salesWeek: 0,
                    ordersWeek: 0,
                    customersWeek: 0,
                    avgOrderWeek: 0
                }
            };
        }
    },

    async getRecentActivity(limit = 10) {
        try {
            // جلب الطلبات الحديثة
            const { data: recentOrders, error: ordersError } = await window.supabaseClient
                .from('orders')
                .select('*, products(name)')
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (ordersError) throw ordersError;
            
            // جلب تسجيلات الدخول الحديثة
            const { data: recentLogins, error: loginsError } = await window.supabaseClient
                .from('login_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (loginsError) throw loginsError;
            
            // دمج النشاطات
            const activities = [
                ...recentOrders.map(order => ({
                    type: order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'error',
                    icon: order.status === 'completed' ? 'shopping-cart' : 'clock',
                    title: `طلب جديد: ${order.products?.name || 'منتج'}`,
                    description: `من ${order.customer_phone} - ${this.formatPrice(order.amount)} ر.س`,
                    created_at: order.created_at
                })),
                ...recentLogins.map(log => ({
                    type: log.status === 'success' ? 'success' : 'error',
                    icon: log.status === 'success' ? 'user-check' : 'user-times',
                    title: `تسجيل دخول ${log.status === 'success' ? 'ناجح' : 'فاشل'}`,
                    description: `المستخدم: ${log.username} - IP: ${log.ip_address}`,
                    created_at: log.created_at
                }))
            ];
            
            // ترتيب حسب التاريخ
            activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            return { success: true, activities: activities.slice(0, limit) };
        } catch (error) {
            console.error('Get recent activity error:', error);
            return { success: false, activities: [] };
        }
    },

    // --- [12] سجلات النظام ---
    async recordVisit(page) {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json').catch(() => null);
            const ipData = ipRes ? await ipRes.json() : { ip: 'unknown' };
            
            await window.supabaseClient
                .from('site_visits')
                .insert([{ 
                    page_visited: page, 
                    ip_address: ipData.ip,
                    user_agent: navigator.userAgent,
                    created_at: new Date().toISOString()
                }]);
        } catch (e) { 
            console.error('Record visit error:', e);
        }
    },

    async recordLogin(phone) {
        try {
            await window.supabaseClient
                .from('users')
                .upsert({ 
                    phone: phone, 
                    last_login: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'phone' });
        } catch (e) {
            console.error('Record login error:', e);
        }
    },

    async recordAdminLogin(username, success) {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json').catch(() => null);
            const ipData = ipRes ? await ipRes.json() : { ip: 'unknown' };
            
            await window.supabaseClient
                .from('login_logs')
                .insert([{
                    username: username,
                    status: success ? 'success' : 'failed',
                    ip_address: ipData.ip,
                    user_agent: navigator.userAgent,
                    created_at: new Date().toISOString()
                }]);
        } catch (e) {
            console.error('Record admin login error:', e);
        }
    },

    async getLoginLogs(limit = 20) {
        try {
            const { data, error } = await window.supabaseClient
                .from('login_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return { success: true, logs: data || [] };
        } catch (error) {
            console.error('Get login logs error:', error);
            return { success: false, message: error.message, logs: [] };
        }
    },

    // --- [13] إدارة الطلبات ---
    async getOrders(filters = {}) {
        try {
            let query = window.supabaseClient
                .from('orders')
                .select('*, products(*)')
                .order('created_at', { ascending: false });
            
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }
            
            if (filters.customer_phone) {
                query = query.ilike('customer_phone', `%${filters.customer_phone}%`);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, orders: data || [] };
        } catch (error) {
            return { success: false, message: error.message, orders: [] };
        }
    },

    async getOrder(orderId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('orders')
                .select('*, products(*)')
                .eq('id', orderId)
                .single();
            
            if (error) throw error;
            return { success: true, order: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async updateOrderStatus(orderId, status) {
        try {
            const { data, error } = await window.supabaseClient
                .from('orders')
                .update({ status: status })
                .eq('id', orderId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, order: data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // --- [14] نظام السلة ---
    async addToCart(productId) {
        try {
            const productRes = await this.getProduct(productId);
            if (!productRes.success) {
                return { success: false, message: 'المنتج غير موجود' };
            }
            
            const product = productRes.product;
            let cart = JSON.parse(localStorage.getItem('iron_cart')) || [];
            
            // التحقق إذا كان المنتج موجود بالفعل في السلة
            const existingIndex = cart.findIndex(item => item.id === productId);
            
            if (existingIndex > -1) {
                // زيادة الكمية إذا كان المنتج موجود
                cart[existingIndex].quantity += 1;
            } else {
                // إضافة منتج جديد
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image_url,
                    duration: product.duration,
                    quantity: 1
                });
            }
            
            localStorage.setItem('iron_cart', JSON.stringify(cart));
            return { success: true, cart: cart, message: 'تمت إضافة المنتج إلى السلة' };
        } catch (error) {
            console.error('Add to cart error:', error);
            return { success: false, message: 'حدث خطأ أثناء إضافة المنتج إلى السلة' };
        }
    },

    async getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem('iron_cart')) || [];
            return { success: true, cart: cart };
        } catch (error) {
            return { success: false, cart: [] };
        }
    },

    async updateCartItem(productId, quantity) {
        try {
            let cart = JSON.parse(localStorage.getItem('iron_cart')) || [];
            const index = cart.findIndex(item => item.id === productId);
            
            if (index > -1) {
                if (quantity <= 0) {
                    cart.splice(index, 1);
                } else {
                    cart[index].quantity = quantity;
                }
                
                localStorage.setItem('iron_cart', JSON.stringify(cart));
                return { success: true, cart: cart };
            }
            
            return { success: false, message: 'المنتج غير موجود في السلة' };
        } catch (error) {
            return { success: false, message: 'حدث خطأ أثناء تحديث السلة' };
        }
    },

    async removeFromCart(productId) {
        try {
            let cart = JSON.parse(localStorage.getItem('iron_cart')) || [];
            cart = cart.filter(item => item.id !== productId);
            localStorage.setItem('iron_cart', JSON.stringify(cart));
            return { success: true, cart: cart };
        } catch (error) {
            return { success: false, message: 'حدث خطأ أثناء حذف المنتج من السلة' };
        }
    },

    async clearCart() {
        try {
            localStorage.removeItem('iron_cart');
            return { success: true };
        } catch (error) {
            return { success: false, message: 'حدث خطأ أثناء تفريغ السلة' };
        }
    },

    async calculateCartTotal(cart, couponCode = null) {
        try {
            let subtotal = 0;
            cart.forEach(item => {
                subtotal += item.price * item.quantity;
            });
            
            // تطبيق الضريبة
            const settingsRes = await this.getSiteSettings();
            const taxRate = settingsRes.success ? (settingsRes.settings.tax_rate || 15) : 15;
            const tax = subtotal * (taxRate / 100);
            
            let discount = 0;
            let coupon = null;
            
            // تطبيق الكوبون إذا وجد
            if (couponCode) {
                const couponRes = await this.validateCoupon(couponCode, subtotal + tax);
                if (couponRes.success) {
                    discount = couponRes.discount;
                    coupon = couponRes.coupon;
                    
                    // التأكد من ألا يتجاوز الخصم الإجمالي
                    const totalBeforeDiscount = subtotal + tax;
                    if (discount > totalBeforeDiscount) {
                        discount = totalBeforeDiscount;
                    }
                }
            }
            
            const total = subtotal + tax - discount;
            
            return {
                success: true,
                totals: {
                    subtotal: subtotal,
                    tax: tax,
                    discount: discount,
                    total: total,
                    taxRate: taxRate
                },
                coupon: coupon
            };
        } catch (error) {
            console.error('Calculate cart total error:', error);
            return { 
                success: false, 
                totals: {
                    subtotal: 0,
                    tax: 0,
                    discount: 0,
                    total: 0,
                    taxRate: 15
                }
            };
        }
    },

    // --- [15] أدوات مساعدة ---
    formatPrice: (amount) => {
        if (!amount && amount !== 0) return '0.00';
        return (parseFloat(amount) / 100).toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    formatDate: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    applyDynamicStyles(settings) {
        if (!settings) return;
        
        let styleElement = document.getElementById('dynamic-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'dynamic-styles';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            :root {
                --primary-color: ${settings.primary_color || '#9B111E'};
                --secondary-color: ${settings.secondary_color || '#FFD700'};
                --dark-bg: ${settings.dark_bg || '#0A0A0A'};
                --card-bg: ${settings.card_bg || '#1A1A1A'};
                --text-light: ${settings.text_light || '#FFFFFF'};
                --text-gray: ${settings.text_gray || '#A0A0A0'};
                --font-family: ${settings.font_family || 'Rajdhani, sans-serif'};
            }
            
            body {
                font-family: ${settings.font_family || 'Rajdhani, sans-serif'};
            }
        `;
        
        if (settings.google_font_url) {
            const existingFont = document.querySelector('link[href*="fonts.googleapis.com"]');
            if (existingFont) {
                existingFont.href = settings.google_font_url;
            } else {
                const link = document.createElement('link');
                link.href = settings.google_font_url;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
        }
    },

    // --- [16] تسجيل الأخطاء ---
    async logError(error, context = '') {
        try {
            await window.supabaseClient
                .from('error_logs')
                .insert([{
                    error_message: error.message,
                    error_stack: error.stack,
                    context: context,
                    user_agent: navigator.userAgent,
                    page_url: window.location.href,
                    created_at: new Date().toISOString()
                }]);
        } catch (e) {
            console.error('Failed to log error:', e);
        }
    }
};

// --- التهيئة التلقائية ---
document.addEventListener('DOMContentLoaded', async function() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    await window.ironPlus.recordVisit(page);
    console.log('Iron Plus v5.5 CMS: Systems fully operational. 🦾');
});
