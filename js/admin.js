// ========================================
// لوحة تحكم Iron Plus - النظام الإداري المطور (النسخة الكاملة)
// ========================================

// 1. التحقق من حالة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Jarvis: Admin systems initializing... 🦾');
    
    // التحقق من وجود الكائن الرئيسي وصلاحية المشرف
    if (!window.ironPlus || !window.ironPlus.isAdminLoggedIn()) {
        console.log('Access denied. Redirecting to login...');
        showLoginScreen();
        return;
    }
    
    // تهيئة لوحة التحكم والبدء في سحب البيانات
    await initializeAdminPanel();
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
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;
        const messageDiv = document.getElementById('loginMessage');
        
        // تنظيف الرسائل السابقة (الدالة موجودة في قسم المساعدات بالأسفل)
        clearMessage(messageDiv);
        
        if (!username || !password) {
            showMessage(messageDiv, 'يرجى ملء جميع الحقول يا بطل', 'error');
            return;
        }
        
        showMessage(messageDiv, 'جاري فحص الصلاحيات الأمنية...', 'info');
        
        try {
            const result = await window.ironPlus.adminLogin(username, password);
            
            if (result.success) {
                showMessage(messageDiv, 'تم تسجيل الدخول.. جاري تشغيل الأنظمة!', 'success');
                setTimeout(() => { window.location.reload(); }, 1000);
            } else {
                showMessage(messageDiv, result.message || 'بيانات الدخول غير صحيحة', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage(messageDiv, 'عطلاً في الاتصال بالسيرفر المركزي', 'error');
        }
    });
}

// --- ثانياً: تهيئة الأنظمة (Initialization) ---

async function initializeAdminPanel() {
    try {
        const loginScreen = document.getElementById('adminLoginScreen');
        const dashboard = document.getElementById('adminDashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        const adminName = window.ironPlus.getAdminUsername();
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement && adminName) {
            adminNameElement.textContent = `مرحباً، القائد ${adminName}`;
        }
        
        setupNavigation();
        await loadDashboardData();
        await loadProducts();
        await loadOrders();
        await loadProductsForCodes();
        setupEventListeners();
        
        console.log('Systems Online: Admin panel is fully operational.');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('فشل في تشغيل بعض الأنظمة', 'error');
    }
}

// --- ثالثاً: إدارة التنقل (Navigation) ---

function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.admin-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            menuItems.forEach(el => el.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section') + 'Section';
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                const section = this.getAttribute('data-section');
                if(section === 'dashboard') loadDashboardData();
                else if(section === 'products') loadProducts();
                else if(section === 'orders') loadOrders();
            }
        });
    });
}

// --- رابعاً: إدارة البيانات (Dashboard & Products) ---

async function loadDashboardData() {
    try {
        const statsResult = await window.ironPlus.getSiteStats();
        if (statsResult.success) {
            const stats = statsResult.stats;
            updateElement('totalSales', `${window.ironPlus.formatPrice(stats.totalSales)} ر.س`);
            updateElement('totalProducts', stats.activeProducts);
            updateElement('totalCustomers', stats.uniqueCustomers || 0);
            updateElement('availableCodes', stats.availableCodes || 0);
            updateElement('totalOrders', stats.totalOrders);
        }
        
        const ordersResult = await window.ironPlus.getAllOrders({ limit: 5 });
        if (ordersResult.success && ordersResult.orders.length > 0) {
            updateRecentOrders(ordersResult.orders);
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

function updateRecentOrders(orders) {
    const container = document.getElementById('recentOrdersContainer');
    if (!container) return;
    
    container.innerHTML = orders.map(order => `
        <div class="recent-order hud-effect">
            <div class="order-info">
                <strong>${order.customer_phone}</strong>
                <small>${window.ironPlus.formatPrice(order.amount)} ر.س</small>
            </div>
            <span class="status-badge ${getStatusClass(order.status)}">
                ${getStatusText(order.status)}
            </span>
        </div>
    `).join('');
}

async function loadProducts() {
    const result = await window.ironPlus.getProducts();
    if (result.success) renderProductsTable(result.products);
}

function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد منتجات حالياً</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image_url || 'assets/default.png'}" style="width:45px; border-radius:8px; border:1px solid var(--iron-gold);"></td>
            <td><strong>${product.name}</strong></td>
            <td><div class="text-gold">${window.ironPlus.formatPrice(product.price)} ر.س</div></td>
            <td>${product.duration || 'دائم'}</td>
            <td><span class="badge">${product.stock === 999 ? '∞' : product.stock}</span></td>
            <td><span class="status-badge ${product.is_active ? 'status-active' : 'status-inactive'}">${product.is_active ? 'نشط' : 'معطل'}</span></td>
            <td>
                <div class="action-buttons">
                    <button onclick="adminPanel.showProductModal('${product.id}')" class="btn-action btn-edit"><i class="fas fa-edit"></i></button>
                    <button onclick="adminPanel.deleteProduct('${product.id}', '${product.name}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// --- خامساً: إدارة الطلبات والأكواد بالجملة ---

async function loadOrders(filters = {}) {
    const result = await window.ironPlus.getAllOrders(filters);
    if (result.success) renderOrdersTable(result.orders);
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.id.substring(0,8)}</strong></td>
            <td>${order.customer_phone}</td>
            <td>${order.products?.name || 'N/A'}</td>
            <td>${window.ironPlus.formatPrice(order.amount)} ر.س</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
            <td><small>${window.ironPlus.formatDate(order.created_at)}</small></td>
            <td>
                <div class="action-buttons">
                    <button onclick="adminPanel.deliverOrder('${order.id}', '${order.product_id}')" class="btn-action btn-success" title="تسليم الكود"><i class="fas fa-key"></i></button>
                    <button onclick="adminPanel.contactCustomer('${order.customer_phone}')" class="btn-action btn-success"><i class="fab fa-whatsapp"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleBulkCodesUpload() {
    const productId = document.getElementById('productForCodes').value;
    const codesText = document.getElementById('bulkCodesText').value.trim();
    
    if (!productId || !codesText) {
        showNotification('اختر المنتج وحط الأكواد يا مدير', 'warning');
        return;
    }
    
    const result = await window.ironPlus.uploadBulkCodes(productId, codesText);
    if (result.success) {
        showNotification(`تم شحن ${result.count} كود بنجاح! 🚀`, 'success');
        document.getElementById('bulkCodesText').value = '';
        if (typeof loadAvailableCodes === 'function') await loadAvailableCodes(productId);
    }
}

// --- سادساً: الوظائف المساعدة والخدمات (UI Helpers) ---

function setupEventListeners() {
    const uploadBtn = document.getElementById('uploadCodesBtn');
    if (uploadBtn) uploadBtn.onclick = handleBulkCodesUpload;

    const productForm = document.getElementById('productForm');
    if (productForm) productForm.onsubmit = handleProductSubmit;
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const productId = form.productId.value;
    
    const data = {
        name: form.productName.value,
        price: parseFloat(form.productPrice.value),
        description: form.productDescription.value,
        image_url: form.productImage.value,
        is_active: form.productIsActive.checked
    };

    const result = productId ? 
        await window.ironPlus.updateProduct(productId, data) : 
        await window.ironPlus.addProduct(data);

    if (result.success) {
        showNotification('تم الحفظ بنجاح ✅', 'success');
        closeModal();
        loadProducts();
    }
}

// الدوال التي كانت تسبب أخطاء ReferenceError
function clearMessage(element) {
    if (element) {
        element.innerHTML = '';
        element.style.display = 'none';
    }
}

function showMessage(element, text, type = 'info') {
    if (!element) return;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    element.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
    element.className = `message ${type}`;
    element.style.display = 'block';
}

function showNotification(msg, type) {
    console.log(`Notification: ${msg}`);
    alert(`${type.toUpperCase()}: ${msg}`);
}

function updateElement(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function getStatusClass(s) {
    if (s === 'completed') return 'status-active';
    if (s === 'pending') return 'status-warning';
    if (s === 'paid') return 'status-success';
    return 'status-inactive';
}

function getStatusText(s) {
    const map = { completed: 'مكتمل', pending: 'معلق', paid: 'مدفوع', failed: 'فاشل' };
    return map[s] || s;
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}

// --- سابعاً: تصدير الدوال للاستخدام في HTML ---

window.adminPanel = {
    showProductModal: async (id) => {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');
        if (id) {
            if (title) title.textContent = "تعديل المنتج";
            const res = await window.ironPlus.getProduct(id);
            if (res.success) {
                form.productId.value = res.product.id;
                form.productName.value = res.product.name;
                form.productPrice.value = window.ironPlus.formatPrice(res.product.price);
                form.productIsActive.checked = res.product.is_active;
                form.productDescription.value = res.product.description || '';
                form.productImage.value = res.product.image_url || '';
            }
        } else {
            if (title) title.textContent = "إضافة منتج جديد";
            form.reset();
            form.productId.value = '';
        }
        modal.style.display = 'flex';
    },
    deleteProduct: async (id, name) => {
        if (confirm(`هل أنت متأكد من حذف ${name}؟ سيتم مسحه من الوجود!`)) {
            const res = await window.ironPlus.deleteProduct(id);
            if (res.success) loadProducts();
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
    const result = await window.ironPlus.getProducts();
    if (result.success) {
        const select = document.getElementById('productForCodes');
        if (!select) return;
        select.innerHTML = '<option value="">اختر منتجاً</option>' + 
            result.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
}

function logoutAdmin() {
    if(confirm("هل تريد إغلاق غرفة العمليات وتسجيل الخروج؟")) {
        localStorage.removeItem('iron_admin');
        localStorage.removeItem('admin_username');
        window.location.reload();
    }
}
window.logoutAdmin = logoutAdmin;
