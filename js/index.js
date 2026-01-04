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
    const mobileLoginButton = document.getElementById('mobileLoginButton');
    const userPhoneDisplay = document.getElementById('userPhone');

    if (isLoggedIn && userPhone) {
        // حالة تسجيل الدخول
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.style.animation = 'slideInLeft 0.3s ease';
        }
        if (loginButton) loginButton.style.display = 'none';
        if (mobileLoginButton) mobileLoginButton.style.display = 'none';
        if (userPhoneDisplay) userPhoneDisplay.textContent = userPhone;
        
        // تحديث زر الخروج في القائمة المتنقلة
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn-primary mt-4';
            logoutBtn.innerHTML = '<i class="fas fa-power-off ml-2"></i> تسجيل الخروج';
            logoutBtn.addEventListener('click', async () => {
                if (window.ironPlus && window.ironPlus.logout) {
                    await window.ironPlus.logout();
                }
                location.reload();
            });
            
            const existingLogoutBtn = mobileMenu.querySelector('.logout-btn');
            if (!existingLogoutBtn) {
                logoutBtn.classList.add('logout-btn');
                mobileMenu.querySelector('.flex-col').appendChild(logoutBtn);
            }
        }
    } else {
        // حالة الزائر
        if (userInfo) userInfo.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
        if (mobileLoginButton) mobileLoginButton.style.display = 'block';
        
        // إزالة زر الخروج من القائمة المتنقلة إذا كان موجوداً
        const existingLogoutBtn = document.querySelector('.logout-btn');
        if (existingLogoutBtn) {
            existingLogoutBtn.remove();
        }
    }
}

// --- [2] تحميل وعرض المنتجات ---
async function loadProducts() {
    const container = document.getElementById('productsContainer');
    const loading = container ? container.querySelector('.loading-spinner') : null;
    
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
        
        // تحديد الأيقونة المناسبة بناءً على الفئة
        let iconClass = 'fas fa-mobile-alt';
        let iconColor = '#FFD700';
        
        if (product.category === 'snap') {
            iconClass = 'fab fa-snapchat-ghost';
            iconColor = '#FFFC00';
        } else if (product.category === 'tiktok') {
            iconClass = 'fab fa-tiktok';
            iconColor = '#000000';
        } else if (product.category === 'youtube') {
            iconClass = 'fab fa-youtube';
            iconColor = '#FF0000';
        } else if (product.name.includes('فك حظر')) {
            iconClass = 'fas fa-unlock-alt';
            iconColor = '#9B111E';
        }
        
        return `
            <div class="product-card">
                <!-- Product Image -->
                <div class="h-40 bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
                    <div class="text-center">
                        <i class="${iconClass} text-6xl" style="color: ${iconColor}"></i>
                        <div class="mt-2 text-sm text-[#A0A0A0]">${product.category === 'snap' ? 'Snapchat Plus' : product.category === 'tiktok' ? 'TikTok Plus' : product.category === 'youtube' ? 'YouTube Premium' : product.name}</div>
                    </div>
                </div>
                
                <!-- Product Info -->
                <div class="p-6 flex-1 flex flex-col">
                    <h3 class="font-bold text-xl mb-3">${product.name}</h3>
                    
                    <!-- Rating -->
                    <div class="rating-stars mb-4">
                        ${stars}
                        <span class="text-sm text-[#A0A0A0] mr-2">(${product.rating || 5}.0)</span>
                    </div>
                    
                    <!-- Description -->
                    <p class="text-[#A0A0A0] text-sm mb-4 flex-grow">
                        ${product.description || 'باقة مميزة مع مزايا متقدمة'}
                    </p>
                    
                    <!-- Price -->
                    <div class="mt-auto">
                        <div class="flex items-baseline gap-2 mb-4">
                            <span class="text-2xl font-bold text-[#FFD700]">${price}</span>
                            <span class="text-[#A0A0A0]">ر.س</span>
                        </div>
                        
                        <!-- Add to Cart Button -->
                        <button class="btn-primary w-full py-3 buy-btn" data-product-id="${product.id}">
                            <i class="fas fa-plus-circle ml-2"></i> أضف للسلة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // إضافة مستمعي الأحداث لأزرار الشراء
    addBuyButtonListeners();
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // نجوم كاملة
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // نصف نجمة
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // نجوم فارغة
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function formatPrice(price) {
    if (!price) return '0.00';
    return parseFloat(price).toFixed(2);
}

function addBuyButtonListeners() {
    document.querySelectorAll('.buy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            if (productId) {
                buyProduct(productId);
            }
        });
    });
}

function showNoProductsMessage(container) {
    container.innerHTML = `
        <div class="col-span-4 text-center py-12">
            <div class="no-products-icon mb-6">
                <i class="fas fa-box-open text-4xl text-gray-600"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-300 mb-2">لا توجد باقات متاحة حالياً</h3>
            <p class="text-gray-500 mb-6">نعمل على إضافة باقات جديدة قريباً</p>
            <button onclick="location.reload()" class="btn-primary">
                <i class="fas fa-sync-alt ml-2"></i> تحديث الصفحة
            </button>
        </div>
    `;
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
    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Accordion
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('i');
            
            // Close all other accordions
            document.querySelectorAll('.accordion-content').forEach(item => {
                if (item !== content) {
                    item.classList.remove('active');
                    item.previousElementSibling.querySelector('i').classList.remove('fa-chevron-up');
                    item.previousElementSibling.querySelector('i').classList.add('fa-chevron-down');
                }
            });
            
            // Toggle current accordion
            content.classList.toggle('active');
            
            // Toggle icon
            if (content.classList.contains('active')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    });
    
    // تحديث سلة المشتريات
    updateCartCount();
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
    // شريط التنقل عند التمرير
    const nav = document.querySelector('.nav-container');
    let lastScroll = 0;
    
    if (nav) {
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
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
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

// --- [8] نظام الإشعارات الحية ---
function setupLiveNotifications() {
    const messages = [
        { title: "مستخدم جديد اشترى الآن!", text: "خالد اشترى باقة سناب بلس" },
        { title: "تحديث النظام", text: "تم تحديث جميع تطبيقات البلس" },
        { title: "عرض خاص", text: "خصم ٣٠٪ على باقة تيك توك بلس" },
        { title: "عملية ناجحة", text: "نورة حصلت على كود التفعيل" },
        { title: "دعم فني", text: "فريق الدعم متاح الآن على الواتساب" }
    ];
    
    function showRandomNotification() {
        const notification = document.getElementById('liveNotification');
        const notifTitle = document.getElementById('notifTitle');
        const notifText = document.getElementById('notifText');
        
        if (!notification || !notifTitle || !notifText) return;
        
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        notifTitle.textContent = randomMsg.title;
        notifText.textContent = randomMsg.text;
        
        notification.classList.remove('hidden');
        
        // إخفاء تلقائي بعد 5 ثواني
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }
    
    // عرض إشعار أولي بعد 3 ثواني
    setTimeout(showRandomNotification, 3000);
    
    // عرض إشعارات عشوائية كل 15-30 ثانية
    setInterval(() => {
        if (Math.random() > 0.3) { // 70% فرصة
            showRandomNotification();
        }
    }, 15000 + Math.random() * 15000);
}

// دالة إغلاق الإشعار
window.closeNotification = function() {
    const notification = document.getElementById('liveNotification');
    if (notification) {
        notification.classList.add('hidden');
    }
};

// --- [9] دوال مساعدة ---
function showNotification(message, type = 'info', duration = 4000) {
    // إنشاء الإشعار
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'success' ? 'bg-green-900/90 border-green-700' :
        type === 'error' ? 'bg-red-900/90 border-red-700' :
        type === 'warning' ? 'bg-yellow-900/90 border-yellow-700' :
        'bg-blue-900/90 border-blue-700'
    } border`;
    
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
        <div class="flex items-center">
            <i class="fas ${icon} mr-3 text-xl"></i>
            <span class="flex-1">${message}</span>
            <button class="ml-4 text-gray-300 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // إخفاء تلقائي
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }
}

// --- [10] تهيئة النظام الكاملة ---
document.addEventListener('DOMContentLoaded', function() {
    // إضافة مستمعي الأحداث الأساسيين
    setupEventListeners();
    
    // إعداد الإشعارات الحية
    setupLiveNotifications();
    
    // تحميل البيانات
    setTimeout(async () => {
        await checkUserStatus();
        await loadProducts();
        await loadStatistics();
        await recordVisit();
    }, 100);
});

// تصدير الوظائف للاستخدام العام
window.ironHomepage = {
    buyProduct,
    showNotification,
    updateCartCount
};

console.log('📦 IRON+ Homepage v4.6 loaded successfully!');
