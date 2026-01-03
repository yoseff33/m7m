// ========================================
// الصفحة الرئيسية لـ Iron Plus
// ========================================

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Iron Plus Homepage initializing...');
    
    try {
        // التحقق من حالة المستخدم
        await checkUserStatus();
        
        // تحميل المنتجات
        await loadProducts();
        
        // تحميل الإحصائيات
        await loadStatistics();
        
        // إعداد مستمعي الأحداث
        setupEventListeners();
        
        // تسجيل الزيارة
        await recordVisit();
        
        console.log('Homepage initialized successfully');
    } catch (error) {
        console.error('Failed to initialize homepage:', error);
        showNotification('حدث خطأ في تحميل الصفحة', 'error');
    }
});

// التحقق من حالة المستخدم
async function checkUserStatus() {
    const userPhone = window.ironPlus.getUserPhone();
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('loginButton');
    
    if (userPhone && window.ironPlus.isUserLoggedIn()) {
        // المستخدم مسجل الدخول
        if (userInfo) {
            userInfo.style.display = 'block';
            document.getElementById('userPhone').textContent = userPhone;
        }
        if (loginButton) loginButton.style.display = 'none';
    } else {
        // المستخدم غير مسجل
        if (userInfo) userInfo.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
    }
}

// تحميل المنتجات
async function loadProducts() {
    const container = document.getElementById('productsContainer');
    const loading = document.getElementById('loadingMessage');
    const errorDiv = document.getElementById('errorMessage');
    
    if (!container) return;
    
    try {
        // إظهار حالة التحميل
        if (loading) loading.style.display = 'block';
        if (errorDiv) errorDiv.style.display = 'none';
        
        // جلب المنتجات
        const result = await window.ironPlus.getProducts();
        
        if (result.success && result.products.length > 0) {
            // عرض المنتجات
            renderProducts(result.products);
            
            // إخفاء حالة التحميل
            if (loading) loading.style.display = 'none';
        } else {
            // لا توجد منتجات
            container.innerHTML = `
                <div class="col" style="grid-column: 1 / -1;">
                    <div class="iron-card text-center">
                        <i class="fas fa-box-open" style="font-size: 3rem; color: var(--iron-gold); margin-bottom: 20px;"></i>
                        <h3 class="text-glow-gold">لا توجد منتجات حالياً</h3>
                        <p>سيتم إضافة المنتجات قريباً</p>
                    </div>
                </div>
            `;
            
            if (loading) loading.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load products:', error);
        
        // عرض رسالة الخطأ
        if (errorDiv) {
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                حدث خطأ في تحميل المنتجات: ${error.message}
            `;
            errorDiv.style.display = 'block';
        }
        
        if (loading) loading.style.display = 'none';
    }
}

// عرض المنتجات
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    const html = products.map(product => {
        const price = window.ironPlus.formatPrice(product.price);
        const originalPrice = product.original_price ? 
            window.ironPlus.formatPrice(product.original_price) : null;
        
        const features = product.features?.map(feature => 
            `<li>${feature}</li>`
        ).join('') || '';
        
        return `
            <div class="col">
                <div class="iron-card">
                    ${product.stock < 10 && product.stock !== 999 ? 
                        `<div class="product-badge">
                            <i class="fas fa-bolt"></i> آخر ${product.stock} وحدة
                        </div>` : ''
                    }
                    
                    <div class="card-header">
                        ${product.image_url ? 
                            `<img src="${product.image_url}" alt="${product.name}" 
                                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 15px;">` : 
                            `<div style="width: 100%; height: 200px; background: rgba(255,215,0,0.1); 
                                 border-radius: 10px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-box" style="font-size: 3rem; color: var(--iron-gold);"></i>
                             </div>`
                        }
                        
                        <h3 class="card-title">${product.name}</h3>
                        ${product.description ? 
                            `<p class="card-subtitle">${product.description}</p>` : ''
                        }
                    </div>
                    
                    <div class="card-body">
                        ${features ? 
                            `<ul class="features-list">${features}</ul>` : ''
                        }
                        
                        ${product.duration ? 
                            `<div class="text-center" style="margin: 20px 0;">
                                <span class="badge badge-featured">
                                    <i class="fas fa-clock" style="margin-left: 5px;"></i>
                                    ${product.duration}
                                </span>
                            </div>` : ''
                        }
                    </div>
                    
                    <div class="card-footer">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div class="price-display" style="font-size: 2rem; color: var(--iron-gold);">
                                ${price} ر.س
                            </div>
                            ${originalPrice ? 
                                `<div style="color: #888; text-decoration: line-through;">
                                    ${originalPrice} ر.س
                                </div>` : ''
                            }
                        </div>
                        
                        <button class="btn-iron btn-gold" style="width: 100%;"
                                onclick="buyProduct('${product.id}')"
                                ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart" style="margin-left: 8px;"></i>
                            ${product.stock === 0 ? 'نفذت الكمية' : 'اشتري الآن'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// تحميل الإحصائيات
async function loadStatistics() {
    try {
        const result = await window.ironPlus.getSiteStats();
        
        if (result.success) {
            const stats = result.stats;
            
            // تحديث العداد
            updateCounter('visitorCount', stats.uniqueCustomers);
            updateCounter('orderCount', stats.totalOrders);
            updateCounter('activeUsers', stats.uniqueCustomers);
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

// تحديث العداد
function updateCounter(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const current = parseInt(element.textContent) || 0;
    const target = value || 0;
    
    if (current === target) return;
    
    // تأثير العد
    let start = current;
    const duration = 1000; // 1 ثانية
    const increment = target > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / (target - start)));
    
    const timer = setInterval(() => {
        start += increment;
        element.textContent = start;
        
        if (start === target) {
            clearInterval(timer);
        }
    }, stepTime);
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.ironPlus.logout();
        });
    }
    
    // زر الشراء
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('buy-btn') || 
            e.target.closest('.buy-btn')) {
            const button = e.target.classList.contains('buy-btn') ? 
                e.target : e.target.closest('.buy-btn');
            const productId = button.getAttribute('data-product-id');
            if (productId) {
                e.preventDefault();
                buyProduct(productId);
            }
        }
    });
}

// شراء منتج
async function buyProduct(productId) {
    try {
        // التحقق من تسجيل الدخول
        if (!window.ironPlus.isUserLoggedIn()) {
            showNotification('يرجى تسجيل الدخول أولاً', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1500);
            return;
        }
        
        // جلب بيانات المنتج
        const productResult = await window.ironPlus.getProduct(productId);
        if (!productResult.success || !productResult.product) {
            showNotification('المنتج غير متوفر', 'error');
            return;
        }
        
        const product = productResult.product;
        const userPhone = window.ironPlus.getUserPhone();
        
        // إظهار تأكيد الشراء
        const confirmed = confirm(`هل تريد شراء ${product.name} بسعر ${window.ironPlus.formatPrice(product.price)} ر.س؟`);
        if (!confirmed) return;
        
        // إنشاء عملية الدفع
        showNotification('جاري إنشاء رابط الدفع...', 'info');
        
        // هنا سيتم استدعاء Edge Function للدفع
        const paymentResult = await window.ironPlus.createPayment(
            productId, 
            userPhone, 
            product.price
        );
        
        if (paymentResult.success && paymentResult.data.url) {
            // فتح صفحة الدفع
            window.open(paymentResult.data.url, '_blank', 'noopener,noreferrer');
            
            showNotification('تم فتح صفحة الدفع، يرجى إتمام العملية', 'success');
            
            // مراقبة حالة الدفع
            monitorPayment(paymentResult.data.transactionNo);
        } else {
            showNotification(paymentResult.message || 'فشل في إنشاء عملية الدفع', 'error');
        }
        
    } catch (error) {
        console.error('Failed to process purchase:', error);
        showNotification('حدث خطأ في عملية الشراء', 'error');
    }
}

// مراقبة حالة الدفع
function monitorPayment(transactionNo) {
    // هنا يمكن تنفيذ نظام مراقبة حالة الدفع
    console.log('Monitoring payment for transaction:', transactionNo);
    
    // التحقق من حالة الدفع كل 10 ثوانٍ
    const checkInterval = setInterval(async () => {
        try {
            // استعلام عن حالة الطلب
            const orders = await window.ironPlus.getUserOrders(window.ironPlus.getUserPhone());
            
            if (orders.success) {
                const order = orders.orders.find(o => o.transaction_no === transactionNo);
                
                if (order && order.status === 'completed') {
                    clearInterval(checkInterval);
                    showNotification('تم تأكيد الدفع بنجاح!', 'success');
                    
                    // توجيه إلى صفحة النجاح
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 2000);
                } else if (order && order.status === 'failed') {
                    clearInterval(checkInterval);
                    showNotification('فشلت عملية الدفع', 'error');
                }
            }
        } catch (error) {
            console.error('Payment monitoring error:', error);
        }
    }, 10000);
    
    // إيقاف المراقبة بعد 5 دقائق
    setTimeout(() => {
        clearInterval(checkInterval);
    }, 300000);
}

// تسجيل الزيارة
async function recordVisit() {
    try {
        await window.ironPlus.recordVisit('index.html');
    } catch (error) {
        console.warn('Failed to record visit:', error);
    }
}

// إظهار الإشعار
function showNotification(message, type = 'info') {
    // تنفيذ بسيط للإشعارات
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 5 ثوانٍ
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// الحصول على أيقونة الإشعار
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-bell';
    }
}

// البحث عن منتج
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const productCards = document.querySelectorAll('.iron-card');
    
    productCards.forEach(card => {
        const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.card-subtitle')?.textContent.toLowerCase() || '';
        
        if (searchTerm === '' || title.includes(searchTerm) || description.includes(searchTerm)) {
            card.parentElement.style.display = 'block';
        } else {
            card.parentElement.style.display = 'none';
        }
    });
}

// تصفية المنتجات حسب الفئة
function filterProducts(category) {
    // هنا يمكن تنفيذ التصفية حسب الفئة
    console.log('Filtering products by category:', category);
}

// تصدير الدوال للاستخدام العام
window.homepage = {
    buyProduct,
    searchProducts,
    filterProducts,
    showNotification
};
