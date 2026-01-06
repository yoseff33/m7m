// ========================================
// الصفحة الرئيسية لـ Iron Plus v5.5 🦾
// النسخة الديناميكية مع نظام الإدارة الشامل
// النسخة الكاملة v1.0
// ========================================

// بيانات المنتجات الافتراضية (للتنمية)
const DEFAULT_PRODUCTS = [
    {
        id: 'snap-plus-3m',
        name: 'سناب بلس - ٣ أشهر',
        description: 'باقة سناب بلس المميزة مع مزايا متقدمة وضد الحظر',
        price: 8999, // بالهللة
        category: 'snap',
        image_url: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
        rating: 5,
        features: ['ضد الحظر', 'مزايا متقدمة', 'دعم فني 24/7', 'تحديثات مستمرة'],
        stock: 10
    },
    {
        id: 'tiktok-plus-6m',
        name: 'تيك توك بلس - ٦ أشهر',
        description: 'باقة تيك توك بلس الشاملة مع أدوات تحليل متقدمة',
        price: 14999, // بالهللة
        category: 'tiktok',
        image_url: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
        rating: 5,
        features: ['أدوات تحليل', 'تحميل مباشر', 'لا إعلانات', 'دعم فني'],
        stock: 8
    },
    {
        id: 'youtube-premium-1y',
        name: 'يوتيوب بريميوم - سنة',
        description: 'يوتيوب بريميوم مع تحميل الفيديوهات واستماع في الخلفية',
        price: 19999, // بالهللة
        category: 'youtube',
        image_url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
        rating: 4.5,
        features: ['لا إعلانات', 'تحميل الفيديوهات', 'استماع خلفي', 'يوتيوب ميوزك'],
        stock: 5
    },
    {
        id: 'netflix-premium',
        name: 'نيتفليكس بريميوم',
        description: 'اشتراك نيتفليكس بريميوم مع ٤ شاشات ودقة 4K',
        price: 24999, // بالهللة
        category: 'other',
        image_url: 'https://cdn-icons-png.flaticon.com/512/5977/5977590.png',
        rating: 5,
        features: ['٤ شاشات', 'دقة 4K', 'محتوى حصري', 'تحميل للمشاهدة لاحقاً'],
        stock: 3
    }
];

// متغيرات النظام
let siteSettings = null;
let liveNotificationsInterval = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 IRON+ Homepage v5.5 CMS Initializing...');
    console.log('🦾 J.A.R.V.I.S Systems: ONLINE');
    
    try {
        // 1. تحميل إعدادات الموقع
        await loadSiteSettings();
        
        // 2. التحقق من حالة المستخدم
        await checkUserStatus();
        
        // 3. تحميل وعرض المنتجات
        await loadProducts();
        
        // 4. تحميل البانرات الديناميكية
        await loadBanners();
        
        // 5. تحميل الإحصائيات
        await loadStatistics();
        
        // 6. تحميل التقييمات
        await loadReviews();
        
        // 7. إعداد مستمعي الأحداث
        setupEventListeners();
        
        // 8. تسجيل الزيارة
        await recordVisit();
        
        // 9. إعداد تأثيرات التمرير
        setupScrollEffects();
        
        // 10. إعداد الإشعارات الحية
        setupLiveNotifications();
        
        // 11. تحديث عداد السلة
        updateCartCount();
        
        console.log('✅ All systems operational - CMS Mode');
    } catch (error) {
        console.error('❌ Failed to initialize homepage:', error);
        showNotification('حدث خطأ في تحميل الصفحة. جرب تحديث الصفحة.', 'error');
    }
});

// --- [1] تحميل إعدادات الموقع ---
async function loadSiteSettings() {
    try {
        if (!window.ironPlus) {
            console.warn('ironPlus library not found, using default settings');
            siteSettings = window.ironPlus?.getDefaultSettings?.() || {};
            return;
        }
        
        const res = await window.ironPlus.getSiteSettings();
        if (res.success) {
            siteSettings = res.settings;
            applySiteSettings();
        } else {
            siteSettings = window.ironPlus.getDefaultSettings();
            applySiteSettings();
        }
    } catch (error) {
        console.error('Error loading site settings:', error);
        siteSettings = window.ironPlus?.getDefaultSettings?.() || {};
        applySiteSettings();
    }
}

function applySiteSettings() {
    if (!siteSettings) return;
    
    // تطبيق الأنماط الديناميكية
    window.ironPlus.applyDynamicStyles(siteSettings);
    
    // التحقق من وضع الصيانة
    if (siteSettings.maintenance_mode && !window.location.href.includes('admin.html')) {
        window.location.href = 'maintenance.html';
        return;
    }
    
    // تحديث عنوان الصفحة
    if (siteSettings.meta_title) {
        document.title = siteSettings.meta_title;
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = siteSettings.meta_title;
        }
    }
    
    // تحديث meta description
    if (siteSettings.meta_description) {
        const metaDesc = document.getElementById('metaDescription');
        if (metaDesc) {
            metaDesc.setAttribute('content', siteSettings.meta_description);
        }
    }
    
    // تحديث meta keywords
    if (siteSettings.meta_keywords) {
        const metaKeywords = document.getElementById('metaKeywords');
        if (metaKeywords) {
            metaKeywords.setAttribute('content', siteSettings.meta_keywords);
        }
    }
    
    // تحديث Favicon
    if (siteSettings.site_favicon) {
        const favicon = document.getElementById('favicon');
        if (favicon) {
            favicon.href = siteSettings.site_favicon;
        }
    }
    
    // تحديث شعار الموقع
    if (siteSettings.site_logo) {
        const logo = document.getElementById('siteLogo');
        if (logo) {
            logo.src = siteSettings.site_logo;
            logo.style.display = 'block';
        }
    }
    
    // تحديث شريط الإعلانات
    if (siteSettings.announcement_bar) {
        const announcementBar = document.getElementById('announcementBar');
        const announcementText = document.getElementById('announcementText');
        if (announcementBar && announcementText) {
            announcementText.textContent = siteSettings.announcement_bar;
            announcementBar.classList.remove('hidden');
        }
    }
    
    // تحديث وسائل التواصل في الفوتر
    updateSocialLinks();
    
    // تحديث روابط السياسات
    updatePolicyLinks();
    
    // إضافة أكواد التتبع
    setupTrackingCodes();
}

function updateSocialLinks() {
    if (!siteSettings) return;
    
    // واتساب
    if (siteSettings.whatsapp_number) {
        const whatsappLink = document.getElementById('whatsappLink');
        if (whatsappLink) {
            whatsappLink.href = `https://wa.me/${siteSettings.whatsapp_number}`;
            whatsappLink.style.display = 'inline-flex';
        }
    }
    
    // سناب شات
    if (siteSettings.snapchat_username) {
        const snapchatLink = document.getElementById('snapchatLink');
        if (snapchatLink) {
            snapchatLink.href = `https://snapchat.com/add/${siteSettings.snapchat_username}`;
            snapchatLink.style.display = 'inline-flex';
        }
    }
    
    // تيك توك
    if (siteSettings.tiktok_username) {
        const tiktokLink = document.getElementById('tiktokLink');
        if (tiktokLink) {
            tiktokLink.href = `https://tiktok.com/@${siteSettings.tiktok_username.replace('@', '')}`;
            tiktokLink.style.display = 'inline-flex';
        }
    }
    
    // تويتر
    if (siteSettings.twitter_username) {
        const twitterLink = document.getElementById('twitterLink');
        if (twitterLink) {
            twitterLink.href = `https://twitter.com/${siteSettings.twitter_username.replace('@', '')}`;
            twitterLink.style.display = 'inline-flex';
        }
    }
    
    // البريد الإلكتروني
    if (siteSettings.contact_email) {
        const emailLink = document.getElementById('emailLink');
        if (emailLink) {
            emailLink.href = `mailto:${siteSettings.contact_email}`;
            emailLink.style.display = 'inline-flex';
        }
    }
}

function updatePolicyLinks() {
    if (!siteSettings) return;
    
    // سياسة الاسترجاع
    const refundPolicyLink = document.getElementById('refundPolicyLink');
    if (refundPolicyLink && siteSettings.refund_policy_active) {
        refundPolicyLink.href = `policy.html?type=refund`;
        refundPolicyLink.style.display = 'block';
    }
    
    // الشروط والأحكام
    const termsLink = document.getElementById('termsLink');
    if (termsLink && siteSettings.terms_active) {
        termsLink.href = `policy.html?type=terms`;
        termsLink.style.display = 'block';
    }
    
    // سياسة الخصوصية
    const privacyLink = document.getElementById('privacyLink');
    if (privacyLink) {
        privacyLink.href = `policy.html?type=privacy`;
        privacyLink.style.display = 'block';
    }
    
    // من نحن
    const aboutLink = document.getElementById('aboutLink');
    if (aboutLink && siteSettings.about_active) {
        aboutLink.href = `policy.html?type=about`;
        aboutLink.style.display = 'block';
    }
}

function setupTrackingCodes() {
    if (!siteSettings) return;
    
    // Google Analytics
    if (siteSettings.google_analytics_id && siteSettings.conversion_tracking) {
        const script = document.createElement('script');
        script.id = 'googleAnalyticsScript';
        script.innerHTML = `
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
            ga('create', '${siteSettings.google_analytics_id}', 'auto');
            ga('send', 'pageview');
        `;
        document.head.appendChild(script);
    }
    
    // Snapchat Pixel
    if (siteSettings.snapchat_pixel_id && siteSettings.conversion_tracking) {
        const script = document.createElement('script');
        script.id = 'snapchatPixelScript';
        script.innerHTML = `
            (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
            {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
            a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
            r.src=n;var u=t.getElementsByTagName(s)[0];
            u.parentNode.insertBefore(r,u);})(window,document,
            'https://sc-static.net/scevent.min.js');
            snaptr('init', '${siteSettings.snapchat_pixel_id}');
            snaptr('track', 'PAGE_VIEW');
        `;
        document.head.appendChild(script);
    }
    
    // Facebook Pixel
    if (siteSettings.facebook_pixel_id && siteSettings.conversion_tracking) {
        const script = document.createElement('script');
        script.id = 'facebookPixelScript';
        script.innerHTML = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${siteSettings.facebook_pixel_id}');
            fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
    }
}

// --- [2] التحقق من حالة المستخدم ---
async function checkUserStatus() {
    try {
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
    updateUserUI(false, null);
}

function updateUserUI(isLoggedIn, userPhone) {
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('loginButton');
    const mobileLoginButton = document.getElementById('mobileLoginButton');
    const userPhoneDisplay = document.getElementById('userPhone');

    if (isLoggedIn && userPhone) {
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.style.animation = 'slideInLeft 0.3s ease';
        }
        if (loginButton) loginButton.style.display = 'none';
        if (mobileLoginButton) mobileLoginButton.style.display = 'none';
        if (userPhoneDisplay) userPhoneDisplay.textContent = userPhone;
        
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
        if (userInfo) userInfo.style.display = 'none';
        if (loginButton) loginButton.style.display = 'block';
        if (mobileLoginButton) mobileLoginButton.style.display = 'block';
        
        const existingLogoutBtn = document.querySelector('.logout-btn');
        if (existingLogoutBtn) {
            existingLogoutBtn.remove();
        }
    }
}

// --- [3] تحميل وعرض المنتجات ---
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
        
        if (window.ironPlus && window.ironPlus.getProducts) {
            const result = await window.ironPlus.getProducts();
            if (result.success) {
                products = result.products;
            } else {
                throw new Error('Failed to fetch products');
            }
        } else {
            console.log('Using mock products data');
            products = DEFAULT_PRODUCTS;
        }
        
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
        
        // تحويل المميزات إلى قائمة
        let featuresList = '';
        if (product.features && Array.isArray(product.features)) {
            featuresList = product.features.slice(0, 3).map(feature => 
                `<li class="flex items-center gap-2 text-sm text-gray-400">
                    <i class="fas fa-check text-green-500 text-xs"></i>
                    <span>${feature}</span>
                </li>`
            ).join('');
        }
        
        return `
            <div class="product-card group">
                <!-- Product Image -->
                <div class="h-40 bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center relative overflow-hidden">
                    <div class="text-center relative z-10">
                        ${product.image_url ? 
                            `<img src="${product.image_url}" alt="${product.name}" class="w-16 h-16 object-cover rounded-lg mx-auto">` :
                            `<i class="${iconClass} text-6xl" style="color: ${iconColor}"></i>`
                        }
                        <div class="mt-2 text-sm text-[#A0A0A0]">${product.category === 'snap' ? 'Snapchat Plus' : product.category === 'tiktok' ? 'TikTok Plus' : product.category === 'youtube' ? 'YouTube Premium' : product.name}</div>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                
                <!-- Product Info -->
                <div class="p-6 flex-1 flex flex-col">
                    <h3 class="font-bold text-xl mb-3">${product.name}</h3>
                    
                    <!-- Rating -->
                    <div class="rating-stars mb-4">
                        ${stars}
                        <span class="text-sm text-[#A0A0A0] mr-2">(${product.rating || 5}.0)</span>
                    </div>
                    
                    <!-- Features -->
                    ${featuresList ? `
                        <ul class="space-y-2 mb-4">
                            ${featuresList}
                        </ul>
                    ` : ''}
                    
                    <!-- Description -->
                    <p class="text-[#A0A0A0] text-sm mb-4 flex-grow line-clamp-2">
                        ${product.description || 'باقة مميزة مع مزايا متقدمة'}
                    </p>
                    
                    <!-- Stock -->
                    ${product.stock !== undefined ? `
                        <div class="mb-4">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-gray-400">المخزون:</span>
                                <span class="${product.stock < 5 ? 'text-red-500' : 'text-green-500'} font-medium">
                                    ${product.stock} متبقي
                                </span>
                            </div>
                            <div class="w-full bg-gray-800 rounded-full h-2 mt-1">
                                <div class="bg-green-500 h-2 rounded-full" style="width: ${Math.min((product.stock / 10) * 100, 100)}%"></div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Price -->
                    <div class="mt-auto">
                        <div class="flex items-baseline gap-2 mb-4">
                            <span class="text-2xl font-bold text-[#FFD700]">${price}</span>
                            <span class="text-[#A0A0A0]">ر.س</span>
                            ${product.duration ? `
                                <span class="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                                    ${product.duration}
                                </span>
                            ` : ''}
                        </div>
                        
                        <!-- Add to Cart Button -->
                        <button class="btn-primary w-full py-3 add-to-cart-btn" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">
                            <i class="fas fa-cart-plus ml-2"></i> أضف للسلة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    addCartButtonListeners();
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function formatPrice(amount) {
    if (!amount && amount !== 0) return '0.00';
    return (parseFloat(amount) / 100).toLocaleString('ar-SA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function addCartButtonListeners() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            const productPrice = this.getAttribute('data-product-price');
            
            if (productId) {
                await addToCart(productId, productName, productPrice);
            }
        });
    });
}

async function addToCart(productId, productName, productPrice) {
    try {
        if (!window.ironPlus || !window.ironPlus.addToCart) {
            // استخدام localStorage مباشرة إذا لم تكن الدالة متاحة
            let cart = JSON.parse(localStorage.getItem('iron_cart')) || [];
            const existingIndex = cart.findIndex(item => item.id === productId);
            
            if (existingIndex > -1) {
                cart[existingIndex].quantity += 1;
            } else {
                cart.push({
                    id: productId,
                    name: productName,
                    price: parseInt(productPrice),
                    quantity: 1
                });
            }
            
            localStorage.setItem('iron_cart', JSON.stringify(cart));
            updateCartCount();
            showNotification(`تمت إضافة ${productName} إلى السلة 🛒`, 'success');
            return;
        }
        
        const res = await window.ironPlus.addToCart(productId);
        if (res.success) {
            showNotification(`تمت إضافة ${productName} إلى السلة 🛒`, 'success');
            updateCartCount();
            
            // تأثير على زر السلة
            const cartIcon = document.querySelector('.fa-shopping-bag');
            if (cartIcon) {
                cartIcon.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    cartIcon.style.transform = 'scale(1)';
                }, 300);
            }
        } else {
            showNotification(res.message || 'حدث خطأ أثناء إضافة المنتج', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showNotification('حدث خطأ أثناء إضافة المنتج إلى السلة', 'error');
    }
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

// --- [4] تحميل البانرات الديناميكية ---
async function loadBanners() {
    try {
        if (!window.ironPlus || !window.ironPlus.getBanners) {
            console.log('Banners system not available');
            return;
        }
        
        const res = await window.ironPlus.getBanners();
        if (!res.success || !res.banners || res.banners.length === 0) {
            return;
        }
        
        const activeBanners = res.banners.filter(b => b.is_active);
        
        // Hero Banner
        const heroBanner = activeBanners.find(b => b.position === 'hero');
        if (heroBanner) {
            const heroContainer = document.getElementById('heroBanner');
            if (heroContainer) {
                heroContainer.innerHTML = `
                    <a href="${heroBanner.link || '#'}" ${heroBanner.link ? 'target="_blank"' : ''}>
                        <img src="${heroBanner.image_url}" 
                             alt="${heroBanner.alt_text || heroBanner.title}" 
                             class="w-full h-64 md:h-96 object-cover rounded-xl"
                             onerror="this.src='assets/default-banner.jpg'">
                    </a>
                `;
            }
        }
        
        // Middle Banner
        const middleBanner = activeBanners.find(b => b.position === 'middle');
        if (middleBanner) {
            const middleContainer = document.getElementById('middleBanner');
            if (middleContainer) {
                middleContainer.innerHTML = `
                    <div class="banner-wrapper">
                        <a href="${middleBanner.link || '#'}" ${middleBanner.link ? 'target="_blank"' : ''}>
                            <img src="${middleBanner.image_url}" 
                                 alt="${middleBanner.alt_text || middleBanner.title}" 
                                 class="w-full h-48 object-cover rounded-xl shadow-lg"
                                 onerror="this.src='assets/default-banner.jpg'">
                        </a>
                    </div>
                `;
            }
        }
        
        // Bottom Banner
        const bottomBanner = activeBanners.find(b => b.position === 'bottom');
        if (bottomBanner) {
            const bottomContainer = document.getElementById('bottomBanner');
            if (bottomContainer) {
                bottomContainer.innerHTML = `
                    <div class="banner-wrapper">
                        <a href="${bottomBanner.link || '#'}" ${bottomBanner.link ? 'target="_blank"' : ''}>
                            <img src="${bottomBanner.image_url}" 
                                 alt="${bottomBanner.alt_text || bottomBanner.title}" 
                                 class="w-full h-48 object-cover rounded-xl shadow-lg"
                                 onerror="this.src='assets/default-banner.jpg'">
                        </a>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading banners:', error);
    }
}

// --- [5] تحميل التقييمات ---
async function loadReviews() {
    try {
        if (!window.ironPlus || !window.ironPlus.getReviews) {
            return;
        }
        
        const res = await window.ironPlus.getReviews(true);
        if (res.success && res.reviews.length > 0) {
            const reviewsContainer = document.getElementById('reviewsContainer');
            if (reviewsContainer) {
                const approvedReviews = res.reviews.filter(r => r.is_approved);
                if (approvedReviews.length > 0) {
                    renderReviews(approvedReviews.slice(0, 6));
                }
            }
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

function renderReviews(reviews) {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    
    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-avatar">
                    ${review.customer_name.charAt(0)}
                </div>
                <div class="review-info">
                    <h4 class="review-name">${review.customer_name}</h4>
                    <div class="review-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </div>
            </div>
            <div class="review-content">
                <p>${review.comment || 'تقييم ممتاز'}</p>
            </div>
            ${review.images && review.images.length > 0 ? `
                <div class="review-images">
                    ${review.images.slice(0, 3).map(img => `
                        <img src="${img}" alt="صورة التقييم" class="review-image">
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// --- [6] الإحصائيات ---
async function loadStatistics() {
    try {
        let stats;
        
        if (window.ironPlus && window.ironPlus.getSiteStats) {
            const result = await window.ironPlus.getSiteStats();
            if (result.success) {
                stats = result.stats;
            }
        }
        
        if (!stats) {
            stats = {
                uniqueCustomers: 13655,
                totalOrders: 3101,
                averageRating: 5.0,
                supportResponseTime: '24/7'
            };
        }
        
        updateCounters(stats);
    } catch (error) {
        console.error('Error loading statistics:', error);
        updateCounters({
            uniqueCustomers: 13655,
            totalOrders: 3101,
            averageRating: 5.0,
            supportResponseTime: '24/7'
        });
    }
}

function updateCounters(stats) {
    const visitorCount = document.getElementById('visitorCount');
    if (visitorCount) {
        animateCounter(visitorCount, stats.uniqueCustomers || 13655);
    }
    
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

// --- [7] إعداد مستمعي الأحداث ---
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
            
            document.querySelectorAll('.accordion-content').forEach(item => {
                if (item !== content) {
                    item.classList.remove('active');
                    item.previousElementSibling.querySelector('i').classList.remove('fa-chevron-up');
                    item.previousElementSibling.querySelector('i').classList.add('fa-chevron-down');
                }
            });
            
            content.classList.toggle('active');
            
            if (content.classList.contains('active')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    });
}

function updateCartCount() {
    try {
        const cartCount = document.getElementById('cartCount');
        if (!cartCount) return;
        
        const cart = JSON.parse(localStorage.getItem('iron_cart')) || [];
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        
        cartCount.textContent = totalItems;
        
        if (totalItems > 0) {
            cartCount.style.display = 'flex';
            
            // تأثير عند تحديث العداد
            cartCount.style.animation = 'none';
            setTimeout(() => {
                cartCount.style.animation = 'bounce 0.5s ease';
            }, 10);
        } else {
            cartCount.style.display = 'none';
        }
    } catch (error) {
        console.error('Update cart count error:', error);
    }
}

// --- [8] تأثيرات التمرير ---
function setupScrollEffects() {
    const nav = document.querySelector('.nav-container');
    let lastScroll = 0;
    
    if (nav) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                nav.classList.add('scrolled');
                
                if (currentScroll > lastScroll) {
                    nav.style.transform = 'translateY(-100%)';
                } else {
                    nav.style.transform = 'translateY(0)';
                }
            } else {
                nav.classList.remove('scrolled');
                nav.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        });
    }
    
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

// --- [9] تسجيل الزيارة ---
async function recordVisit() {
    try {
        if (window.ironPlus && window.ironPlus.recordVisit) {
            await window.ironPlus.recordVisit('index.html');
        }
    } catch (error) {
        console.error('Error recording visit:', error);
    }
}

// --- [10] نظام الإشعارات الحية ---
function setupLiveNotifications() {
    if (!siteSettings || !siteSettings.live_notifications) {
        return;
    }
    
    clearInterval(liveNotificationsInterval);
    
    // عرض إشعار أولي بعد 3 ثواني
    setTimeout(() => {
        if (siteSettings.real_order_notifications && window.ironPlus) {
            showRealOrderNotification();
        } else {
            showRandomNotification();
        }
    }, 3000);
    
    // عرض إشعارات عشوائية كل 15-30 ثانية
    liveNotificationsInterval = setInterval(() => {
        if (Math.random() > 0.3) {
            if (siteSettings.real_order_notifications && window.ironPlus) {
                showRealOrderNotification();
            } else {
                showRandomNotification();
            }
        }
    }, 15000 + Math.random() * 15000);
}

async function showRealOrderNotification() {
    try {
        const res = await window.ironPlus.getRecentActivity(5);
        if (res.success && res.activities.length > 0) {
            const orderActivities = res.activities.filter(a => a.title.includes('طلب'));
            if (orderActivities.length > 0) {
                const randomActivity = orderActivities[Math.floor(Math.random() * orderActivities.length)];
                
                const notification = document.getElementById('liveNotification');
                const notifTitle = document.getElementById('notifTitle');
                const notifText = document.getElementById('notifText');
                
                if (notification && notifTitle && notifText) {
                    notifTitle.textContent = randomActivity.title;
                    notifText.textContent = randomActivity.description;
                    notification.classList.remove('hidden');
                    
                    setTimeout(() => {
                        notification.classList.add('hidden');
                    }, (siteSettings.notification_duration || 10) * 1000);
                }
                return;
            }
        }
        
        // إذا لم تكن هناك طلبات حقيقية، نعرض إشعار عشوائي
        showRandomNotification();
    } catch (error) {
        console.error('Error showing real order notification:', error);
        showRandomNotification();
    }
}

function showRandomNotification() {
    const notification = document.getElementById('liveNotification');
    const notifTitle = document.getElementById('notifTitle');
    const notifText = document.getElementById('notifText');
    
    if (!notification || !notifTitle || !notifText) return;
    
    let messages = [];
    
    if (siteSettings && siteSettings.notification_texts) {
        messages = siteSettings.notification_texts.split('\n').filter(m => m.trim());
    }
    
    if (messages.length === 0) {
        messages = [
            "مستخدم جديد اشترى الآن!",
            "تم تحديث المخزون",
            "عرض خاص محدود",
            "خصم 20% على الباقات المميزة",
            "جديد! باقات تيك توك بلس"
        ];
    }
    
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    
    // تقسيم الرسالة إلى عنوان ونص
    const parts = randomMsg.split('|');
    notifTitle.textContent = parts[0] || randomMsg;
    notifText.textContent = parts[1] || "IRON+ متجر التطبيقات المميزة";
    
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, (siteSettings?.notification_duration || 10) * 1000);
}

window.closeNotification = function() {
    const notification = document.getElementById('liveNotification');
    if (notification) {
        notification.classList.add('hidden');
    }
};

// --- [11] دوال مساعدة ---
function showNotification(message, type = 'info', duration = 4000) {
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
    
    document.body.appendChild(notification);
    
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }
}

// --- [12] تهيئة النظام الكاملة ---
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    
    setTimeout(async () => {
        await checkUserStatus();
        await loadProducts();
        await loadStatistics();
        await recordVisit();
        updateCartCount();
    }, 100);
});

// تصدير الوظائف للاستخدام العام
window.ironHomepage = {
    addToCart,
    showNotification,
    updateCartCount,
    closeNotification
};

console.log('📦 IRON+ Homepage v5.5 CMS loaded successfully!');
