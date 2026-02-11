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
    try {
        await api.enrollInCourse(courseId);
        alert('تم التسجيل بنجاح! 🎉');
        window.location.reload();
    } catch (error) {
        alert('خطأ: ' + error.message);
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
