// js/index.js
document.addEventListener('DOMContentLoaded', async () => {
    const productsGrid = document.getElementById('productsGrid');
    
    // جلب المنتجات من القاعدة (التحكم بالسعر يتم من هنا تلقائياً)
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        productsGrid.innerHTML = `<p class="text-glow-red">خطأ في الاتصال بالأنظمة الرقمية..</p>`;
        return;
    }

    productsGrid.innerHTML = ''; // مسح علامة التحميل
    
    products.forEach(product => {
        const card = `
            <div class="product-card hud-effect">
                <img src="${product.image_url || 'assets/images/default.jpg'}" alt="${product.name}">
                <h3 class="tech-font">${product.name}</h3>
                <div class="price-tag">${window.ironFormat(product.price)} <span>ريال</span></div>
                <button onclick="startPurchase('${product.id}', ${product.price})" class="btn-iron w-full">
                    <i class="fas fa-bolt"></i> شراء الآن
                </button>
            </div>
        `;
        productsGrid.innerHTML += card;
    });
});

function startPurchase(id, price) {
    sessionStorage.setItem('selectedProductId', id);
    sessionStorage.setItem('selectedPrice', price);
    window.location.href = 'rer.html';
}
