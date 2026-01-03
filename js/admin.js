// في بداية admin.js
const ADMIN_ALLOWED_IPS = ['123.456.789.0']; // ضع IPs مصرح بها

async function checkIPAccess() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        
        if (!ADMIN_ALLOWED_IPS.includes(data.ip)) {
            localStorage.removeItem('iron_admin');
            alert('غير مصرح لك بالوصول');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('IP Check Error:', error);
    }
}

// استدعاء في تحقق المشرف
if (isAdminLoggedIn()) {
    checkIPAccess();
}
<td>
                    ${order.products ? order.products.name : 'N/A'}
                </td>
                <td>
                    <strong class="text-gold">${(order.amount / 100).toFixed(2)} ر.س</strong>
                </td>
                <td>
                    <span class="status-badge">
                        ${getStatusText(order.status)}
                    </span>
                </td>
                <td>
                    ${new Date(order.created_at).toLocaleDateString('ar-SA')}
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewOrderDetails('${order.id}')" class="btn-action btn-view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="contactCustomer('${order.customer_phone}')" class="btn-action" style="background: linear-gradient(45deg, #25D366, #128C7E); color: white;">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        ${order.status === 'pending' ? 
                            `<button onclick="updateOrderStatus('${order.id}', 'completed')" class="btn-action" style="background: linear-gradient(45deg, #2ecc71, #27ae60); color: white;">
                                تأكيد
                            </button>` : ''
                        }
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading orders table:', error);
        showMessage('حدث خطأ في تحميل الطلبات', 'error');
    }
}

// دالة لتحويل حالة الطلب إلى نص عربي
function getStatusText(status) {
    const statusMap = {
        'pending': 'معلق',
        'paid': 'مدفوع',
        'completed': 'مكتمل',
        'failed': 'فاشل'
    };
    return statusMap[status] || status;
}

// تحميل قائمة المنتجات في select الأكواد
async function loadProductSelect() {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('id, name')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById('productForCodes');
        select.innerHTML = '<option value="">اختر منتجاً</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading products select:', error);
    }
}

// رفع الأكواد بالجملة
async function uploadCodes() {
    const productId = document.getElementById('productForCodes').value;
    const codesText = document.getElementById('bulkCodesText').value;
    
    if (!productId || !codesText) {
        showMessage('يرجى اختيار منتج وإدخال الأكواد', 'error');
        return;
    }
    
    const codesArray = codesText.split('\n')
        .map(code => code.trim())
        .filter(code => code.length > 0);
    
    if (codesArray.length === 0) {
        showMessage('لم يتم إدخال أي أكواد', 'error');
        return;
    }
    
    try {
        // تحويل الأكواد إلى صيغة للادخال في قاعدة البيانات
        const codesToInsert = codesArray.map(code => ({
            product_id: productId,
            code: code,
            is_used: false
        }));
        
        const { data, error } = await supabaseClient
            .from('activation_codes')
            .insert(codesToInsert);
        
        if (error) throw error;
        
        showMessage(`تم رفع ${codesArray.length} كود بنجاح`, 'success');
        document.getElementById('bulkCodesText').value = '';
        
        // تحديث الإحصائيات
        loadStatistics();
        
    } catch (error) {
        console.error('Error uploading codes:', error);
        showMessage('حدث خطأ في رفع الأكواد', 'error');
    }
}

// عرض تفاصيل الطلب
async function viewOrderDetails(orderId) {
    try {
        const { data: order, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                products (*),
                activation_codes (code)
            `)
            .eq('id', orderId)
            .single();
        
        if (error) throw error;
        
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = `تفاصيل الطلب #${order.id.substring(0, 8)}`;
        
        modalContent.innerHTML = `
            <div class="order-details" style="margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div>
                        <strong class="text-gold">العميل:</strong><br>
                        ${order.customer_name || 'غير محدد'}<br>
                        ${order.customer_phone}
                    </div>
                    <div>
                        <strong class="text-gold">الحالة:</strong><br>
                        <span class="status-badge">${getStatusText(order.status)}</span>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong class="text-gold">المنتج:</strong><br>
                    ${order.products ? order.products.name : 'غير محدد'}
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong class="text-gold">المبلغ:</strong><br>
                    ${(order.amount / 100).toFixed(2)} ر.س
                </div>
                
                ${order.activation_codes && order.activation_codes.length > 0 ? `
                    <div style="margin-bottom: 15px;">
                        <strong class="text-gold">كود التفعيل:</strong><br>
                        <code style="background: rgba(0, 255, 255, 0.1); padding: 10px; border-radius: 6px; display: inline-block; margin-top: 5px; color: var(--tech-blue);">
                            ${order.activation_codes[0].code}
                        </code>
                    </div>
                ` : ''}
                
                <div style="margin-bottom: 15px;">
                    <strong class="text-gold">تاريخ الطلب:</strong><br>
                    ${new Date(order.created_at).toLocaleString('ar-SA')}
                </div>
                
                ${order.notes ? `
                    <div style="margin-bottom: 15px;">
                        <strong class="text-gold">ملاحظات:</strong><br>
                        ${order.notes}
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('productModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error viewing order details:', error);
        showMessage('حدث خطأ في تحميل تفاصيل الطلب', 'error');
    }
}

// التواصل مع العميل عبر واتساب
function contactCustomer(phone) {
    const whatsappUrl = `https://wa.me/966${phone.substring(1)}`;
    window.open(whatsappUrl, '_blank');
}

// تحديث حالة الطلب
async function updateOrderStatus(orderId, status) {
    try {
        const { error } = await supabaseClient
            .from('orders')
            .update({ status: status })
            .eq('id', orderId);
        
        if (error) throw error;
        
        showMessage('تم تحديث حالة الطلب بنجاح', 'success');
        
        // إعادة تحميل جدول الطلبات
        loadOrdersTable();
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showMessage('حدث خطأ في تحديث حالة الطلب', 'error');
    }
}

// إضافة منتج جديد
function showAddProductModal() {
    const modalTitle = document.getElementById('modalTitle');
    const productForm = document.getElementById('productForm');
    
    modalTitle.textContent = 'إضافة منتج جديد';
    productForm.reset();
    document.getElementById('productId').value = '';
    
    document.getElementById('productModal').style.display = 'flex';
}

// تحرير منتج
async function editProduct(productId) {
    try {
        const { data: product, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        const modalTitle = document.getElementById('modalTitle');
        const productForm = document.getElementById('productForm');
        
        modalTitle.textContent = 'تعديل المنتج';
        
        // تعبئة الحقول
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = (product.price / 100).toFixed(2);
        document.getElementById('productDuration').value = product.duration || '';
        document.getElementById('productImage').value = product.image_url || '';
        document.getElementById('productFeatures').value = product.features ? product.features.join('\n') : '';
        
        document.getElementById('productModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error editing product:', error);
        showMessage('حدث خطأ في تحميل بيانات المنتج', 'error');
    }
}

// حذف منتج
async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        showMessage('تم حذف المنتج بنجاح', 'success');
        
        // إعادة تحميل الجدول
        loadProductsTable();
        loadStatistics();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('حدث خطأ في حذف المنتج', 'error');
    }
}

// عرض تفاصيل المنتج
async function viewProduct(productId) {
    try {
        const { data: product, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = product.name;
        
        modalContent.innerHTML = `
            <div class="product-details" style="margin-bottom: 20px;">
                <div style="margin-bottom: 15px;">
                    <strong class="text-gold">الوصف:</strong><br>
                    ${product.description || 'لا يوجد وصف'}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div>
                        <strong class="text-gold">السعر:</strong><br>
                        ${(product.price / 100).toFixed(2)} ر.س
                    </div>
                    <div>
                        <strong class="text-gold">المدة:</strong><br>
                        ${product.duration || 'غير محدد'}
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong class="text-gold">المميزات:</strong><br>
                    ${product.features && product.features.length > 0 ? 
                        `<ul style="padding-right: 20px; margin-top: 10px;">
                            ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>` : 
                        'لا توجد مميزات'
                    }
                </div>
                
                ${product.image_url ? `
                    <div style="margin-bottom: 15px;">
                        <strong class="text-gold">الصورة:</strong><br>
                        <img src="${product.image_url}" alt="${product.name}" style="max-width: 200px; border-radius: 8px; margin-top: 10px;">
                    </div>
                ` : ''}
                
                <div style="margin-bottom: 15px;">
                    <strong class="text-gold">الحالة:</strong><br>
                    <span class="status-badge ${product.is_active ? 'status-active' : 'status-inactive'}">
                        ${product.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong class="text-gold">تاريخ الإضافة:</strong><br>
                    ${new Date(product.created_at).toLocaleDateString('ar-SA')}
                </div>
            </div>
        `;
        
        document.getElementById('productModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error viewing product:', error);
        showMessage('حدث خطأ في تحميل بيانات المنتج', 'error');
    }
}

// حفظ المنتج (إضافة/تعديل)
document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value) * 100; // تحويل لسنت
    const duration = document.getElementById('productDuration').value;
    const image_url = document.getElementById('productImage').value;
    const featuresText = document.getElementById('productFeatures').value;
    
    if (!name || !price) {
        showMessage('يرجى ملء الحقول المطلوبة', 'error');
        return;
    }
    
    const features = featuresText.split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);
    
    const productData = {
        name,
        description,
        price,
        duration,
        image_url,
        features,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        
        if (productId) {
            // تحديث المنتج
            const { data, error } = await supabaseClient
                .from('products')
                .update(productData)
                .eq('id', productId)
                .select();
            
            if (error) throw error;
            result = data;
        } else {
            // إضافة منتج جديد
            const { data, error } = await supabaseClient
                .from('products')
                .insert([productData])
                .select();
            
            if (error) throw error;
            result = data;
        }
        
        showMessage(`تم ${productId ? 'تعديل' : 'إضافة'} المنتج بنجاح`, 'success');
        
        // إغلاق المشفر
        closeModal();
        
        // إعادة تحميل البيانات
        loadProductsTable();
        loadProductSelect();
        loadStatistics();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showMessage('حدث خطأ في حفظ المنتج', 'error');
    }
});

// تصدير البيانات
async function exportData() {
    try {
        const [products, orders, codes] = await Promise.all([
            supabaseClient.from('products').select('*'),
            supabaseClient.from('orders').select('*'),
            supabaseClient.from('activation_codes').select('*')
        ]);
        
        const data = {
            products: products.data,
            orders: orders.data,
            activation_codes: codes.data,
            exported_at: new Date().toISOString()
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `iron-plus-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('تم تصدير البيانات بنجاح', 'success');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showMessage('حدث خطأ في تصدير البيانات', 'error');
    }
}

// تصفية الطلبات
async function filterOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    const date = document.getElementById('orderDateFilter').value;
    const phone = document.getElementById('orderPhoneFilter').value;
    
    let query = supabaseClient
        .from('orders')
        .select(`
            *,
            products (name)
        `)
        .order('created_at', { ascending: false });
    
    if (status) {
        query = query.eq('status', status);
    }
    
    if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        
        query = query.gte('created_at', startDate.toISOString())
                     .lt('created_at', endDate.toISOString());
    }
    
    if (phone) {
        query = query.ilike('customer_phone', `%${phone}%`);
    }
    
    try {
        const { data: orders, error } = await query;
        
        if (error) throw error;
        
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <small>${order.id.substring(0, 8)}...</small><br>
                    ${order.transaction_no ? `<small>${order.transaction_no}</small>` : ''}
                </td>
                <td>
                    ${order.customer_name || 'عميل'} <br>
                    <small>${order.customer_phone}</small>
                </td>
                <td>${order.products ? order.products.name : 'N/A'}</td>
                <td><strong class="text-gold">${(order.amount / 100).toFixed(2)} ر.س</strong></td>
                <td><span class="status-badge">${getStatusText(order.status)}</span></td>
                <td>${new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewOrderDetails('${order.id}')" class="btn-action btn-view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="contactCustomer('${order.customer_phone}')" class="btn-action" style="background: linear-gradient(45deg, #25D366, #128C7E); color: white;">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error filtering orders:', error);
    }
}

// تحميل الأكواد
async function loadBulkCodes() {
    // قم بتحميل الأكواد الحالية
    try {
        const { data: codes, error } = await supabaseClient
            .from('activation_codes')
            .select(`
                *,
                products (name)
            `)
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (error) throw error;
        
        const container = document.getElementById('codesListContainer');
        container.innerHTML = '';
        
        if (codes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #aaa;">لا توجد أكواد حالياً</p>';
            return;
        }
        
        codes.forEach(code => {
            const codeItem = document.createElement('div');
            codeItem.className = `code-item ${code.is_used ? 'used' : ''}`;
            codeItem.innerHTML = `
                <div>
                    <strong>${code.products ? code.products.name : 'غير معروف'}</strong><br>
                    <span class="code-text">${code.code}</span>
                </div>
                <div>
                    <span class="code-status ${code.is_used ? 'code-used' : 'code-available'}">
                        ${code.is_used ? 'مستخدم' : 'متاح'}
                    </span>
                    ${code.used_by_phone ? `<br><small>${code.used_by_phone}</small>` : ''}
                </div>
            `;
            container.appendChild(codeItem);
        });
        
    } catch (error) {
        console.error('Error loading codes:', error);
        showMessage('حدث خطأ في تحميل الأكواد', 'error');
    }
}

// إغلاق المشفر
function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

// عرض الرسائل
function showMessage(text, type) {
    const messageDiv = document.getElementById('loginMessage') || createMessageDiv();
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// إنشاء عنصر رسالة إذا لم يكن موجوداً
function createMessageDiv() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'adminMessage';
    messageDiv.className = 'message';
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '10000';
    document.body.appendChild(messageDiv);
    return messageDiv;
}

// تسجيل خروج المشرف
function logoutAdmin() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        localStorage.removeItem('iron_admin');
        localStorage.removeItem('admin_username');
        location.reload();
    }
}

// التحقق إذا كان المشرف مسجل الدخول
function isAdminLoggedIn() {
    return localStorage.getItem('iron_admin') === 'true';
}

// تهيئة (لضمان أن المتغيرات متاحة عالمياً)
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewProduct = viewProduct;
window.viewOrderDetails = viewOrderDetails;
window.contactCustomer = contactCustomer;
window.updateOrderStatus = updateOrderStatus;
window.showAddProductModal = showAddProductModal;
window.loadBulkCodes = loadBulkCodes;
window.uploadCodes = uploadCodes;
window.exportData = exportData;
window.filterOrders = filterOrders;
window.closeModal = closeModal;
window.logoutAdmin = logoutAdmin;
