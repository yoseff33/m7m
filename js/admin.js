// js/admin.js
async function checkAdmin() {
    const pass = document.getElementById('adminPass').value;
    // الباسورد الافتراضي (تقدر تغيره)
    if (pass === '123456') {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadAdminPanel();
    } else {
        alert('وصول غير مصرح به! توني ستارك يراقبك.');
    }
}

async function loadAdminPanel() {
    loadProducts();
    loadOrders();
}

// تحميل المنتجات لتغيير السعر
async function loadProducts() {
    const { data: products } = await supabaseClient.from('products').select('*');
    const container = document.getElementById('adminProductsList');
    const select = document.getElementById('codeProductSelect');
    
    container.innerHTML = '';
    select.innerHTML = '<option value="">اختر المنتج لرفع الكود</option>';

    products.forEach(p => {
        container.innerHTML += `
            <div class="admin-product-item hud-card">
                <span class="tech-font">${p.name}</span>
                <div>
                    <input type="number" id="p-${p.id}" value="${p.price/100}" class="price-input-small">
                    <button onclick="updatePrice('${p.id}')" class="btn-iron" style="padding:5px">تعديل السعر</button>
                </div>
            </div>
        `;
        select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
}

// تحديث السعر في القاعدة فوراً
async function updatePrice(id) {
    const newPrice = document.getElementById(`p-${id}`).value;
    const { error } = await supabaseClient
        .from('products')
        .update({ price: newPrice * 100 })
        .eq('id', id);

    if (!error) alert('تم تحديث السعر عالمياً! ✅');
}

// رفع الأكواد بالجملة
async function uploadBulkCodes() {
    const pId = document.getElementById('codeProductSelect').value;
    const codes = document.getElementById('bulkCodes').value.split('\n').filter(c => c.trim() !== "");
    
    if (!pId || codes.length === 0) return alert('كمل البيانات يا بطل');

    const dataToInsert = codes.map(c => ({ product_id: pId, code: c.trim() }));
    const { error } = await supabaseClient.from('activation_codes').insert(dataToInsert);

    if (!error) {
        alert(`تم شحن ${codes.length} كود بنجاح! 🚀`);
        document.getElementById('bulkCodes').value = '';
    }
}

async function loadOrders() {
    const { data: orders } = await supabaseClient.from('orders').select('*, products(name)').order('created_at', {ascending: false});
    const log = document.getElementById('ordersLog');
    log.innerHTML = orders.map(o => `
        <tr>
            <td>${o.customer_phone}</td>
            <td>${o.products?.name}</td>
            <td>${window.ironFormat(o.amount)} ريال</td>
            <td>${o.status}</td>
            <td><button onclick="window.open('https://wa.me/${o.customer_phone}')" class="btn-iron" style="padding:2px 10px"><i class="fab fa-whatsapp"></i></button></td>
        </tr>
    `).join('');
}
