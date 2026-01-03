// success.js - منطق صفحة النجاح
document.addEventListener('DOMContentLoaded', async function() {
    // الحصول على رقم المعاملة من الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const transactionNo = urlParams.get('transactionNo');
    const phone = urlParams.get('phone');
    
    if (transactionNo) {
        await loadOrderDetails(transactionNo);
    } else if (phone) {
        // محاولة العثور على آخر طلب للمستخدم
        await findLatestOrder(phone);
    } else {
        showError('لم يتم العثور على تفاصيل الطلب');
    }
});

async function loadOrderDetails(transactionNo) {
    try {
        const { data: order, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                products (*),
                activation_codes (code)
            `)
            .eq('transaction_no', transactionNo)
            .single();
        
        if (error) throw error;
        
        displayOrderDetails(order);
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showError('حدث خطأ في تحميل تفاصيل الطلب');
    }
}

async function findLatestOrder(phone) {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                products (*),
                activation_codes (code)
            `)
            .eq('customer_phone', phone)
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (error || !orders || orders.length === 0) {
            throw new Error('لم يتم العثور على طلبات');
        }
        
        displayOrderDetails(orders[0]);
        
    } catch (error) {
        console.error('Error finding latest order:', error);
        showError('حدث خطأ في العثور على طلبك');
    }
}

function displayOrderDetails(order) {
    const orderDetails = document.getElementById('orderDetails');
    
    const orderDate = new Date(order.created_at).toLocaleDateString('ar-SA');
    const statusBadge = getStatusBadge(order.status);
    
    let activationCode = '';
    if (order.activation_codes && order.activation_codes.length > 0) {
        activationCode = `
            <div class="activation-code" style="margin-top: 20px; padding: 15px; background: rgba(0, 255, 255, 0.1); border-radius: 8px; border: 1px solid var(--tech-blue);">
                <strong class="text-gold">كود التفعيل:</strong><br>
                <div style="font-family: 'Courier New', monospace; font-size: 18px; color: var(--tech-blue); padding: 10px; text-align: center; margin-top: 10px;">
                    ${order.activation_codes[0].code}
                </div>
                <small style="color: #aaa; display: block; margin-top: 10px;">احفظ هذا الكود واستخدمه لتطبيقك</small>
            </div>
        `;
    }
    
    orderDetails.innerHTML = `
        <div class="details-card hud-effect" style="padding: 25px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <strong class="text-gold">رقم الطلب:</strong><br>
                    ${order.id.substring(0, 8)}...
                </div>
                <div>
                    <strong class="text-gold">الحالة:</strong><br>
                    ${statusBadge}
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <strong class="text-gold">المنتج:</strong><br>
                ${order.products ? order.products.name : 'غير محدد'}
            </div>
            
            <div style="margin-bottom: 20px;">
                <strong class="text-gold">المبلغ المدفوع:</strong><br>
                <span class="text-glow-red" style="font-size: 24px;">${(order.amount / 100).toFixed(2)} ر.س</span>
            </div>
            
            <div style="margin-bottom: 20px;">
                <strong class="text-gold">تاريخ الطلب:</strong><br>
                ${orderDate}
            </div>
            
            ${activationCode}
        </div>
    `;
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': { text: 'معلق', color: 'var(--iron-gold)' },
        'paid': { text: 'مدفوع', color: 'var(--tech-blue)' },
        'completed': { text: 'مكتمل', color: '#2ecc71' },
        'failed': { text: 'فاشل', color: 'var(--iron-red)' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: '#ccc' };
    
    return `<span style="color: ${statusInfo.color}; font-weight: bold;">${statusInfo.text}</span>`;
}

function showError(message) {
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = `
        <div class="error-message hud-effect" style="padding: 30px; text-align: center;">
            <div style="font-size: 60px; color: var(--iron-red); margin-bottom: 20px;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="text-glow-red">${message}</h3>
            <p style="color: #aaa; margin-top: 10px;">يرجى التواصل مع الدعم الفني إذا استمرت المشكلة</p>
        </div>
    `;
}
