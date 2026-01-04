// ========================================
// الصفحة الرئيسية لـ Iron Plus - النسخة المطورة v4.6 🦾
// تصميم متكامل مع هوية آيرون مان وتجربة مستخدم محسنة
// ========================================

// بيانات المنتجات الافتراضية (للتنمية)
const DEFAULT_PRODUCTS = [
    {
        id: 'snap-plus-3m',
        name: 'سناب بلس - ٣ أشهر',
        description: 'باقة سناب بلس المميزة مع مزايا متقدمة وضد الحظر',
        price: 89.99,
        category: 'snap',
        image_url: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
        rating: 5,
        features: ['ضد الحظر', 'مزايا متقدمة', 'دعم فني 24/7', 'تحديثات مستمرة']
    },
    {
        id: 'tiktok-plus-6m',
        name: 'تيك توك بلس - ٦ أشهر',
        description: 'باقة تيك توك بلس الشاملة مع أدوات تحليل متقدمة',
        price: 149.99,
        category: 'tiktok',
        image_url: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
        rating: 5,
        features: ['أدوات تحليل', 'تحميل مباشر', 'لا إعلانات', 'دعم فني']
    },
    {
        id: 'youtube-premium-1y',
        name: 'يوتيوب بريميوم - سنة',
        description: 'يوتيوب بريميوم مع تحميل الفيديوهات واستماع في الخلفية',
        price: 199.99,
        category: 'youtube',
        image_url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
        rating: 4.5,
        features: ['لا إعلانات', 'تحميل الفيديوهات', 'استماع خلفي', 'يوتيوب ميوزك']
    },
    {
        id: 'netflix-premium',
        name: 'نيتفليكس بريميوم',
        description: 'اشتراك نيتفليكس بريميوم مع ٤ شاشات ودقة 4K',
        price: 249.99,
        category: 'other',
        image_url: 'https://cdn-icons-png.flaticon.com/512/5977/5977590.png',
        rating: 5,
        features: ['٤ شاشات', 'دقة 4K', 'محتوى حصري', 'تحميل للمشاهدة لاحقاً']
    }
];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 IRON+ Homepage v4.6 Initializing...');
    console.log('🦾 J.A.R.V.I.S Systems: ONLINE');
    
    try {
        // 1. التحقق من حالة المستخدم
        await checkUserStatus();
        
        // 2. تحميل وعرض المنتجات
        await loadProducts();
        
        // 3. تحميل الإحصائيات
        await loadStatistics();
        
        // 4. إعداد مستمعي الأحداث
        setupEventListeners();
        
        // 5. تسجيل الزيارة
        await recordVisit();
        
        // 6. إعداد تأثيرات التمرير
        setupScrollEffects();
        
        console.log('✅ All systems operational');
    } catch (error) {
        console.error('❌ Failed to initialize homepage:', error);
        showNotification('حدث خطأ في تحميل الصفحة. جرب تحديث الصفحة.', 'error');
    }
});

// --- [1] التحقق من حالة المستخدم ---
async function checkUserStatus() {
    try {
        // التحقق من وجود مكتبة ironPlus
        if (!window.ironPlus) {
            console.warn('ironPlus library not found, using mock data');
            return mockUserStatus();
        }
        
        const isLoggedIn = window.ironPlus.isLoggedIn();
        const userPhone = window.ironPlus.getUserPhone();
        
        updateUserUI(isLoggedIn, userPhone);
    } catch (error) {
        console.error('Error checking user status:', error);
        mockUserStatus();
    }
}

function mockUserStatus() {
    // عرض واجهة الزائر بشكل افتراضي
    updateUserUI(false, null);
}

function updateUserUI(isLoggedIn, userPhone) {
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('loginButton');
    const userPhoneDisplay = document.getElementById('userPhone');
    const logoutBtn = document.getElementById('logoutBtn');

    if (isLoggedIn && userPhone) {
        // حالة تسجيل الدخول
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.style.animation = 'slideInLeft 0.3s ease';
        }
        if (loginButton) loginButton.style.display = 'none';
        if (userPhoneDisplay) userPhoneDisplay.textContent = userPhone;
        
        // إضافة مستمع للخروج
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (window.ironPlus && window.ironPlus.logout) {
                    await window.ironPlus.logout();
                }
                location.reload();
            });
        }
    } else {
        // حالة الزائر
        if (userInfo) userInfo.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
    }
}

// --- [2] تحميل وعرض المنتجات ---
async function loadProducts() {
    const container = document.getElementById('productsContainer');
    const loading = document.querySelector('.loading-spinner');
    
    if (!container) {
        console.error('Products container not found');
        return;
    }
    
    try {
        if (loading) loading.style.display = 'block';
        
        let products = [];
        
        // محاولة جلب المنتجات من API
        if (window.ironPlus && window.ironPlus.getProducts) {
            const result = await window.ironPlus.getProducts();
            if (result.success) {
                products = result.products;
            } else {
                throw new Error('Failed to fetch products');
            }
        } else {
            // استخدام البيانات الافتراضية للتنمية
            console.log('Using mock products data');
            products = DEFAULT_PRODUCTS;
        }
        
        // عرض المنتجات
        if (products.length > 0) {
            renderProducts(products);
            setupProductFilters(products);
        } else {
            showNoProductsMessage(container);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNoProductsMessage(container);
        showNotification('حدث خطأ في تحميل المنتجات', 'error');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = products.map(product => {
        const price = formatPrice(product.price);
        const stars = generateStars(product.rating || 5);
        
        return `
            <div class="col" data-category="${product.category}">
                <div class="iron-card text-center p-6 product-card">
                    <!-- شارة الخصم (إذا موجودة) -->
                    ${product.discount ? `
                        <div class="product-badge">
                            <span class="badge-discount">${product.discount}% خصم</span>
                        </div>
                    ` : ''}
                    
                    <!-- صورة المنتج -->
                    <div class="product-img-header mb-4">
                        <img src="${product.image_url}" 
                             alt="${product.name}" 
                             class="product-image"
                             onerror="this.src='https://cdn-icons-png.flaticon.com/512/891/891419.png'">
                    </div>
                    
                    <!-- معلومات المنتج -->
                    <div class="card-header mb-4">
                        <h3 class="card-title text-lg font-bold text-white mb-2">
                            ${product.name}
                        </h3>
                        <p class="text-gray-400 text-sm mb-3 line-clamp-2">
                            ${product.description || 'باقة مميزة مع مزايا متقدمة'}
                        </p>
                    </div>
                    
                    <!-- التقييم -->
                    <div class="product-rating mb-4">
                        ${stars}
                        <span class="text-gray-500 text-xs mr-2">(${product.rating || 5}.0)</span>
                    </div>
                    
                    <!-- الميزات -->
                    ${product.features ? `
                        <div class="product-features mb-4 hidden md:block">
                            ${product.features.slice(0, 2).map(feature => `
                                <span class="feature-tag">${feature}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- السعر -->
                    <div class="price-display text-center mb-4">
                        ${product.originalPrice ? `
                            <div class="original-price text-gray-500 line-through text-sm">
                                ${formatPrice(product.originalPrice)} ر.س
                            </div>
                        ` : ''}
                        <span class="text-glow-red text-2xl font-bold">${price}</span>
                        <small class="text-gray-400 text-sm mr-1">ر.س</small>
                    </div>
                    
                    <!-- الزر -->
                    <div class="card-footer">
                        <button class="btn-iron btn-gold w-full buy-btn" 
                                data-product-id="${product.id}"
                                onclick="buyProduct('${product.id}')">
                            <i class="fas fa-shopping-basket ml-2"></i>
                            <span class="btn-text">أضف للسلة</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // إضافة تأثيرات Hover للمنتجات
    addProductHoverEffects();
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // نجوم كاملة
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star text-gold"></i>';
    }
    
    // نصف نجمة
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt text-gold"></i>';
    }
    
    // نجوم فارغة
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star text-gold"></i>';
    }
    
    return `<div class="stars flex justify-center gap-1">${stars}</div>`;
}

function formatPrice(price) {
    if (!price) return '0.00';
    return parseFloat(price).toFixed(2);
}

function setupProductFilters(products) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // تحديث حالة الأزرار
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // تصفية المنتجات
            productCards.forEach(card => {
                const productCard = card.closest('.col');
                const category = productCard.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    productCard.style.display = 'block';
                    setTimeout(() => {
                        productCard.style.opacity = '1';
                        productCard.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    productCard.style.opacity = '0';
                    productCard.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        productCard.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

function showNoProductsMessage(container) {
    container.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="no-products-icon mb-6">
                <i class="fas fa-box-open text-4xl text-gray-600"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-300 mb-2">لا توجد باقات متاحة حالياً</h3>
            <p class="text-gray-500 mb-6">نعمل على إضافة باقات جديدة قريباً</p>
            <button onclick="location.reload()" class="btn-iron btn-outline">
                <i class="fas fa-sync-alt ml-2"></i> تحديث الصفحة
            </button>
        </div>
    `;
}

function addProductHoverEffects() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(155,17,30,0.4)';
            
            const image = this.querySelector('.product-image');
            if (image) {
                image.style.transform = 'scale(1.05)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
            
            const image = this.querySelector('.product-image');
            if (image) {
                image.style.transform = 'scale(1)';
            }
        });
    });
}

// --- [3] منطق الشراء ---
async function buyProduct(productId) {
    try {
        // التحقق من تسجيل الدخول
        if (!window.ironPlus || !window.ironPlus.isLoggedIn()) {
            localStorage.setItem('pending_purchase_id', productId);
            
            showNotification('يرجى تسجيل الدخول لإتمام الطلب', 'warning', 3000);
            
            setTimeout(() => {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            }, 1500);
            
            return;
        }
        
        // عرض تحميل
        showNotification('جاري تجهيز طلبك... 🦾', 'info');
        
        // الحصول على معلومات المنتج
        let product;
        if (window.ironPlus.getProduct) {
            const result = await window.ironPlus.getProduct(productId);
            if (result.success) {
                product = result.product;
            } else {
                throw new Error('Failed to get product details');
            }
        } else {
            // استخدام بيانات وهمية للتنمية
            product = DEFAULT_PRODUCTS.find(p => p.id === productId);
        }
        
        if (!product) {
            throw new Error('Product not found');
        }
        
        // إنشاء عملية دفع
        if (window.ironPlus.createPayment) {
            const phone = window.ironPlus.getUserPhone();
            const payRes = await window.ironPlus.createPayment(
                productId, 
                phone, 
                product.price
            );

            if (payRes.success && payRes.data.url) {
                // إضافة تأثير قبل التحويل
                document.body.style.opacity = '0.7';
                setTimeout(() => {
                    window.location.href = payRes.data.url;
                }, 500);
            } else {
                throw new Error('Failed to create payment');
            }
        } else {
            // محاكاة عملية الدفع للتنمية
            simulatePayment(product);
        }
    } catch (error) {
        console.error('Purchase Error:', error);
        showNotification('حدث خطأ أثناء معالجة طلبك', 'error');
        
        // إعادة تعيين التأثيرات
        document.body.style.opacity = '1';
    }
}

function simulatePayment(product) {
    showNotification(`جاري محاكاة الدفع لـ ${product.name}...`, 'info');
    
    setTimeout(() => {
        const success = Math.random() > 0.2; // 80% نجاح
        
        if (success) {
            showNotification('تمت عملية الدفع بنجاح! ✅', 'success', 5000);
            
            // تحديث سلة المشتريات
            updateCartCount(1);
            
            // إظهار رسالة نجاح تفصيلية
            setTimeout(() => {
                showNotification(
                    `تم شراء ${product.name} بنجاح! سيصلك الكود خلال ثوانٍ.`,
                    'success',
                    6000
                );
            }, 1000);
        } else {
            showNotification('فشلت عملية الدفع. جرب مرة أخرى.', 'error');
        }
    }, 2000);
}

// --- [4] الإحصائيات ---
async function loadStatistics() {
    try {
        let stats;
        
        if (window.ironPlus && window.ironPlus.getSiteStats) {
            const result = await window.ironPlus.getSiteStats();
            if (result.success) {
                stats = result.stats;
            }
        }
        
        // استخدام إحصائيات وهمية إذا لم تكن متوفرة
        if (!stats) {
            stats = {
                uniqueCustomers: 13655,
                totalOrders: 3101,
                averageRating: 5.0,
                supportResponseTime: '24/7'
            };
        }
        
        // تحديث العدادات
        updateCounters(stats);
    } catch (error) {
        console.error('Error loading statistics:', error);
        // استخدام القيم الافتراضية
        updateCounters({
            uniqueCustomers: 13655,
            totalOrders: 3101,
            averageRating: 5.0,
            supportResponseTime: '24/7'
        });
    }
}

function updateCounters(stats) {
    // عداد العملاء
    const visitorCount = document.getElementById('visitorCount');
    if (visitorCount) {
        animateCounter(visitorCount, stats.uniqueCustomers || 13655);
    }
    
    // عداد الطلبات
    const orderCount = document.getElementById('orderCount');
    if (orderCount) {
        animateCounter(orderCount, stats.totalOrders || 3101);
    }
    
    // تحديث التقييم
    const ratingElement = document.querySelector('.stat-box:nth-child(3) h3');
    if (ratingElement) {
        ratingElement.textContent = stats.averageRating || '5.0';
    }
}

function animateCounter(element, target) {
    const current = parseInt(element.textContent.replace(/,/g, '') || 0);
    const increment = target > current ? 1 : -1;
    const step = Math.ceil(Math.abs(target - current) / 100);
    
    let currentValue = current;
    
    const timer = setInterval(() => {
        currentValue += increment * step;
        
        if ((increment > 0 && currentValue >= target) || 
            (increment < 0 && currentValue <= target)) {
            currentValue = target;
            clearInterval(timer);
        }
        
        element.textContent = currentValue.toLocaleString();
    }, 20);
}

// --- [5] إعداد مستمعي الأحداث ---
function setupEventListeners() {
    // البحث عن المنتجات
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchProducts, 300));
    }
    
    // زر تحميل المزيد
    const loadMoreBtn = document.getElementById('loadMore');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreProducts);
    }
    
    // قائمة التنقل للموبايل
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // تحديث سلة المشتريات
    updateCartCount();
}

function searchProducts() {
    const searchInput = document.getElementById('globalSearch');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    const productCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    
    productCards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.querySelector('.text-gray-400')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.closest('.col').style.display = 'block';
            visibleCount++;
        } else {
            card.closest('.col').style.display = 'none';
        }
    });
    
    // إظهار رسالة إذا لم توجد نتائج
    const noResults = document.getElementById('noResults');
    if (visibleCount === 0 && searchTerm) {
        if (!noResults) {
            const container = document.getElementById('productsContainer');
            const message = document.createElement('div');
            message.id = 'noResults';
            message.className = 'col-span-full text-center py-12';
            message.innerHTML = `
                <i class="fas fa-search text-4xl text-gray-600 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-300 mb-2">لا توجد نتائج</h3>
                <p class="text-gray-500">لم نعثر على باقات تطابق "${searchTerm}"</p>
            `;
            container.appendChild(message);
        }
    } else if (noResults) {
        noResults.remove();
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

async function loadMoreProducts() {
    const loadMoreBtn = document.getElementById('loadMore');
    if (loadMoreBtn) {
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> جاري التحميل...';
        loadMoreBtn.disabled = true;
        
        try {
            // محاكاة تأخير الشبكة
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // هنا يمكنك إضافة منطق جلب المزيد من المنتجات من الخادم
            showNotification('تم تحميل المزيد من المنتجات', 'success');
        } catch (error) {
            showNotification('حدث خطأ أثناء التحميل', 'error');
        } finally {
            loadMoreBtn.innerHTML = '<i class="fas fa-sync-alt ml-2"></i> تحميل المزيد';
            loadMoreBtn.disabled = false;
        }
    }
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = document.querySelector('.menu-toggle i');
    
    navLinks.classList.toggle('active');
    
    if (navLinks.classList.contains('active')) {
        menuIcon.classList.remove('fa-bars');
        menuIcon.classList.add('fa-times');
        document.body.style.overflow = 'hidden';
    } else {
        menuIcon.classList.remove('fa-times');
        menuIcon.classList.add('fa-bars');
        document.body.style.overflow = '';
    }
}

function updateCartCount(additional = 0) {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        let currentCount = parseInt(cartCount.textContent) || 0;
        currentCount += additional;
        cartCount.textContent = currentCount;
        
        if (currentCount > 0) {
            cartCount.style.display = 'flex';
            
            // تأثير عند إضافة منتج للسلة
            if (additional > 0) {
                cartCount.style.animation = 'none';
                setTimeout(() => {
                    cartCount.style.animation = 'bounce 0.5s ease';
                }, 10);
            }
        } else {
            cartCount.style.display = 'none';
        }
    }
}

// --- [6] تأثيرات التمرير ---
function setupScrollEffects() {
    // تأثيرات fade-in عند التمرير
    const fadeElements = document.querySelectorAll('.scroll-fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    fadeElements.forEach(element => {
        observer.observe(element);
    });
    
    // شريط التنقل عند التمرير
    const nav = document.querySelector('.nav-iron-pro');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            nav.classList.add('scrolled');
            
            if (currentScroll > lastScroll) {
                // التمرير للأسفل
                nav.style.transform = 'translateY(-100%)';
            } else {
                // التمرير للأعلى
                nav.style.transform = 'translateY(0)';
            }
        } else {
            nav.classList.remove('scrolled');
            nav.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
}

// --- [7] تسجيل الزيارة ---
async function recordVisit() {
    try {
        if (window.ironPlus && window.ironPlus.recordVisit) {
            await window.ironPlus.recordVisit('index.html');
        }
    } catch (error) {
        console.error('Error recording visit:', error);
    }
}

// --- [8] دوال مساعدة ---
function showNotification(message, type = 'info', duration = 4000) {
    // إزالة أي إشعارات سابقة
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // إنشاء الإشعار
    const notification = document.createElement('div');
    notification.className = `custom-notification notification-${type}`;
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-times-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon} mr-3"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // إضافة الأنماط
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        max-width: 400px;
        background: rgba(26, 26, 26, 0.95);
        backdrop-filter: blur(10px);
        border: 2px solid ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
        border-radius: 12px;
        padding: 15px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 9999;
        animation: slideInDown 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        border-right: 4px solid var(--iron-gold);
    `;
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // زر الإغلاق
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // إخفاء تلقائي
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutUp 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
    
    // إضافة أنماط الحركة
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideOutUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }
        
        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.3); }
        }
        
        .notification-close {
            background: none;
            border: none;
            color: #ccc;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .notification-close:hover {
            background: rgba(255,255,255,0.1);
            color: var(--iron-red);
        }
    `;
    document.head.appendChild(style);
}

// --- [9] دالة الأكورديون ---
window.toggleFaq = function(element) {
    const faqItem = element.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const icon = element.querySelector('i');
    
    if (answer.classList.contains('hidden')) {
        // إغلاق جميع الأسئلة المفتوحة
        document.querySelectorAll('.faq-answer').forEach(ans => {
            ans.classList.add('hidden');
        });
        document.querySelectorAll('.faq-question i').forEach(ic => {
            ic.classList.remove('fa-minus');
            ic.classList.add('fa-plus');
        });
        
        // فتح السؤال الحالي
        answer.classList.remove('hidden');
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
        
        // تأثير سلس
        setTimeout(() => {
            answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    } else {
        // إغلاق السؤال الحالي
        answer.classList.add('hidden');
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
    }
};

// تصدير الوظائف للاستخدام العام
window.ironHomepage = {
    buyProduct,
    showNotification,
    toggleFaq,
    updateCartCount,
    loadMoreProducts,
    searchProducts
};

console.log('📦 IRON+ Homepage v4.6 loaded successfully!');
// --- [10] إدارة التقييمات المتحركة ---
function loadReviews() {
    const reviewsData = [
        {
            id: 1,
            name: "سعد العتيبي",
            date: "منذ ساعتين",
            rating: 5,
            product: "سناب بلس",
            comment: "أفضل متجر تعاملت معه، التفعيل فوري والسناب شغال معي زي الحلاوة. الدعم الفني سريع ومحترف. أنصح فيه الجميع!",
            verified: true,
            avatarColor: "#9b111e"
        },
        {
            id: 2,
            name: "نورة محمد",
            date: "منذ يوم",
            rating: 5,
            product: "تيك توك بلس",
            comment: "اشتريت باقة تيك توك بلس وكل شيء سلس. الكود وصل خلال ثواني والدعم رد علي حتى وقت متأخر من الليل. شكراً لكم!",
            verified: true,
            avatarColor: "#ff4757"
        },
        {
            id: 3,
            name: "خالد السبيعي",
            date: "منذ ٣ أيام",
            rating: 5,
            product: "فك حظر سناب",
            comment: "خدمة فك الحظر ساعدتني كثيراً. كنت محظور من سناب ومكثت ٣ شهور، وبعد ما جربت خدمتهم رجع لي الحساب خلال ١٠ دقائق!",
            verified: true,
            avatarColor: "#ffd700"
        },
        {
            id: 4,
            name: "فهد القحطاني",
            date: "منذ أسبوع",
            rating: 4,
            product: "يوتيوب بريميوم",
            comment: "خدمة ممتازة، السعر مناسب جداً مقارنة بالجودة. الدعم الفني متجاوب ويحل المشاكل بسرعة. أنصح بالتجربة.",
            verified: true,
            avatarColor: "#00a8ff"
        },
        {
            id: 5,
            name: "لينا الغامدي",
            date: "منذ ١٠ أيام",
            rating: 5,
            product: "سناب بلس",
            comment: "اشتريت أكثر من باقة وماقصرت معاي أبداً. التفعيل فوري والجودة ممتازة. راح أتعامل معكم دايماً.",
            verified: true,
            avatarColor: "#9b111e"
        },
        {
            id: 6,
            name: "تركي الحربي",
            date: "منذ أسبوعين",
            rating: 5,
            product: "نيتفليكس بريميوم",
            comment: "النيتفليكس شغال زي الفل، الدقة 4K والشاشات الأربعة كلها شغالة. سعر ممتاز جداً مقابل الخدمة.",
            verified: true,
            avatarColor: "#e50914"
        }
    ];

    const reviewsTrack = document.getElementById('reviewsTrack');
    const dotsContainer = document.querySelector('.review-dots');
    
    if (!reviewsTrack) return;
    
    // مسح المحتوى القديم
    reviewsTrack.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    // إضافة التقييمات الجديدة
    reviewsData.forEach((review, index) => {
        const reviewCard = document.createElement('div');
        reviewCard.className = `review-card hud-effect p-6 min-w-[350px] flex-shrink-0 ${index === 0 ? 'active' : ''}`;
        reviewCard.setAttribute('data-index', index);
        reviewCard.style.animationDelay = `${index * 0.1}s`;
        
        // توليد النجوم
        const stars = Array(5).fill(0).map((_, i) => 
            i < review.rating ? 
            '<i class="fas fa-star text-gold"></i>' : 
            '<i class="far fa-star text-gold"></i>'
        ).join('');
        
        reviewCard.innerHTML = `
            <div class="review-header flex justify-between items-start mb-4">
                <div class="reviewer-info flex items-center gap-3">
                    <div class="reviewer-avatar" style="background: ${review.avatarColor}20; border-color: ${review.avatarColor}50">
                        <i class="fas fa-user-circle text-xl" style="color: ${review.avatarColor}"></i>
                    </div>
                    <div>
                        <strong class="block text-white">${review.name}</strong>
                        <span class="${review.verified ? 'text-green-400' : 'text-gray-500'} text-xs flex items-center gap-1">
                            <i class="fas fa-${review.verified ? 'check-circle' : 'user'}"></i> 
                            ${review.verified ? 'مشترك مؤكد' : 'مستخدم'}
                        </span>
                    </div>
                </div>
                <div class="review-date text-xs text-gray-500">
                    <i class="fas fa-clock mr-1"></i>${review.date}
                </div>
            </div>
            <p class="text-sm text-gray-300 mb-4 leading-relaxed">
                "${review.comment}"
            </p>
            <div class="review-footer flex justify-between items-center mt-4 pt-4 border-t border-gray-800">
                <div class="stars text-sm">
                    ${stars}
                    <span class="text-gray-500 text-xs mr-2">${review.rating}.0</span>
                </div>
                <span class="text-xs text-gray-400 flex items-center gap-1">
                    <i class="fas fa-tag"></i>
                    ${review.product}
                </span>
            </div>
        `;
        
        reviewsTrack.appendChild(reviewCard);
        
        // إضافة نقطة التنقل
        if (dotsContainer) {
            const dot = document.createElement('button');
            dot.className = `review-dot ${index === 0 ? 'active' : ''}`;
            dot.setAttribute('data-index', index);
            dot.setAttribute('aria-label', `التقييم ${index + 1}`);
            dotsContainer.appendChild(dot);
        }
    });
    
    // إعداد التنقل
    setupReviewNavigation();
}

function setupReviewNavigation() {
    const track = document.getElementById('reviewsTrack');
    const cards = track.querySelectorAll('.review-card');
    const dots = document.querySelectorAll('.review-dot');
    const prevBtn = document.querySelector('.review-prev');
    const nextBtn = document.querySelector('.review-next');
    
    if (!cards.length || !track) return;
    
    let currentIndex = 0;
    const cardWidth = cards[0].offsetWidth + 24; // عرض الكارت + الجاب
    const containerWidth = track.parentElement.offsetWidth;
    const visibleCards = Math.floor(containerWidth / cardWidth);
    const totalCards = cards.length;
    
    // دالة تحديث الموضع
    function updatePosition() {
        const maxIndex = Math.max(0, totalCards - visibleCards);
        currentIndex = Math.min(currentIndex, maxIndex);
        
        track.style.transform = `translateX(${-currentIndex * cardWidth}px)`;
        
        // تحديث النقاط النشطة
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // تحديث حالة الأزرار
        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
            prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentIndex >= maxIndex;
            nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
        }
    }
    
    // زر التالي
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const maxIndex = Math.max(0, totalCards - visibleCards);
            if (currentIndex < maxIndex) {
                currentIndex++;
                updatePosition();
            }
        });
    }
    
    // زر السابق
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updatePosition();
            }
        });
    }
    
    // النقاط
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updatePosition();
        });
    });
    
    // حركة تلقائية
    let autoScrollInterval = setInterval(() => {
        const maxIndex = Math.max(0, totalCards - visibleCards);
        
        if (currentIndex < maxIndex) {
            currentIndex++;
        } else {
            currentIndex = 0;
        }
        updatePosition();
    }, 4000);
    
    // إيقاف الحركة التلقائية عند التفاعل
    const stopAutoScroll = () => {
        clearInterval(autoScrollInterval);
    };
    
    const startAutoScroll = () => {
        autoScrollInterval = setInterval(() => {
            const maxIndex = Math.max(0, totalCards - visibleCards);
            
            if (currentIndex < maxIndex) {
                currentIndex++;
            } else {
                currentIndex = 0;
            }
            updatePosition();
        }, 4000);
    };
    
    track.addEventListener('mouseenter', stopAutoScroll);
    track.addEventListener('touchstart', stopAutoScroll);
    
    track.addEventListener('mouseleave', startAutoScroll);
    track.addEventListener('touchend', startAutoScroll);
    
    // سحب بالإصبع للهواتف
    let touchStartX = 0;
    let touchEndX = 0;
    
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoScroll();
    });
    
    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoScroll();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchStartX - touchEndX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // سحب لليسار - التالي
                const maxIndex = Math.max(0, totalCards - visibleCards);
                if (currentIndex < maxIndex) {
                    currentIndex++;
                }
            } else {
                // سحب لليمين - السابق
                if (currentIndex > 0) {
                    currentIndex--;
                }
            }
            updatePosition();
        }
    }
    
    // تهيئة الحركة
    track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    updatePosition();
    
    // تحديث عند تغيير حجم النافذة
    window.addEventListener('resize', () => {
        updatePosition();
    });
}

// إضافة استدعاء loadReviews في DOMContentLoaded
// داخل document.addEventListener('DOMContentLoaded', function() {
// إضافة هذا السطر بعد loadProducts();
loadReviews();
