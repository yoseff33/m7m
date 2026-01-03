// js/index.js
document.addEventListener('DOMContentLoaded', async () => {
    const productsGrid = document.getElementById('productsGrid');
    
    // 1. جلب المنتجات النشطة من Supabase
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        productsGrid.innerHTML = `<p class="text-glow-red">فشل في تحميل الأنظمة..</p>`;
        return;
    }

    // 2. عرض المنتجات في الصفحة
    productsGrid.innerHTML = ''; // مسح اللودر
    products.forEach(product => {
        const card = `
            <div class="product-card hud-effect">
                <img src="${product.image_url || 'https://via.placeholder.com/300'}" alt="${product.name}">
                <h3 class="tech-font">${product.name}</h3>
                <div class="price-tag">${window.ironHelper.formatPrice(product.price)} <span>ريال</span></div>
                <button onclick="handlePurchase('${product.id}', ${product.price}, '${product.name}')" class="btn-iron w-full">
                    <i class="fas fa-shopping-cart"></i> شراء الآن
                </button>
            </div>
        `;
        productsGrid.innerHTML += card;
    });
});

// دالة الضغط على الشراء
function handlePurchase(id, price, name) {
    window.ironHelper.saveToSession({ id, price, name });
    window.location.href = 'rer.html'; // التوجه لصفحة الدفع
}
