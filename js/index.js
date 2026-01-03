// ========================================
// الصفحة الرئيسية لـ Iron Plus - المحرك المعدل
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Homepage: Initializing... 🦾');
    
    // ننتظر قليلاً لضمان تحميل كائن ironPlus من ملف الإعدادات
    setTimeout(async () => {
        if (!window.ironPlus) {
            console.error("Critical: Iron Plus Core not found!");
            return;
        }

        try {
            await checkUserStatus();
            await loadProducts();
            await loadStatistics();
            setupEventListeners();
            await window.ironPlus.recordVisit('index.html');
        } catch (error) {
            console.error('Boot Error:', error);
        }
    }, 100);
});

async function checkUserStatus() {
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('loginButton');
    const userPhoneDisplay = document.getElementById('userPhone');

    if (window.ironPlus.isLoggedIn()) {
        const phone = window.ironPlus.getUserPhone();
        if (userInfo) userInfo.style.display = 'flex';
        if (userPhoneDisplay) userPhoneDisplay.textContent = phone;
        if (loginButton) loginButton.style.display = 'none';
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
    }
}

async function loadProducts() {
    const container = document.getElementById('productsContainer');
    const loading = document.getElementById('loadingMessage');
    if (!container) return;

    try {
        const result = await window.ironPlus.getProducts();
        if (result.success && result.products.length > 0) {
            renderProducts(result.products);
        } else {
            container.innerHTML = '<h3 class="text-glow-gold">لا توجد منتجات حالياً</h3>';
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = products.map(p => `
        <div class="col">
            <div class="iron-card hud-effect">
                <div class="card-header text-center">
                    <img src="${p.image_url || 'assets/default.png'}" style="width:70px; border-radius:15px; margin-bottom:10px;">
                    <h3 class="tech-font">${p.name}</h3>
                </div>
                <div class="card-body">
                    <ul class="features-list">
                        ${p.features ? p.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('') : ''}
                    </ul>
                </div>
                <div class="card-footer text-center">
                    <div class="main-price text-glow-gold">${window.ironPlus.formatPrice(p.price)} ر.س</div>
                    <button class="btn-iron btn-gold buy-btn" data-id="${p.id}">
                        <i class="fas fa-shopping-cart"></i> شراء الآن
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadStatistics() {
    const res = await window.ironPlus.getSiteStats();
    if (res.success) {
        const vCount = document.getElementById('visitorCount');
        const oCount = document.getElementById('orderCount');
        if (vCount) vCount.textContent = res.stats.uniqueCustomers || '245';
        if (oCount) oCount.textContent = res.stats.totalOrders || '890';
    }
}

function setupEventListeners() {
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.buy-btn');
        if (btn) {
            const pid = btn.getAttribute('data-id');
            await handlePurchase(pid);
        }
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = () => window.ironPlus.logout();
}

async function handlePurchase(productId) {
    if (!window.ironPlus.isLoggedIn()) {
        alert('يرجى تسجيل الدخول أولاً');
        window.location.href = 'login.html?redirect=index.html';
        return;
    }
    
    const pRes = await window.ironPlus.getProduct(productId);
    const phone = window.ironPlus.getUserPhone();
    
    const payRes = await window.ironPlus.createPayment(productId, phone, pRes.product.price);
    if (payRes.success && payRes.data.url) {
        window.location.href = payRes.data.url;
    } else {
        alert('بوابة الدفع غير متاحة حالياً');
    }
}
