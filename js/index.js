/**
 * Iron Plus - Core Engine v2.0
 * منطق الصفحة الرئيسية وتفاعلات العميل بالكامل
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log("جارٍ تشغيل أنظمة Iron Plus... 🦾");

    // 1. نظام التحليلات والزوار
    try {
        await incrementVisitor();
        await updateVisitorCount();
    } catch (e) { console.log("Visitor system pending..."); }
    
    // 2. تحميل وعرض المنتجات ديناميكياً
    await loadProducts();
    
    // 3. تحديث واجهة المستخدم بناءً على تسجيل الدخول
    checkUserLogin();
    
    // 4. إعداد التفاعلات الإضافية
    setupEventListeners();
});

// --- أولاً: أنظمة الزوار ---

async function incrementVisitor() {
    try {
        const today = new Date().toISOString().split('T')[0];
        // استدعاء Edge Function لزيادة العداد في قاعدة البيانات
        await fetch(`${SUPABASE_URL}/functions/v1/increment-visitor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: today })
        });
    } catch (error) {
        console.error('Visitor increment failed:', error);
    }
}

async function updateVisitorCount() {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-visitors`);
        const data = await response.json();
        if (data.success && document.getElementById('visitorCount')) {
            document.getElementById('visitorCount').textContent = data.total;
        }
    } catch (error) {
        if(document.getElementById('visitorCount')) 
            document.getElementById('visitorCount').textContent = "99+";
    }
}

// --- ثانياً: إدارة المنتجات والعرض ---

async function loadProducts() {
    const container = document.getElementById('productsContainer');
    try {
        // نستخدم الوظيفة المعرفة في supabase-config.js
        const result = await window.ironPlus.getProducts();
        
        if (result.success && result.products) {
            displayProducts(result.products);
        } else {
            showError(result.message || 'فشل في جلب البيانات من السيرفر');
        }
    } catch (error) {
        console.error('Load Products Error:', error);
        showError('تعذر الاتصال بقاعدة البيانات المركزية');
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    const loader = document.getElementById('loadingMessage');
    
    if (loader) loader.style.display = 'none';
    if (!container) return;

    container.innerHTML = '';
    
    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'iron-card hud-effect';
    
    // السعر مخزن بالهللة، نحوله لريال
    const priceRIYAL = (product.price / 100).toFixed(0);

    card.innerHTML = `
        <div class="product-card">
            <div class="product-img-container">
                ${product.image_url ? 
                    `<img src="${product.image_url}" alt="${product.name}" class="product-image">` : 
                    '<div class="product-image-placeholder"><i class="fas fa-box-open"></i></div>'
                }
            </div>
            
            <div class="product-content">
                <h3 class="product-name text-glow-gold tech-font">${product.name}</h3>
                <p class="product-description">${product.description || 'لا يوجد وصف متاح'}</p>
                
                ${product.features && product.features.length > 0 ? `
                    <ul class="product-features">
                        ${product.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
                    </ul>
                ` : ''}
                
                <div class="product-footer">
                    <div class="product-price">
                        <span class="price-amount text-glow-red">${priceRIYAL} ر.س</span>
                        ${product.duration ? `<span class="price-duration">/ ${product.duration}</span>` : ''}
                    </div>
                    
                    <button onclick="buyProduct('${product.id}')" class="btn-iron">
                        <i class="fas fa-bolt"></i> شراء الآن
                    </button>
                </div>
            </div>
        </div>
    `;
    return card;
}

// --- ثالثاً: نظام الشراء والربط مع Paylink ---

async function buyProduct(productId) {
    // التأكد من تسجيل الدخول
    const isLoggedIn = window.ironPlus.isLoggedIn();
    
    if (!isLoggedIn) {
        // حفظ المنتج في الذاكرة لتسهيل العودة بعد تسجيل الدخول
        localStorage.setItem('pending_product', productId);
        showMessage('يجب تسجيل الدخول لإتمام العملية', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }
    
    try {
        const phone = localStorage.getItem('iron_user_phone');
        showMessage('جاري تحضير بوابة الدفع الآمنة...', 'success');

        // جلب السعر الفعلي من القاعدة لضمان الدقة
        const { data: product } = await supabaseClient
            .from('products')
            .select('price')
            .eq('id', productId)
            .single();

        // إنشاء رابط الدفع عبر Paylink
        const result = await window.ironPlus.createPayment(productId, phone, product.price);
        
        if (result.success && result.data.url) {
            window.location.href = result.data.url; 
        } else {
            showMessage(result.message || 'خطأ في إنشاء الفاتورة', 'error');
        }
    } catch (error) {
        console.error('Purchase process failed:', error);
        showMessage('فشل نظام الدفع، حاول لاحقاً', 'error');
    }
}

// --- رابعاً: إدارة الواجهة والرسائل ---

function checkUserLogin() {
    const isLoggedIn = window.ironPlus.isLoggedIn();
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginButton');
    
    if (isLoggedIn) {
        const phone = localStorage.getItem('iron_user_phone');
        const display = document.getElementById('userPhone');
        if (display) display.textContent = phone;
        if (userInfo) userInfo.style.display = 'flex';
        if (loginBtn) loginBtn.style.display = 'none';
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'block';
    }
}

function showMessage(text, type) {
    let msgDiv = document.getElementById('statusMsg');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'statusMsg';
        msgDiv.className = 'status-toast hud-effect';
        document.body.appendChild(msgDiv);
    }
    
    msgDiv.textContent = text;
    msgDiv.style.display = 'block';
    msgDiv.style.borderRight = `4px solid ${type === 'success' ? '#2ecc71' : 'var(--iron-red)'}`;
    
    setTimeout(() => { msgDiv.style.display = 'none'; }, 4000);
}

function showError(text) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    container.innerHTML = `
        <div class="hud-effect" style="padding:50px; text-align:center; width:100%; grid-column: 1/-1;">
            <i class="fas fa-exclamation-triangle" style="font-size:40px; color:var(--iron-red);"></i>
            <h3 class="text-glow-gold" style="margin-top:15px;">خطأ في الاتصال بالشبكة</h3>
            <p>${text}</p>
            <button onclick="location.reload()" class="btn-iron" style="margin-top:20px;">إعادة فحص الأنظمة</button>
        </div>
    `;
}

function setupEventListeners() {
    // أي تفاعلات إضافية (مثل إغلاق القوائم أو البحث)
    console.log("Systems ready, Tony.");
}

// جعل الدوال متاحة للـ HTML (onclick)
window.buyProduct = buyProduct;
window.logout = () => {
    if(confirm('هل تريد تسجيل الخروج وفصل الجلسة؟')) {
        window.ironPlus.logout();
    }
};
