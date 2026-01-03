// profile.js - منطق صفحة العميل
document.addEventListener('DOMContentLoaded', async function() {
    // التحقق من تسجيل الدخول
    const isLoggedIn = window.ironPlus.isLoggedIn();
    
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // تحميل بيانات المستخدم
    await loadUserData();
    
    // تحميل الطلبات
    await loadUserOrders();
});

async function loadUserData() {
    const phone = localStorage.getItem('iron_user_phone');
    
    // عرض رقم الجوال
    document.getElementById('userPhoneDisplay').textContent = phone;
    document.getElementById('infoPhone').textContent = phone;
    
    try {
        // الحصول على إحصائيات المستخدم
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('amount, status')
            .eq('customer_phone', phone);
        
        if (!error && orders) {
            const completedOrders = orders.filter(order => order.status === 'completed');
            const totalSpent = completedOrders.reduce((sum, order) => sum + order.amount, 0);
            
            document.getElementById('infoOrdersCount').textContent = completedOrders.length;
            document.getElementById('infoTotalSpent').textContent = `${(totalSpent / 100).toFixed(2)} ر.س`;
            
            document.getElementById('userStats').textContent = 
                `${completedOrders.length} طلب | ${(totalSpent / 100).toFixed(2)} ر.س`;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadUserOrders() {
    const phone = localStorage.getItem('iron_user_phone');
    
    try {
        const result = await window.ironPlus.getUserOrders(phone);
        
        if (result.success && result.orders) {
            displayOrders(result.orders);
        } else {
            showMessage('حدث خطأ في تحميل الطلبات', 'error');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showMessage('فشل الاتصال بالخادم', 'error');
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state hud-effect" style="text-align: center; padding: 40px;">
                <i class="fas fa-shopping-cart" style="font-size: 60px; color: var(--metal-gray); margin-bottom: 20px;"></i>
                <h3 class="text-glow-blue">لا توجد طلبات سابقة</h3>
                <p style="color: #aaa; margin-top: 10px;">لم تقم بأي عمليات شراء حتى الآن</p>
                <a href="index.html" class="btn-iron" style="margin-top: 20px;">
                    <i class="fas fa-shopping-cart" style="margin-left: 8px;"></i>
                    ابدأ التسوق
                </a>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = '';
    
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersList.appendChild(orderCard);
    });
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card hud-effect';
    
    const statusBadge = getStatusBadge(order.status);
    const orderDate = new Date(order.created_at).toLocaleDateString('ar-SA');
    
    card.innerHTML = `
        <div class="order-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
                <h4 class="text-glow-gold">${order.products ? order.products.name : 'طلب'}</h4>
                <small style="color: #aaa;">${orderDate}</small>
            </div>
            ${statusBadge}
        </div>
        
        <div class="order-details" style="margin-bottom: 15px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <strong class="text-gold">رقم الطلب:</strong><br>
                    <small>${order.id.substring(0, 8)}...</small>
                </div>
                <div>
                    <strong class="text-gold">المبلغ:</strong><br>
                    <span class="text-glow-red">${(order.amount / 100).toFixed(2)} ر.س</span>
                </div>
            </div>
        </div>
        
        ${order.activation_code_id ? `
            <div class="order-code" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 215, 0, 0.2);">
                <strong class="text-gold">كود التفعيل:</strong><br>
                <code style="background: rgba(0, 255, 255, 0.1); padding: 8px 12px; border-radius: 6px; display: inline-block; margin-top: 8px; font-family: 'Courier New', monospace; color: var(--tech-blue);">
                    ${order.activation_code_id}
                </code>
            </div>
        ` : ''}
    `;
    
    return card;
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': { text: 'معلق', class: 'status-warning' },
        'paid': { text: 'مدفوع', class: 'status-info' },
        'completed': { text: 'مكتمل', class: 'status-success' },
        'failed': { text: 'فاشل', class: 'status-error' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-default' };
    
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

function logout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        window.ironPlus.logout();
    }
}

function showMessage(text, type) {
    // ... (كود عرض الرسائل)
}
