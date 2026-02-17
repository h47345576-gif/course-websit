// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Check current page and initialize
    const path = window.location.pathname;
    const pageName = path.split('/').pop().toLowerCase();

    // Normalize page name (handle clean URLs)
    let page = pageName;
    if (pageName === '' || pageName === 'index' || pageName === 'index.html') page = 'index';
    else if (pageName === 'courses' || pageName === 'courses.html') page = 'courses';
    else if (pageName === 'course' || pageName === 'course.html') page = 'course';
    else if (pageName === 'login' || pageName === 'login.html') page = 'login';
    else if (pageName === 'register' || pageName === 'register.html') page = 'register';

    console.log('Current page detected:', page); // Debugging

    // Update navigation based on auth state
    updateNavigation();

    // Page-specific initialization
    switch (page) {
        case 'index':
            loadFeaturedCourses();
            break;
        case 'courses':
            loadAllCourses();
            break;
        case 'course':
            loadCourseDetails();
            break;
        case 'login':
            initLoginForm();
            break;
        case 'register':
            initRegisterForm();
            break;
    }
});

// Update navigation based on login state
function updateNavigation() {
    const navButtons = document.querySelector('.nav-buttons');
    if (!navButtons) return;

    if (api.isLoggedIn()) {
        const user = api.getCurrentUser();
        navButtons.innerHTML = `
            <span class="user-greeting">مرحباً، ${user?.name || 'المستخدم'}</span>
            <button onclick="api.logout()" class="btn btn-outline">تسجيل الخروج</button>
        `;
    }
}

// Load featured courses on homepage
async function loadFeaturedCourses() {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    try {
        const data = await api.getCourses();
        const courses = data.results || [];

        if (courses.length === 0) {
            grid.innerHTML = '<p class="no-courses">لا توجد كورسات متاحة حالياً</p>';
            return;
        }

        grid.innerHTML = courses.map(course => createCourseCard(course)).join('');

        // Update stats
        const coursesCount = document.getElementById('coursesCount');
        if (coursesCount) {
            coursesCount.textContent = courses.length + '+';
        }
    } catch (error) {
        grid.innerHTML = `<p class="error-message">خطأ في تحميل الكورسات: ${error.message}</p>`;
    }
}

// Load all courses on courses page
async function loadAllCourses() {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    // Get category filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');

    try {
        const data = await api.getCourses();
        let courses = data.results || [];

        // Filter by category if specified
        if (categoryFilter) {
            courses = courses.filter(c => c.category === categoryFilter);

            // Update page title
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) {
                pageTitle.textContent = `كورسات ${categoryFilter}`;
            }
        }

        if (courses.length === 0) {
            grid.innerHTML = '<p class="no-courses">لا توجد كورسات متاحة في هذا التصنيف</p>';
            return;
        }

        grid.innerHTML = courses.map(course => createCourseCard(course)).join('');
    } catch (error) {
        grid.innerHTML = `<p class="error-message">خطأ في تحميل الكورسات: ${error.message}</p>`;
    }
}

// Create course card HTML
function createCourseCard(course) {
    const isFree = course.price === 0 && (!course.original_price || course.original_price === 0);
    const hasDiscount = course.discount_percentage > 0 && course.original_price > 0;

    return `
        <a href="course.html?id=${course.id}" class="course-card">
            <div class="course-image">
                <img src="${course.thumbnail_url}" alt="${course.title}" 
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200?text=Course'">
                ${isFree ? '<span class="course-badge free">مجاني</span>' : ''}
                ${hasDiscount ? `<span class="course-badge" style="position: absolute; bottom: 12px; right: 12px; top: auto; background: linear-gradient(135deg, #ef4444, #f97316);">خصم ${course.discount_percentage}%</span>` : ''}
            </div>
            <div class="course-content">
                <span class="course-category">${course.category}</span>
                <h3 class="course-title">${course.title}</h3>
                <p class="course-instructor">👨‍🏫 ${course.instructor}</p>
                <div class="course-meta">
                    <span class="course-price ${isFree ? 'free' : ''}">${formatPrice(course.price, course.original_price, course.discount_percentage)}</span>
                    <span class="course-duration">⏱ ${formatDuration(course.duration_minutes)}</span>
                </div>
            </div>
        </a>
    `;
}

// Load course details
async function loadCourseDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        window.location.href = 'courses.html';
        return;
    }

    const container = document.getElementById('courseDetails');
    if (!container) return;

    try {
        const [course, lessonsData] = await Promise.all([
            api.getCourse(courseId),
            api.getCourseLessons(courseId)
        ]);

        // Merge full lessons data (with content_url) into course object
        if (lessonsData && lessonsData.results) {
            course.lessons = lessonsData.results;
        }

        displayCourseDetails(course);
    } catch (error) {
        container.innerHTML = `<p class="error-message">خطأ في تحميل الكورس: ${error.message}</p>`;
    }
}

// Display course details
function displayCourseDetails(course) {
    const container = document.getElementById('courseDetails');
    const isFree = course.price === 0;
    const lessons = course.lessons || [];

    // Check if user is enrolled (This is a basic check, ideally backend should confirm)
    // For now, we assume if they can see the content_url, they can play it.
    // Since our backend endpoint /:id/lessons is public, we can just check if url exists.

    window.currentCourse = course; // Store for easy access

    container.innerHTML = `
        <div class="course-header">
            <div class="container">
                <div class="course-header-content">
                    <span class="course-category">${course.category}</span>
                    <h1>${course.title}</h1>
                    <p class="course-description">${course.description}</p>
                    <div class="course-meta-info">
                        <span>👨‍🏫 ${course.instructor}</span>
                        <span>📚 ${lessons.length} درس</span>
                        <span>⏱ ${formatDuration(course.duration_minutes)}</span>
                    </div>
                </div>
                <div class="course-header-image" id="coursePlayer">
                    <img src="${course.thumbnail_url}" alt="${course.title}">
                    ${lessons.length > 0 ? `<button class="btn btn-primary" onclick="playLesson(${lessons[0].id})">▶ ابدأ المشاهدة</button>` : ''}
                </div>
            </div>
        </div>
        
        <div class="course-body">
            <div class="course-content-section">
                <h2>محتوى الكورس</h2>
                <div class="lessons-list">
                    ${lessons.map((lesson, index) => `
                        <div class="lesson-item ${lesson.content_url ? 'clickable' : ''}" onclick="${lesson.content_url ? `playLesson(${lesson.id})` : ''}" style="${lesson.content_url ? 'cursor: pointer;' : ''}">
                            <span class="lesson-number">${index + 1}</span>
                            <div class="lesson-info">
                                <h4>${lesson.title}</h4>
                                <span class="lesson-type">${getLessonTypeIcon(lesson.type)} ${getLessonTypeName(lesson.type)}</span>
                            </div>
                            <span class="lesson-duration">${formatLessonDuration(lesson.duration_seconds)}</span>
                            ${lesson.content_url ? '<span>▶</span>' : '<span>🔒</span>'}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="course-sidebar">
                <div class="price-card">
                    ${course.discount_percentage > 0 && course.original_price > 0 ? `<div style="text-align: center; margin-bottom: 10px;">
                        <span style="background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 5px 12px; border-radius: 20px; font-weight: 600; font-size: 0.9rem;">خصم ${course.discount_percentage}%</span>
                    </div>` : ''}
                    <div class="price-value ${isFree ? 'free' : ''}">${formatPrice(course.price, course.original_price, course.discount_percentage)}</div>
                    ${api.isLoggedIn()
            ? `<button class="btn btn-primary btn-lg" onclick="enrollInCourse(${course.id})">سجل الآن / تابع</button>`
            : `<a href="login.html?redirect=course.html?id=${course.id}" class="btn btn-primary btn-lg">سجل دخول للتسجيل</a>`
        }
                    <ul class="course-includes">
                        <li>✅ ${lessons.length} درس فيديو</li>
                        <li>✅ وصول مدى الحياة</li>
                        <li>✅ شهادة عند الإكمال</li>
                        ${course.can_download ? '<li>✅ قابل للتحميل</li>' : ''}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Play Lesson Function
function playLesson(lessonId) {
    if (!window.currentCourse || !window.currentCourse.lessons) return;

    const lesson = window.currentCourse.lessons.find(l => l.id == lessonId);
    if (!lesson || !lesson.content_url) {
        alert('هذا الدرس غير متاح حالياً');
        return;
    }

    const playerContainer = document.getElementById('coursePlayer');
    if (!playerContainer) return;

    // Scroll to player
    playerContainer.scrollIntoView({ behavior: 'smooth' });

    if (lesson.type === 'video') {
        // Add playing class to expand the container
        playerContainer.classList.add('playing');

        // Check if it's a direct file or YouTube/Vimeo
        if (lesson.content_url.includes('youtube.com') || lesson.content_url.includes('youtu.be')) {
            playerContainer.innerHTML = `<iframe width="100%" height="100%" src="${lesson.content_url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>`;
        } else {
            // Direct Video File
            playerContainer.innerHTML = `
                <video controls width="100%" height="100%" autoplay style="object-fit: contain;">
                    <source src="${lesson.content_url}" type="video/mp4">
                    متصفحك لا يدعم تشغيل الفيديو.
                </video>
             `;
        }
    } else if (lesson.type === 'pdf') {
        // For non-video content, remove playing class
        playerContainer.classList.remove('playing');
        playerContainer.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>📄 ${lesson.title}</h3>
                <p>هذا الدرس عبارة عن ملف PDF.</p>
                <a href="${lesson.content_url}" target="_blank" class="btn btn-primary">فتح الملف</a>
            </div>
        `;
    } else {
        playerContainer.classList.remove('playing');
        playerContainer.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px;">
                <h3>${lesson.title}</h3>
                <p>${lesson.text_content || 'لا يوجد محتوى نصي.'}</p>
            </div>
        `;
    }
}

// Helper functions for lessons
function getLessonTypeIcon(type) {
    switch (type) {
        case 'video': return '🎬';
        case 'text': return '📝';
        case 'pdf': return '📄';
        default: return '📚';
    }
}

function getLessonTypeName(type) {
    switch (type) {
        case 'video': return 'فيديو';
        case 'text': return 'نص';
        case 'pdf': return 'PDF';
        default: return 'درس';
    }
}

function formatLessonDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Enroll in course
async function enrollInCourse(courseId) {
    if (!window.currentCourse) return;

    const course = window.currentCourse;
    const isFree = course.price === 0 && (!course.original_price || course.original_price === 0);

    if (isFree) {
        // Free course - direct enrollment
        try {
            await api.enrollInCourse(courseId);
            alert('تم التسجيل بنجاح! 🎉');
            window.location.reload();
        } catch (error) {
            alert('خطأ: ' + error.message);
        }
    } else {
        // Paid course - show payment modal
        showPaymentModal(course);
    }
}

// Payment System Functions
let currentPaymentData = {};

function showPaymentModal(course) {
    window.currentPaymentCourse = course;

    // Update course info in modal
    const infoDiv = document.getElementById('coursePaymentInfo');
    infoDiv.innerHTML = `
        <h3>${course.title}</h3>
        <div class="price">${formatPrice(course.price, course.original_price, course.discount_percentage)}</div>
    `;

    // Reset modal to step 1
    document.getElementById('paymentStep1').style.display = 'block';
    document.getElementById('paymentStep2').style.display = 'none';
    document.getElementById('paymentStep3').style.display = 'none';

    // Show modal
    const modal = document.getElementById('paymentModal');
    modal.classList.add('active');
    modal.style.display = 'flex';
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);

    // Reset data
    currentPaymentData = {};
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
    });
}

function selectPaymentMethod(method) {
    currentPaymentData.method = method;
    currentPaymentData.amount = window.currentPaymentCourse.price;

    // Highlight selected method
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.payment-method-card').classList.add('selected');

    // Show step 2 with payment details
    document.getElementById('paymentStep1').style.display = 'none';
    document.getElementById('paymentStep2').style.display = 'block';

    // Generate payment details based on method
    const detailsDiv = document.getElementById('paymentDetails');

    if (method === 'cash') {
        detailsDiv.innerHTML = `
            <div class="cash-info">
                <h3>💵 الدفع كاش</h3>
                <p>قم بالدفع مباشرة في المكتب أو للمعلم</p>
                <p><strong>العنوان:</strong> دمشق - المزة - شارع الجلاء</p>
                <p><strong>ساعات العمل:</strong> 9 صباحاً - 6 مساءً</p>
                <p style="margin-top: 15px; font-size: 0.9rem;">بعد الدفع، قم برفع صورة الإيصال للتأكيد</p>
            </div>
            <div class="payment-info-row">
                <span class="payment-info-label">المبلغ المطلوب:</span>
                <span class="payment-info-value" style="font-size: 1.3rem; color: #667eea;">${formatPrice(currentPaymentData.amount, null, null)}</span>
            </div>
        `;
    } else if (method === 'bank_transfer') {
        detailsDiv.innerHTML = `
            <div class="bank-info">
                <h3>🏦 معلومات الحساب البنكي</h3>
                <div class="bank-account-detail">
                    <span><strong>اسم البنك:</strong> بنك سورية الدولي الإسلامي</span>
                </div>
                <div class="bank-account-detail">
                    <span><strong>رقم الحساب:</strong> 123456789</span>
                    <button class="copy-btn" onclick="copyToClipboard('123456789')">نسخ</button>
                </div>
                <div class="bank-account-detail">
                    <span><strong>الاسم:</strong> منصة التعلم التعليمية</span>
                </div>
                <p style="margin-top: 15px; font-size: 0.9rem; text-align: center;">بعد التحويل، قم برفع صورة الإيصال للتأكيد</p>
            </div>
            <div class="payment-info-row">
                <span class="payment-info-label">المبلغ المطلوب:</span>
                <span class="payment-info-value" style="font-size: 1.3rem; color: #4facfe;">${formatPrice(currentPaymentData.amount, null, null)}</span>
            </div>
        `;
    } else if (method === 'online') {
        detailsDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 15px; text-align: center; color: #333;">
                <h3>💳 الدفع الإلكتروني</h3>
                <p>سيتم توجيهك إلى بوابة الدفع الآمنة</p>
                <p style="margin-top: 15px; font-size: 0.9rem;">⚡ الدفع الإلكتروني سيتم تفعيله قريباً</p>
            </div>
            <div class="payment-info-row">
                <span class="payment-info-label">المبلغ المطلوب:</span>
                <span class="payment-info-value" style="font-size: 1.3rem; color: #a8edea;">${formatPrice(currentPaymentData.amount, null, null)}</span>
            </div>
        `;
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('تم النسخ بنجاح! ✅');
    });
}

async function submitPayment() {
    const notes = document.getElementById('paymentNotes').value;
    currentPaymentData.notes = notes;

    try {
        const response = await api.submitPayment(window.currentPaymentCourse.id, currentPaymentData);

        window.currentPaymentId = response.payment_id;

        document.getElementById('paymentStep2').style.display = 'none';
        document.getElementById('paymentStep3').style.display = 'block';

        if (response.status === 'pending' && response.message?.includes('pending')) {
            alert('لديك طلب دفع قيد الانتظار لهذا الكورس. يمكنك رفع الإيصال الآن.');
        }

    } catch (error) {
        if (error.message.includes('already paid')) {
            alert('✅ تم تأكيد دفعك مسبقاً!\n\nيمكنك الوصول للكورس مباشرة.');
            closePaymentModal();
        } else if (error.message.includes('pending')) {
            alert('⏳ لديك طلب دفع قيد المراجعة.\n\nيرجى الانتظار حتى يتم مراجعة إيصالك من الإدارة.');
            closePaymentModal();
        } else {
            alert('⚠️ حدث خطأ أثناء إرسال طلب الدفع.\n\nيرجى المحاولة مرة أخرى أو التواصل مع الدعم.');
        }
    }
}

function handleReceiptSelected() {
    const fileInput = document.getElementById('receiptFile');
    const file = fileInput.files[0];

    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = function (e) {
        const preview = document.getElementById('receiptPreview');
        preview.innerHTML = `
            <img src="${e.target.result}" alt="Receipt">
            <div class="upload-progress" style="display: none;">
                <div class="upload-progress-bar" id="uploadProgressBar"></div>
            </div>
            <button class="btn btn-primary" onclick="uploadReceipt()">📤 رفع الإيصال</button>
        `;
    };
    reader.readAsDataURL(file);
}

async function uploadReceipt() {
    const fileInput = document.getElementById('receiptFile');
    const file = fileInput.files[0];

    if (!file || !window.currentPaymentId) {
        alert('حدث خطأ. الرجاء المحاولة مرة أخرى.');
        return;
    }

    // Show progress
    const progressContainer = document.querySelector('.upload-progress');
    const progressBar = document.getElementById('uploadProgressBar');
    progressContainer.style.display = 'block';
    progressBar.style.width = '30%';

    try {
        await api.uploadReceipt(window.currentPaymentId, file);

        progressBar.style.width = '100%';

        setTimeout(() => {
            alert('تم رفع الإيصال بنجاح! ✅\nسيتم مراجعة الدفع وتفعيل الكورس قريباً.');
            closePaymentModal();
            window.location.reload();
        }, 500);

    } catch (error) {
        progressBar.style.width = '0%';
        progressContainer.style.display = 'none';
        alert('خطأ في رفع الإيصال: ' + error.message);
    }
}

// Login form
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = form.email.value;
        const password = form.password.value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('loginError');

        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري تسجيل الدخول...';
        errorDiv.textContent = '';

        try {
            await api.login(email, password);

            // Get user and check role for redirect
            const user = api.getCurrentUser();
            const urlParams = new URLSearchParams(window.location.search);
            let redirect = urlParams.get('redirect');

            if (!redirect) {
                if (user.role === 'admin') {
                    redirect = 'admin/index.html';
                } else if (user.role === 'teacher') {
                    redirect = 'teacher/index.html';
                } else {
                    redirect = 'index.html';
                }
            }

            window.location.href = redirect;
        } catch (error) {
            errorDiv.textContent = error.message;
            submitBtn.disabled = false;
            submitBtn.textContent = 'تسجيل الدخول';
        }
    });
}

// Register form
function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;
        const phone = form.phone?.value || '';
        const submitBtn = form.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('registerError');

        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري إنشاء الحساب...';
        errorDiv.textContent = '';

        try {
            await api.register(name, email, password, phone);
            window.location.href = 'index.html';
        } catch (error) {
            errorDiv.textContent = error.message;
            submitBtn.disabled = false;
            submitBtn.textContent = 'إنشاء حساب';
        }
    });
}
