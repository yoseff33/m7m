// ========================================
// الصفحة الرئيسية لـ Iron Plus v5.5 🦾
// النسخة الديناميكية مع نظام الإدارة الشامل
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
    console.log('🚀 IRON+ Homepage v5.5 Initializing...');
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
        
        // 6. إعداد مستمعي الأحداث
        setupEventListeners();
        
        // 7. تسجيل الزيارة
        await recordVisit();
        
        // 8. إعداد تأثيرات التمرير
        setupScrollEffects();
        
        // 9. إعداد الإشعارات الحية
        setupLiveNotifications();
        
        // 10. تحديث عداد السلة
        updateCartCount();
        
        console.log('✅ All systems operational - Dynamic Mode');
    } catch (error) {
        console.error('❌ Failed to initialize homepage:', error);
        showNotification('حدث خطأ في تحميل الصفحة. جرب تحديث الصفحة.', 'error');
    }
});
// --- [1] تحميل إعدادات الموقع مع فحص وضع الصيانة ---
// --- [1] تحميل إعدادات الموقع ---
async function loadSiteSettings() {
    try {
        if (!window.ironPlus) {
            console.warn('ironPlus library not found, using default settings');
            siteSettings = window.ironPlus?.getDefaultSettings?.() || {};
            applySiteSettings();
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

// --- [2] تطبيق الإعدادات وتحديث الواجهة ---
function applySiteSettings() {
    if (!siteSettings) return;

    // --- تحقق وضع الصيانة (الشاشة المعتمة والضبابية) ---
    if (siteSettings.maintenance_mode === true) {
        const whatsapp = siteSettings.whatsapp_number || '';
        
        document.body.innerHTML = `
            <div style="position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; color: white; font-family: 'Cairo', 'Rajdhani', sans-serif; direction: rtl;">
                <div style="text-align: center; padding: 40px; border: 1px solid rgba(255,215,0,0.3); border-radius: 20px; max-width: 500px; width: 90%; background: rgba(26, 26, 26, 0.5); box-shadow: 0 0 30px rgba(0,0,0,0.5);">
                    <div style="font-size: 70px; margin-bottom: 20px;">🦾</div>
                    <h1 style="font-size: 2.2rem; font-weight: bold; margin-bottom: 15px; color: #fff; text-shadow: 0 0 10px rgba(155, 17, 30, 0.5);">الموقع تحت الصيانة</h1>
                    <p style="color: #A0A0A0; margin-bottom: 30px; line-height: 1.8; font-size: 1.1rem;">
                        عذراً عميلنا العزيز، حنا جالسين نسوي بعض التحديثات والتحسينات عشان نخدمك بشكل أفضل.
                        <br><strong style="color: #FFD700;">تقدر تطلب وتتواصل معنا مباشرة عبر الواتساب:</strong>
                    </p>
                    <a href="https://wa.me/${whatsapp}" target="_blank" style="display: inline-flex; align-items: center; background: #25D366; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; gap: 12px; transition: 0.3s; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);">
                        <i class="fab fa-whatsapp" style="font-size: 24px;"></i>
                        للطلب عبر الواتساب اضغط هنا
                    </a>
                    <div style="margin-top: 40px; font-size: 0.85rem; color: #555; letter-spacing: 1px;">IRON+ OS v5.5</div>
                </div>
            </div>
        `;
        document.body.style.overflow = 'hidden';
        return; // يوقف تحميل باقي الموقع تماماً
    }

    // --- تكملة الإعدادات الطبيعية (SEO والمعلومات) ---
    if (siteSettings.meta_title) {
        document.title = siteSettings.meta_title;
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = siteSettings.meta_title;
    }
    
    if (siteSettings.meta_description) {
        const metaDesc = document.getElementById('metaDescription');
        if (metaDesc) metaDesc.setAttribute('content', siteSettings.meta_description);
    }
    
    if (siteSettings.meta_keywords) {
        const metaKey = document.getElementById('metaKeywords');
        if (metaKey) metaKey.setAttribute('content', siteSettings.meta_keywords);
    }
    
    if (siteSettings.site_favicon) {
        const favicon = document.getElementById('favicon');
        if (favicon) favicon.href = siteSettings.site_favicon;
    }
    
    if (siteSettings.announcement_bar) {
        const announcementBar = document.getElementById('announcementBar');
        const announcementText = document.getElementById('announcementText');
        if (announcementBar && announcementText) {
            announcementText.textContent = siteSettings.announcement_bar;
            announcementBar.classList.remove('hidden');
        }
    }
    
    // تحديث الروابط والتتبع
    if (typeof updateSocialLinks === 'function') updateSocialLinks();
    if (typeof updatePolicyLinks === 'function') updatePolicyLinks();
    if (typeof setupTrackingCodes === 'function') setupTrackingCodes();
}

function updateSocialLinks() {
    if (!siteSettings) return;
    
    // واتساب
    if (siteSettings.whatsapp_number) {
        const whatsappLink = document.getElementById('whatsappLink');
        if (whatsappLink) {
            whatsappLink.href = `https://wa.me/${siteSettings.whatsapp_number}`;
        }
    }
    
    // سناب شات
    if (siteSettings.snapchat_username) {
        const snapchatLink = document.getElementById('snapchatLink');
        if (snapchatLink) {
            snapchatLink.href = `https://snapchat.com/add/${siteSettings.snapchat_username}`;
        }
    }
    
    // تيك توك
    if (siteSettings.tiktok_username) {
        const tiktokLink = document.getElementById('tiktokLink');
        if (tiktokLink) {
            tiktokLink.href = `https://tiktok.com/${siteSettings.tiktok_username}`;
        }
    }
    
    // تويتر
    if (siteSettings.twitter_username) {
        const twitterLink = document.getElementById('twitterLink');
        if (twitterLink) {
            twitterLink.href = `https://twitter.com/${siteSettings.twitter_username}`;
        }
    }
}

function updatePolicyLinks() {
    if (!siteSettings) return;
    
    // سياسة الاسترجاع
    const refundPolicyLink = document.getElementById('refundPolicyLink');
    if (refundPolicyLink && siteSettings.refund_policy_active) {
        refundPolicyLink.href = `policy.html?type=refund`;
    }
    
    // الشروط والأحكام
    const termsLink = document.getElementById('termsLink');
    if (termsLink && siteSettings.terms_active) {
        termsLink.href = `policy.html?type=terms`;
    }
    
    // سياسة الخصوصية
    const privacyLink = document.getElementById('privacyLink');
    if (privacyLink) {
        privacyLink.href = `policy.html?type=privacy`;
    }
    
    // من نحن
    const aboutLink = document.getElementById('aboutLink');
    if (aboutLink && siteSettings.about_active) {
        aboutLink.href = `policy.html?type=about`;
    }
}

function setupTrackingCodes() {
    if (!siteSettings) return;
    
    // Google Analytics
    if (siteSettings.google_analytics_id && siteSettings.conversion_tracking) {
        const script = document.getElementById('googleAnalyticsScript');
        script.innerHTML = `
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
            ga('create', '${siteSettings.google_analytics_id}', 'auto');
            ga('send', 'pageview');
        `;
    }
    
    // Snapchat Pixel
    if (siteSettings.snapchat_pixel_id && siteSettings.conversion_tracking) {
        const script = document.getElementById('snapchatPixelScript');
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

    // حفظ المنتجات في متغير عالمي لكي تتمكن نافذة التفاصيل من الوصول إليها
    window.allProducts = products;

    container.innerHTML = products.map(product => {
        const price = formatPrice(product.price);
        const stars = generateStars(product.rating || 5);
        
        // تنظيف اسم المنتج من أي فواصل قد تكسر الكود (Escape quotes)
        const escapedName = product.name.replace(/'/g, "\\'");

        // --- إعداد شكل المنتج (صورة أو أيقونة) ---
        let imageContent = '';
        if (product.image_url) {
            imageContent = `<img src="${product.image_url}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${product.name}">`;
        } else {
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
            } else if (product.name && product.name.includes('فك حظر')) {
                iconClass = 'fas fa-unlock-alt';
                iconColor = '#9B111E';
            }

            imageContent = `
                <div class="text-center relative z-10">
                    <i class="${iconClass} text-6xl" style="color: ${iconColor}"></i>
                    <div class="mt-2 text-sm text-[#A0A0A0]">${product.category || 'باقة رقمية'}</div>
                </div>
            `;
        }

        // --- تحويل المميزات إلى قائمة (أول 3 فقط) ---
        let featuresList = '';
        if (product.features && Array.isArray(product.features)) {
            featuresList = product.features.slice(0, 3).map(feature => `
                <li class="flex items-center gap-2 text-sm text-gray-400">
                    <i class="fas fa-check text-green-500 text-xs"></i>
                    <span>${feature}</span>
                </li>
            `).join('');
        }

        return `
            <div class="product-card group flex flex-col h-full cursor-pointer transition-all duration-300 hover:border-[#FFD700]/30 border border-transparent rounded-xl overflow-hidden"
                 onclick="ironHomepage.showProductDetails('${product.id}')">

                <div class="h-56 bg-[#1A1A1A] flex items-center justify-center relative overflow-hidden rounded-t-xl">
                    ${imageContent}
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                        <span class="bg-[#FFD700] text-black px-4 py-2 rounded-full font-bold text-sm">عرض التفاصيل</span>
                    </div>
                </div>

                <div class="p-6 flex-1 flex flex-col">
                    <h3 class="font-bold text-xl mb-2 group-hover:text-[#FFD700] transition-colors">${product.name}</h3>

                    <div class="rating-stars mb-4 flex items-center">
                        <div class="text-[#FFD700] flex gap-1">${stars}</div>
                        <span class="text-xs text-[#A0A0A0] mr-2">(${product.rating || 5}.0)</span>
                    </div>

                    ${featuresList ? `<ul class="space-y-2 mb-4">${featuresList}</ul>` : ''}

                    <p class="text-[#A0A0A0] text-sm mb-4 line-clamp-2 flex-grow">
                        ${product.description || 'باقة مميزة مع مزايا متقدمة وتفعيل فوري'}
                    </p>

                    ${product.stock ? `
                        <div class="mb-5">
                            <div class="flex items-center justify-between text-xs mb-1">
                                <span class="text-gray-400">مخزون الأكواد:</span>
                                <span class="${product.stock < 5 ? 'text-red-500' : 'text-green-500'} font-bold">
                                    ${product.stock} متبقي
                                </span>
                            </div>
                            <div class="w-full bg-gray-800 rounded-full h-1.5">
                                <div class="bg-gradient-to-r from-green-600 to-green-400 h-1.5 rounded-full"
                                     style="width: ${Math.min((product.stock / 15) * 100, 100)}%"></div>
                            </div>
                        </div>
                    ` : ''}

                    <div class="mt-auto">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-baseline gap-1">
                                <span class="text-2xl font-bold text-[#FFD700]">${price}</span>
                                <span class="text-xs text-[#A0A0A0]">ر.س</span>
                            </div>
                        </div>

                        <button class="btn-primary w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transform active:scale-95 transition-transform"
                                onclick="event.stopPropagation(); ironHomepage.addToCart('${product.id}', '${escapedName}', ${product.price})">
                            <i class="fas fa-shopping-basket"></i>
                            أضف للسلة
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // إعادة تحديث عداد السلة والمستمعات
    if (typeof updateCartCount === 'function') updateCartCount();
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

function formatPrice(price) {
    if (!price && price !== 0) return '0.00';
    return (parseFloat(price) / 100).toLocaleString('ar-SA', {
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
        
        // --- [1] البانر الرئيسي (Hero Banner) بمقاس 9:16 ---
        const heroBanner = activeBanners.find(b => b.position === 'hero');
        if (heroBanner) {
            const heroContainer = document.getElementById('heroBanner');
            if (heroContainer) {
                heroContainer.innerHTML = `
                    <a href="${heroBanner.link || '#'}" ${heroBanner.link ? 'target="_blank"' : ''} 
                       style="display: block; aspect-ratio: 9 / 16; overflow: hidden; border-radius: 15px; border: 1px solid rgba(155, 17, 30, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <img src="${heroBanner.image_url}" 
                             alt="${heroBanner.alt_text || heroBanner.title}" 
                             style="width: 100%; height: 100%; object-fit: cover;"
                             onerror="this.src='assets/default-banner.jpg'">
                    </a>
                `;
            }
        }
        
        // --- [2] البانر الأوسط (Middle Banner) ---
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
        
        // --- [3] البانر السفلي (Bottom Banner) ---
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
// --- [5] الإحصائيات ---
// --- [5] الإحصائيات ---
async function loadStatistics() {
    try {
        let stats;
        
        if (window.ironPlus && window.ironPlus.getSiteStats) {
            const result = await window.ironPlus.getSiteStats();
            if (result.success) {
                stats = result.stats;
            }
        }
        
        // إذا لم توجد بيانات في قاعدة البيانات، نستخدم أرقام واقعية
        if (!stats) {
            stats = {
                uniqueCustomers: 1542,   // عدد العملاء الواثقين (واقعي)
                totalOrders: 1208,       // عدد الطلبات الناجحة (واقعي)
                averageRating: 5.0,
                supportResponseTime: '24/7'
            };
        }
        
        updateCounters(stats);
    } catch (error) {
        console.error('Error loading statistics:', error);
        updateCounters({
            uniqueCustomers: 1542,
            totalOrders: 1208,
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

// --- [5] الدوال المساعدة للإحصائيات ---
function animateCounter(element, target) {
    // 1. تنظيف النص الحالي من أي حروف أو فواصل (مثل ,) لضمان تحويله لرقم صحيح
    const currentText = element.textContent || "0";
    const current = parseInt(currentText.replace(/\D/g, '')) || 0;
    
    // 2. تحويل الرقم المستهدف (Target) لرقم صحيح
    const targetNum = parseInt(target) || 0;
    
    // إذا كان الرقم الحالي هو نفسه المستهدف، لا داعي للتكرار
    if (current === targetNum) return;

    const increment = targetNum > current ? 1 : -1;
    // حساب الخطوة (السرعة) بناءً على حجم الرقم ليكون التحرك سلساً
    const step = Math.ceil(Math.abs(targetNum - current) / 100); 
    
    let currentValue = current;
    
    const timer = setInterval(() => {
        currentValue += increment * step;
        
        // التوقف عند الوصول للرقم المستهدف أو تجاوزه
        if ((increment > 0 && currentValue >= targetNum) || 
            (increment < 0 && currentValue <= targetNum)) {
            currentValue = targetNum;
            clearInterval(timer);
        }
        
        // عرض الرقم بتنسيق إنجليزي (يضيف الفواصل تلقائياً للأرقام الكبيرة)
        element.textContent = currentValue.toLocaleString('en-US');
    }, 20);
}

// --- [6] إعداد مستمعي الأحداث ---
// --- [6] إعداد مستمعي الأحداث ---
function setupEventListeners() {
    // 1. القائمة الجانبية للجوال (Mobile Menu)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden'; // منع التمرير خلف القائمة
        });
    }
    
    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = ''; // إعادة التمرير للوضع الطبيعي
        });
    }
    
    // 2. نظام الأكورديون للأسئلة الشائعة (FAQ)
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('i');
            
            // إغلاق باقي الأسئلة المفتوحة (عشان يفتح واحد بس في كل مرة)
            document.querySelectorAll('.accordion-content').forEach(item => {
                if (item !== content && item.classList.contains('active')) {
                    item.classList.remove('active');
                    // تغيير أيقونة السؤال اللي تقفل
                    const otherIcon = item.previousElementSibling.querySelector('i');
                    if (otherIcon) {
                        otherIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                    }
                }
            });
            
            // تبديل حالة السؤال الحالي (فتح أو إغلاق)
            const isActive = content.classList.toggle('active');
            
            // تغيير الأيقونة بناءً على الحالة الجديدة
            if (icon) {
                if (isActive) {
                    icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                } else {
                    icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                }
            }
        });
    });
}

// تحديث عداد السلة في الهيدر
function updateCartCount() {
    try {
        const cartCount = document.getElementById('cartCount');
        if (!cartCount) return;
        
        const cart = JSON.parse(localStorage.getItem('iron_cart')) || [];
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        
        cartCount.textContent = totalItems;
        
        if (totalItems > 0) {
            cartCount.style.display = 'flex';
            
            // إضافة تأثير حركي عند زيادة العدد
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

// --- [7] تأثيرات التمرير ونظام التنقل ---
function setupScrollEffects() {
    const nav = document.querySelector('.nav-container');
    let lastScroll = 0;
    
    if (nav) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                nav.classList.add('scrolled'); // إضافة خلفية عند التمرير
                
                // إخفاء الشريط عند التمرير للأسفل وإظهاره عند التمرير للأعلى
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
    
    // تمرير سلس عند الضغط على روابط القائمة
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // تعويض ارتفاع الهيدر
                    behavior: 'smooth'
                });
            }
        });
    });
}
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

// --- [8] تسجيل الزيارة ---
async function recordVisit() {
    try {
        if (window.ironPlus && window.ironPlus.recordVisit) {
            await window.ironPlus.recordVisit('index.html');
        }
    } catch (error) {
        console.error('Error recording visit:', error);
    }
}

// --- [9] نظام الإشعارات الحية (طلبات حقيقية فقط) ---
function setupLiveNotifications() {
    // التحقق من تفعيل الإشعارات ومن تفعيل الإشعارات الحقيقية حصراً
    if (!siteSettings || !siteSettings.live_notifications || !siteSettings.real_order_notifications) {
        console.log("إشعارات الطلبات الحقيقية معطلة من الإعدادات.");
        return;
    }
    
    clearInterval(liveNotificationsInterval);
    
    // عرض أول إشعار حقيقي بعد 5 ثواني من فتح الموقع (إذا وجد)
    setTimeout(() => {
        if (window.ironPlus) {
            showRealOrderNotification();
        }
    }, 5000);
    
    // محاولة جلب طلبات حقيقية كل 40 إلى 60 ثانية (توقيت واقعي لتجنب شكوك جوجل)
    liveNotificationsInterval = setInterval(() => {
        if (window.ironPlus) {
            showRealOrderNotification();
        }
    }, 40000 + Math.random() * 20000);
}

async function showRealOrderNotification() {
    try {
        if (!window.ironPlus || !window.ironPlus.getRecentActivity) return;

        const res = await window.ironPlus.getRecentActivity(10);
        if (res.success && res.activities.length > 0) {
            // تصفية النشاطات لتشمل فقط العناوين التي تحتوي على كلمة "طلب" (طلبات حقيقية)
            const orderActivities = res.activities.filter(a => a.title.includes('طلب'));
            
            if (orderActivities.length > 0) {
                // اختيار طلب واحد عشوائي من آخر الطلبات الحقيقية
                const randomActivity = orderActivities[Math.floor(Math.random() * orderActivities.length)];
                
                const notification = document.getElementById('liveNotification');
                const notifTitle = document.getElementById('notifTitle');
                const notifText = document.getElementById('notifText');
                
                if (notification && notifTitle && notifText) {
                    notifTitle.textContent = randomActivity.title;
                    
                    let description = randomActivity.description || "اشترى باقة جديدة الآن";
                    
                    // تنسيق الرقم للخصوصية (مثال: 055****123)
                    const phoneRegex = /05\d{8}/;
                    const match = description.match(phoneRegex);
                    if (match) {
                        const fullPhone = match[0];
                        const maskedPhone = fullPhone.substring(0, 3) + "****" + fullPhone.slice(-3);
                        description = description.replace(fullPhone, maskedPhone);
                    }
                    
                    notifText.textContent = description;
                    notification.classList.remove('hidden');
                    
                    // إخفاء الإشعار بعد المدة المحددة (أو 8 ثواني كافتراضي)
                    setTimeout(() => {
                        notification.classList.add('hidden');
                    }, (siteSettings.notification_duration || 8) * 1000);
                }
            }
            // ملاحظة: إذا لم توجد طلبات حقيقية، لن يظهر أي شيء (تم حذف الـ fallback)
        }
    } catch (error) {
        console.error('Error fetching real orders:', error);
    }
}

// دالة إغلاق الإشعار يدوياً
window.closeNotification = function() {
    const notification = document.getElementById('liveNotification');
    if (notification) {
        notification.classList.add('hidden');
    }
};

// --- [10] دوال مساعدة ---
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
        case 'success': icon = 'fa-check-circle'; break;
        case 'error': icon = 'fa-times-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        default: icon = 'fa-info-circle';
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
            if (notification.parentNode) notification.remove();
        }, duration);
    }
}

// --- [11] تهيئة النظام الكاملة ---
document.addEventListener('DOMContentLoaded', function() {
    // ملاحظة: تأكد أن setupEventListeners() مستدعاة في مكان واحد فقط لتجنب تكرار الأحداث
    if (typeof setupEventListeners === 'function') {
        setupEventListeners();
    }

    setTimeout(async () => {
        await checkUserStatus();
        await loadProducts();
        await loadStatistics();
        await recordVisit();
        updateCartCount();
        setupLiveNotifications(); // تشغيل نظام الإشعارات الجديد
    }, 100);
});
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
// --- [10] دوال مساعدة ---
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
// --- [11] تهيئة النظام الكاملة ---
// --- [11] تهيئة النظام الكاملة ---
document.addEventListener('DOMContentLoaded', function() {

    setTimeout(async () => {
        await checkUserStatus();
        await loadProducts();
        await loadStatistics();
        await recordVisit();
        updateCartCount();
    }, 100);
});

// --- [12] دوال النافذة المنبثقة (Modal) لتفاصيل المنتج ---
// --- [1] بيانات الأسئلة المؤقتة (إملاء احترافي واقعي) ---
const MOCK_QUESTIONS = {
    // أسئلة خاصة بمنتجات سناب بلس
    'snap': [
        { q: "هل الاشتراك آمن من الحظر؟", a: "نعم، النسخة مطورة بأكواد حماية قوية جداً وضد الحظر، وننصح دائماً باتباع تعليمات التثبيت لضمان استقرار حسابك." },
        { q: "هل أحتاج لحذف التطبيق الأصلي؟", a: "نعم، لضمان عمل سناب بلس بدون تعارض، يجب حذف التطبيق الأصلي قبل البدء في تثبيت النسخة المطورة." },
        { q: "هل يظهر للآخرين إني أصور الشاشة أو أحفظ؟", a: "لا، النسخة تدعم تصوير الشاشة وحفظ السنابات والدردشات بدون علم الطرف الآخر تماماً." }
    ],
    
    // أسئلة خاصة ببرامج بلس الأخرى
    'apps': [
        { q: "متى يتم تفعيل الاشتراك بعد الدفع؟", a: "التفعيل فوري وتلقائي! بمجرد إتمام الدفع، سيظهر لك كود التفعيل مباشرة في صفحة 'طلباتي' وتوصلك رسالة نصية." },
        { q: "هل الاشتراك لجهاز واحد فقط؟", a: "الاشتراك يرتبط بجهازك (UDID)، وبمجرد التفعيل تقدر تحمل كل برامج بلس المتاحة لجهازك طوال فترة الاشتراك." },
        { q: "لو واجهت مشكلة في التثبيت وش أسوي؟", a: "دعمنا الفني معك 24/7! تواصل معنا عبر الواتساب وبنحل لك أي مشكلة تواجهك في ثواني." }
    ]
};

// --- [2] دالة فتح النافذة وتعبئة بيانات المنتج المختار ---
window.showProductDetails = function(productId) {
    const product = window.allProducts?.find(p => p.id === productId);
    if (!product) return;

    // 1. تعبئة النصوص الأساسية
    const modalName = document.getElementById('modalName');
    const modalDesc = document.getElementById('modalDescription');
    const modalPrice = document.getElementById('modalPrice');
    const modalCategory = document.getElementById('modalCategory');
    const modalRating = document.getElementById('modalRating');

    if (modalName) modalName.textContent = product.name;
    if (modalDesc) modalDesc.textContent = product.description || 'باقة مميزة مع تفعيل فوري وضمان الاستقرار.';
    if (modalPrice) modalPrice.textContent = (product.price / 100).toFixed(2);
    
    // تحديد الفئة للعرض
    const isSnap = product.category === 'snap' || product.name.includes('سناب');
    if (modalCategory) modalCategory.textContent = isSnap ? 'باقة سناب بلس' : 'باقة برامج بلس';
    if (modalRating) modalRating.textContent = `(${product.rating || 5}.0)`;

    // 2. تعبئة الصورة
    const imgContainer = document.getElementById('modalImageContainer');
    if (imgContainer) {
        imgContainer.innerHTML = product.image_url 
            ? `<img src="${product.image_url}" class="max-w-full max-h-full object-contain p-4" alt="${product.name}">`
            : `<i class="fas fa-box text-7xl text-[#9B111E]"></i>`;
    }

    // 3. تعبئة النجوم والمميزات
    const modalStars = document.getElementById('modalStars');
    if (modalStars) modalStars.innerHTML = generateStars(product.rating || 5);

    const featuresList = document.getElementById('modalFeatures');
    if (featuresList) {
        const features = product.features && Array.isArray(product.features) ? product.features : ['تفعيل فوري', 'ضمان كامل', 'دعم فني 24/7'];
        featuresList.innerHTML = features.map(f => 
            `<li class="flex items-center gap-3">
                <i class="fas fa-check-circle text-[#FFD700]"></i>
                <span>${f}</span>
            </li>`
        ).join('');
    }

    // --- [إضافة جديدة] تعبئة الأسئلة الشائعة بناءً على نوع المنتج ---
    const questionsContainer = document.getElementById('questionsContainer');
    if (questionsContainer) {
        const questions = isSnap ? MOCK_QUESTIONS.snap : MOCK_QUESTIONS.apps;
        questionsContainer.innerHTML = questions.map(item => `
            <div class="bg-[#111] p-4 rounded-xl border-r-4 border-[#FFD700]">
                <p class="text-white text-sm font-bold mb-2">س: ${item.q}</p>
                <p class="text-[#A0A0A0] text-sm italic">ج: ${item.a}</p>
            </div>
        `).join('');
    }

    // 4. برمجة زر الإضافة داخل النافذة
    const modalAddBtn = document.getElementById('modalAddBtn');
    if (modalAddBtn) {
        modalAddBtn.onclick = async (e) => {
            e.stopPropagation();
            await ironHomepage.addToCart(product.id, product.name, product.price);
            closeProductModal();
        };
    }

    // 5. إظهار النافذة وتغيير حالة التمرير
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
};

// --- [3] دالة إغلاق النافذة ---
window.closeProductModal = function() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }
};

// إغلاق النافذة عند الضغط خارج الإطار أو زر Esc
window.addEventListener('click', (e) => {
    const modal = document.getElementById('productModal');
    if (e.target === modal) closeProductModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
});

// تصدير الوظائف للاستخدام العام
window.ironHomepage = {
    ...window.ironHomepage, // الحفاظ على الوظائف السابقة
    closeProductModal,
    showProductDetails
};

console.log('🦾 IRON+ FAQ & Modal System: Fully Loaded!');
