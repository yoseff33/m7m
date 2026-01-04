// ========================================
// لوحة تحكم Iron Plus v5.0 - نظام الإدارة الشامل CMS
// ========================================

// 1. تهيئة النظام
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

// 2. شاشة الدخول
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

// 3. تهيئة اللوحة الرئيسية
async function initializeAdminPanel() {
    try {
        document.getElementById('adminLoginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        updateElement('adminName', `مرحباً، ${window.ironPlus.getAdminUsername()}`);
        
        setupNavigation();
        setupTabSystem();
        await loadDashboardData();
        await loadProducts();
        await loadProductsForCodes();
        await loadAllSettings();
        await loadBanners();
        
        console.log('Systems Online: Admin panel v5.0 fully operational.');
    } catch (error) {
        console.error('Boot error:', error);
    }
}

// 4. نظام التنقل بين الأقسام
function setupNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
            
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section') + 'Section';
            const target = document.getElementById(sectionId);
            if (target) target.classList.add('active');
        });
    });
}

function setupTabSystem() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section') + 'Section';
            
            // تحديث الأزرار النشطة
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // إظهار القسم المحدد
            document.querySelectorAll('.admin-section').forEach(sec => {
                sec.classList.remove('active');
            });
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // تحميل البيانات عند اختيار القسم
                switch(sectionId) {
                    case 'ordersSection':
                        loadOrders();
                        break;
                    case 'pagesSection':
                        // لا تحميل تلقائي، انتظار اختيار المستخدم
                        break;
                    case 'bannersSection':
                        loadBanners();
                        break;
                }
            }
        });
    });
}

// 5. تحميل البيانات
async function loadDashboardData() {
    try {
        const res = await window.ironPlus.getSiteStats();
        if (res.success) {
            updateElement('totalSales', `${window.ironPlus.formatPrice(res.stats.totalSales)} ر.س`);
            updateElement('availableCodes', res.stats.availableCodes);
            updateElement('totalCustomers', res.stats.uniqueCustomers);
            updateElement('activeProducts', res.stats.activeProducts);
            
            // تحميل الطلبات لحساب الإحصائيات
            const ordersRes = await window.ironPlus.getAllOrders();
            if (ordersRes.success) {
                const orders = ordersRes.orders;
                const pending = orders.filter(o => o.status === 'pending').length;
                const completed = orders.filter(o => o.status === 'completed').length;
                
                updateElement('pendingOrders', pending);
                updateElement('completedOrders', completed);
                
                // حساب نسبة التحويل (مثال بسيط)
                const conversionRate = orders.length > 0 ? 
                    Math.round((completed / orders.length) * 100) : 0;
                updateElement('conversionRate', `${conversionRate}%`);
            }
        }
        
        // تحميل عدد الزيارات اليوم (مثال)
        updateElement('dailyVisits', '156');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadAllSettings() {
    try {
        const res = await window.ironPlus.getSiteSettings();
        if (res.success) {
            const settings = res.settings;
            
            // تعبئة إعدادات الموقع
            if (settings.site_logo_text) {
                document.getElementById('site_logo_text').value = settings.site_logo_text;
            }
            if (settings.site_tagline) {
                document.getElementById('site_tagline').value = settings.site_tagline;
            }
            if (settings.live_notification_text) {
                document.getElementById('live_notification_text').value = settings.live_notification_text;
            }
            if (settings.maintenance_mode) {
                document.getElementById('maintenance_mode').checked = settings.maintenance_mode === 'true';
            }
            if (settings.tax_rate) {
                document.getElementById('tax_rate').value = settings.tax_rate;
            }
            
            // تعبئة إعدادات التواصل الاجتماعي
            if (settings.whatsapp_number) {
                document.getElementById('whatsapp_number').value = settings.whatsapp_number;
            }
            if (settings.snapchat_username) {
                document.getElementById('snapchat_username').value = settings.snapchat_username;
            }
            if (settings.tiktok_username) {
                document.getElementById('tiktok_username').value = settings.tiktok_username;
            }
            if (settings.twitter_username) {
                document.getElementById('twitter_username').value = settings.twitter_username;
            }
            
            // تعبئة إعدادات SEO
            if (settings.meta_title) {
                document.getElementById('meta_title').value = settings.meta_title;
            }
            if (settings.meta_description) {
                document.getElementById('meta_description').value = settings.meta_description;
            }
            if (settings.meta_keywords) {
                document.getElementById('meta_keywords').value = settings.meta_keywords;
            }
            
            // تعبئة إعدادات التحليل
            if (settings.google_analytics_id) {
                document.getElementById('google_analytics_id').value = settings.google_analytics_id;
            }
            if (settings.snapchat_pixel_id) {
                document.getElementById('snapchat_pixel_id').value = settings.snapchat_pixel_id;
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function loadProducts() {
    const res = await window.ironPlus.getProducts();
    const tbody = document.getElementById('productsTableBody');
    if (res.success && tbody) {
        tbody.innerHTML = res.products.map(p => `
            <tr>
                <td><img src="${p.image_url || 'assets/default.png'}" style="width:40px; border-radius:5px;"></td>
                <td><strong>${p.name}</strong></td>
                <td><div class="text-gold">${window.ironPlus.formatPrice(p.price)} ر.س</div></td>
                <td>${p.duration || '-'}</td>
                <td><span class="status-badge status-${p.is_active ? 'active' : 'inactive'}">${p.is_active ? 'نشط' : 'غير نشط'}</span></td>
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

async function loadOrders(filters = {}) {
    const res = await window.ironPlus.getAllOrders(filters);
    const tbody = document.getElementById('ordersTableBody');
    if (res.success && tbody) {
        tbody.innerHTML = res.orders.map(o => `
            <tr>
                <td><small>${o.id.substring(0,8)}</small></td>
                <td>${o.customer_phone}</td>
                <td>${o.products?.name || 'N/A'}</td>
                <td>${window.ironPlus.formatPrice(o.amount)} ر.س</td>
                <td><small>${new Date(o.created_at).toLocaleDateString('ar-SA')}</small></td>
                <td><span class="status-badge status-${o.status}">${getStatusText(o.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="adminPanel.deliverOrder('${o.id}', '${o.product_id}')" class="btn-action btn-success" title="تسليم الكود"><i class="fas fa-key"></i></button>
                        <button onclick="adminPanel.contactCustomer('${o.customer_phone}')" class="btn-action"><i class="fab fa-whatsapp"></i></button>
                        <button onclick="adminPanel.viewOrderDetails('${o.id}')" class="btn-action"><i class="fas fa-eye"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

async function loadBanners() {
    const res = await window.ironPlus.getBanners();
    const container = document.getElementById('bannersList');
    if (res.success && container) {
        if (res.banners.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-images text-3xl mb-3"></i>
                    <p>لا توجد بانرات إعلانية</p>
                </div>
            `;
        } else {
            container.innerHTML = res.banners.map(banner => `
                <div class="banner-item flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                    <div class="flex items-center gap-4">
                        <img src="${banner.image_url}" alt="${banner.title}" style="width:80px; height:50px; object-fit:cover; border-radius:5px;">
                        <div>
                            <h4 class="font-bold">${banner.title || 'بدون عنوان'}</h4>
                            <p class="text-sm text-gray-400">${banner.target_url || 'لا يوجد رابط'}</p>
                            <span class="text-xs ${banner.is_active ? 'text-green-400' : 'text-red-400'}">
                                ${banner.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button onclick="adminPanel.showBannerModal('${banner.id}')" class="btn-action"><i class="fas fa-edit"></i></button>
                        <button onclick="adminPanel.deleteBanner('${banner.id}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// 6. دوال مساعدة
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

function showNotification(msg, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-900 border-green-700' :
        type === 'error' ? 'bg-red-900 border-red-700' :
        type === 'warning' ? 'bg-yellow-900 border-yellow-700' :
        'bg-blue-900 border-blue-700'
    } border`;
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="flex-1">${msg}</span>
            <button class="ml-4" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// 7. تصدير دوال النظام
window.adminPanel = {
    // إدارة المنتجات
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
                form.productPrice.value = window.ironPlus.formatPrice(res.product.price);
                form.productDuration.value = res.product.duration || '';
                form.productImage.value = res.product.image_url || '';
                form.productDescription.value = res.product.description || '';
                form.productFeatures.value = Array.isArray(res.product.features) ? 
                    res.product.features.join('\n') : (res.product.features || '');
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
                showNotification('تم حذف المنتج بنجاح', 'success');
                loadProducts();
            }
        }
    },

    // إدارة الأكواد
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
            loadDashboardData();
        } else {
            showNotification(res.message, 'error');
        }
    },

    generateRandomCodes: async () => {
        const pId = document.getElementById('productForCodes').value;
        const count = parseInt(document.getElementById('codesCount').value) || 10;
        
        if (!pId) {
            showNotification('يرجى اختيار منتج أولاً', 'warning');
            return;
        }
        
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = `IRON-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            codes.push(code);
        }
        
        document.getElementById('bulkCodesText').value = codes.join('\n');
        showNotification(`تم توليد ${count} كود عشوائي`, 'success');
    },

    clearCodesText: () => {
        document.getElementById('bulkCodesText').value = '';
    },

    // إدارة الطلبات
    deliverOrder: async (orderId, productId) => {
        const res = await window.ironPlus.assignActivationCode(orderId, productId);
        if (res.success) {
            showNotification(`تم تسليم الكود بنجاح: ${res.code}`, 'success');
            loadOrders();
            loadDashboardData();
        } else {
            showNotification(res.message, 'error');
        }
    },

    contactCustomer: (phone) => {
        const cleanPhone = phone.startsWith('0') ? '966' + phone.substring(1) : phone;
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    },

    filterOrders: () => {
        const status = document.getElementById('orderFilterStatus').value;
        const phone = document.getElementById('orderFilterPhone').value;
        loadOrders({ status, phone });
    },

    viewOrderDetails: async (orderId) => {
        // يمكن تطوير هذه الدالة لعرض تفاصيل الطلب في modal
        showNotification('تفاصيل الطلب قيد التطوير', 'info');
    },

    // إدارة الإعدادات
    saveGeneralSettings: async () => {
        const settings = {
            site_logo_text: document.getElementById('site_logo_text').value,
            site_tagline: document.getElementById('site_tagline').value,
            live_notification_text: document.getElementById('live_notification_text').value,
            maintenance_mode: document.getElementById('maintenance_mode').checked ? 'true' : 'false',
            tax_rate: document.getElementById('tax_rate').value
        };
        
        const res = await window.ironPlus.updateMultipleSettings(settings);
        if (res.success) {
            showNotification('تم حفظ الإعدادات العامة بنجاح', 'success');
        } else {
            showNotification('حدث خطأ في حفظ الإعدادات', 'error');
        }
    },

    saveSocialSettings: async () => {
        const settings = {
            whatsapp_number: document.getElementById('whatsapp_number').value,
            snapchat_username: document.getElementById('snapchat_username').value,
            tiktok_username: document.getElementById('tiktok_username').value,
            twitter_username: document.getElementById('twitter_username').value
        };
        
        const res = await window.ironPlus.updateMultipleSettings(settings);
        if (res.success) {
            showNotification('تم حفظ إعدادات التواصل الاجتماعي بنجاح', 'success');
        } else {
            showNotification('حدث خطأ في حفظ الإعدادات', 'error');
        }
    },

    saveSeoSettings: async () => {
        const settings = {
            meta_title: document.getElementById('meta_title').value,
            meta_description: document.getElementById('meta_description').value,
            meta_keywords: document.getElementById('meta_keywords').value
        };
        
        const res = await window.ironPlus.updateMultipleSettings(settings);
        if (res.success) {
            showNotification('تم حفظ إعدادات SEO بنجاح', 'success');
        } else {
            showNotification('حدث خطأ في حفظ الإعدادات', 'error');
        }
    },

    saveAnalyticsSettings: async () => {
        const settings = {
            google_analytics_id: document.getElementById('google_analytics_id').value,
            snapchat_pixel_id: document.getElementById('snapchat_pixel_id').value
        };
        
        const res = await window.ironPlus.updateMultipleSettings(settings);
        if (res.success) {
            showNotification('تم حفظ إعدادات التحليل بنجاح', 'success');
        } else {
            showNotification('حدث خطأ في حفظ الإعدادات', 'error');
        }
    },

    // إدارة البانرات
    showBannerModal: async (id) => {
        const modal = document.getElementById('bannerModal');
        const form = document.getElementById('bannerForm');
        const title = document.getElementById('bannerModalTitle');
        
        if (id) {
            title.textContent = "تعديل البانر";
            // هنا يجب جلب بيانات البانر من السيرفر
            // هذا مثال:
            // const res = await window.ironPlus.getBanner(id);
        } else {
            title.textContent = "إضافة بانر جديد";
            form.reset();
            form.bannerId.value = '';
        }
        modal.style.display = 'flex';
    },

    closeBannerModal: () => {
        document.getElementById('bannerModal').style.display = 'none';
    },

    saveBanner: async () => {
        const bannerData = {
            title: document.getElementById('bannerTitle').value,
            image_url: document.getElementById('bannerImage').value,
            target_url: document.getElementById('bannerLink').value,
            display_order: parseInt(document.getElementById('bannerOrder').value) || 0,
            is_active: document.getElementById('bannerActive').checked
        };
        
        const bannerId = document.getElementById('bannerId').value;
        let res;
        
        if (bannerId) {
            res = await window.ironPlus.updateBanner(bannerId, bannerData);
        } else {
            res = await window.ironPlus.addBanner(bannerData);
        }
        
        if (res.success) {
            showNotification('تم حفظ البانر بنجاح', 'success');
            this.closeBannerModal();
            loadBanners();
        } else {
            showNotification(res.message, 'error');
        }
    },

    deleteBanner: async (id) => {
        if (confirm('هل تريد حذف هذا البانر؟')) {
            const res = await window.ironPlus.deleteBanner(id);
            if (res.success) {
                showNotification('تم حذف البانر بنجاح', 'success');
                loadBanners();
            }
        }
    },

    // إدارة الصفحات
    loadPageContent: async () => {
        const slug = document.getElementById('pageSelector').value;
        if (!slug) return;
        
        const res = await window.ironPlus.getPage(slug);
        if (res.success) {
            document.getElementById('pageTitle').value = res.page.title;
            document.getElementById('pageContent').innerHTML = res.page.content || '';
            document.getElementById('pageMetaTitle').value = res.page.meta_title || '';
            document.getElementById('pageMetaDescription').value = res.page.meta_description || '';
            
            document.getElementById('pageEditorSection').style.display = 'block';
            document.getElementById('pagePlaceholder').style.display = 'none';
        }
    },

    savePageContent: async () => {
        const slug = document.getElementById('pageSelector').value;
        const updates = {
            title: document.getElementById('pageTitle').value,
            content: document.getElementById('pageContent').innerHTML,
            meta_title: document.getElementById('pageMetaTitle').value,
            meta_description: document.getElementById('pageMetaDescription').value
        };
        
        const res = await window.ironPlus.updatePage(slug, updates);
        if (res.success) {
            showNotification('تم حفظ الصفحة بنجاح', 'success');
        } else {
            showNotification('حدث خطأ في حفظ الصفحة', 'error');
        }
    },

    cancelPageEdit: () => {
        document.getElementById('pageEditorSection').style.display = 'none';
        document.getElementById('pagePlaceholder').style.display = 'block';
        document.getElementById('pageSelector').value = '';
    },

    // إدارة الأمان
    updateAdminCredentials: async () => {
        const newUsername = document.getElementById('new_username').value;
        const currentPassword = document.getElementById('current_password').value;
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        const messageDiv = document.getElementById('securityMessage');
        clearMessage(messageDiv);
        
        if (!currentPassword) {
            showMessage(messageDiv, 'يرجى إدخال كلمة المرور الحالية', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage(messageDiv, 'كلمات المرور الجديدة غير متطابقة', 'error');
            return;
        }
        
        // في الواقع، يجب تشفير كلمة المرور قبل إرسالها
        // هذا مثال مبسط
        const res = await window.ironPlus.updateAdminCredentials(
            newUsername || localStorage.getItem('admin_username'),
            newPassword,
            currentPassword
        );
        
        if (res.success) {
            showMessage(messageDiv, res.message, 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showMessage(messageDiv, res.message, 'error');
        }
    }
};

// 8. دوال مساعدة إضافية
async function loadProductsForCodes() {
    const res = await window.ironPlus.getProducts();
    const select = document.getElementById('productForCodes');
    if (res.success && select) {
        select.innerHTML = '<option value="">اختر باقة...</option>' + 
            res.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
}

// 9. إعداد مستمعي الأحداث
document.addEventListener('DOMContentLoaded', function() {
    // إعداد مستمع نموذج المنتج
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.onsubmit = async function(e) {
            e.preventDefault();
            const form = e.target;
            const productId = form.productId.value;
            const data = {
                name: form.productName.value,
                price: parseFloat(form.productPrice.value),
                duration: form.productDuration.value,
                image_url: form.productImage.value,
                description: form.productDescription.value,
                features: form.productFeatures.value,
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
                showNotification(res.message, 'error');
            }
        };
    }
    
    // إعداد مستمع نموذج البانر
    const bannerForm = document.getElementById('bannerForm');
    if (bannerForm) {
        bannerForm.onsubmit = function(e) {
            e.preventDefault();
            adminPanel.saveBanner();
        };
    }
});

// 10. دوال للوصول من HTML
window.logoutAdmin = () => {
    if(confirm('هل تريد تسجيل الخروج؟')) window.ironPlus.logout();
};

window.closeModal = window.adminPanel.closeModal;
window.uploadCodes = window.adminPanel.uploadCodes;
