// js/admin.js

// 1. التحقق من دخول المشرف
function checkAdmin() {
    const pass = document.getElementById('adminPass').value;
    // تقدر تغير "123456" للباسورد اللي تبي
    if (pass === '123456') { 
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadAdminProducts();
        loadOrders();
    } else {
        alert('شفرة الدخول خاطئة!');
    }
}

// 2. تحميل المنتجات لتعديل الأسعار
async function loadAdminProducts() {
    const { data: products } = await supabase.from('products').select('*');
    const container = document.getElementById('adminProductsList');
    const select = document.getElementById('codeProductSelect');
    
    container.innerHTML = '';
    select.innerHTML = '<option value="">اختر منتجاً لرفع الأكواد</option>';

    products.forEach(p => {
        // عرض في قائمة التعديل
        container.innerHTML += `
            <div class="admin-product-item hud-card" style="margin-bottom: 10px;">
                <span class="tech-font">${p.name}</span>
                <div style="display:flex; gap:10px; align-items:center;">
                    <input type="number" id="price-${p.id}" value="${p.price / 100}" class="price-input-small">
                    <button onclick="updateProductPrice('${p.id}')" class="btn-iron" style="padding: 5px 15px;">تحديث</button>
                </div>
            </div>
        `;
        // إضافة للقائمة المنسدلة للأكواد
        select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
}

// 3. تحديث السعر في قاعدة البيانات (الإدارة بدون كود)
async function updateProductPrice(id) {
    const newPrice = document.getElementById(`price-${id}`).value;
    const { error } = await supabase
        .from('products')
        .update({ price: newPrice * 100 }) // نضرب في 100 عشان نحولها لهللات
        .eq('id', id);

    if (!error) alert('تم تحديث السعر عالمياً بنجاح! ✅');
    else alert('فشل التحديث، تأكد من الصلاحيات.');
}

// 4. رفع الأكواد بالجملة
async function uploadBulkCodes() {
    const productId = document.getElementById('codeProductSelect').value;
    const rawCodes = document.getElementById('bulkCodes').value;
    
    if (!productId || !rawCodes) return alert('اختر المنتج وحط الأكواد!');

    const codesArray = rawCodes.split('\n').filter(c => c.trim() !== "").map(c => ({
        product_id: productId,
        code: c.trim(),
        is_used: false
    }));

    const { error } = await supabase.from('activation_codes').insert(codesArray);

    if (!error) {
        alert(`تم رفع ${codesArray.length} كود بنجاح للمخزن! 🚀`);
        document.getElementById('bulkCodes').value = '';
    } else {
        alert('خطأ في الرفع: ' + error.message);
    }
}

// 5. سجل الطلبات
async function loadOrders() {
    const { data: orders } = await supabase
        .from('orders')
        .select('*, products(name)')
        .order('created_at', { ascending: false });

    const tbody = document.getElementById('ordersLog');
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td>${o.customer_phone}</td>
            <td>${o.products?.name}</td>
            <td>${o.amount / 100} ريال</td>
            <td class="text-glow-blue">${o.status}</td>
            <td><button onclick="window.open('https://wa.me/${o.customer_phone}')" class="btn-iron" style="padding:2px 10px"><i class="fab fa-whatsapp"></i></button></td>
        </tr>
    `).join('');
}
