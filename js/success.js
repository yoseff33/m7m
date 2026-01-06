// ==========================================
// success.js - نظام إدارة نجاح الطلبات IRON+ v5.6
// تم الإصلاح: معالجة خطأ PGRST201 (تعدد العلاقات)
// ==========================================

document.addEventListener('DOMContentLoaded', async function() {
    // 1. استخراج المعلمات من الرابط (URL Parameters)
    const urlParams = new URLSearchParams(window.location.search);
    const transactionNo = urlParams.get('transactionNo');
    const phone = urlParams.get('phone');
    const orderId = urlParams.get('orderId');
    
    console.log('🔍 نظام النجاح - المعلمات المستلمة:', { transactionNo, phone, orderId });
    
    // التأكد من تهيئة سوبابيس
    if (typeof window.supabaseClient === 'undefined') {
        console.error('❌ Supabase Client is not initialized!');
        showError('فشل الاتصال بنظام السيرفر');
        return;
    }

    // 2. توجيه عملية البحث بناءً على المعطى
    if (transactionNo) {
        await loadOrderDetails(transactionNo);
    } else if (orderId) {
        await loadOrderById(orderId);
    } else if (phone) {
        await findLatestOrder(phone);
    } else {
        showError('لم يتم العثور على أي تفاصيل للطلب في الرابط');
    }
});

// --- [دوال جلب البيانات] ---

async function loadOrderDetails(transactionNo) {
    try {
        console.log('🔍 جاري جلب الطلب عبر المعاملة:', transactionNo);
        
        // حل خطأ PGRST201: تحديد أن الربط يتم عبر عمود product_id تحديداً
        const { data: order, error } = await window.supabaseClient
            .from('orders')
            .select(`
                *,
                products:product_id (*),
                activation_codes:order_id (code)
            `)
            .eq('transaction_no', transactionNo)
            .maybeSingle();
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        if (!order) {
            console.warn('⚠️ الطلب غير موجود في قاعدة البيانات');
            showError('لم يتم العثور على تفاصيل الطلب.. تأكد من اكتمال الدفع');
            return;
        }
        
        console.log('✅ تم استرجاع الطلب:', order);
        displayOrderDetails(order);
        
        // إذا كان الطلب مدفوعاً ولم يتم تعيين كود، نحاول تعيينه
        if (order.status === 'paid' && !order.activation_code_id && order.product_id) {
            await tryAssignActivationCode(order);
        }
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showError('حدث خطأ أثناء تحميل تفاصيل الطلب');
    }
}

async function loadOrderById(orderId) {
    try {
        const { data: order, error } = await window.supabaseClient
            .from('orders')
            .select(`
                *,
                products:product_id (*),
                activation_codes:order_id (code)
            `)
            .eq('id', orderId)
            .maybeSingle();
        
        if (error) throw error;
        if (order) displayOrderDetails(order);
        else showError('رقم الطلب غير صحيح');
        
    } catch (error) {
        console.error('Error loading order by ID:', error);
        showError('حدث خطأ في تحميل الطلب عبر المعرف');
    }
}

async function findLatestOrder(phone) {
    try {
        const { data: orders, error } = await window.supabaseClient
            .from('orders')
            .select(`
                *,
                products:product_id (*),
                activation_codes:order_id (code)
            `)
            .eq('customer_phone', phone)
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (error || !orders || orders.length === 0) {
            throw new Error('لم يتم العثور على طلبات سابقة');
        }
        
        displayOrderDetails(orders[0]);
        
    } catch (error) {
        console.error('Error finding latest order:', error);
        showError('حدث خطأ في العثور على طلبك الأخير');
    }
}

async function tryAssignActivationCode(order) {
    try {
        console.log('🔄 محاولة تعيين كود تفعيل تلقائي...');
        if (!window.ironPlus || !window.ironPlus.assignActivationCode) {
            console.log('دالة التعيين غير متوفرة في ironPlus');
            return;
        }
        
        const codeRes = await window.ironPlus.assignActivationCode(order.id, order.product_id);
        
        if (codeRes.success) {
            console.log('✅ تم تعيين الكود:', codeRes.code);
            showNotification('تم تفعيل الكود الخاص بك بنجاح!', 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    } catch (error) {
        console.error('Error assigning activation code:', error);
    }
}

// --- [دوال العرض والواجهة] ---

function displayOrderDetails(order) {
    const orderDetails = document.getElementById('orderDetails');
    if (!orderDetails) return;

    const orderDate = new Date(order.created_at).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    const statusBadge = getStatusBadge(order.status);
    
    // التحقق من وجود الكود
    let activationCodeHtml = '';
    const codes = order.activation_codes;
    
    if (codes && codes.length > 0) {
        const code = codes[0].code;
        activationCodeHtml = `
            <div class="activation-code hud-effect" style="margin-top: 25px; padding: 25px; background: rgba(0, 255, 255, 0.05); border: 2px solid #00ffff; border-radius: 12px; box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);">
                <div style="text-align: center;">
                    <i class="fas fa-key" style="font-size: 40px; color: #00ffff; margin-bottom: 15px;"></i>
                    <h3 style="color: #fff; margin-bottom: 15px; font-family: 'Orbitron', sans-serif;">كود التفعيل الخاص بك</h3>
                    <div style="font-family: 'Courier New', monospace; font-size: 26px; font-weight: bold; color: #00ffff; padding: 18px; background: rgba(0, 0, 0, 0.4); border-radius: 8px; letter-spacing: 2px; margin: 15px 0; border: 1px dashed #00ffff;">
                        ${code}
                    </div>
                    <button onclick="copyToClipboard('${code}')" class="btn-primary" style="margin-top: 15px; padding: 12px 30px;">
                        <i class="fas fa-copy ml-2"></i> نسخ كود التفعيل
                    </button>
                    <p style="color: #aaa; margin-top: 15px; font-size: 13px;">
                        <i class="fas fa-info-circle ml-1"></i> استخدم هذا الكود داخل التطبيق لتفعيل اشتراكك
                    </p>
                </div>
            </div>
        `;
    } else if (order.status === 'paid' || order.status === 'completed') {
        activationCodeHtml = `
            <div class="activation-pending hud-effect" style="margin-top: 25px; padding: 25px; background: rgba(255, 215, 0, 0.05); border-radius: 12px; border: 2px solid #FFD700; text-align: center;">
                <i class="fas fa-hourglass-half fa-spin" style="font-size: 40px; color: #FFD700; margin-bottom: 15px;"></i>
                <h3 style="color: #fff; margin-bottom: 10px;">جاري تحضير الكود...</h3>
                <p style="color: #aaa; font-size: 14px;">يتم الآن تخصيص كود لك من المخزن. إذا استغرق الأمر أكثر من دقيقة، يرجى تحديث الصفحة.</p>
                <button onclick="window.location.reload()" class="btn-secondary" style="margin-top: 20px;">
                    <i class="fas fa-sync-alt ml-2"></i> تحديث الحالة
                </button>
            </div>
        `;
    }

    orderDetails.innerHTML = `
        <div class="details-card hud-effect" style="padding: 30px; background: rgba(15, 15, 15, 0.95); border-radius: 20px; border: 1px solid rgba(255, 215, 0, 0.15);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; text-align: right;">
                <div class="detail-item">
                    <strong class="text-gold"><i class="fas fa-hashtag ml-2"></i>رقم المعاملة:</strong><br>
                    <span style="font-family: 'Courier New', monospace; color: #fff;">${order.transaction_no || order.id}</span>
                </div>
                <div class="detail-item">
                    <strong class="text-gold"><i class="fas fa-signal ml-2"></i>الحالة:</strong><br>
                    ${statusBadge}
                </div>
                <div class="detail-item">
                    <strong class="text-gold"><i class="fas fa-user ml-2"></i>العميل:</strong><br>
                    <span style="color: #fff;">${order.customer_name || 'عميل IRON+'}</span>
                </div>
                <div class="detail-item">
                    <strong class="text-gold"><i class="fas fa-calendar-alt ml-2"></i>التاريخ:</strong><br>
                    <span style="color: #fff;">${orderDate}</span>
                </div>
            </div>
            
            <div style="padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; border-right: 4px solid #9B111E; margin-bottom: 25px;">
                <strong class="text-gold"><i class="fas fa-shopping-cart ml-2"></i>المنتج المطلوب:</strong><br>
                <div style="font-size: 18px; margin-top: 8px; color: #fff;">
                    ${order.products ? order.products.name : 'باقة اشتراك IRON+'}
                </div>
                <div style="margin-top: 10px; font-size: 24px; font-weight: bold; color: #fff;">
                    ${(order.amount / 100).toFixed(2)} ر.س
                </div>
            </div>
            
            ${activationCodeHtml}
            
            <div class="action-buttons" style="margin-top: 35px; display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                <a href="index.html" class="btn-secondary" style="min-width: 160px; text-align: center; text-decoration: none;">
                    <i class="fas fa-home ml-2"></i> الرئيسية
                </a>
                <button onclick="showActivationInstructions()" class="btn-primary" style="min-width: 160px;">
                    <i class="fas fa-info-circle ml-2"></i> التعليمات
                </button>
                <button onclick="window.print()" class="btn-secondary">
                    <i class="fas fa-print"></i>
                </button>
            </div>
        </div>
    `;
}

// --- [الأدوات المساعدة والمكونات] ---

function getStatusBadge(status) {
    const statusMap = {
        'pending': { text: '⏳ معلق', color: '#FFD700', icon: 'fa-clock' },
        'paid': { text: '✅ مدفوع', color: '#00d1ff', icon: 'fa-check-circle' },
        'completed': { text: '🏁 مكتمل', color: '#2ecc71', icon: 'fa-flag-checkered' },
        'failed': { text: '❌ فاشل', color: '#ff4444', icon: 'fa-times-circle' }
    };
    
    const info = statusMap[status] || { text: status, color: '#888', icon: 'fa-question' };
    
    return `
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: ${info.color}15; border: 1px solid ${info.color}; border-radius: 20px; color: ${info.color}; font-weight: bold; font-size: 14px;">
            <i class="fas ${info.icon}"></i> ${info.text}
        </span>
    `;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('تم نسخ الكود بنجاح! 📋', 'success');
    }).catch(() => showNotification('فشل النسخ، يرجى النسخ يدوياً', 'error'));
}

function showActivationInstructions() {
    const content = `
        <div style="text-align: right; line-height: 1.8;">
            <p style="color: #FFD700; font-weight: bold; margin-bottom: 15px;">خطوات تفعيل الاشتراك:</p>
            <ol style="padding-right: 20px; color: #ccc;">
                <li>قم بنسخ كود التفعيل الظاهر في الصفحة.</li>
                <li>افتح تطبيق <span style="color:#9B111E">IRON+</span> على جهازك.</li>
                <li>توجه إلى قائمة "تفعيل الباقة".</li>
            </ol>
        </div>
    `;
    showModal('تعليمات التفعيل 💡', content);
}

function showError(message) {
    const orderDetails = document.getElementById('orderDetails');
    if (!orderDetails) return;
    
    orderDetails.innerHTML = `
        <div style="padding: 50px 20px; text-align: center; background: rgba(155, 17, 30, 0.05); border: 1px solid #9B111E; border-radius: 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 60px; color: #9B111E; margin-bottom: 20px;"></i>
            <h3 style="color: #fff; margin-bottom: 10px;">${message}</h3>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <a href="index.html" class="btn-primary" style="text-decoration:none;">العودة للرئيسية</a>
                <button onclick="window.location.reload()" class="btn-secondary">إعادة المحاولة</button>
            </div>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const note = document.createElement('div');
    note.className = 'fixed top-4 left-4 z-[9999] p-4 rounded-lg shadow-2xl border slide-in';
    note.style.backgroundColor = type === 'success' ? '#064e3b' : '#7f1d1d';
    note.style.borderColor = type === 'success' ? '#10b981' : '#ef4444';
    note.style.color = '#fff';
    note.innerHTML = `<div class="flex items-center gap-3"><i class="fas ${type === 'success' ? 'fa-check' : 'fa-info'}"></i><span>${message}</span></div>`;
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 4000);
}

function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-[#111] border border-[#FFD700]/30 w-full max-w-md rounded-2xl overflow-hidden">
            <div class="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                <h3 class="text-[#FFD700] font-bold">${title}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-white/50 hover:text-white"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-6 text-white">${content}</div>
        </div>
    `;
    document.body.appendChild(modal);
}
