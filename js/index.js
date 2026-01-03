// ========================================
// الصفحة الرئيسية لـ Iron Plus - المحرك الرئيسي المعدل
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Iron Plus Homepage: Systems Online 🦾');
    
    try {
        // 1. فحص هوية المستخدم
        await checkUserStatus();
        
        // 2. شحن المنتجات من القاعدة
        await loadProducts();
        
        // 3. تحديث لوحة الإحصائيات (الزوار والطلبات)
        await loadStatistics();
        
        // 4. تشغيل مستمعي الأحداث
        setupEventListeners();
        
        // 5. تسجيل الزيارة الأمنية
        await recordVisit();
        
    } catch (error) {
        console.error('System Failure:', error);
        showNotification('عذراً.. حدث خلل في الأنظمة المركزية', 'error');
    }
});

// --- أولاً: إدارة حالة المستخدم ---

async function checkUserStatus() {
    // التأكد من وجود كائن ironPlus أولاً
    if (!window.ironPlus) return;

    const userPhone = window.ironPlus.getUserPhone();
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('loginButton');
    
    // استخدام isLoggedIn (الموحد مع ملف الإعدادات)
    if (userPhone && window.ironPlus.isLoggedIn()) {
        if (userInfo) {
            userInfo.style.display = 'flex';
            document.getElementById('userPhone').textContent = userPhone;
        }
        if (loginButton) loginButton.style.display = 'none';
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
    }
}

// --- ثانياً: تحميل وعرض المنتجات ---

async function loadProducts() {
    const container = document.getElementById('productsContainer');
    const loading = document.getElementById('loadingMessage');
    
    if (!container) return;
    
    try {
        if (loading) loading.style.display = 'block';
        
        const result = await window.ironPlus.getProducts();
        
        if (result.success && result.products.length > 0) {
            renderProducts(result.products);
        } else {
            container.innerHTML = `
                <div class="col" style="grid-column: 1 / -1; text-align:center; padding:50px;">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: var(--iron-gold); margin-bottom: 20px;"></i>
                    <h3 class="text-glow-gold">المخزن فارغ حالياً</h3>
                    <p>جاري شحن تطبيقات جديدة.. انتظرونا!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load Error:', error);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = products.map(product => {
        const price = window.ironPlus.formatPrice(product.price);
        const hasDiscount = product.original_price && product.original_price > product.price;

        return `
            <div class="col">
                <div class="iron-card hud-effect">
                    ${product.stock < 5 && product.stock > 0 ? `<div class="product-badge red">🔥 أوشك على النفاذ</div>` : ''}
                    
                    <div class="card-header text-center">
                        <img src="${product.image_url || 'assets/default-app.png'}" alt="${product.name}" 
                             style="width: 80px; height: 80px; border-radius: 15px; margin-bottom: 15px; box-shadow: var(--glow-blue);">
                        <h3 class="card-title tech-font">${product.name}</h3>
                    </div>
                    
                    <div class="card-body">
                        <ul class="features-list">
                            ${product.features ? product.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('') : '<li>مميزات حصرية</li>'}
                        </ul>
                    </div>
                    
                    <div class="card-footer">
                        <div class="price-section text-center">
                            ${hasDiscount ? `<small class="old-price">${window.ironPlus.formatPrice(product.original_price)} ر.س</small>` : ''}
                            <div class="main-price text-glow-gold">${price} ر.س</div>
                        </div>
                        
                        <button class="btn-iron btn-gold buy-btn" 
                                data-product-id="${product.id}"
                                ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-bolt"></i> 
                            ${product.stock === 0 ? 'نفذت الكمية' : 'تفعيل الآن'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- ثالثاً: نظام الإحصائيات الذكي ---

async function loadStatistics() {
    try {
        const result = await window.ironPlus.getSiteStats();
        if (result.success) {
            updateCounter('visitorCount', result.stats.uniqueCustomers + 250); // إضافة رقم وهمي لزيادة الثقة
            updateCounter('orderCount', result.stats.totalOrders + 1200);
        }
    } catch (e) { console.warn('Stats sync failed'); }
}

function updateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let count = 0;
    const speed = 20;
    const inc = Math.ceil(target / 50);
    
    const timer = setInterval(() => {
        count += inc;
        if (count >= target) {
            el.textContent = target;
            clearInterval(timer);
        } else {
            el.textContent = count;
        }
    }, speed);
}

// --- رابعاً: معالجة المشتريات والدفع ---

function setupEventListeners() {
    // 1. تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => window.ironPlus.logout();
    }
    
    // 2. مستمع الشراء (Event Delegation)
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.buy-btn');
        if (btn) {
            const pid = btn.getAttribute('data-product-id');
            if (pid) buyProduct(pid);
        }
    });
}

async function buyProduct(productId) {
    if (!window.ironPlus.isLoggedIn()) {
        showNotification('يجب تسجيل الدخول برقم جوالك أولاً', 'warning');
        setTimeout(() => { window.location.href = 'login.html?product=' + productId; }, 1500);
        return;
    }

    const confirmed = confirm('هل أنت متأكد من الانتقال لبوابة الدفع الآمنة؟');
    if (!confirmed) return;

    try {
        showNotification('جاري فحص المخزون وتحضير الفاتورة...', 'info');
        const phone = window.ironPlus.getUserPhone();
        
        // جلب السعر الفعلي لضمان الدقة
        const pRes = await window.ironPlus.getProduct(productId);
        
        const result = await window.ironPlus.createPayment(productId, phone, pRes.product.price);
        
        if (result.success && result.data.url) {
            showNotification('تم تجهيز الطلب.. جاري التحويل', 'success');
            window.location.href = result.data.url; // التحويل في نفس الصفحة أفضل لتجربة الجوال
        } else {
            showNotification('عذراً.. بوابة الدفع غير متاحة حالياً', 'error');
        }
    } catch (error) {
        showNotification('خلل في معالج العمليات', 'error');
    }
}

// --- خامساً: الخدمات العامة ---

function showNotification(msg, type) {
    const toast = document.createElement('div');
    toast.className = `iron-toast ${type} hud-effect`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

async function recordVisit() {
    try { await window.ironPlus.recordVisit('index.html'); } catch(e){}
}

// تصدير للوصول الخارجي
window.homepage = { searchProducts: () => { /* تنفيذ البحث */ } };
