// ========================================
// لوحة تحكم Iron Plus - النظام الإداري المطور v5.5
// ========================================

// دالة لمعالجة أخطاء الصور
function handleImageError(img) {
    // استبدال الصور المعطوبة بصورة افتراضية
    const productName = img.alt || 'Product';
    const encodedName = encodeURIComponent(productName.substring(0, 20));
    img.src = `https://ui-avatars.com/api/?name=${encodedName}&background=3d5afe&color=ffffff&size=40`;
    img.onerror = null; // منع تكرار الأخطاء
}

// 1. تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('Jarvis: Admin Systems Initializing v5.5... 🦾');
    
    // انتظار بسيط لضمان تحميل ملف الإعدادات
    setTimeout(async () => {
        if (!window.ironPlus || !window.ironPlus.isAdminLoggedIn()) {
            console.log('Access Denied. Showing Login Screen...');
            showLoginScreen();
            return;
        }
        // إذا مسجل دخول، شغل اللوحة فوراً
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
        
        setupNavigation();
        await loadDashboardData();
        await loadProducts();
        await loadOrders();
        await loadProductsForCodes();
        await loadSiteSettings();
        await loadCoupons();
        await loadBanners();
        await loadPages();
        setupEventListeners();
        
        console.log('Systems Online: Admin panel fully operational.');
    } catch (error) {
        console.error('Boot error:', error);
        showNotification('حدث خطأ أثناء تهيئة النظام', 'error');
    }
}

// --- ثالثاً: إدارة التنقل (Navigation) ---

function setupNavigation() {
    // التنقل بين الأقسام
    document.querySelectorAll('.admin-nav button').forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            showAdminSection(sectionId);
        });
    });
}

function showAdminSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إزالة النشاط من جميع أزرار التنقل
    document.querySelectorAll('.admin-nav button').forEach(button => {
        button.classList.remove('active');
    });
    
    // عرض القسم المطلوب
    const targetSection = document.getElementById(`${sectionId}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // تفعيل زر التنقل
    const activeButton = document.querySelector(`.admin-nav button[data-section="${sectionId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// ✅ تعريف دالة switchTab لمعالجة الأخطاء
window.switchTab = function(sectionId) {
    showAdminSection(sectionId);
};

// --- رابعاً: إدارة البيانات (Dashboard & Lists) ---

async function loadDashboardData() {
    try {
        const res = await window.ironPlus.getSiteStats();
        if (res.success) {
            updateElement('totalSales', `${window.ironPlus.formatPrice(res.stats.totalSales)} ر.س`);
            updateElement('availableCodes', res.stats.availableCodes);
            updateElement('totalCustomers', res.stats.uniqueCustomers);
            updateElement('activeOrders', res.stats.totalOrders || 0);
        } else {
            showNotification('فشل تحميل الإحصائيات', 'error');
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

async function loadProducts() {
    try {
        const res = await window.ironPlus.getProducts();
        const tbody = document.getElementById('productsTableBody');
        if (res.success && tbody) {
            tbody.innerHTML = res.products.map(p => `
                <tr>
                    <td>
                        <img src="${p.image_url || '#'}" 
                             onerror="handleImageError(this)"
                             style="width:40px; height:40px; border-radius:5px; object-fit:cover;"
                             alt="${p.name}">
                    </td>
                    <td><strong>${p.name}</strong></td>
                    <td><div class="text-gold">${window.ironPlus.formatPrice(p.price)} ر.س</div></td>
                    <td>${p.duration || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="adminPanel.showProductModal('${p.id}')" class="btn-action"><i class="fas fa-edit"></i></button>
                            <button onclick="adminPanel.deleteProduct('${p.id}', '${p.name}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
            // إضافة معالج الأخطاء للصور بعد التحميل
            setTimeout(() => {
                tbody.querySelectorAll('img').forEach(img => {
                    img.onerror = function() {
                        const productName = img.alt || 'Product';
                        const encodedName = encodeURIComponent(productName.substring(0, 20));
                        this.src = `https://ui-avatars.com/api/?name=${encodedName}&background=3d5afe&color=ffffff&size=40`;
                    };
                });
            }, 100);
        } else if (!res.success) {
            showNotification('فشل تحميل المنتجات', 'error');
        }
    } catch (error) {
        console.error('Load products error:', error);
    }
}

async function loadOrders() {
    await filterOrders();
}

async function filterOrders() {
    try {
        const search = document.getElementById('orderSearch')?.value || '';
        const status = document.getElementById('orderStatusFilter')?.value || '';
        
        const filters = {};
        if (search) filters.phone = search;
        if (status) filters.status = status;
        
        const res = await window.ironPlus.getAllOrders(filters);
        const tbody = document.getElementById('allOrdersTableBody');
        if (res.success && tbody) {
            tbody.innerHTML = res.orders.map(o => `
                <tr>
                    <td><small>${o.id?.substring(0,8) || 'N/A'}</small></td>
                    <td>${o.customer_phone || 'N/A'}</td>
                    <td>${o.products?.name || 'N/A'}</td>
                    <td>${window.ironPlus.formatPrice(o.amount)} ر.س</td>
                    <td><span class="status-badge status-${o.status}">${getStatusText(o.status)}</span></td>
                    <td>${window.ironPlus.formatDate(o.created_at)}</td>
                    <td>
                        <div class="action-buttons">
                            ${o.status === 'pending' ? `<button onclick="adminPanel.deliverOrder('${o.id}', '${o.product_id}')" class="btn-action btn-success" title="تسليم الكود"><i class="fas fa-key"></i></button>` : ''}
                            <button onclick="adminPanel.contactCustomer('${o.customer_phone}')" class="btn-action"><i class="fab fa-whatsapp"></i></button>
                            <button onclick="adminPanel.updateOrderStatus('${o.id}', 'completed')" class="btn-action btn-success" title="تم"><i class="fas fa-check"></i></button>
                            <button onclick="adminPanel.updateOrderStatus('${o.id}', 'failed')" class="btn-action btn-delete" title="فشل"><i class="fas fa-times"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Filter orders error:', error);
    }
}

// --- خامساً: إدارة الإعدادات (Site Settings) ---

async function loadSiteSettings() {
    try {
        const res = await window.ironPlus.getSiteSettings();
        if (res.success) {
            const settings = res.settings;
            
            // تعبئة الحقول
            for (const key in settings) {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = settings[key] === 'true' || settings[key] === true;
                    } else {
                        element.value = settings[key] || '';
                    }
                }
            }
        }
        
        // إعداد نموذج الإعدادات
        const settingsForm = document.getElementById('siteSettingsForm');
        if (settingsForm) {
            settingsForm.onsubmit = async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const settings = {};
                
                // جمع البيانات من النموذج
                document.querySelectorAll('#siteSettingsForm input, #siteSettingsForm textarea, #siteSettingsForm select').forEach(element => {
                    if (element.id) {
                        if (element.type === 'checkbox') {
                            settings[element.id] = element.checked;
                        } else {
                            settings[element.id] = element.value;
                        }
                    }
                });
                
                const res = await window.ironPlus.updateSiteSettings(settings);
                if (res.success) {
                    showNotification('تم حفظ الإعدادات بنجاح ✅', 'success');
                } else {
                    showNotification('حدث خطأ أثناء حفظ الإعدادات', 'error');
                }
            };
        }
    } catch (error) {
        console.error('Load site settings error:', error);
    }
}

// --- سادساً: إدارة الكوبونات (Coupons) ---

async function loadCoupons() {
    try {
        const res = await window.ironPlus.getCoupons();
        const tbody = document.getElementById('couponsTableBody');
        if (res.success && tbody) {
            tbody.innerHTML = res.coupons.map(c => `
                <tr>
                    <td><strong>${c.code}</strong></td>
                    <td>${c.discount_type === 'percentage' ? 'نسبة مئوية' : 'قيمة ثابتة'}</td>
                    <td>${c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} ر.س`}</td>
                    <td>${c.product_id || 'جميع المنتجات'}</td>
                    <td>${window.ironPlus.formatDate(c.valid_from)}</td>
                    <td>${window.ironPlus.formatDate(c.valid_to)}</td>
                    <td><span class="status-badge ${c.is_active ? 'status-completed' : 'status-failed'}">${c.is_active ? 'نشط' : 'غير نشط'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="adminPanel.showCouponModal('${c.id}')" class="btn-action"><i class="fas fa-edit"></i></button>
                            <button onclick="adminPanel.deleteCoupon('${c.id}', '${c.code}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Load coupons error:', error);
    }
}

// --- سابعاً: إدارة البانرات (Banners) ---

async function loadBanners() {
    try {
        const res = await window.ironPlus.getBanners();
        const container = document.getElementById('bannersContainer');
        if (res.success && container) {
            container.innerHTML = res.banners.map(b => `
                <div class="hud-card">
                    <img src="${b.image_url || '#'}" 
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(b.title.substring(0, 20))}&background=3d5afe&color=ffffff&size=300x150'"
                         style="width:100%; height:150px; object-fit:cover; border-radius:5px;" 
                         alt="${b.title}">
                    <div style="padding:15px;">
                        <h4>${b.title}</h4>
                        <p class="text-sm text-gray-400">${b.link || 'لا يوجد رابط'}</p>
                        <div class="flex justify-between items-center mt-4">
                            <span class="status-badge ${b.is_active ? 'status-completed' : 'status-failed'}">${b.is_active ? 'نشط' : 'غير نشط'}</span>
                            <div class="action-buttons">
                                <button onclick="adminPanel.showBannerModal('${b.id}')" class="btn-action"><i class="fas fa-edit"></i></button>
                                <button onclick="adminPanel.deleteBanner('${b.id}', '${b.title}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load banners error:', error);
    }
}

// --- ثامناً: إدارة الصفحات (Pages) ---

async function loadPages() {
    try {
        const res = await window.ironPlus.getPages();
        const tbody = document.getElementById('pagesTableBody');
        if (res.success && tbody) {
            tbody.innerHTML = res.pages.map(p => `
                <tr>
                    <td><strong>${p.title}</strong></td>
                    <td>/page.html?slug=${p.slug}</td>
                    <td>${window.ironPlus.formatDate(p.created_at)}</td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="adminPanel.showPageModal('${p.id}')" class="btn-action"><i class="fas fa-edit"></i></button>
                            <button onclick="adminPanel.deletePage('${p.id}', '${p.title}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Load pages error:', error);
    }
}

// --- تاسعاً: الدوال المساعدة والخدمات (UI Helpers) ---

function clearMessage(el) { 
    if (el) { 
        el.innerHTML = ''; 
        el.style.display = 'none'; 
    } 
}

function showMessage(el, text, type) {
    if (!el) return;
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    el.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
    el.className = `message ${type}`;
    el.style.display = 'block';
}

function updateElement(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function getStatusText(s) {
    const map = { 
        completed: 'مكتمل', 
        pending: 'معلق', 
        failed: 'فاشل',
        processing: 'قيد المعالجة',
        delivered: 'تم التسليم'
    };
    return map[s] || s;
}

function showNotification(msg, type = 'info') {
    // إنشاء إشعار مؤقت
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-900' : type === 'error' ? 'bg-red-900' : 'bg-blue-900'} text-white`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'} mr-2"></i>
            <span>${msg}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function setupEventListeners() {
    // نموذج المنتج
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.onsubmit = handleProductSubmit;
    }
    
    // نموذج الكوبون
    const couponForm = document.getElementById('couponForm');
    if (couponForm) {
        couponForm.onsubmit = handleCouponSubmit;
    }
    
    // نموذج البانر
    const bannerForm = document.getElementById('bannerForm');
    if (bannerForm) {
        bannerForm.onsubmit = handleBannerSubmit;
    }
    
    // نموذج الصفحة
    const pageForm = document.getElementById('pageForm');
    if (pageForm) {
        pageForm.onsubmit = handlePageSubmit;
    }
    
    // نموذج الأمان
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.onsubmit = handleSecuritySubmit;
    }
    
    // فلتر الطلبات
    const orderSearch = document.getElementById('orderSearch');
    const orderStatusFilter = document.getElementById('orderStatusFilter');
    
    if (orderSearch) {
        orderSearch.addEventListener('input', debounce(filterOrders, 500));
    }
    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', filterOrders);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
        showNotification(res.message || 'حدث خطأ', 'error');
    }
}

async function handleCouponSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const couponId = form.couponId.value;
    const data = {
        code: form.couponCode.value,
        discount_type: form.couponType.value,
        discount_value: parseFloat(form.couponValue.value),
        product_id: form.couponProduct.value || null,
        valid_from: form.couponValidFrom.value,
        valid_to: form.couponValidTo.value,
        is_active: form.couponIsActive.checked
    };

    const res = couponId ? 
        await window.ironPlus.updateCoupon(couponId, data) : 
        await window.ironPlus.addCoupon(data);

    if (res.success) {
        showNotification('تم حفظ الكوبون بنجاح ✅', 'success');
        adminPanel.closeModal();
        loadCoupons();
    } else {
        showNotification(res.message || 'حدث خطأ', 'error');
    }
}

async function handleBannerSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const bannerId = form.bannerId.value;
    const data = {
        title: form.bannerTitle.value,
        image_url: form.bannerImage.value,
        link: form.bannerLink.value || null,
        sort_order: parseInt(form.bannerOrder.value) || 1,
        is_active: form.bannerIsActive.checked
    };

    const res = bannerId ? 
        await window.ironPlus.updateBanner(bannerId, data) : 
        await window.ironPlus.addBanner(data);

    if (res.success) {
        showNotification('تم حفظ البانر بنجاح ✅', 'success');
        adminPanel.closeModal();
        loadBanners();
    } else {
        showNotification(res.message || 'حدث خطأ', 'error');
    }
}

async function handlePageSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const pageId = form.pageId.value;
    const data = {
        title: form.pageTitle.value,
        slug: form.pageSlug.value,
        content: document.getElementById('pageContentHidden').value,
        is_active: true
    };

    const res = pageId ? 
        await window.ironPlus.updatePage(pageId, data) : 
        await window.ironPlus.addPage(data);

    if (res.success) {
        showNotification('تم حفظ الصفحة بنجاح ✅', 'success');
        adminPanel.closeModal();
        loadPages();
    } else {
        showNotification(res.message || 'حدث خطأ', 'error');
    }
}

async function handleSecuritySubmit(e) {
    e.preventDefault();
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('كلمة المرور غير متطابقة', 'error');
        return;
    }
    
    // هنا يجب إضافة منطق تغيير بيانات المسؤول
    showNotification('هذه الميزة قيد التطوير', 'info');
}

// --- عاشراً: تصدير الدوال للـ HTML (The Bridge) ---

window.adminPanel = {
    // المنتجات
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
                form.productPrice.value = res.product.price / 100; // تحويل من هللة إلى ريال
                form.productDuration.value = res.product.duration || '';
                form.productImage.value = res.product.image_url || '';
                form.productDescription.value = res.product.description || '';
                form.productFeatures.value = Array.isArray(res.product.features) ? 
                    res.product.features.join('\n') : res.product.features || '';
            }
        } else {
            title.textContent = "إضافة باقة جديدة";
            form.reset();
            form.productId.value = '';
        }
        modal.style.display = 'flex';
    },

    closeModal: () => {
        document.querySelectorAll('.auth-overlay').forEach(modal => {
            modal.style.display = 'none';
        });
    },

    deleteProduct: async (id, name) => {
        if (confirm(`هل تريد حذف "${name}" نهائياً؟`)) {
            const res = await window.ironPlus.deleteProduct(id);
            if (res.success) {
                showNotification('تم حذف المنتج بنجاح', 'success');
                loadProducts();
            } else {
                showNotification(res.message, 'error');
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
        } else {
            showNotification(res.message, 'error');
        }
    },

    deliverOrder: async (orderId, productId) => {
        if (confirm('هل تريد تسليم كود التفعيل لهذا الطلب؟')) {
            const res = await window.ironPlus.assignActivationCode(orderId, productId);
            if (res.success) {
                showNotification(`تم تسليم الكود بنجاح: ${res.code}`, 'success');
                loadOrders();
            } else {
                showNotification(res.message, 'error');
            }
        }
    },

    updateOrderStatus: async (orderId, status) => {
        const statusText = getStatusText(status);
        if (confirm(`هل تريد تغيير حالة الطلب إلى "${statusText}"؟`)) {
            const res = await window.ironPlus.updateOrderStatus(orderId, status);
            if (res.success) {
                showNotification(`تم تحديث حالة الطلب إلى ${statusText}`, 'success');
                loadOrders();
            } else {
                showNotification(res.message, 'error');
            }
        }
    },

    contactCustomer: (phone) => {
        const cleanPhone = phone.startsWith('0') ? '966' + phone.substring(1) : phone;
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    },

    // الكوبونات
    showCouponModal: async (id) => {
        const modal = document.getElementById('couponModal');
        const form = document.getElementById('couponForm');
        const title = document.getElementById('couponModalTitle');
        
        // تحميل المنتجات لملء القائمة
        const productsRes = await window.ironPlus.getProducts();
        const productSelect = document.getElementById('couponProduct');
        if (productsRes.success) {
            productSelect.innerHTML = '<option value="">جميع المنتجات (عام)</option>' + 
                productsRes.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }
        
        if (id) {
            title.textContent = "تعديل كوبون الخصم";
            const res = await window.ironPlus.getCoupon(id);
            if (res.success) {
                form.couponId.value = res.coupon.id;
                form.couponCode.value = res.coupon.code;
                form.couponType.value = res.coupon.discount_type;
                form.couponValue.value = res.coupon.discount_value;
                form.couponProduct.value = res.coupon.product_id || '';
                form.couponValidFrom.value = new Date(res.coupon.valid_from).toISOString().slice(0, 16);
                form.couponValidTo.value = new Date(res.coupon.valid_to).toISOString().slice(0, 16);
                form.couponIsActive.checked = res.coupon.is_active;
            }
        } else {
            title.textContent = "إضافة كوبون خصم";
            form.reset();
            form.couponId.value = '';
            // تعيين القيم الافتراضية
            const now = new Date();
            form.couponValidFrom.value = now.toISOString().slice(0, 16);
            const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
            form.couponValidTo.value = nextMonth.toISOString().slice(0, 16);
        }
        modal.style.display = 'flex';
    },

    deleteCoupon: async (id, code) => {
        if (confirm(`هل تريد حذف كوبون "${code}" نهائياً؟`)) {
            const res = await window.ironPlus.deleteCoupon(id);
            if (res.success) {
                showNotification('تم حذف الكوبون بنجاح', 'success');
                loadCoupons();
            } else {
                showNotification(res.message, 'error');
            }
        }
    },

    // البانرات
    showBannerModal: async (id) => {
        const modal = document.getElementById('bannerModal');
        const form = document.getElementById('bannerForm');
        const title = document.getElementById('bannerModalTitle');
        if (id) {
            title.textContent = "تعديل البانر";
            const res = await window.ironPlus.getBanner(id);
            if (res.success) {
                form.bannerId.value = res.banner.id;
                form.bannerTitle.value = res.banner.title;
                form.bannerImage.value = res.banner.image_url;
                form.bannerLink.value = res.banner.link || '';
                form.bannerOrder.value = res.banner.sort_order || 1;
                form.bannerIsActive.checked = res.banner.is_active;
            }
        } else {
            title.textContent = "إضافة بانر إعلاني";
            form.reset();
            form.bannerId.value = '';
        }
        modal.style.display = 'flex';
    },

    deleteBanner: async (id, title) => {
        if (confirm(`هل تريد حذف بانر "${title}" نهائياً؟`)) {
            const res = await window.ironPlus.deleteBanner(id);
            if (res.success) {
                showNotification('تم حذف البانر بنجاح', 'success');
                loadBanners();
            } else {
                showNotification(res.message, 'error');
            }
        }
    },

    // الصفحات
    showPageModal: async (id) => {
        const modal = document.getElementById('pageModal');
        const form = document.getElementById('pageForm');
        const title = document.getElementById('pageModalTitle');
        const editor = document.getElementById('pageContent');
        const hiddenField = document.getElementById('pageContentHidden');
        
        // عند تغيير المحرر، تحديث الحقل المخفي
        editor.addEventListener('input', function() {
            hiddenField.value = this.innerHTML;
        });
        
        if (id) {
            title.textContent = "تعديل الصفحة";
            const res = await window.ironPlus.getPage(id);
            if (res.success) {
                form.pageId.value = res.page.id;
                form.pageTitle.value = res.page.title;
                form.pageSlug.value = res.page.slug;
                editor.innerHTML = res.page.content || '';
                hiddenField.value = res.page.content || '';
            }
        } else {
            title.textContent = "إضافة صفحة جديدة";
            form.reset();
            editor.innerHTML = '';
            hiddenField.value = '';
            form.pageId.value = '';
        }
        modal.style.display = 'flex';
    },

    deletePage: async (id, pageTitle) => {
        if (confirm(`هل تريد حذف صفحة "${pageTitle}" نهائياً؟`)) {
            const res = await window.ironPlus.deletePage(id);
            if (res.success) {
                showNotification('تم حذف الصفحة بنجاح', 'success');
                loadPages();
            } else {
                showNotification(res.message, 'error');
            }
        }
    }
};

// دوال المحرر
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('pageContent').focus();
}

async function loadProductsForCodes() {
    try {
        const res = await window.ironPlus.getProducts();
        const select = document.getElementById('productForCodes');
        if (res.success && select) {
            select.innerHTML = '<option value="">اختر باقة...</option>' + 
                res.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Load products for codes error:', error);
    }
}

window.logoutAdmin = () => {
    if(confirm('هل تريد تسجيل الخروج؟')) window.ironPlus.logout();
};

// جعل الدوال متاحة للـ HTML القديم
window.closeModal = window.adminPanel.closeModal;
window.uploadCodes = window.adminPanel.uploadCodes;

// تعريف دالة handleImageError في النطاق العام
window.handleImageError = handleImageError;
