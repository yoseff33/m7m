// ========================================
// لوحة تحكم Iron Plus - النظام الإداري المطور (النسخة النهائية)
// ========================================

// 1. تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('Jarvis: Admin Systems Initializing... 🦾');
    
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
        setupEventListeners();
        
        console.log('Systems Online: Admin panel fully operational.');
    } catch (error) {
        console.error('Boot error:', error);
    }
}

// --- ثالثاً: إدارة التنقل (Navigation) ---

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

// --- رابعاً: إدارة البيانات (Dashboard & Lists) ---

async function loadDashboardData() {
    const res = await window.ironPlus.getSiteStats();
    if (res.success) {
        updateElement('totalSales', `${window.ironPlus.formatPrice(res.stats.totalSales)} ر.س`);
        updateElement('availableCodes', res.stats.availableCodes);
        updateElement('totalCustomers', res.stats.uniqueCustomers);
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

async function loadOrders() {
    const res = await window.ironPlus.getAllOrders();
    const tbody = document.getElementById('ordersTableBody');
    if (res.success && tbody) {
        tbody.innerHTML = res.orders.map(o => `
            <tr>
                <td><small>${o.id.substring(0,8)}</small></td>
                <td>${o.customer_phone}</td>
                <td>${o.products?.name || 'N/A'}</td>
                <td>${window.ironPlus.formatPrice(o.amount)} ر.س</td>
                <td><span class="status-badge status-${o.status}">${getStatusText(o.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="adminPanel.deliverOrder('${o.id}', '${o.product_id}')" class="btn-action btn-success" title="تسليم الكود"><i class="fas fa-key"></i></button>
                        <button onclick="adminPanel.contactCustomer('${o.customer_phone}')" class="btn-action"><i class="fab fa-whatsapp"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

// --- خامساً: الدوال المساعدة والخدمات (UI Helpers) ---

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
    alert(`${type.toUpperCase()}: ${msg}`);
}

function setupEventListeners() {
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.onsubmit = handleProductSubmit;
    }
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
        is_active: true
    };

    const res = productId ? 
        await window.ironPlus.updateProduct(productId, data) : 
        await window.ironPlus.addProduct(data);

    if (res.success) {
        showNotification('تم الحفظ بنجاح ✅', 'success');
        adminPanel.closeModal();
        loadProducts();
    }
}

// --- سادساً: تصدير الدوال للـ HTML (The Bridge) ---

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
                form.productPrice.value = window.ironPlus.formatPrice(res.product.price);
                form.productDuration.value = res.product.duration || '';
                form.productImage.value = res.product.image_url || '';
                form.productDescription.value = res.product.description || '';
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
            if (res.success) loadProducts();
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

// جعل الدوال متاحة للـ HTML القديم
window.closeModal = window.adminPanel.closeModal;
window.uploadCodes = window.adminPanel.uploadCodes;
// جسر لربط أزرار الـ HTML القديمة بالدوال الجديدة
window.showAddProductModal = function() {
    if (window.adminPanel && window.adminPanel.showProductModal) {
        window.adminPanel.showProductModal();
    } else {
        console.error("خطأ: نظام اللوحة لم يكتمل تحميله بعد");
    }
};
