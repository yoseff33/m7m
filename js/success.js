// success.js - منطق صفحة النجاح مع دعم Paylink
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionNo = urlParams.get('transactionNo');
    const phone = urlParams.get('phone');
    const orderId = urlParams.get('orderId');

    console.log('🔍 معلمات النجاح:', { transactionNo, phone, orderId });

    try {
        if (transactionNo) {
            await loadOrderDetails(transactionNo);
        } else if (orderId) {
            await loadOrderById(orderId);
        } else if (phone) {
            await findLatestOrder(phone);
        } else {
            showError('لم يتم العثور على تفاصيل الطلب');
        }
    } catch (err) {
        console.error('Error in DOMContentLoaded:', err);
        showError('حدث خطأ غير متوقع أثناء تحميل الصفحة');
    }
});

// تحميل الطلب بواسطة رقم المعاملة
async function loadOrderDetails(transactionNo) {
    try {
        console.log('🔍 جاري تحميل تفاصيل الطلب:', transactionNo);

        const { data: order, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                products (*),
                activation_codes (code)
            `)
            .eq('transaction_no', transactionNo)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('✅ الطلب المسترجع:', order);

        displayOrderDetails(order);

        if (order.status === 'paid' && (!order.activation_codes || order.activation_codes.length === 0) && order.product_id) {
            await tryAssignActivationCode(order);
        }

    } catch (error) {
        console.error('Error loading order details:', error);
        showError('حدث خطأ في تحميل تفاصيل الطلب');
    }
}

// تحميل الطلب بواسطة ID
async function loadOrderById(orderId) {
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

        displayOrderDetails(order);

    } catch (error) {
        console.error('Error loading order by ID:', error);
        showError('حدث خطأ في تحميل تفاصيل الطلب');
    }
}

// العثور على آخر طلب بواسطة رقم الهاتف
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

// تعيين كود التفعيل تلقائياً
async function tryAssignActivationCode(order) {
    try {
        if (!window.ironPlus || !window.ironPlus.assignActivationCode) {
            console.log('ironPlus غير متاح');
            return;
        }

        const codeRes = await window.ironPlus.assignActivationCode(order.id, order.product_id);

        if (codeRes.success) {
            console.log('✅ تم تعيين كود التفعيل:', codeRes.code);

            setTimeout(async () => {
                try {
                    await loadOrderDetails(order.transaction_no);
                    showNotification('تم تعيين كود التفعيل بنجاح!', 'success');
                } catch (err) {
                    console.error('Error reloading order after assigning code:', err);
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Error assigning activation code:', error);
    }
}

// عرض تفاصيل الطلب
function displayOrderDetails(order) {
    const orderDetails = document.getElementById('orderDetails');

    const orderDate = new Date(order.created_at).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusBadge = getStatusBadge(order.status);

    let activationCode = '';
    const codes = Array.isArray(order.activation_codes) ? order.activation_codes : [];

    if (codes.length > 0) {
        const code = codes[0].code;
        activationCode = `
            <div class="activation-code hud-effect" style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 150, 255, 0.1)); border-radius: 12px; border: 2px solid var(--tech-blue); box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);">
                <div style="text-align: center;">
                    <i class="fas fa-key" style="font-size: 40px; color: var(--tech-blue); margin-bottom: 15px;"></i>
                    <h3 style="color: var(--text-light); margin-bottom: 15px; font-family: 'Orbitron', sans-serif;">
                        كود التفعيل الخاص بك
                    </h3>
                    <div style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: var(--tech-blue); padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; letter-spacing: 2px; margin: 15px 0;">
                        ${code}
                    </div>
                    <button onclick="copyToClipboard('${code}')" class="btn-primary" style="margin-top: 15px;">
                        <i class="fas fa-copy"></i> نسخ الكود
                    </button>
                    <p style="color: #aaa; margin-top: 15px; font-size: 14px;">
                        <i class="fas fa-info-circle"></i> احفظ هذا الكود واستخدمه في تطبيق IRON+
                    </p>
                </div>
            </div>
        `;
    } else if (order.status === 'paid') {
        activationCode = `
            <div class="activation-pending hud-effect" style="margin-top: 25px; padding: 20px; background: rgba(255, 215, 0, 0.1); border-radius: 12px; border: 2px solid var(--iron-gold);">
                <div style="text-align: center;">
                    <i class="fas fa-hourglass-half" style="font-size: 40px; color: var(--iron-gold); margin-bottom: 15px;"></i>
                    <h3 style="color: var(--text-light); margin-bottom: 10px;">جاري تحضير كود التفعيل...</h3>
                    <p style="color: #aaa;">
                        سيتم تعيين كود التفعيل تلقائياً خلال دقائق. إذا لم يظهر، يرجى تحديث الصفحة.
                    </p>
                    <button onclick="window.location.reload()" class="btn-secondary" style="margin-top: 15px;">
                        <i class="fas fa-sync-alt"></i> تحديث الصفحة
                    </button>
                </div>
            </div>
        `;
    }

    const productName = order.products && order.products.name ? order.products.name : 'غير محدد';
    const amountPaid = (order.amount / 100).toFixed(2);
    const discount = order.discount > 0 ? (order.discount / 100).toFixed(2) : 0;

    orderDetails.innerHTML = `
        <div class="details-card hud-effect" style="padding: 30px; background: rgba(26, 26, 26, 0.8); border-radius: 16px; border: 1px solid rgba(255, 215, 0, 0.1);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 25px;">
                <div class="detail-item">
                    <strong class="text-gold"><i class="fas fa-receipt ml-2"></i>رقم الطلب:</strong><br>
                    <span style="font-family: 'Courier New', monospace;">${order.transaction_no || order.id.substring(0, 12)}</span>
                </div>
                <div class="detail-item">
                    <strong class="text-gold"><i class="fas fa-info-circle ml-2"></i>الحالة:</strong><br>
                    ${statusBadge}
                </div>
                <div class="detail-item">
                    <strong class="text-gold"><i class="fas fa-user ml-2"></i>رقم الجوال:</strong><br>
                    ${order.customer_phone || 'غير محدد'}
                </div>
                <div class="detail-item">
                    <strong class="text-gold"><i class="fas fa-calendar ml-2"></i>تاريخ الطلب:</strong><br>
                    ${orderDate}
                </div>
            </div>

            <div class="detail-item" style="margin-bottom: 25px;">
                <strong class="text-gold"><i class="fas fa-box ml-2"></i>المنتج:</strong><br>
                <div style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; margin-top: 10px;">
                    ${productName}
                </div>
            </div>

            <div class="detail-item" style="margin-bottom: 25px;">
                <strong class="text-gold"><i class="fas fa-money-bill-wave ml-2"></i>المبلغ المدفوع:</strong><br>
                <span class="text-glow-red" style="font-size: 28px; font-family: 'Orbitron', sans-serif;">
                    ${amountPaid} ر.س
                </span>
                ${discount > 0 ? `<div style="color: #2ecc71; margin-top: 5px;"><i class="fas fa-tag"></i> شامل خصم ${discount} ر.س</div>` : ''}
            </div>

            ${activationCode}

            <div class="action-buttons" style="margin-top: 30px; display: flex; gap: 15px; flex-wrap: wrap;">
                <a href="index.html" class="btn-secondary">
                    <i class="fas fa-home"></i> العودة للرئيسية
                </a>
                ${order.status === 'completed' && codes.length > 0 ? `
                    <button onclick="showActivationInstructions()" class="btn-primary">
                        <i class="fas fa-question-circle"></i> كيفية الاستخدام
                    </button>
                ` : ''}
                <button onclick="window.print()" class="btn-secondary">
                    <i class="fas fa-print"></i> طباعة الفاتورة
                </button>
            </div>
        </div>
    `;
}

// ---------------------------------------
// دوال مساعدة
// ---------------------------------------
function getStatusBadge(status) {
    const statusMap = {
        'pending': { text: '⏳ معلق', color: 'var(--iron-gold)', icon: 'fa-clock' },
        'paid': { text: '✅ مدفوع', color: 'var(--tech-blue)', icon: 'fa-check-circle' },
        'completed': { text: '🎉 مكتمل', color: '#2ecc71', icon: 'fa-award' },
        'failed': { text: '❌ فاشل', color: 'var(--iron-red)', icon: 'fa-times-circle' },
        'refunded': { text: '↩️ مسترد', color: '#f39c12', icon: 'fa-undo' }
    };

    const statusInfo = statusMap[status] || { text: status, color: '#ccc', icon: 'fa-question-circle' };

    return `
        <span style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: ${statusInfo.color}20; border-radius: 20px; border: 1px solid ${statusInfo.color}; color: ${statusInfo.color}; font-weight: bold;">
            <i class="fas ${statusInfo.icon}"></i>
            ${statusInfo.text}
        </span>
    `;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('تم نسخ الكود بنجاح!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('فشل نسخ الكود', 'error');
    });
}

function showActivationInstructions() {
    const instructions = `
        <div style="padding: 20px; max-width: 500px;">
            <h3 style="color: var(--text-light); margin-bottom: 15px;">
                <i class="fas fa-graduation-cap ml-2"></i>
                كيفية تفعيل تطبيق IRON+
            </h3>
            <ol style="color: var(--text-gray); line-height: 2; text-align: right; padding-right: 20px;">
                <li>افتح تطبيق IRON+ على جهازك</li>
                <li>اذهب إلى قسم "التفعيل"</li>
                <li>أدخل كود التفعيل الظاهر أعلاه</li>
                <li>اضغط على زر "تفعيل"</li>
                <li>انتظر حتى تظهر رسالة "تم التفعيل بنجاح"</li>
                <li>أعد تشغيل التطبيق للاستمتاع بالمزايا الكاملة</li>
            </ol>
            <p style="color: #aaa; margin-top: 20px; font-size: 14px;">
                <i class="fas fa-headset ml-2"></i>
                للاستفسارات: تواصل مع الدعم الفني عبر الواتساب
            </p>
        </div>
    `;

    showModal('تعليمات التفعيل', instructions);
}

function showError(message) {
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = `
        <div class="error-message hud-effect" style="padding: 40px; text-align: center; background: rgba(155, 17, 30, 0.1); border-radius: 16px; border: 1px solid var(--iron-red);">
            <div style="font-size: 80px; color: var(--iron-red); margin-bottom: 20px;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="text-glow-red" style="margin-bottom: 15px;">${message}</h3>
            <p style="color: #aaa; margin-bottom: 25px;">يرجى التأكد من رابط الطلب أو التواصل مع الدعم الفني</p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <a href="index.html" class="btn-primary">
                    <i class="fas fa-home"></i> العودة للرئيسية
                </a>
                <button onclick="window.location.reload()" class="btn-secondary">
                    <i class="fas fa-sync-alt"></i> إعادة المحاولة
                </button>
            </div>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'success' ? 'bg-green-900/90 border-green-700' :
        type === 'error' ? 'bg-red-900/90 border-red-700' :
        type === 'warning' ? 'bg-yellow-900/90 border-yellow-700' :
        'bg-blue-900/90 border-blue-700'
    } border`;

    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'} mr-3 text-xl"></i>
            <span class="flex-1">${message}</span>
            <button class="ml-4 text-gray-300 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 5000);
}

function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70';
    modal.innerHTML = `
        <div class="bg-[#1A1A1A] rounded-2xl p-6 max-w-md w-full mx-4 border border-[#FFD700]/20">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-[#FFD700]">${title}</h3>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// تأكد من تعريف supabaseClient
if (typeof supabaseClient === 'undefined' && typeof window.supabaseClient !== 'undefined') {
    var supabaseClient = window.supabaseClient;
}
