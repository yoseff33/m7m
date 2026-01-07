// profile.js - منطق صفحة العميل (مربوط مباشرة مع Supabase)

document.addEventListener('DOMContentLoaded', async function () {

    if (!window.ironPlus || !window.ironPlus.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    await loadUserData();
    await loadUserOrders();
});

/* =========================
   تحميل بيانات المستخدم
========================= */
async function loadUserData() {
    const phone = localStorage.getItem('iron_user_phone');

    document.getElementById('userPhoneDisplay').textContent = phone;
    document.getElementById('infoPhone').textContent = phone;

    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('amount, status')
            .eq('customer_phone', phone);

        if (error) throw error;

        const completedOrders = orders.filter(o => o.status === 'completed');
        const totalSpent = completedOrders.reduce((sum, o) => sum + o.amount, 0);

        document.getElementById('infoOrdersCount').textContent = completedOrders.length;
        document.getElementById('infoTotalSpent').textContent = `${(totalSpent / 100).toFixed(2)} ر.س`;
        document.getElementById('userStats').textContent =
            `${completedOrders.length} طلب | ${(totalSpent / 100).toFixed(2)} ر.س`;

    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/* =========================
   تحميل طلبات المستخدم
========================= */
/* =========================
   تحميل طلبات المستخدم
========================= */
async function loadUserOrders() {
    const phone = localStorage.getItem('iron_user_phone');

    try {
        // قمنا بتحديد أسماء العلاقات ( ! ) لحل مشكلة PGRST201
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select(`
                id,
                amount,
                status,
                created_at,
                activation_code_id,
                products!orders_product_id_fkey ( name ),
                activation_codes!orders_activation_code_id_fkey ( code )
            `)
            .eq('customer_phone', phone)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase Query Error:', error);
            throw error;
        }

        displayOrders(orders || []);

    } catch (error) {
        console.error('Error loading orders:', error);
        showMessage('فشل تحميل الطلبات', 'error');
    }
}

/* =========================
   عرض الطلبات
========================= */
function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');

    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state hud-effect" style="text-align:center;padding:40px;">
                <h3 class="text-glow-blue">لا توجد طلبات سابقة</h3>
                <p style="color:#aaa;margin-top:10px;">لم تقم بأي عمليات شراء حتى الآن</p>
                <a href="index.html" class="btn-iron" style="margin-top:20px;display:inline-block;">ابدأ التسوق</a>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = '';
    orders.forEach(order => ordersList.appendChild(createOrderCard(order)));
}

/* =========================
   إنشاء كرت الطلب
========================= */
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card hud-effect';

    const statusBadge = getStatusBadge(order.status);
    const orderDate = new Date(order.created_at).toLocaleDateString('ar-SA');

    const productName = order.products ? order.products.name : 'طلب';
    const activationCode = order.activation_codes ? order.activation_codes.code : null;

    card.innerHTML = `
        <div class="order-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
            <div>
                <h4 class="text-glow-gold">${productName}</h4>
                <small style="color:#aaa;">${orderDate}</small>
            </div>
            ${statusBadge}
        </div>

        <div class="order-details" style="margin-bottom:15px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
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

        ${activationCode ? `
            <div class="order-code" style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,215,0,0.2);">
                <strong class="text-gold">كود التفعيل:</strong><br>
                <code style="background:rgba(0,255,255,0.1);padding:8px 12px;border-radius:6px;display:inline-block;margin-top:8px;">
                    ${activationCode}
                </code>
            </div>
        ` : ''}
    `;

    return card;
}

/* =========================
   حالة الطلب
========================= */
function getStatusBadge(status) {
    const map = {
        pending: { text: 'معلق', class: 'status-warning' },
        paid: { text: 'مدفوع', class: 'status-info' },
        completed: { text: 'مكتمل', class: 'status-success' },
        failed: { text: 'فاشل', class: 'status-error' }
    };
    const s = map[status] || { text: status, class: 'status-default' };
    return `<span class="status-badge ${s.class}">${s.text}</span>`;
}

/* =========================
   تسجيل الخروج
========================= */
function logout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        window.ironPlus.logout();
    }
}

function showMessage(text, type) {
    console.log(type, text);
}
