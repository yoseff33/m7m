// success.js - منطق صفحة النجاح مع دعم Paylink و SPL
document.addEventListener('DOMContentLoaded', async function() {
    // التحقق من تهيئة Supabase
    if (!window.supabaseClient) {
        console.error('Supabase client غير مهيأ');
        showError('خطأ في تهيئة النظام');
        return;
    }
    
    // الحصول على معلمات الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const transactionNo = sanitizeInput(urlParams.get('transactionNo'));
    const phone = sanitizeInput(urlParams.get('phone'));
    const orderId = sanitizeInput(urlParams.get('orderId'));
    const paymentId = sanitizeInput(urlParams.get('paymentId')); // دعم Paylink
    
    console.log('🔍 معلمات النجاح:', { transactionNo, phone, orderId, paymentId });
    
    try {
        // الأولوية: transactionNo > orderId > paymentId > phone
        if (transactionNo) {
            await loadOrderByTransaction(transactionNo);
        } else if (orderId) {
            await loadOrderById(orderId);
        } else if (paymentId) {
            await loadOrderByPaymentId(paymentId);
        } else if (phone) {
            await findLatestOrder(phone);
        } else {
            showError('لم يتم العثور على تفاصيل الطلب');
        }
    } catch (error) {
        console.error('خطأ في تحميل الصفحة:', error);
        showError('حدث خطأ في تحميل تفاصيل الطلب');
    }
});

// ================ دوال المساعدة الأساسية ================

function sanitizeInput(input) {
    if (!input) return null;
    return input.toString().trim()
        .replace(/[<>"'`]/g, '')
        .substring(0, 100);
}

async function logAccess(attemptData) {
    try {
        // تسجيل محاولات الوصول
        await window.supabaseClient
            .from('access_logs')
            .insert({
                session_id: generateSessionId(),
                page: 'success',
                data: attemptData,
                user_agent: navigator.userAgent,
                ip_address: await getClientIP()
            });
    } catch (error) {
        console.warn('فشل تسجيل الدخول:', error);
    }
}

function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
}

async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'unknown';
    }
}

// ================ دوال تحميل الطلبات ================

async function loadOrderByTransaction(transactionNo) {
    showLoading();
    
    try {
        console.log('🔍 جاري تحميل الطلب برقم المعاملة:', transactionNo);
        
        // تسجيل محاولة الوصول
        await logAccess({ transactionNo, action: 'load_by_transaction' });
        
        // استعلام آمن بدون علاقات متداخلة
        const { data: order, error } = await window.supabaseClient
            .from('orders')
            .select('*')
            .eq('transaction_no', transactionNo)
            .maybeSingle(); // استخدم maybeSingle بدلاً من single
        
        if (error) {
            console.error('خطأ في Supabase:', error);
            throw new Error(`فشل تحميل الطلب: ${error.message}`);
        }
        
        if (!order) {
            throw new Error('الطلب غير موجود أو تم حذفه');
        }
        
        // جلب البيانات المرتبطة بشكل منفصل
        const [productData, activationData] = await Promise.all([
            fetchProductData(order.product_id),
            fetchActivationCode(order.activation_code_id)
        ]);
        
        // إنشاء كائن الطلب المدمج
        const enhancedOrder = {
            ...order,
            product: productData,
            activation_code: activationData
        };
        
        console.log('✅ الطلب المسترجع:', enhancedOrder);
        
        // عرض التفاصيل
        displayOrderDetails(enhancedOrder);
        
        // محاولة تعيين كود تفعيل إذا لزم الأمر
        if (shouldAssignCode(enhancedOrder)) {
            await tryAssignActivationCode(enhancedOrder);
        }
        
    } catch (error) {
        console.error('خطأ في تحميل الطلب:', error);
        showError(`حدث خطأ: ${error.message}`);
    }
}

async function loadOrderById(orderId) {
    showLoading();
    
    try {
        console.log('🔍 جاري تحميل الطلب بالمعرف:', orderId);
        
        // استعلام آمن
        const { data: order, error } = await window.supabaseClient
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();
        
        if (error) throw error;
        if (!order) throw new Error('الطلب غير موجود');
        
        // جلب البيانات المرتبطة
        const [productData, activationData] = await Promise.all([
            fetchProductData(order.product_id),
            fetchActivationCode(order.activation_code_id)
        ]);
        
        const enhancedOrder = {
            ...order,
            product: productData,
            activation_code: activationData
        };
        
        displayOrderDetails(enhancedOrder);
        
    } catch (error) {
        console.error('خطأ في تحميل الطلب بالمعرف:', error);
        showError('فشل في تحميل الطلب');
    }
}

async function loadOrderByPaymentId(paymentId) {
    showLoading();
    
    try {
        console.log('🔍 جاري تحميل الطلب برقم الدفع:', paymentId);
        
        const { data: order, error } = await window.supabaseClient
            .from('orders')
            .select('*')
            .or(`payment_id.eq.${paymentId},transaction_no.eq.${paymentId}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (error) throw error;
        if (!order) throw new Error('لم يتم العثور على طلب بهذا المعرف');
        
        const [productData, activationData] = await Promise.all([
            fetchProductData(order.product_id),
            fetchActivationCode(order.activation_code_id)
        ]);
        
        const enhancedOrder = {
            ...order,
            product: productData,
            activation_code: activationData
        };
        
        displayOrderDetails(enhancedOrder);
        
    } catch (error) {
        console.error('خطأ في تحميل الطلب برقم الدفع:', error);
        showError('فشل في تحميل تفاصيل الدفع');
    }
}

async function findLatestOrder(phone) {
    showLoading();
    
    try {
        console.log('🔍 جاري البحث عن أحدث طلب للرقم:', phone);
        
        // تحقق من صحة رقم الجوال
        if (!/^(05|5)[0-9]{8}$/.test(phone)) {
            throw new Error('رقم الجوال غير صالح');
        }
        
        const { data: orders, error } = await window.supabaseClient
            .from('orders')
            .select('*')
            .eq('customer_phone', phone)
            .order('created_at', { ascending: false })
            .limit(5); // جلب آخر 5 طلبات
        
        if (error) throw error;
        if (!orders || orders.length === 0) {
            throw new Error('لم يتم العثور على طلبات لهذا الرقم');
        }
        
        // جلب تفاصيل الطلب الأول (الأحدث)
        const order = orders[0];
        const [productData, activationData] = await Promise.all([
            fetchProductData(order.product_id),
            fetchActivationCode(order.activation_code_id)
        ]);
        
        const enhancedOrder = {
            ...order,
            product: productData,
            activation_code: activationData,
            recent_orders: orders.slice(1) // حفظ الطلبات الأخرى للعرض
        };
        
        displayOrderDetails(enhancedOrder);
        
    } catch (error) {
        console.error('خطأ في البحث عن الطلب:', error);
        showError('فشل في العثور على طلباتك');
    }
}

// ================ دوال جلب البيانات المرتبطة ================

async function fetchProductData(productId) {
    if (!productId) return null;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('products')
            .select('id, name, description, price, duration_days')
            .eq('id', productId)
            .maybeSingle();
        
        if (error) {
            console.warn('خطأ في جلب بيانات المنتج:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.warn('فشل جلب المنتج:', error);
        return null;
    }
}

async function fetchActivationCode(codeId) {
    if (!codeId) return null;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('activation_codes')
            .select('id, code, is_used, expires_at, created_at')
            .eq('id', codeId)
            .maybeSingle();
        
        if (error) {
            console.warn('خطأ في جلب كود التفعيل:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.warn('فشل جلب كود التفعيل:', error);
        return null;
    }
}

// ================ منطق كود التفعيل ================

function shouldAssignCode(order) {
    return order.status === 'paid' && 
           !order.activation_code_id && 
           order.product_id && 
           (!window.assignedCodes || !window.assignedCodes.includes(order.id));
}

async function tryAssignActivationCode(order) {
    try {
        // تأكد من وجود ironPlus
        if (!window.ironPlus || typeof window.ironPlus.assignActivationCode !== 'function') {
            console.warn('ironPlus غير متاح');
            return;
        }
        
        console.log('🔄 محاولة تعيين كود تفعيل للطلب:', order.id);
        
        // استدعاء SPL function
        const codeRes = await window.ironPlus.assignActivationCode(order.id, order.product_id);
        
        if (codeRes.success) {
            console.log('✅ تم تعيين الكود:', codeRes.code);
            
            // تحديث الواجهة
            showNotification('تم تعيين كود التفعيل بنجاح!', 'success');
            
            // منع إعادة المحاولة لنفس الطلب
            if (!window.assignedCodes) window.assignedCodes = [];
            window.assignedCodes.push(order.id);
            
            // إعادة تحميل البيانات بعد ثانيتين
            setTimeout(async () => {
                if (order.transaction_no) {
                    await loadOrderByTransaction(order.transaction_no);
                }
            }, 2000);
        } else {
            console.warn('فشل تعيين الكود:', codeRes.error);
            showNotification('جاري تحضير كود التفعيل، يرجى الانتظار...', 'info');
        }
    } catch (error) {
        console.error('خطأ في تعيين كود التفعيل:', error);
        // لا تعرض خطأ للمستخدم، فقط سجل في الكونسول
    }
}

// ================ عرض البيانات ================

function displayOrderDetails(order) {
    const orderDetails = document.getElementById('orderDetails');
    if (!orderDetails) return;
    
    // تنسيق التاريخ
    const orderDate = new Date(order.created_at).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // إعداد الحالة
    const statusBadge = getStatusBadge(order.status);
    
    // إعداد المنتج
    const productName = order.product ? order.product.name : 'غير محدد';
    const productDesc = order.product ? order.product.description : '';
    
    // إعداد كود التفعيل
    const activationCodeHtml = getActivationCodeHtml(order);
    
    // إعداد الطلبات الحديثة إن وجدت
    const recentOrdersHtml = getRecentOrdersHtml(order.recent_orders);
    
    orderDetails.innerHTML = `
        <div class="success-container">
            <div class="header hud-effect" style="text-align: center; margin-bottom: 30px;">
                <i class="fas fa-check-circle" style="font-size: 60px; color: #2ecc71; margin-bottom: 15px;"></i>
                <h1 style="color: var(--text-light); margin-bottom: 10px;">تمت عملية الدفع بنجاح!</h1>
                <p style="color: var(--text-gray);">شكراً لثقتك. تفاصيل طلبك أدناه</p>
            </div>
            
            <div class="details-card hud-effect">
                <div class="details-grid">
                    <div class="detail-item">
                        <strong class="text-gold"><i class="fas fa-receipt ml-2"></i>رقم الطلب:</strong>
                        <span class="monospace">${order.transaction_no || order.id.substring(0, 8)}</span>
                    </div>
                    
                    <div class="detail-item">
                        <strong class="text-gold"><i class="fas fa-info-circle ml-2"></i>الحالة:</strong>
                        ${statusBadge}
                    </div>
                    
                    <div class="detail-item">
                        <strong class="text-gold"><i class="fas fa-user ml-2"></i>رقم الجوال:</strong>
                        <span>${order.customer_phone || 'غير محدد'}</span>
                    </div>
                    
                    <div class="detail-item">
                        <strong class="text-gold"><i class="fas fa-calendar ml-2"></i>تاريخ الطلب:</strong>
                        <span>${orderDate}</span>
                    </div>
                </div>
                
                <div class="product-section">
                    <h3 class="section-title"><i class="fas fa-box ml-2"></i>تفاصيل المنتج</h3>
                    <div class="product-card">
                        <h4>${productName}</h4>
                        ${productDesc ? `<p>${productDesc}</p>` : ''}
                        ${order.product?.duration_days ? `
                            <div class="duration-badge">
                                <i class="fas fa-clock"></i> ${order.product.duration_days} يوم
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="payment-section">
                    <h3 class="section-title"><i class="fas fa-money-bill-wave ml-2"></i>تفاصيل الدفع</h3>
                    <div class="payment-amount">
                        <span class="amount">${(order.amount / 100).toFixed(2)} ر.س</span>
                        ${order.discount > 0 ? `
                            <div class="discount-badge">
                                <i class="fas fa-tag"></i> وفرت ${(order.discount / 100).toFixed(2)} ر.س
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${activationCodeHtml}
                ${recentOrdersHtml}
                
                <div class="action-buttons">
                    <a href="index.html" class="btn-secondary">
                        <i class="fas fa-home"></i> العودة للرئيسية
                    </a>
                    
                    ${order.status === 'paid' || order.status === 'completed' ? `
                        <button onclick="showActivationInstructions()" class="btn-primary">
                            <i class="fas fa-question-circle"></i> كيفية الاستخدام
                        </button>
                    ` : ''}
                    
                    <button onclick="printInvoice('${order.transaction_no || order.id}')" class="btn-secondary">
                        <i class="fas fa-print"></i> طباعة الفاتورة
                    </button>
                    
                    <button onclick="shareOrder('${order.transaction_no}')" class="btn-secondary">
                        <i class="fas fa-share-alt"></i> مشاركة
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getActivationCodeHtml(order) {
    if (!order.activation_code) {
        if (order.status === 'paid') {
            return `
                <div class="activation-pending">
                    <i class="fas fa-hourglass-half"></i>
                    <h3>جاري تحضير كود التفعيل...</h3>
                    <p>سيتم تعيين كود التفعيل تلقائياً خلال دقائق</p>
                    <button onclick="window.location.reload()" class="btn-refresh">
                        <i class="fas fa-sync-alt"></i> تحديث الصفحة
                    </button>
                </div>
            `;
        }
        return '';
    }
    
    const code = order.activation_code.code;
    const isExpired = order.activation_code.expires_at && 
                     new Date(order.activation_code.expires_at) < new Date();
    
    return `
        <div class="activation-section">
            <h3 class="section-title"><i class="fas fa-key ml-2"></i>كود التفعيل</h3>
            <div class="activation-code ${isExpired ? 'expired' : ''}">
                <div class="code-display">${code}</div>
                <div class="code-actions">
                    <button onclick="copyToClipboard('${code}')" class="btn-copy">
                        <i class="fas fa-copy"></i> نسخ الكود
                    </button>
                    ${isExpired ? `
                        <span class="expired-badge">
                            <i class="fas fa-exclamation-triangle"></i> منتهي الصلاحية
                        </span>
                    ` : ''}
                </div>
                ${order.activation_code.expires_at ? `
                    <p class="expiry-info">
                        <i class="fas fa-calendar-times"></i>
                        ينتهي في ${new Date(order.activation_code.expires_at).toLocaleDateString('ar-SA')}
                    </p>
                ` : ''}
            </div>
        </div>
    `;
}

function getRecentOrdersHtml(recentOrders) {
    if (!recentOrders || recentOrders.length === 0) return '';
    
    return `
        <div class="recent-orders">
            <h3 class="section-title"><i class="fas fa-history ml-2"></i>طلباتك الحديثة</h3>
            <div class="orders-list">
                ${recentOrders.map(order => `
                    <div class="recent-order" onclick="loadOrderById('${order.id}')">
                        <span>${order.transaction_no || order.id.substring(0, 8)}</span>
                        <span class="status-badge small">${getStatusText(order.status)}</span>
                        <span class="date">${new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getStatusBadge(status) {
    const statusConfig = {
        'pending': { text: '⏳ معلق', color: '#f39c12', icon: 'fa-clock' },
        'paid': { text: '✅ مدفوع', color: '#3498db', icon: 'fa-check-circle' },
        'completed': { text: '🎉 مكتمل', color: '#2ecc71', icon: 'fa-award' },
        'failed': { text: '❌ فاشل', color: '#e74c3c', icon: 'fa-times-circle' },
        'refunded': { text: '↩️ مسترد', color: '#9b59b6', icon: 'fa-undo' },
        'processing': { text: '🔄 جاري المعالجة', color: '#1abc9c', icon: 'fa-cog' }
    };
    
    const config = statusConfig[status] || { text: status, color: '#95a5a6', icon: 'fa-question-circle' };
    
    return `
        <span class="status-badge" style="background-color: ${config.color}20; border-color: ${config.color}; color: ${config.color};">
            <i class="fas ${config.icon}"></i>
            ${config.text}
        </span>
    `;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'معلق',
        'paid': 'مدفوع',
        'completed': 'مكتمل',
        'failed': 'فاشل',
        'refunded': 'مسترد',
        'processing': 'جاري المعالجة'
    };
    return statusMap[status] || status;
}

// ================ دوال المساعدة للواجهة ================

function showLoading() {
    const orderDetails = document.getElementById('orderDetails');
    if (!orderDetails) return;
    
    orderDetails.innerHTML = `
        <div class="loading-container">
            <div class="spinner">
                <div class="double-bounce1"></div>
                <div class="double-bounce2"></div>
            </div>
            <p>جاري تحميل تفاصيل طلبك...</p>
        </div>
    `;
}

function showError(message) {
    const orderDetails = document.getElementById('orderDetails');
    if (!orderDetails) return;
    
    orderDetails.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>${message}</h2>
            <p>يرجى التأكد من رابط الطلب أو التواصل مع الدعم الفني</p>
            <div class="error-actions">
                <a href="index.html" class="btn-primary">
                    <i class="fas fa-home"></i> العودة للرئيسية
                </a>
                <button onclick="window.location.reload()" class="btn-secondary">
                    <i class="fas fa-sync-alt"></i> إعادة المحاولة
                </button>
                <a href="https://wa.me/966500000000" class="btn-whatsapp" target="_blank">
                    <i class="fab fa-whatsapp"></i> تواصل مع الدعم
                </a>
            </div>
        </div>
    `;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('تم نسخ الكود بنجاح!', 'success');
    }).catch(err => {
        console.error('فشل النسخ:', err);
        showNotification('فشل نسخ الكود', 'error');
    });
}

function printInvoice(orderId) {
    const printContent = document.getElementById('orderDetails').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div class="print-container">
            <div class="print-header">
                <h1>فاتورة شراء - IRON+</h1>
                <p>رقم الطلب: ${orderId}</p>
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            ${printContent}
            <div class="print-footer">
                <p>شكراً لتعاملك مع IRON+</p>
                <p>للاستفسارات: support@iron-plus.store</p>
            </div>
        </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
}

function shareOrder(transactionNo) {
    if (navigator.share) {
        navigator.share({
            title: 'طلب IRON+ الخاص بي',
            text: `تفاصيل طلبي في IRON+`,
            url: window.location.href
        });
    } else {
        copyToClipboard(window.location.href);
        showNotification('تم نسخ رابط الطلب', 'success');
    }
}

function showActivationInstructions() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-graduation-cap"></i> دليل تفعيل IRON+</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h4>افتح تطبيق IRON+</h4>
                        <p>تأكد من أن لديك آخر نسخة من التطبيق</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h4>اذهب إلى قسم "التفعيل"</h4>
                        <p>يمكنك العثور عليه في القائمة الرئيسية</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h4>أدخل كود التفعيل</h4>
                        <p>انسخ الكود من هذه الصفحة وأدخله في التطبيق</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h4>اضغط على "تفعيل"</h4>
                        <p>انتظر حتى تظهر رسالة التأكيد</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">5</div>
                    <div class="step-content">
                        <h4>أعد تشغيل التطبيق</h4>
                        <p>لضمان تطبيق جميع الميزات الجديدة</p>
                    </div>
                </div>
                <div class="support-note">
                    <i class="fas fa-headset"></i>
                    <p>للحصول على مساعدة فورية، تواصل مع الدعم عبر الواتساب</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                    فهمت، شكراً!
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showNotification(message, type = 'info') {
    // إنشاء الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-times-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 
                          'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // إزالة تلقائية بعد 5 ثواني
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ================ تهيئة SPL (Serverless Functions) ================

// SPL Functions Wrapper
const SPL = {
    // تعيين كود التفعيل
    async assignActivationCode(orderId, productId) {
        try {
            const response = await fetch('/api/assign-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId, productId })
            });
            
            return await response.json();
        } catch (error) {
            console.error('SPL Error:', error);
            return { success: false, error: 'فشل الاتصال بالخادم' };
        }
    },
    
    // تحديث حالة الطلب
    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch('/api/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId, status })
            });
            
            return await response.json();
        } catch (error) {
            console.error('SPL Error:', error);
            return { success: false, error: 'فشل تحديث الحالة' };
        }
    },
    
    // التحقق من صلاحية الكود
    async validateActivationCode(code) {
        try {
            const response = await fetch(`/api/validate-code?code=${code}`);
            return await response.json();
        } catch (error) {
            console.error('SPL Error:', error);
            return { valid: false, message: 'فشل التحقق من الكود' };
        }
    },
    
    // جلب إحصائيات المستخدم
    async getUserStats(phone) {
        try {
            const response = await fetch(`/api/user-stats?phone=${phone}`);
            return await response.json();
        } catch (error) {
            console.error('SPL Error:', error);
            return null;
        }
    }
};

// إضافة SPL للـ window للتوافق مع الكود القديم
window.ironPlus = window.ironPlus || SPL;

// ================ التهيئة النهائية ================

// التحقق من تهيئة Supabase إذا لم تكن موجودة
if (!window.supabaseClient) {
    console.warn('⚠️ Supabase client غير مهيأ، جاري التهيئة...');
    
    // محاولة تهيئة من config
    if (typeof initSupabase === 'function') {
        initSupabase();
    } else {
        // تهيئة افتراضية
        const supabaseUrl = 'https://your-project.supabase.co';
        const supabaseKey = 'your-anon-key';
        
        window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
            db: { schema: 'public' },
            realtime: { params: { eventsPerSecond: 10 } }
        });
    }
}

// إضافة أنماط CSS مدمجة
const addStyles = () => {
    const styles = `
        .success-container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .hud-effect { 
            background: rgba(26, 26, 26, 0.9); 
            border-radius: 16px; 
            border: 1px solid rgba(255, 215, 0, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .details-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 25px; 
        }
        .detail-item { 
            padding: 15px; 
            background: rgba(255, 255, 255, 0.05); 
            border-radius: 10px; 
        }
        .text-gold { color: #FFD700; }
        .monospace { font-family: 'Courier New', monospace; }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin: 5px 0;
        }
        .product-card, .payment-amount {
            padding: 20px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            margin: 15px 0;
        }
        .amount {
            font-size: 32px;
            font-family: 'Orbitron', sans-serif;
            color: #FFD700;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        .activation-code {
            padding: 25px;
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 150, 255, 0.1));
            border-radius: 15px;
            border: 2px solid #3498db;
            text-align: center;
            margin: 20px 0;
        }
        .code-display {
            font-family: 'Courier New', monospace;
            font-size: 28px;
            font-weight: bold;
            padding: 15px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            margin: 15px 0;
            letter-spacing: 3px;
        }
        .action-buttons {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 30px;
            justify-content: center;
        }
        .btn-primary, .btn-secondary {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s;
        }
        .btn-primary {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .loading-container {
            text-align: center;
            padding: 60px 20px;
        }
        .spinner {
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            position: relative;
        }
        .double-bounce1, .double-bounce2 {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: #FFD700;
            opacity: 0.6;
            position: absolute;
            top: 0;
            left: 0;
            animation: bounce 2.0s infinite ease-in-out;
        }
        .double-bounce2 { animation-delay: -1.0s; }
        @keyframes bounce {
            0%, 100% { transform: scale(0.0); }
            50% { transform: scale(1.0); }
        }
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        }
        .notification.success { background: rgba(46, 204, 113, 0.9); }
        .notification.error { background: rgba(231, 76, 60, 0.9); }
        .notification.warning { background: rgba(241, 196, 15, 0.9); }
        .notification.info { background: rgba(52, 152, 219, 0.9); }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }
        .modal-content {
            background: #1a1a1a;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid rgba(255, 215, 0, 0.3);
        }
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 20px; text-align: center; }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
};

// تشغيل إضافة الأنماط بعد تحميل الصفحة
setTimeout(addStyles, 100);

// تهيئة SPL عند التحميل
window.SPL = SPL;
console.log('✅ SPL Functions loaded successfully');
