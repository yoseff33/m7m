// js/profile.js
document.addEventListener('DOMContentLoaded', async () => {
    const phone = localStorage.getItem('iron_user_phone');
    if (!phone) window.location.href = 'login.html';

    document.getElementById('welcomeUser').textContent = `أهلاً بك: ${phone}`;

    // جلب الطلبات الناجحة مع الأكواد
    const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*, products(name), activation_codes(code)')
        .eq('customer_phone', phone)
        .eq('status', 'paid');

    const grid = document.getElementById('codesGrid');
    grid.innerHTML = '';

    if (orders.length === 0) {
        grid.innerHTML = '<p>لم تقم بشراء أي أكواد بعد.</p>';
        return;
    }

    orders.forEach(order => {
        grid.innerHTML += `
            <div class="hud-card">
                <h4 class="text-gold">${order.products.name}</h4>
                <div class="input-iron text-center" style="letter-spacing:2px; font-weight:bold; color:var(--tech-blue)">
                    ${order.activation_codes?.code || 'جاري التجهيز..'}
                </div>
                <small>تاريخ الطلب: ${new Date(order.created_at).toLocaleDateString('ar-SA')}</small>
            </div>
        `;
    });
});
