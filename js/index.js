// ========================================
// الصفحة الرئيسية لـ Iron Plus - النسخة المطورة v4.6 🦾
// ترتيب عصري مطابق لمتطلبات العميل مع هوية آيرون مان
// ========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Iron Plus Homepage initializing... 🚀');
    
    try {
        // 1. التحقق من حالة المستخدم
        await checkUserStatus();
        
        // 2. تحميل المنتجات بالترتيب الجديد
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

/**
 * دالة عرض المنتجات بالترتيب الجديد (مثل الفيديو):
 * 1. الصورة بالأعلى
 * 2. الاسم
 * 3. النجوم
 * 4. السعر
 * 5. زر أضف للسلة
 */
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = products.map(product => {
        const price = window.ironPlus.formatPrice(product.price);
        return `
            <div class="col">
                <div class="iron-card text-center p-6">
                    <div class="product-img-header mb-4" style="height: 120px; display: flex; align-items: center; justify-content: center;">
                        <img src="${product.image_url || 'assets/default.png'}" alt="${product.name}" style="max-height: 100%; object-fit: contain;">
                    </div>
                    
                    <div class="card-header mb-2">
                        <h3 class="card-title text-lg font-bold text-white">${product.name}</h3>
                    </div>
                    
                    <div class="flex justify-center gap-1 text-gold text-xs mb-3">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <span style="color: #666; margin-right: 5px;">(5.0)</span>
                    </div>

                    <div class="card-body">
                        <div class="price-display text-center mb-4">
                            <span class="text-glow-red" style="font-size: 1.8rem; font-weight: bold;">${price}</span>
                            <small style="color: #888; font-size: 0.9rem;">ر.س</small>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        <button class="btn-iron btn-gold" style="width: 100%; border-radius: 12px; font-weight: 700;" onclick="buyProduct('${product.id}')">
                            <i class="fas fa-shopping-basket" style="margin-left: 8px;"></i> أضف للسلة
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
        if (!window.ironPlus.isLoggedIn()) {
            localStorage.setItem('pending_purchase_id', productId);
            showNotification('يرجى تسجيل الدخول لإتمام الطلب', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            return;
        }

        showNotification('جاري تجهيز طلبك... 🦾', 'info');
        
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
            
            // تحديث الأرقام لتطابق الفيديو (أو الأرقام الحقيقية)
            if (visitorCount) visitorCount.textContent = result.stats.uniqueCustomers || '13,655';
            if (orderCount) orderCount.textContent = result.stats.totalOrders || '3,101';
        }
    } catch (e) { /* تجاهل أخطاء الإحصائيات */ }
}

// دالة الـ Accordion للأسئلة الشائعة
window.toggleFaq = function(element) {
    const answer = element.querySelector('.faq-answer');
    const icon = element.querySelector('i');
    if (answer) {
        answer.classList.toggle('hidden');
        if (icon) {
            icon.classList.toggle('fa-plus');
            icon.classList.toggle('fa-minus');
        }
    }
};

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
    const alertBox = document.createElement('div');
    alertBox.className = `notification ${type}`;
    alertBox.style.cssText = "position:fixed; bottom:20px; left:20px; background:rgba(20,20,20,0.95); border:2px solid var(--iron-gold); padding:15px; z-index:9999; border-radius:12px; color:white; animation:slideInLeft 0.3s ease; backdrop-filter:blur(10px);";
    
    let icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-times-circle' : 'fa-info-circle');
    alertBox.innerHTML = `<i class="fas ${icon}" style="margin-left:10px; color:var(--iron-gold);"></i> ${message}`;
    
    document.body.appendChild(alertBox);
    setTimeout(() => {
        alertBox.style.opacity = '0';
        setTimeout(() => alertBox.remove(), 500);
    }, 4000);
}

// تصدير للوصول العالمي
window.homepage = {
    buyProduct,
    showNotification,
    toggleFaq
};
