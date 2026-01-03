// ========================================
// الصفحة الرئيسية لـ Iron Plus - النسخة الكاملة والمصححة 🦾
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Iron Plus Homepage initializing... 🚀');
    
    try {
        // 1. التحقق من حالة المستخدم
        await checkUserStatus();
        
        // 2. تحميل المنتجات
        await loadProducts();
        
        // 3. تحميل الإحصائيات (العدادات)
        await loadStatistics();
        
        // 4. إعداد مستمعي الأحداث
        setupEventListeners();
        
        // 5. تسجيل الزيارة
        await recordVisit();
        
        console.log('Homepage systems: ONLINE');
    } catch (error) {
        console.error('Failed to initialize homepage:', error);
    }
});

// --- [1] التحقق من حالة المستخدم (Login Status) ---
async function checkUserStatus() {
    // تم التصحيح ليتوافق مع supabase-config.js
    const isLoggedIn = window.ironPlus.isLoggedIn();
    const userPhone = window.ironPlus.getUserPhone();
    
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('loginButton');
    const userPhoneDisplay = document.getElementById('userPhone');

    if (isLoggedIn && userPhone) {
        if (userInfo) userInfo.style.display = 'flex';
        if (loginButton) loginButton.style.display = 'none';
        if (userPhoneDisplay) userPhoneDisplay.textContent = userPhone;
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
    }
}

// --- [2] تحميل وعرض المنتجات (Products) ---
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
                <div class="col" style="grid-column: 1 / -1;">
                    <div class="iron-card text-center">
                        <h3 class="text-glow-gold">لا توجد باقات متاحة حالياً</h3>
                    </div>
                </div>`;
        }
    } catch (error) {
        console.error('Error loading products:', error);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = products.map(product => {
        const price = window.ironPlus.formatPrice(product.price);
        return `
            <div class="col">
                <div class="iron-card">
                    <div class="card-header">
                        <h3 class="card-title">${product.name}</h3>
                        <p class="card-subtitle">${product.description || ''}</p>
                    </div>
                    <div class="card-body">
                        <div class="price-display text-center" style="font-size: 2.2rem; color: var(--iron-gold); margin: 20px 0;">
                            ${price} <small style="font-size: 1rem;">ر.س</small>
                        </div>
                        ${product.duration ? `<div class="text-center"><span class="badge badge-info">${product.duration}</span></div>` : ''}
                    </div>
                    <div class="card-footer" style="margin-top: 20px;">
                        <button class="btn-iron btn-gold" style="width: 100%;" onclick="buyProduct('${product.id}')">
                            <i class="fas fa-shopping-cart" style="margin-left: 8px;"></i> اشتري الآن
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- [3] منطق الشراء والتحويل للدفع (Payment Flow) ---
async function buyProduct(productId) {
    try {
        // إذا العميل مو مسجل، نحفظ المنتج ونوديه للدخول
        if (!window.ironPlus.isLoggedIn()) {
            localStorage.setItem('pending_purchase_id', productId);
            showNotification('يرجى تسجيل الدخول لإكمال الدفع', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            return;
        }

        // إذا مسجل، نبدأ عملية الدفع فوراً
        showNotification('جاري تجهيز رابط الدفع... 💳', 'info');
        
        const phone = window.ironPlus.getUserPhone();
        const productRes = await window.ironPlus.getProduct(productId);
        
        if (productRes.success) {
            const payRes = await window.ironPlus.createPayment(
                productId, 
                phone, 
                productRes.product.price
            );

            if (payRes.success && payRes.data.url) {
                window.location.href = payRes.data.url;
            } else {
                showNotification('فشل إنشاء رابط الدفع، جرب مرة ثانية', 'error');
            }
        }
    } catch (error) {
        console.error('Purchase Error:', error);
        showNotification('حدث خطأ غير متوقع', 'error');
    }
}

// --- [4] الإحصائيات والوظائف المساعدة ---
async function loadStatistics() {
    try {
        const result = await window.ironPlus.getSiteStats();
        if (result.success) {
            const visitorCount = document.getElementById('visitorCount');
            const orderCount = document.getElementById('orderCount');
            
            if (visitorCount) visitorCount.textContent = result.stats.uniqueCustomers || '0';
            if (orderCount) orderCount.textContent = result.stats.totalOrders || '0';
        }
    } catch (e) { /* تجاهل أخطاء الإحصائيات */ }
}

function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => window.ironPlus.logout());
    }
}

async function recordVisit() {
    try { await window.ironPlus.recordVisit('index.html'); } catch (e) {}
}

function showNotification(message, type) {
    // تنبيه بسيط (يمكنك استبداله بنظام Toast لاحقاً)
    console.log(`Notification [${type}]: ${message}`);
    const alertBox = document.createElement('div');
    alertBox.className = `notification ${type}`;
    alertBox.style.cssText = "position:fixed; top:20px; left:20px; background:var(--metal-gray); border:2px solid var(--iron-gold); padding:15px; z-index:9999; border-radius:10px; color:white; animation:slideInLeft 0.3s ease;";
    alertBox.innerHTML = message;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 4000);
}

// تصدير للوصول العالمي
window.homepage = {
    buyProduct,
    showNotification
};
