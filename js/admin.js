// ========================================
// لوحة تحكم Iron Plus - النسخة النهائية الشاملة
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Jarvis: Admin systems initializing... 🦾');
    
    // 1. فحص الصلاحيات
    if (!window.ironPlus || !window.ironPlus.isAdminLoggedIn()) {
        showLoginScreen();
        return;
    }
    
    // 2. تشغيل لوحة التحكم
    await initializeAdminPanel();
});

// --- أولاً: أنظمة الدخول والواجهة ---

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
        
        clearMessage(messageDiv); // تنظيف الرسائل القديمة
        
        if (!username || !password) {
            showMessage(messageDiv, 'أدخل البيانات كاملة يا بطل', 'error');
            return;
        }
        
        try {
            const result = await window.ironPlus.adminLogin(username, password);
            if (result.success) {
                showMessage(messageDiv, 'تم التحقق.. جاري الدخول 🚀', 'success');
                setTimeout(() => { window.location.reload(); }, 1000);
            } else {
                showMessage(messageDiv, 'البيانات غلط، تأكد من الرمز', 'error');
            }
        } catch (error) {
            showMessage(messageDiv, 'مشكلة في الاتصال بالسيرفر', 'error');
        }
    });
}

// --- ثانياً: تهيئة البيانات (Dashboard Initialization) ---

async function initializeAdminPanel() {
    const loginScreen = document.getElementById('adminLoginScreen');
    const dashboard = document.getElementById('adminDashboard');
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    const adminName = window.ironPlus.getAdminUsername();
    updateElement('adminName', `مرحباً، ${adminName}`);

    setupNavigation();
    await loadDashboardData();
    await loadProducts();
    await loadOrders();
    await loadProductsForCodes();
    setupEventListeners();
}

// --- ثالثاً: إدارة البيانات والجداول ---

async function loadDashboardData() {
    const res = await window.ironPlus.getSiteStats();
    if (res.success) {
        updateElement('totalSales', `${window.ironPlus.formatPrice(res.stats.totalSales)} ر.س`);
        updateElement('totalProducts', res.stats.activeProducts);
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
                <td><img src="${p.image_url || ''}" style="width:40px; border-radius:5px;"></td>
                <td>${p.name}</td>
                <td class="text-gold">${window.ironPlus.formatPrice(p.price)} ر.س</td>
                <td>${p.duration || '-'}</td>
                <td>
                    <button onclick="adminPanel.showProductModal('${p.id}')" class="btn-action"><i class="fas fa-edit"></i></button>
                    <button onclick="adminPanel.deleteProduct('${p.id}', '${p.name}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
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
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                <td>
                    <button onclick="adminPanel.deliverOrder('${o.id}', '${o.product_id}')" class="btn-action btn-success"><i class="fas fa-key"></i></button>
                    <button onclick="adminPanel.contactCustomer('${o.customer_phone}')" class="btn-action"><i class="fab fa-whatsapp"></i></button>
                </td>
            </tr>
        `).join('');
    }
}

// --- رابعاً: الدوال المساعدة (إصلاح أخطاء ReferenceError) ---

function clearMessage(el) { if (el) { el.innerHTML = ''; el.style.display = 'none'; } }

function showMessage(el, text, type) {
    if (!el) return;
    el.innerHTML = text;
    el.className = `message ${type}`;
    el.style.display = 'block';
}

function updateElement(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function showNotification(msg, type) { alert(`${type.toUpperCase()}: ${msg}`); }

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}

// --- خامساً: تصدير الأوامر للواجهة ---

window.adminPanel = {
    showProductModal: async (id) => {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        if (id) {
            const res = await window.ironPlus.getProduct(id);
            if (res.success) {
                form.productId.value = res.product.id;
                form.productName.value = res.product.name;
                form.productPrice.value = window.ironPlus.formatPrice(res.product.price);
            }
        } else {
            form.reset();
            form.productId.value = '';
        }
        modal.style.display = 'flex';
    },
    deleteProduct: async (id, name) => {
        if (confirm(`حذف ${name}؟`)) {
            await window.ironPlus.deleteProduct(id);
            loadProducts();
        }
    },
    deliverOrder: async (orderId, productId) => {
        const res = await window.ironPlus.assignActivationCode(orderId, productId);
        if (res.success) showNotification(`تم التسليم: ${res.code}`, 'success');
        else showNotification(res.message, 'error');
    },
    contactCustomer: (phone) => {
        window.open(`https://wa.me/966${phone.substring(1)}`, '_blank');
    }
};

async function uploadCodes() {
    const pId = document.getElementById('productForCodes').value;
    const text = document.getElementById('bulkCodesText').value;
    const res = await window.ironPlus.uploadBulkCodes(pId, text);
    if (res.success) {
        showNotification('تم الشحن!', 'success');
        document.getElementById('bulkCodesText').value = '';
    }
}

function setupNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.onclick = () => {
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            document.getElementById(item.dataset.section + 'Section').classList.add('active');
        };
    });
}

function setupEventListeners() {
    const btn = document.getElementById('uploadCodesBtn');
    if (btn) btn.onclick = uploadCodes;
}

async function loadProductsForCodes() {
    const res = await window.ironPlus.getProducts();
    const select = document.getElementById('productForCodes');
    if (res.success && select) {
        select.innerHTML = res.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
}

function logoutAdmin() {
    localStorage.removeItem('iron_admin');
    window.location.reload();
}
window.logoutAdmin = logoutAdmin;
window.closeModal = closeModal;
