// admin.js - منطق لوحة التحكم
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من تسجيل دخول المشرف
    checkAdminAuth();
    
    // ربط الأحداث
    setupEventListeners();
    
    // تحميل البيانات إذا كان المستخدم مسجلاً
    if (isAdminLoggedIn()) {
        loadAdminData();
    }
});

// التحقق من تسجيل دخول المشرف
function checkAdminAuth() {
    const isAdmin = localStorage.getItem('iron_admin') === 'true';
    const adminLoginScreen = document.getElementById('adminLoginScreen');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (isAdmin) {
        adminLoginScreen.style.display = 'none';
        adminDashboard.style.display = 'block';
        
        // عرض اسم المستخدم
        const adminName = localStorage.getItem('admin_username') || 'المشرف';
        document.getElementById('adminName').textContent = `مرحباً، ${adminName}`;
    } else {
        adminLoginScreen.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // تسجيل دخول المشرف
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            const messageDiv = document.getElementById('loginMessage');
            
            messageDiv.style.display = 'none';
            messageDiv.className = 'message';
            
            if (!username || !password) {
                showMessage('يرجى ملء جميع الحقول', 'error');
                return;
            }
            
            try {
                // استدعاء دالة تسجيل الدخول
                const result = await window.ironPlus.adminLogin(username, password);
                
                if (result.success) {
                    localStorage.setItem('iron_admin', 'true');
                    localStorage.setItem('admin_username', username);
                    
                    showMessage('تم تسجيل الدخول بنجاح', 'success');
                    
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    showMessage(result.message, 'error');
                }
            } catch (error) {
                showMessage('حدث خطأ في الاتصال بالسيرفر', 'error');
                console.error('Login Error:', error);
            }
        });
    }
    
    // التنقل بين الأقسام
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إزالة النشاط من جميع العناصر
            document.querySelectorAll('.menu-item').forEach(el => {
                el.classList.remove('active');
            });
            
            // إضافة النشاط للعنصر الحالي
            this.classList.add('active');
            
            // إخفاء جميع الأقسام
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // إظهار القسم المحدد
            const sectionId = this.getAttribute('data-section') + 'Section';
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// تحميل بيانات لوحة التحكم
async function loadAdminData() {
    try {
        // تحميل الإحصائيات
        await loadStatistics();
        
        // تحميل المنتجات
        await loadProductsTable();
        
        // تحميل الطلبات
        await loadOrdersTable();
        
        // تحميل قائمة المنتجات للأكواد
        await loadProductSelect();
        
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// تحميل الإحصائيات
async function loadStatistics() {
    try {
        // إجمالي المبيعات
        const { data: orders, error: ordersError } = await supabaseClient
            .from('orders')
            .select('amount')
            .eq('status', 'completed');
        
        if (!ordersError && orders) {
            const totalSales = orders.reduce((sum, order) => sum + order.amount, 0) / 100;
            document.getElementById('totalSales').textContent = `${totalSales.toFixed(2)} ر.س`;
        }
        
        // عدد المنتجات
        const { count: productsCount, error: productsError } = await supabaseClient
            .from('products')
            .select('*', { count: 'exact', head: true });
        
        if (!productsError) {
            document.getElementById('totalProducts').textContent = productsCount;
        }
        
        // عدد العملاء
        const { count: customersCount, error: customersError } = await supabaseClient
            .from('orders')
            .select('customer_phone', { count: 'exact' })
            .neq('customer_phone', null);
        
        if (!customersError) {
            document.getElementById('totalCustomers').textContent = customersCount;
        }
        
        // عدد الأكواد المتاحة
        const { count: codesCount, error: codesError } = await supabaseClient
            .from('activation_codes')
            .select('*', { count: 'exact', head: true })
            .eq('is_used', false);
        
        if (!codesError) {
            document.getElementById('availableCodes').textContent = codesCount;
        }
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// تحميل جدول المنتجات
async function loadProductsTable() {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    ${product.image_url ? 
                        `<img src="${product.image_url}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">` : 
                        '<i class="fas fa-box" style="font-size: 20px; color: var(--iron-gold);"></i>'
                    }
                </td>
                <td>
                    <strong>${product.name}</strong><br>
                    <small style="color: #aaa;">${product.description || ''}</small>
                </td>
                <td>
                    <strong class="text-gold">${(product.price / 100).toFixed(2)} ر.س</strong>
                </td>
                <td>${product.duration || '-'}</td>
                <td>${product.stock || '∞'}</td>
                <td>
                    <span class="status-badge ${product.is_active ? 'status-active' : 'status-inactive'}">
                        ${product.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="editProduct('${product.id}')" class="btn-action btn-edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteProduct('${product.id}')" class="btn-action btn-delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button onclick="viewProduct('${product.id}')" class="btn-action btn-view">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading products table:', error);
        showMessage('حدث خطأ في تحميل المنتجات', 'error');
    }
}

// تحميل جدول الطلبات
async function loadOrdersTable() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                products (name)
            `)
            .order('created_at', { ascending: false });
        
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
                    ${order.customer_name || 'عميل'}
                    // تابع ملف admin.js
                <td>
                    ${order.customer_phone}<br>
                    ${order.customer_name ? `<small>${order.customer_name}</small>` : ''}
                </td>
                <td>
                    ${order.products?.name || 'منتج محذوف'}<br>
                    <small style="color: #aaa;">${order.notes || ''}</small>
                </td>
                <td>
                    <strong class="text-gold">${(order.amount / 100).toFixed(2)} ر.س</strong>
                </td>
                <td>
                    <span class="status-badge" style="
                        ${order.status === 'completed' ? 'background: rgba(46, 204, 113, 0.2); color: #2ecc71; border: 1px solid #2ecc71;' : ''}
                        ${order.status === 'pending' ? 'background: rgba(241, 196, 15, 0.2); color: #f1c40f; border: 1px solid #f1c40f;' : ''}
                        ${order.status === 'failed' ? 'background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid #e74c3c;' : ''}
                        ${order.status === 'paid' ? 'background: rgba(52, 152, 219, 0.2); color: #3498db; border: 1px solid #3498db;' : ''}
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: bold;
                        text-transform: uppercase;
                    ">
                        ${order.status === 'completed' ? 'مكتمل' : 
                          order.status === 'pending' ? 'معلق' : 
                          order.status === 'failed' ? 'فاشل' : 
                          order.status === 'paid' ? 'مدفوع' : order.status}
                    </span>
                </td>
                <td>
                    ${new Date(order.created_at).toLocaleDateString('ar-SA')}<br>
                    <small style="color: #aaa;">${new Date(order.created_at).toLocaleTimeString('ar-SA')}</small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="updateOrderStatus('${order.id}', 'completed')" 
                                class="btn-action btn-view" 
                                title="تم التسليم">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="contactCustomer('${order.customer_phone}')" 
                                class="btn-action btn-edit"
                                title="تواصل عبر واتساب">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <button onclick="viewOrderDetails('${order.id}')" 
                                class="btn-action" 
                                style="background: linear-gradient(45deg, #9b59b6, #8e44ad); color: white;"
                                title="تفاصيل الطلب">
                            <i class="fas fa-info-circle"></i>
                        </button>
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

// تصفية الطلبات
async function filterOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    const date = document.getElementById('orderDateFilter').value;
    const phone = document.getElementById('orderPhoneFilter').value;
    
    try {
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
        
        const { data: orders, error } = await query;
        
        if (error) throw error;
        
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" class="text-center" style="padding: 40px; color: #aaa;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    <p>لا توجد طلبات تطابق معايير البحث</p>
                </td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <small>${order.id.substring(0, 8)}...</small><br>
                    ${order.transaction_no ? `<small>${order.transaction_no}</small>` : ''}
                </td>
                <td>
                    ${order.customer_phone}<br>
                    ${order.customer_name ? `<small>${order.customer_name}</small>` : ''}
                </td>
                <td>
                    ${order.products?.name || 'منتج محذوف'}
                </td>
                <td>
                    <strong class="text-gold">${(order.amount / 100).toFixed(2)} ر.س</strong>
                </td>
                <td>
                    <span class="status-badge" style="
                        ${order.status === 'completed' ? 'background: rgba(46, 204, 113, 0.2); color: #2ecc71; border: 1px solid #2ecc71;' : ''}
                        ${order.status === 'pending' ? 'background: rgba(241, 196, 15, 0.2); color: #f1c40f; border: 1px solid #f1c40f;' : ''}
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                    ">
                        ${order.status === 'completed' ? 'مكتمل' : 'معلق'}
                    </span>
                </td>
                <td>
                    ${new Date(order.created_at).toLocaleDateString('ar-SA')}<br>
                    <small>${new Date(order.created_at).toLocaleTimeString('ar-SA')}</small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="updateOrderStatus('${order.id}', 'completed')" class="btn-action btn-view">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="contactCustomer('${order.customer_phone}')" class="btn-action btn-edit">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error filtering orders:', error);
        showMessage('حدث خطأ في تصفية الطلبات', 'error');
    }
}

// تحميل قائمة المنتجات لاختيار الأكواد
async function loadProductSelect() {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('id, name')
            .eq('is_active', true);
        
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
        console.error('Error loading product select:', error);
    }
}

// رفع أكواد بالجملة
async function uploadCodes() {
    const productId = document.getElementById('productForCodes').value;
    const codesText = document.getElementById('bulkCodesText').value;
    
    if (!productId) {
        showMessage('يرجى اختيار منتج', 'error');
        return;
    }
    
    if (!codesText.trim()) {
        showMessage('يرجى إدخال الأكواد', 'error');
        return;
    }
    
    const codes = codesText.split('\n')
        .map(code => code.trim())
        .filter(code => code.length > 0);
    
    if (codes.length === 0) {
        showMessage('لم يتم العثور على أكواد صالحة', 'error');
        return;
    }
    
    try {
        const codeObjects = codes.map(code => ({
            product_id: productId,
            code: code,
            is_used: false
        }));
        
        const { data, error } = await supabaseClient
            .from('activation_codes')
            .insert(codeObjects);
        
        if (error) throw error;
        
        showMessage(`تم رفع ${codes.length} كود بنجاح`, 'success');
        document.getElementById('bulkCodesText').value = '';
        
        // تحديث عداد الأكواد المتاحة
        await loadStatistics();
        
    } catch (error) {
        console.error('Error uploading codes:', error);
        showMessage('حدث خطأ في رفع الأكواد', 'error');
    }
}

// إظهار نموذج إضافة منتج
function showAddProductModal() {
    document.getElementById('modalTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productDuration').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productFeatures').value = '';
    
    document.getElementById('productModal').style.display = 'flex';
}

// تعديل منتج
async function editProduct(productId) {
    try {
        const { data: product, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        document.getElementById('modalTitle').textContent = 'تعديل المنتج';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = (product.price / 100).toFixed(2);
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productDuration').value = product.duration || '';
        document.getElementById('productImage').value = product.image_url || '';
        document.getElementById('productFeatures').value = (product.features || []).join('\n');
        
        document.getElementById('productModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading product for edit:', error);
        showMessage('حدث خطأ في تحميل بيانات المنتج', 'error');
    }
}

// حفظ المنتج (إضافة أو تعديل)
document.getElementById('productForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value) * 100;
    const description = document.getElementById('productDescription').value;
    const duration = document.getElementById('productDuration').value;
    const image_url = document.getElementById('productImage').value;
    const features = document.getElementById('productFeatures').value
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);
    
    if (!name || !price) {
        showMessage('يرجى ملء الحقول الإلزامية', 'error');
        return;
    }
    
    const productData = {
        name,
        price: Math.round(price),
        description,
        duration,
        image_url,
        features,
        updated_at: new Date().toISOString()
    };
    
    try {
        let result;
        
        if (productId) {
            // تعديل منتج موجود
            const { data, error } = await supabaseClient
                .from('products')
                .update(productData)
                .eq('id', productId)
                .select();
            
            if (error) throw error;
            result = data[0];
            showMessage('تم تحديث المنتج بنجاح', 'success');
        } else {
            // إضافة منتج جديد
            const { data, error } = await supabaseClient
                .from('products')
                .insert([productData])
                .select();
            
            if (error) throw error;
            result = data[0];
            showMessage('تم إضافة المنتج بنجاح', 'success');
        }
        
        // إغلاق النموذج
        closeModal();
        
        // إعادة تحميل الجدول
        await loadProductsTable();
        await loadStatistics();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showMessage('حدث خطأ في حفظ المنتج', 'error');
    }
});

// حذف منتج
async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ لن يمكنك استرجاعه.')) {
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
        await loadProductsTable();
        await loadStatistics();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showMessage('حدث خطأ في حذف المنتج', 'error');
    }
}

// تحديث حالة الطلب
async function updateOrderStatus(orderId, status) {
    try {
        const { error } = await supabaseClient
            .from('orders')
            .update({ 
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
        
        if (error) throw error;
        
        showMessage('تم تحديث حالة الطلب بنجاح', 'success');
        
        // إعادة تحميل الجدول
        await loadOrdersTable();
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showMessage('حدث خطأ في تحديث حالة الطلب', 'error');
    }
}

// التواصل مع العميل عبر واتساب
function contactCustomer(phone) {
    const message = encodeURIComponent('مرحباً، هذا اتصال من متجر Iron Plus بخصوص طلبك');
    window.open(`https://wa.me/966${phone.substring(1)}?text=${message}`, '_blank');
}

// تسجيل خروج المشرف
function logoutAdmin() {
    localStorage.removeItem('iron_admin');
    localStorage.removeItem('admin_username');
    location.reload();
}

// إغلاق النافذة المنبثقة
function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

// عرض رسالة
function showMessage(text, type) {
    const messageDiv = document.getElementById('loginMessage') || createMessageDiv();
    
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // إخفاء الرسالة بعد 5 ثواني
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// إنشاء عنصر رسالة إذا لم يكن موجوداً
function createMessageDiv() {
    const div = document.createElement('div');
    div.id = 'dynamicMessage';
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 500;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        max-width: 400px;
        display: none;
    `;
    document.body.appendChild(div);
    return div;
}

// التحقق من تسجيل دخول المشرف
function isAdminLoggedIn() {
    return localStorage.getItem('iron_admin') === 'true';
}

// تصدير البيانات
async function exportData() {
    try {
        // جمع البيانات
        const [products, orders, codes] = await Promise.all([
            supabaseClient.from('products').select('*'),
            supabaseClient.from('orders').select('*'),
            supabaseClient.from('activation_codes').select('*')
        ]);
        
        const data = {
            export_date: new Date().toISOString(),
            products: products.data || [],
            orders: orders.data || [],
            activation_codes: codes.data || []
        };
        
        // تحويل إلى JSON
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // تنزيل الملف
        const a = document.createElement('a');
        a.href = url;
        a.download = `iron-plus-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showMessage('تم تصدير البيانات بنجاح', 'success');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showMessage('حدث خطأ في تصدير البيانات', 'error');
    }
}

// تحميل أكواد التفعيل لعرضها
async function loadBulkCodes() {
    const productId = document.getElementById('productForCodes').value;
    
    if (!productId) {
        showMessage('يرجى اختيار منتج أولاً', 'error');
        return;
    }
    
    try {
        const { data: codes, error } = await supabaseClient
            .from('activation_codes')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        const container = document.getElementById('codesListContainer');
        container.innerHTML = '';
        
        if (codes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #aaa;">
                    <i class="fas fa-key" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    <p>لا توجد أكواد لهذا المنتج</p>
                </div>
            `;
            return;
        }
        
        const codesList = document.createElement('div');
        
        codes.forEach(code => {
            const codeItem = document.createElement('div');
            codeItem.className = `code-item ${code.is_used ? 'used' : ''}`;
            codeItem.innerHTML = `
                <div>
                    <span class="code-text">${code.code}</span><br>
                    <small style="color: #aaa;">${new Date(code.created_at).toLocaleDateString('ar-SA')}</small>
                </div>
                <span class="code-status ${code.is_used ? 'code-used' : 'code-available'}">
                    ${code.is_used ? 'مستخدم' : 'متاح'}
                </span>
            `;
            codesList.appendChild(codeItem);
        });
        
        container.appendChild(codesList);
        
    } catch (error) {
        console.error('Error loading codes:', error);
        showMessage('حدث خطأ في تحميل الأكواد', 'error');
    }
}

// تهيئة الصفحة عند التحميل
window.onload = function() {
    // إضافة تأثيرات HUD ديناميكية
    addHUDEffects();
    
    // تحميل البيانات إذا كان المستخدم مسجلاً
    if (isAdminLoggedIn()) {
        loadAdminData();
    }
};

// إضافة تأثيرات HUD ديناميكية
function addHUDEffects() {
    // إضافة خطوط متحركة في الخلفية
    const style = document.createElement('style');
    style.textContent = `
        @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
        }
        
        .scanline {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                var(--tech-blue) 50%, 
                transparent 100%
            );
            opacity: 0.3;
            animation: scanline 3s linear infinite;
            pointer-events: none;
            z-index: 9999;
        }
    `;
    document.head.appendChild(style);
    
    // إضافة خط المسح
    const scanline = document.createElement('div');
    scanline.className = 'scanline';
    document.body.appendChild(scanline);
}
