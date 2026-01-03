/**
 * Iron Plus - Admin Command Center v3.5 (FULL VERSION)
 * نظام إدارة المتجر المتكامل - النسخة الكاملة والمعدلة
 */

// 1. إعدادات الأمان (Whitelist) - حط الـ IP حقك هنا
const ADMIN_ALLOWED_IPS = ['123.456.789.0', '0.0.0.0']; 

// مستمع التحميل الرئيسي
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Tony, Jarvis is initializing systems... 🦾");
    
    // التحقق من تسجيل الدخول أولاً
    if (!isAdminLoggedIn()) {
        showAdminLoginScreen();
        return;
    }

    // التحقق من أمان الشبكة (IP)
    await checkIPAccess();
    
    // تشغيل الأنظمة
    initAdminSystems();
    setupAdminEventListeners();
});

// --- أولاً: أنظمة الحماية والدخول ---

function isAdminLoggedIn() {
    return localStorage.getItem('iron_admin') === 'true';
}

function showAdminLoginScreen() {
    const loginScreen = document.getElementById('adminLoginScreen');
    const dashboard = document.getElementById('adminDashboard');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
}

async function checkIPAccess() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const userIP = data.ip;
        console.log("System Access IP:", userIP);

        if (!ADMIN_ALLOWED_IPS.includes(userIP) && !ADMIN_ALLOWED_IPS.includes('0.0.0.0')) {
            localStorage.removeItem('iron_admin');
            alert('🚨 تنبيه أمني: جهازك غير مصرح له بدخول الأنظمة المركزية.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.warn('Network layer offline. Manual verification needed.');
    }
}

// --- ثانياً: تهيئة البيانات (Dashboard Initialization) ---

async function initAdminSystems() {
    const adminName = localStorage.getItem('admin_username') || 'المشرف';
    if(document.getElementById('adminName')) {
        document.getElementById('adminName').textContent = `مرحباً، ${adminName}`;
    }

    // تحميل متزامن للبيانات
    try {
        await Promise.all([
            loadStatistics(),
            loadProductsTable(),
            loadOrdersTable(),
            loadProductSelect(),
            loadBulkCodes()
        ]);
    } catch (error) {
        console.error("Critical Load Error:", error);
    }
}

// --- ثالثاً: نظام الإحصائيات (Analytics) ---

async function loadStatistics() {
    try {
        // مبيعات مكتملة
        const { data: salesData } = await supabaseClient
            .from('orders')
            .select('amount')
            .eq('status', 'completed');
            
        const totalSales = salesData ? salesData.reduce((sum, o) => sum + o.amount, 0) : 0;
        
        // المنتجات النشطة
        const { count: productsCount } = await supabaseClient
            .from('products')
            .select('*', { count: 'exact', head: true });
            
        // العملاء المسجلين
        const { count: usersCount } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true });
            
        // الأكواد غير المستخدمة
        const { count: codesCount } = await supabaseClient
            .from('activation_codes')
            .select('*', { count: 'exact', head: true })
            .eq('is_used', false);

        // التحديث على الواجهة
        document.getElementById('totalSales').textContent = `${(totalSales / 100).toFixed(2)} ر.س`;
        document.getElementById('totalProducts').textContent = productsCount || 0;
        document.getElementById('totalCustomers').textContent = usersCount || 0;
        document.getElementById('availableCodes').textContent = codesCount || 0;
        
    } catch (error) {
        console.error("Stats system failure:", error);
    }
}

// --- رابعاً: إدارة المنتجات (CRUD Operations) ---

async function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return showMessage("فشل تحميل المنتجات", "error");

    tbody.innerHTML = products.map(p => `
        <tr>
            <td>
                ${p.image_url ? `<img src="${p.image_url}" class="table-img" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">` : '<i class="fas fa-box"></i>'}
            </td>
            <td><strong>${p.name}</strong></td>
            <td><span class="text-glow-red font-bold">${(p.price / 100).toFixed(2)} ر.س</span></td>
            <td>${p.duration || '-'}</td>
            <td>${p.stock || '∞'}</td>
            <td>
                <span class="status-badge ${p.is_active ? 'status-active' : 'status-inactive'}">
                    ${p.is_active ? 'نشط' : 'متوقف'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="editProduct('${p.id}')" class="btn-action btn-edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteProduct('${p.id}')" class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                    <button onclick="viewProduct('${p.id}')" class="btn-action btn-view"><i class="fas fa-eye"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function saveProduct(e) {
    if(e) e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const features = document.getElementById('productFeatures').value.split('\n').filter(f => f.trim() !== "");

    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: Math.round(parseFloat(document.getElementById('productPrice').value) * 100),
        duration: document.getElementById('productDuration').value,
        image_url: document.getElementById('productImage').value,
        features: features,
        updated_at: new Date()
    };

    let result;
    if (productId) {
        result = await supabaseClient.from('products').update(productData).eq('id', productId);
    } else {
        result = await supabaseClient.from('products').insert([productData]);
    }

    if (!result.error) {
        showMessage("تم تحديث النظام بنجاح 💾", "success");
        closeModal();
        initAdminSystems();
    } else {
        showMessage("خطأ: " + result.error.message, "error");
    }
}

async function editProduct(id) {
    const { data: product } = await supabaseClient.from('products').select('*').eq('id', id).single();
    if (product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = (product.price / 100).toFixed(2);
        document.getElementById('productDuration').value = product.duration;
        document.getElementById('productImage').value = product.image_url;
        document.getElementById('productFeatures').value = product.features ? product.features.join('\n') : '';
        
        document.getElementById('modalTitle').textContent = "تعديل المنتج";
        document.getElementById('productModal').style.display = 'flex';
    }
}

async function deleteProduct(id) {
    if (confirm("🚨 هل أنت متأكد؟ سيتم مسح المنتج نهائياً من الوجود.")) {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (!error) {
            showMessage("تم المسح بنجاح", "success");
            loadProductsTable();
            loadStatistics();
        }
    }
}

// --- خامساً: إدارة الطلبات (Order Management) ---

async function loadOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*, products(name)')
        .order('created_at', { ascending: false });

    if (error) return;

    tbody.innerHTML = orders.map(o => `
        <tr>
            <td><small>${o.id.substring(0,8)}</small></td>
            <td><strong>${o.customer_phone}</strong><br><small>${o.customer_name || 'عميل'}</small></td>
            <td>${o.products ? o.products.name : 'N/A'}</td>
            <td><strong class="text-gold">${(o.amount / 100).toFixed(2)} ر.س</strong></td>
            <td><span class="status-badge status-${o.status}">${getStatusText(o.status)}</span></td>
            <td>${new Date(o.created_at).toLocaleDateString('ar-SA')}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewOrderDetails('${o.id}')" class="btn-action btn-view"><i class="fas fa-eye"></i></button>
                    <button onclick="contactCustomer('${o.customer_phone}')" class="btn-action" style="background:#25D366"><i class="fab fa-whatsapp"></i></button>
                    ${o.status !== 'completed' ? `<button onclick="updateOrderStatus('${o.id}', 'completed')" class="btn-action" style="background:#2ecc71">تأكيد</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function getStatusText(status) {
    const statusMap = { 'pending': 'معلق', 'paid': 'مدفوع', 'completed': 'مكتمل', 'failed': 'فاشل' };
    return statusMap[status] || status;
}

async function updateOrderStatus(orderId, status) {
    const { error } = await supabaseClient.from('orders').update({ status }).eq('id', orderId);
    if (!error) {
        showMessage("حالة الطلب: " + getStatusText(status), "success");
        loadOrdersTable();
        loadStatistics();
    }
}

// --- سادساً: إدارة الأكواد والرفع بالجملة (Codes Management) ---

async function loadProductSelect() {
    const { data: products } = await supabaseClient.from('products').select('id, name');
    const select = document.getElementById('productForCodes');
    if(select) {
        select.innerHTML = '<option value="">اختر منتجاً للرفع...</option>' + 
            products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
}

async function uploadCodes() {
    const productId = document.getElementById('productForCodes').value;
    const text = document.getElementById('bulkCodesText').value;
    const codes = text.split('\n').map(c => c.trim()).filter(c => c !== "");

    if (!productId || codes.length === 0) return showMessage("الرجاء إدخال البيانات", "error");

    const codeEntries = codes.map(c => ({ product_id: productId, code: c, is_used: false }));
    
    const { error } = await supabaseClient.from('activation_codes').insert(codeEntries);

    if (!error) {
        showMessage(`تم شحن ${codes.length} كود بنجاح 🚀`, "success");
        document.getElementById('bulkCodesText').value = "";
        loadBulkCodes();
        loadStatistics();
    } else {
        showMessage("فشل الرفع: كود مكرر", "error");
    }
}

async function loadBulkCodes() {
    const container = document.getElementById('codesListContainer');
    if(!container) return;

    const { data: codes } = await supabaseClient
        .from('activation_codes')
        .select('*, products(name)')
        .order('created_at', { ascending: false })
        .limit(50);

    container.innerHTML = codes ? codes.map(c => `
        <div class="code-item ${c.is_used ? 'used' : ''} hud-effect" style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; padding:10px;">
            <div>
                <span class="tech-font" style="color:var(--tech-blue)">${c.code}</span><br>
                <small>${c.products?.name}</small>
            </div>
            <span class="status-badge ${c.is_used ? 'status-inactive' : 'status-active'}">${c.is_used ? 'مستخدم' : 'متاح'}</span>
        </div>
    `).join('') : '<p>لا توجد أكواد</p>';
}

// --- سابعاً: وظائف الخدمات (Utility & Extras) ---

async function exportData() {
    try {
        const [p, o, c] = await Promise.all([
            supabaseClient.from('products').select('*'),
            supabaseClient.from('orders').select('*'),
            supabaseClient.from('activation_codes').select('*')
        ]);
        
        const backupData = { date: new Date(), products: p.data, orders: o.data, codes: c.data };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `IronPlus_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        showMessage("تم تصدير النسخة الاحتياطية بنجاح 💾", "success");
    } catch (e) { showMessage("فشل التصدير", "error"); }
}

function contactCustomer(phone) {
    const cleanPhone = phone.startsWith('0') ? '966' + phone.substring(1) : phone;
    window.open(`https://wa.me/${cleanPhone}?text=مرحباً، معك إدارة Iron Plus بخصوص طلبك..`, '_blank');
}

function showMessage(text, type) {
    const msgDiv = document.getElementById('adminMessage') || createMessageElement();
    msgDiv.textContent = text;
    msgDiv.className = `message ${type} hud-effect`;
    msgDiv.style.display = 'block';
    setTimeout(() => msgDiv.style.display = 'none', 4500);
}

function createMessageElement() {
    const div = document.createElement('div');
    div.id = 'adminMessage';
    div.style.cssText = "position:fixed; top:20px; right:20px; z-index:10000; padding:15px 30px; border-radius:10px; color:white; font-weight:bold; border:2px solid var(--iron-gold); background:rgba(0,0,0,0.95);";
    document.body.appendChild(div);
    return div;
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if(modal) modal.style.display = 'none';
}

function setupAdminEventListeners() {
    const form = document.getElementById('productForm');
    if(form) form.addEventListener('submit', saveProduct);
    
    // إغلاق المودال عند الضغط خارجه
    window.onclick = (event) => {
        const modal = document.getElementById('productModal');
        if (event.target == modal) closeModal();
    }
}

function logoutAdmin() {
    if(confirm("هل تريد إغلاق غرفة العمليات وتفويض الصلاحيات؟")) {
        localStorage.removeItem('iron_admin');
        window.location.reload();
    }
}

// --- تصدير الدوال للـ HTML ---
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.contactCustomer = contactCustomer;
window.uploadCodes = uploadCodes;
window.exportData = exportData;
window.closeModal = closeModal;
window.saveProduct = saveProduct;
window.showAddProductModal = () => {
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('modalTitle').textContent = "إضافة منتج جديد";
    document.getElementById('productModal').style.display = 'flex';
};
window.logoutAdmin = logoutAdmin;
