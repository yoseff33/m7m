// ========================================
// لوحة تحكم Iron Plus v5.0 - النظام الإداري الشامل
// ========================================

// 1. تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('Jarvis: Admin Systems Initializing v5.0... 🦾');
    
    setTimeout(async () => {
        if (!window.ironPlus || !window.ironPlus.isAdminLoggedIn()) {
            console.log('Access Denied. Showing Login Screen...');
            showLoginScreen();
            return;
        }
        await initializeAdminPanel();
    }, 200);
});

// --- أولاً: إدارة شاشات الدخول والواجهة ---

function showLoginScreen() {
    const loginScreen = document.getElementById('adminLoginScreen');
    const dashboard = document.getElementById('adminDashboard');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
    setupLoginListeners();
}

function setupLoginListeners() {
    const loginForm = document.getElementById('adminLoginForm');
    if (!loginForm) return;
    
    loginForm.onsubmit = async function(e) {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;
        const messageDiv = document.getElementById('loginMessage');
        
        clearMessage(messageDiv);
        
        if (!username || !password) {
            showMessage(messageDiv, 'يرجى ملء جميع الحقول يا بطل', 'error');
            return;
        }
        
        showMessage(messageDiv, 'جاري فحص الشفرات الأمنية...', 'info');
        
        try {
            const result = await window.ironPlus.adminLogin(username, password);
            if (result.success) {
                showMessage(messageDiv, 'تم التحقق بنجاح! جاري الإقلاع 🚀', 'success');
                setTimeout(() => { window.location.reload(); }, 1000);
            } else {
                showMessage(messageDiv, result.message || 'بيانات الدخول خاطئة', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage(messageDiv, 'خطأ في الاتصال بالسيرفر المركزي', 'error');
        }
    };
}

// --- ثانياً: تهيئة الأنظمة (Initialization) ---

async function initializeAdminPanel() {
    try {
        document.getElementById('adminLoginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        updateElement('adminName', `مرحباً، ${window.ironPlus.getAdminUsername()}`);
        
        await loadDashboardData();
        await loadQuickStats();
        await loadRecentActivity();
        await loadProducts();
        await loadOrders();
        await loadProductsForCodes();
        await loadSettings();
        await loadCoupons();
        await loadBanners();
        await loadLoginLogs();
        setupEventListeners();
        
        console.log('Systems Online: Admin panel fully operational v5.0.');
    } catch (error) {
        console.error('Boot error:', error);
        showNotification('حدث خطأ في تحميل اللوحة', 'error');
    }
}

// --- ثالثاً: إدارة التبويبات (Tabs) ---

function switchTab(tabName) {
    // إخفاء جميع التبويبات
    const tabs = ['dashboard', 'products', 'settings', 'marketing', 'content', 'coupons', 'banners', 'security', 'orders'];
    tabs.forEach(tab => {
        document.getElementById(tab + 'Tab')?.classList.remove('active');
        document.querySelector(`.admin-tab[onclick="switchTab('${tab}')"]`)?.classList.remove('active');
    });
    
    // إظهار التبويب المطلوب
    document.getElementById(tabName + 'Tab')?.classList.add('active');
    document.querySelector(`.admin-tab[onclick="switchTab('${tabName}')"]`)?.classList.add('active');
    
    // تحميل بيانات التبويب إذا لزم
    switch(tabName) {
        case 'dashboard':
            loadQuickStats();
            loadRecentActivity();
            break;
        case 'coupons':
            loadCoupons();
            break;
        case 'banners':
            loadBanners();
            break;
        case 'security':
            loadLoginLogs();
            break;
    }
}

// --- رابعاً: إدارة البيانات (Dashboard & Lists) ---

async function loadDashboardData() {
    const res = await window.ironPlus.getSiteStats();
    if (res.success) {
        updateElement('totalSales', `${window.ironPlus.formatPrice(res.stats.totalSales)} ر.س`);
        updateElement('availableCodes', res.stats.availableCodes);
        updateElement('totalCustomers', res.stats.uniqueCustomers);
        updateElement('dailyVisits', res.stats.dailyVisits || 0);
    }
}

async function loadQuickStats() {
    const res = await window.ironPlus.getQuickStats();
    if (res.success) {
        const stats = res.stats;
        updateElement('salesToday', `${window.ironPlus.formatPrice(stats.salesToday)} ر.س`);
        updateElement('ordersToday', stats.ordersToday);
        updateElement('customersToday', stats.customersToday);
        updateElement('avgOrderToday', `${window.ironPlus.formatPrice(stats.avgOrderToday)} ر.س`);
        updateElement('salesWeek', `${window.ironPlus.formatPrice(stats.salesWeek)} ر.س`);
        updateElement('ordersWeek', stats.ordersWeek);
        updateElement('customersWeek', stats.customersWeek);
        updateElement('avgOrderWeek', `${window.ironPlus.formatPrice(stats.avgOrderWeek)} ر.س`);
    }
}

async function loadRecentActivity() {
    const res = await window.ironPlus.getRecentActivity();
    const container = document.getElementById('recentActivity');
    if (res.success && container) {
        const activities = res.activities;
        if (activities.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-400">لا يوجد نشاط حديث</div>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item mb-4 p-3 border-b border-gray-800 last:border-0">
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <i class="fas fa-${activity.icon || 'bell'} text-xs text-${activity.type === 'success' ? 'green' : activity.type === 'warning' ? 'yellow' : 'red'}-500"></i>
                    </div>
                    <div class="flex-1">
                        <div class="font-medium">${activity.title}</div>
                        <div class="text-sm text-gray-400">${activity.description}</div>
                        <div class="text-xs text-gray-500 mt-1">${window.ironPlus.formatDate(activity.created_at)}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

async function loadProducts() {
    const res = await window.ironPlus.getProducts();
    const tbody = document.getElementById('productsTableBody');
    if (res.success && tbody) {
        tbody.innerHTML = res.products.map(p => `
            <tr>
                <td><img src="${p.image_url || 'assets/default.png'}" style="width:40px; border-radius:5px;" onerror="this.src='assets/default.png'"></td>
                <td><strong>${p.name}</strong><br><small class="text-gray-400">${p.description?.substring(0, 50) || ''}</small></td>
                <td><div class="text-gold">${window.ironPlus.formatPrice(p.price)} ر.س</div></td>
                <td>${p.duration || '-'}</td>
                <td>${p.stock || '∞'}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="adminPanel.showProductModal('${p.id}')" class="btn-action"><i class="fas fa-edit"></i></button>
                        <button onclick="adminPanel.deleteProduct('${p.id}', '${p.name}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

async function loadOrders(filter = 'all') {
    const res = await window.ironPlus.getAllOrders({status: filter === 'all' ? null : filter});
    const tbody = document.getElementById('ordersTableBody');
    if (res.success && tbody) {
        tbody.innerHTML = res.orders.map(o => `
            <tr>
                <td><small>${o.id.substring(0,8)}</small></td>
                <td>${o.customer_phone}</td>
                <td>${o.products?.name || 'N/A'}</td>
                <td>${window.ironPlus.formatPrice(o.amount)} ر.س</td>
                <td>${o.discount ? `${window.ironPlus.formatPrice(o.discount)} ر.س` : '-'}</td>
                <td><strong>${window.ironPlus.formatPrice(o.total || o.amount)} ر.س</strong></td>
                <td>${window.ironPlus.formatDate(o.created_at)}</td>
                <td><span class="status-badge status-${o.status}">${getStatusText(o.status)}</span></td>
                <td><small>${o.activation_code || 'لم يسلم بعد'}</small></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="adminPanel.deliverOrder('${o.id}', '${o.product_id}')" class="btn-action btn-success" title="تسليم الكود"><i class="fas fa-key"></i></button>
                        <button onclick="adminPanel.contactCustomer('${o.customer_phone}')" class="btn-action"><i class="fab fa-whatsapp"></i></button>
                        <button onclick="adminPanel.viewOrder('${o.id}')" class="btn-action" title="تفاصيل"><i class="fas fa-eye"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

async function loadSettings() {
    const res = await window.ironPlus.getSiteSettings();
    if (res.success && res.settings) {
        const settings = res.settings;
        
        // الإعدادات العامة
        if (document.getElementById('siteName')) document.getElementById('siteName').value = settings.site_name || '';
        if (document.getElementById('siteLogo')) document.getElementById('siteLogo').value = settings.site_logo || '';
        if (document.getElementById('siteFavicon')) document.getElementById('siteFavicon').value = settings.site_favicon || '';
        if (document.getElementById('announcementBar')) document.getElementById('announcementBar').value = settings.announcement_bar || '';
        if (document.getElementById('maintenanceMode')) document.getElementById('maintenanceMode').checked = settings.maintenance_mode || false;
        
        // وسائل التواصل
        if (document.getElementById('whatsappNumber')) document.getElementById('whatsappNumber').value = settings.whatsapp_number || '';
        if (document.getElementById('snapchatUsername')) document.getElementById('snapchatUsername').value = settings.snapchat_username || '';
        if (document.getElementById('tiktokUsername')) document.getElementById('tiktokUsername').value = settings.tiktok_username || '';
        if (document.getElementById('twitterUsername')) document.getElementById('twitterUsername').value = settings.twitter_username || '';
        if (document.getElementById('contactEmail')) document.getElementById('contactEmail').value = settings.contact_email || '';
        
        // إعدادات الدفع
        if (document.getElementById('taxRate')) document.getElementById('taxRate').value = settings.tax_rate || 15;
        if (document.getElementById('minOrderAmount')) document.getElementById('minOrderAmount').value = settings.min_order_amount || 0;
        if (document.getElementById('deliveryFee')) document.getElementById('deliveryFee').value = settings.delivery_fee || 0;
        if (document.getElementById('currency')) document.getElementById('currency').value = settings.currency || 'SAR';
        
        // إعدادات SEO
        if (document.getElementById('metaTitle')) document.getElementById('metaTitle').value = settings.meta_title || '';
        if (document.getElementById('metaDescription')) document.getElementById('metaDescription').value = settings.meta_description || '';
        if (document.getElementById('metaKeywords')) document.getElementById('metaKeywords').value = settings.meta_keywords || '';
        if (document.getElementById('canonicalUrl')) document.getElementById('canonicalUrl').value = settings.canonical_url || '';
        
        // أدوات التتبع
        if (document.getElementById('googleAnalyticsId')) document.getElementById('googleAnalyticsId').value = settings.google_analytics_id || '';
        if (document.getElementById('snapchatPixelId')) document.getElementById('snapchatPixelId').value = settings.snapchat_pixel_id || '';
        if (document.getElementById('facebookPixelId')) document.getElementById('facebookPixelId').value = settings.facebook_pixel_id || '';
        if (document.getElementById('twitterPixelId')) document.getElementById('twitterPixelId').value = settings.twitter_pixel_id || '';
        if (document.getElementById('conversionTracking')) document.getElementById('conversionTracking').checked = settings.conversion_tracking || false;
        
        // إشعارات حية
        if (document.getElementById('liveNotifications')) document.getElementById('liveNotifications').checked = settings.live_notifications || false;
        if (document.getElementById('notificationDuration')) document.getElementById('notificationDuration').value = settings.notification_duration || 10;
        if (document.getElementById('notificationTexts')) document.getElementById('notificationTexts').value = settings.notification_texts || '';
        if (document.getElementById('realOrderNotifications')) document.getElementById('realOrderNotifications').checked = settings.real_order_notifications || false;
        
        // المحتوى القانوني
        if (document.getElementById('refundPolicyTitle')) document.getElementById('refundPolicyTitle').value = settings.refund_policy_title || 'سياسة الاسترجاع والإستبدال';
        if (document.getElementById('refundPolicyContent')) document.getElementById('refundPolicyContent').value = settings.refund_policy_content || '';
        if (document.getElementById('refundPolicyActive')) document.getElementById('refundPolicyActive').checked = settings.refund_policy_active || true;
        
        if (document.getElementById('termsTitle')) document.getElementById('termsTitle').value = settings.terms_title || 'الشروط والأحكام';
        if (document.getElementById('termsContent')) document.getElementById('termsContent').value = settings.terms_content || '';
        if (document.getElementById('termsActive')) document.getElementById('termsActive').checked = settings.terms_active || true;
        
        if (document.getElementById('aboutTitle')) document.getElementById('aboutTitle').value = settings.about_title || 'من نحن';
        if (document.getElementById('aboutContent')) document.getElementById('aboutContent').value = settings.about_content || '';
        if (document.getElementById('aboutActive')) document.getElementById('aboutActive').checked = settings.about_active || true;
        
        // إعدادات الأمان
        if (document.getElementById('twoFactorAuth')) document.getElementById('twoFactorAuth').checked = settings.two_factor_auth || false;
        if (document.getElementById('maxLoginAttempts')) document.getElementById('maxLoginAttempts').value = settings.max_login_attempts || 5;
        if (document.getElementById('blockDuration')) document.getElementById('blockDuration').value = settings.block_duration || 15;
        if (document.getElementById('userActivityLogging')) document.getElementById('userActivityLogging').checked = settings.user_activity_logging || true;
        if (document.getElementById('forceHTTPS')) document.getElementById('forceHTTPS').checked = settings.force_https || true;
    }
}

async function loadCoupons() {
    const res = await window.ironPlus.getCoupons();
    const tbody = document.getElementById('couponsTableBody');
    if (res.success && tbody) {
        tbody.innerHTML = res.coupons.map(c => `
            <tr>
                <td><strong>${c.code}</strong></td>
                <td>${c.discount_type === 'percentage' ? 'نسبة %' : 'مبلغ ثابت'}</td>
                <td>${c.discount_type === 'percentage' ? c.discount_value + '%' : window.ironPlus.formatPrice(c.discount_value) + ' ر.س'}</td>
                <td>${c.min_order ? window.ironPlus.formatPrice(c.min_order) + ' ر.س' : 'لا يوجد'}</td>
                <td>${c.max_uses || '∞'}</td>
                <td>${c.used_count || 0}</td>
                <td>${c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('ar-SA') : 'لا نهائي'}</td>
                <td><span class="status-badge ${c.is_active ? 'status-completed' : 'status-failed'}">${c.is_active ? 'نشط' : 'غير نشط'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="adminPanel.editCoupon('${c.id}')" class="btn-action"><i class="fas fa-edit"></i></button>
                        <button onclick="adminPanel.deleteCoupon('${c.id}', '${c.code}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

async function loadBanners() {
    const res = await window.ironPlus.getBanners();
    const tbody = document.getElementById('bannersTableBody');
    if (res.success && tbody) {
        tbody.innerHTML = res.banners.map(b => `
            <tr>
                <td><img src="${b.image_url}" style="width:60px; height:40px; object-fit:cover; border-radius:5px;" onerror="this.src='assets/default-banner.png'"></td>
                <td>${b.title}</td>
                <td>${getBannerPositionText(b.position)}</td>
                <td><a href="${b.link || '#'}" target="_blank" class="text-blue-400 hover:underline">${b.link ? 'رابط' : 'لا يوجد'}</a></td>
                <td>${b.order || 1}</td>
                <td><span class="status-badge ${b.is_active ? 'status-completed' : 'status-failed'}">${b.is_active ? 'نشط' : 'غير نشط'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="adminPanel.editBanner('${b.id}')" class="btn-action"><i class="fas fa-edit"></i></button>
                        <button onclick="adminPanel.deleteBanner('${b.id}', '${b.title}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

async function loadLoginLogs() {
    const res = await window.ironPlus.getLoginLogs();
    const tbody = document.getElementById('loginLogsBody');
    if (res.success && tbody) {
        tbody.innerHTML = res.logs.map(log => `
            <tr>
                <td>${new Date(log.created_at).toLocaleDateString('ar-SA')}</td>
                <td>${new Date(log.created_at).toLocaleTimeString('ar-SA')}</td>
                <td><small>${log.ip_address}</small></td>
                <td><span class="status-badge ${log.status === 'success' ? 'status-completed' : 'status-failed'}">${log.status === 'success' ? 'ناجح' : 'فاشل'}</span></td>
            </tr>
        `).join('');
    }
}

// --- خامساً: إعداد مستمعي الأحداث (Event Listeners) ---

function setupEventListeners() {
    // نموذج المنتج
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.onsubmit = handleProductSubmit;
    }
    
    // إعدادات الموقع
    const siteSettingsForm = document.getElementById('siteSettingsForm');
    if (siteSettingsForm) {
        siteSettingsForm.onsubmit = handleSiteSettingsSubmit;
    }
    
    const socialSettingsForm = document.getElementById('socialSettingsForm');
    if (socialSettingsForm) {
        socialSettingsForm.onsubmit = handleSocialSettingsSubmit;
    }
    
    const paymentSettingsForm = document.getElementById('paymentSettingsForm');
    if (paymentSettingsForm) {
        paymentSettingsForm.onsubmit = handlePaymentSettingsSubmit;
    }
    
    // التسويق والـ SEO
    const seoSettingsForm = document.getElementById('seoSettingsForm');
    if (seoSettingsForm) {
        seoSettingsForm.onsubmit = handleSeoSettingsSubmit;
    }
    
    const trackingSettingsForm = document.getElementById('trackingSettingsForm');
    if (trackingSettingsForm) {
        trackingSettingsForm.onsubmit = handleTrackingSettingsSubmit;
    }
    
    const notificationsSettingsForm = document.getElementById('notificationsSettingsForm');
    if (notificationsSettingsForm) {
        notificationsSettingsForm.onsubmit = handleNotificationsSettingsSubmit;
    }
    
    // المحتوى القانوني
    const refundPolicyForm = document.getElementById('refundPolicyForm');
    if (refundPolicyForm) {
        refundPolicyForm.onsubmit = handleRefundPolicySubmit;
    }
    
    const termsForm = document.getElementById('termsForm');
    if (termsForm) {
        termsForm.onsubmit = handleTermsSubmit;
    }
    
    const aboutForm = document.getElementById('aboutForm');
    if (aboutForm) {
        aboutForm.onsubmit = handleAboutSubmit;
    }
    
    // الكوبونات
    const couponForm = document.getElementById('couponForm');
    if (couponForm) {
        couponForm.onsubmit = handleCouponSubmit;
    }
    
    const couponEditForm = document.getElementById('couponEditForm');
    if (couponEditForm) {
        couponEditForm.onsubmit = handleCouponEditSubmit;
    }
    
    // البانرات
    const bannerUploadForm = document.getElementById('bannerUploadForm');
    if (bannerUploadForm) {
        bannerUploadForm.onsubmit = handleBannerSubmit;
    }
    
    const bannerEditForm = document.getElementById('bannerEditForm');
    if (bannerEditForm) {
        bannerEditForm.onsubmit = handleBannerEditSubmit;
    }
    
    // الأمان
    const adminCredentialsForm = document.getElementById('adminCredentialsForm');
    if (adminCredentialsForm) {
        adminCredentialsForm.onsubmit = handleAdminCredentialsSubmit;
    }
    
    const securitySettingsForm = document.getElementById('securitySettingsForm');
    if (securitySettingsForm) {
        securitySettingsForm.onsubmit = handleSecuritySettingsSubmit;
    }
}

// معالجة النماذج
async function handleProductSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const productId = form.productId.value;
    const data = {
        name: form.productName.value,
        price: parseFloat(form.productPrice.value),
        duration: form.productDuration.value,
        image_url: form.productImage.value,
        description: form.productDescription.value,
        features: form.productFeatures.value.split('\n').filter(f => f.trim()),
        stock: form.productStock.value ? parseInt(form.productStock.value) : null,
        is_active: true
    };

    const res = productId ? 
        await window.ironPlus.updateProduct(productId, data) : 
        await window.ironPlus.addProduct(data);

    if (res.success) {
        showNotification('تم الحفظ بنجاح ✅', 'success');
        adminPanel.closeModal();
        loadProducts();
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handleSiteSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        site_name: form.siteName.value,
        site_logo: form.siteLogo.value,
        site_favicon: form.siteFavicon.value,
        announcement_bar: form.announcementBar.value,
        maintenance_mode: form.maintenanceMode.checked
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ الإعدادات العامة بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handleSocialSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        whatsapp_number: form.whatsappNumber.value,
        snapchat_username: form.snapchatUsername.value,
        tiktok_username: form.tiktokUsername.value,
        twitter_username: form.twitterUsername.value,
        contact_email: form.contactEmail.value
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ وسائل التواصل بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handlePaymentSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        tax_rate: parseFloat(form.taxRate.value),
        min_order_amount: parseFloat(form.minOrderAmount.value),
        delivery_fee: parseFloat(form.deliveryFee.value),
        currency: form.currency.value
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ إعدادات الدفع بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handleSeoSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        meta_title: form.metaTitle.value,
        meta_description: form.metaDescription.value,
        meta_keywords: form.metaKeywords.value,
        canonical_url: form.canonicalUrl.value
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ إعدادات SEO بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handleTrackingSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        google_analytics_id: form.googleAnalyticsId.value,
        snapchat_pixel_id: form.snapchatPixelId.value,
        facebook_pixel_id: form.facebookPixelId.value,
        twitter_pixel_id: form.twitterPixelId.value,
        conversion_tracking: form.conversionTracking.checked
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ إعدادات التتبع بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handleNotificationsSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        live_notifications: form.liveNotifications.checked,
        notification_duration: parseInt(form.notificationDuration.value),
        notification_texts: form.notificationTexts.value,
        real_order_notifications: form.realOrderNotifications.checked
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ إعدادات الإشعارات بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handleRefundPolicySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        refund_policy_title: form.refundPolicyTitle.value,
        refund_policy_content: form.refundPolicyContent.value,
        refund_policy_active: form.refundPolicyActive.checked
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ سياسة الاسترجاع بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handleTermsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        terms_title: form.termsTitle.value,
        terms_content: form.termsContent.value,
        terms_active: form.termsActive.checked
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ الشروط والأحكام بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handleAboutSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        about_title: form.aboutTitle.value,
        about_content: form.aboutContent.value,
        about_active: form.aboutActive.checked
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ صفحة من نحن بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

async function handleCouponSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        code: form.couponCode.value,
        discount_type: form.discountType.value,
        discount_value: parseFloat(form.discountValue.value),
        min_order: form.minOrder.value ? parseFloat(form.minOrder.value) : null,
        max_uses: form.maxUses.value ? parseInt(form.maxUses.value) : null,
        expiry_date: form.expiryDate.value || null,
        is_active: form.couponActive.checked
    };

    const res = await window.ironPlus.createCoupon(data);
    if (res.success) {
        showNotification('تم إنشاء الكوبون بنجاح ✅', 'success');
        form.reset();
        loadCoupons();
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الإنشاء', 'error');
    }
}

async function handleCouponEditSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const couponId = form.editCouponId.value;
    const data = {
        code: form.editCouponCode.value,
        discount_type: form.editDiscountType.value,
        discount_value: parseFloat(form.editDiscountValue.value),
        min_order: form.editMinOrder.value ? parseFloat(form.editMinOrder.value) : null,
        max_uses: form.editMaxUses.value ? parseInt(form.editMaxUses.value) : null,
        expiry_date: form.editExpiryDate.value || null,
        is_active: form.editCouponActive.checked
    };

    const res = await window.ironPlus.updateCoupon(couponId, data);
    if (res.success) {
        showNotification('تم تحديث الكوبون بنجاح ✅', 'success');
        adminPanel.closeCouponModal();
        loadCoupons();
    } else {
        showNotification(res.message || 'حدث خطأ أثناء التحديث', 'error');
    }
}

async function handleBannerSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        title: form.bannerTitle.value,
        image_url: form.bannerImage.value,
        link: form.bannerLink.value,
        position: form.bannerPosition.value,
        order: parseInt(form.bannerOrder.value),
        alt_text: form.bannerAlt.value,
        is_active: form.bannerActive.checked
    };

    const res = await window.ironPlus.createBanner(data);
    if (res.success) {
        showNotification('تم رفع البانر بنجاح ✅', 'success');
        form.reset();
        loadBanners();
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الرفع', 'error');
    }
}

async function handleBannerEditSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const bannerId = form.editBannerId.value;
    const data = {
        title: form.editBannerTitle.value,
        image_url: form.editBannerImage.value,
        link: form.editBannerLink.value,
        position: form.editBannerPosition.value,
        order: parseInt(form.editBannerOrder.value),
        alt_text: form.editBannerAlt.value,
        is_active: form.editBannerActive.checked
    };

    const res = await window.ironPlus.updateBanner(bannerId, data);
    if (res.success) {
        showNotification('تم تحديث البانر بنجاح ✅', 'success');
        adminPanel.closeBannerModal();
        loadBanners();
    } else {
        showNotification(res.message || 'حدث خطأ أثناء التحديث', 'error');
    }
}

async function handleAdminCredentialsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const messageDiv = document.getElementById('credentialsMessage');
    
    const currentPassword = form.currentPassword.value;
    const newUsername = form.newUsername.value;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;
    
    if (!currentPassword) {
        showMessage(messageDiv, 'يرجى إدخال كلمة المرور الحالية', 'error');
        return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
        showMessage(messageDiv, 'كلمات المرور الجديدة غير متطابقة', 'error');
        return;
    }
    
    const data = {
        current_password: currentPassword,
        new_username: newUsername || null,
        new_password: newPassword || null
    };
    
    const res = await window.ironPlus.updateAdminCredentials(data);
    if (res.success) {
        showNotification('تم تحديث بيانات المسؤول بنجاح ✅', 'success');
        form.reset();
        messageDiv.style.display = 'none';
    } else {
        showMessage(messageDiv, res.message || 'حدث خطأ أثناء التحديث', 'error');
    }
}

async function handleSecuritySettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        two_factor_auth: form.twoFactorAuth.checked,
        max_login_attempts: parseInt(form.maxLoginAttempts.value),
        block_duration: parseInt(form.blockDuration.value),
        user_activity_logging: form.userActivityLogging.checked,
        force_https: form.forceHTTPS.checked
    };

    const res = await window.ironPlus.updateSiteSettings(data);
    if (res.success) {
        showNotification('تم حفظ إعدادات الأمان بنجاح ✅', 'success');
    } else {
        showNotification(res.message || 'حدث خطأ أثناء الحفظ', 'error');
    }
}

// --- سادساً: الدوال المساعدة والخدمات (UI Helpers) ---

function clearMessage(el) { if (el) { el.innerHTML = ''; el.style.display = 'none'; } }

function showMessage(el, text, type) {
    if (!el) return;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    el.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
    el.className = `message ${type}`;
    el.style.display = 'block';
}

function updateElement(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function getStatusText(s) {
    const map = { completed: 'مكتمل', pending: 'معلق', failed: 'فاشل' };
    return map[s] || s;
}

function getBannerPositionText(p) {
    const map = { 
        hero: 'الهيرو', 
        middle: 'منتصف الصفحة', 
        bottom: 'أسفل الصفحة',
        sidebar: 'الشريط الجانبي'
    };
    return map[p] || p;
}

function showNotification(msg, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'success' ? 'bg-green-900/90 border-green-700' :
        type === 'error' ? 'bg-red-900/90 border-red-700' :
        type === 'warning' ? 'bg-yellow-900/90 border-yellow-700' :
        'bg-blue-900/90 border-blue-700'
    } border`;
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-times-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icon} mr-3 text-xl"></i>
            <span class="flex-1">${msg}</span>
            <button class="ml-4 text-gray-300 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// --- سابعاً: تصدير الدوال للـ HTML (The Bridge) ---

window.adminPanel = {
    showProductModal: async (id) => {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');
        if (id) {
            title.textContent = "تعديل الباقة";
            const res = await window.ironPlus.getProduct(id);
            if (res.success) {
                form.productId.value = res.product.id;
                form.productName.value = res.product.name;
                form.productPrice.value = res.product.price;
                form.productDuration.value = res.product.duration || '';
                form.productImage.value = res.product.image_url || '';
                form.productDescription.value = res.product.description || '';
                form.productFeatures.value = res.product.features ? res.product.features.join('\n') : '';
                form.productStock.value = res.product.stock || '';
            }
        } else {
            title.textContent = "إضافة باقة جديدة";
            form.reset();
            form.productId.value = '';
        }
        modal.style.display = 'flex';
    },

    closeModal: () => {
        document.getElementById('productModal').style.display = 'none';
    },

    deleteProduct: async (id, name) => {
        if (confirm(`هل تريد حذف ${name} نهائياً؟`)) {
            const res = await window.ironPlus.deleteProduct(id);
            if (res.success) {
                showNotification('تم حذف المنتج بنجاح ✅', 'success');
                loadProducts();
            }
        }
    },

    uploadCodes: async () => {
        const pId = document.getElementById('productForCodes').value;
        const text = document.getElementById('bulkCodesText').value.trim();
        if (!pId || !text) {
            showNotification('يرجى اختيار منتج وإدخال الأكواد', 'warning');
            return;
        }
        const res = await window.ironPlus.uploadBulkCodes(pId, text);
        if (res.success) {
            showNotification(`تم شحن ${res.count} كود بنجاح! 🚀`, 'success');
            document.getElementById('bulkCodesText').value = '';
        }
    },

    deliverOrder: async (orderId, productId) => {
        const res = await window.ironPlus.assignActivationCode(orderId, productId);
        if (res.success) {
            showNotification(`تم تسليم الكود بنجاح: ${res.code}`, 'success');
            loadOrders();
        } else {
            showNotification(res.message, 'error');
        }
    },

    contactCustomer: (phone) => {
        const cleanPhone = phone.startsWith('0') ? '966' + phone.substring(1) : phone;
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    },

    viewOrder: async (orderId) => {
        const res = await window.ironPlus.getOrder(orderId);
        if (res.success) {
            const order = res.order;
            alert(`
                تفاصيل الطلب:
                رقم الطلب: ${order.id.substring(0, 8)}
                العميل: ${order.customer_phone}
                المنتج: ${order.products?.name || 'N/A'}
                المبلغ: ${window.ironPlus.formatPrice(order.amount)} ر.س
                الخصم: ${order.discount ? window.ironPlus.formatPrice(order.discount) + ' ر.س' : 'لا يوجد'}
                الإجمالي: ${window.ironPlus.formatPrice(order.total || order.amount)} ر.س
                الحالة: ${getStatusText(order.status)}
                التاريخ: ${window.ironPlus.formatDate(order.created_at)}
                ${order.activation_code ? `كود التفعيل: ${order.activation_code}` : ''}
            `);
        }
    },

    // إدارة الكوبونات
    showCouponModal: () => {
        document.getElementById('couponModal').style.display = 'flex';
    },

    closeCouponModal: () => {
        document.getElementById('couponModal').style.display = 'none';
    },

    editCoupon: async (id) => {
        const modal = document.getElementById('couponModal');
        const form = document.getElementById('couponEditForm');
        const title = document.getElementById('couponModalTitle');
        
        const res = await window.ironPlus.getCoupon(id);
        if (res.success) {
            const coupon = res.coupon;
            title.textContent = "تعديل الكوبون";
            form.editCouponId.value = coupon.id;
            form.editCouponCode.value = coupon.code;
            form.editDiscountType.value = coupon.discount_type;
            form.editDiscountValue.value = coupon.discount_value;
            form.editMinOrder.value = coupon.min_order || '';
            form.editMaxUses.value = coupon.max_uses || '';
            form.editExpiryDate.value = coupon.expiry_date ? coupon.expiry_date.substring(0, 10) : '';
            form.editCouponActive.checked = coupon.is_active;
            modal.style.display = 'flex';
        }
    },

    deleteCoupon: async (id, code) => {
        if (confirm(`هل تريد حذف الكوبون ${code} نهائياً؟`)) {
            const res = await window.ironPlus.deleteCoupon(id);
            if (res.success) {
                showNotification('تم حذف الكوبون بنجاح ✅', 'success');
                loadCoupons();
            }
        }
    },

    // إدارة البانرات
    showBannerModal: () => {
        document.getElementById('bannerModal').style.display = 'flex';
    },

    closeBannerModal: () => {
        document.getElementById('bannerModal').style.display = 'none';
    },

    editBanner: async (id) => {
        const modal = document.getElementById('bannerModal');
        const form = document.getElementById('bannerEditForm');
        const title = document.getElementById('bannerModalTitle');
        
        const res = await window.ironPlus.getBanner(id);
        if (res.success) {
            const banner = res.banner;
            title.textContent = "تعديل البانر";
            form.editBannerId.value = banner.id;
            form.editBannerTitle.value = banner.title;
            form.editBannerImage.value = banner.image_url;
            form.editBannerLink.value = banner.link || '';
            form.editBannerPosition.value = banner.position;
            form.editBannerOrder.value = banner.order || 1;
            form.editBannerAlt.value = banner.alt_text || '';
            form.editBannerActive.checked = banner.is_active;
            modal.style.display = 'flex';
        }
    },

    deleteBanner: async (id, title) => {
        if (confirm(`هل تريد حذف البانر "${title}" نهائياً؟`)) {
            const res = await window.ironPlus.deleteBanner(id);
            if (res.success) {
                showNotification('تم حذف البانر بنجاح ✅', 'success');
                loadBanners();
            }
        }
    },

    createCoupon: async (e) => {
        e.preventDefault();
        const form = document.getElementById('couponForm');
        const data = {
            code: form.couponCode.value,
            discount_type: form.discountType.value,
            discount_value: parseFloat(form.discountValue.value),
            min_order: form.minOrder.value ? parseFloat(form.minOrder.value) : null,
            max_uses: form.maxUses.value ? parseInt(form.maxUses.value) : null,
            expiry_date: form.expiryDate.value || null,
            is_active: form.couponActive.checked
        };

        const res = await window.ironPlus.createCoupon(data);
        if (res.success) {
            showNotification('تم إنشاء الكوبون بنجاح ✅', 'success');
            form.reset();
            loadCoupons();
        } else {
            showNotification(res.message || 'حدث خطأ أثناء الإنشاء', 'error');
        }
    }
};

async function loadProductsForCodes() {
    const res = await window.ironPlus.getProducts();
    const select = document.getElementById('productForCodes');
    if (res.success && select) {
        select.innerHTML = '<option value="">اختر باقة...</option>' + 
            res.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
}

window.logoutAdmin = () => {
    if(confirm('هل تريد تسجيل الخروج؟')) window.ironPlus.logout();
};

window.switchTab = switchTab;
window.loadOrders = loadOrders;
window.loadSettings = loadSettings;
window.loadCoupons = loadCoupons;
window.loadBanners = loadBanners;
window.loadLoginLogs = loadLoginLogs;

// جسر لربط أزرار الـ HTML القديمة بالدوال الجديدة
window.closeModal = window.adminPanel.closeModal;
window.uploadCodes = window.adminPanel.uploadCodes;
window.showAddProductModal = function() {
    window.adminPanel.showProductModal();
};
