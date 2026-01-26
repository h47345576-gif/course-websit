// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Check current page and initialize
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Update navigation based on auth state
    updateNavigation();

    // Page-specific initialization
    switch (currentPage) {
        case 'index.html':
        case '':
            loadFeaturedCourses();
            break;
        case 'courses.html':
            loadAllCourses();
            break;
        case 'course.html':
            loadCourseDetails();
            break;
        case 'login.html':
            initLoginForm();
            break;
        case 'register.html':
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
    const isFree = course.price === 0;

    return `
        <a href="course.html?id=${course.id}" class="course-card">
            <div class="course-image">
                <img src="${course.thumbnail_url}" alt="${course.title}" 
                     onerror="this.src='https://via.placeholder.com/400x200?text=Course'">
                ${isFree ? '<span class="course-badge free">مجاني</span>' : ''}
            </div>
            <div class="course-content">
                <span class="course-category">${course.category}</span>
                <h3 class="course-title">${course.title}</h3>
                <p class="course-instructor">👨‍🏫 ${course.instructor}</p>
                <div class="course-meta">
                    <span class="course-price ${isFree ? 'free' : ''}">${formatPrice(course.price)}</span>
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
        const course = await api.getCourse(courseId);
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

    container.innerHTML = `
        <div class="course-header">
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
            <div class="course-header-image">
                <img src="${course.thumbnail_url}" alt="${course.title}">
            </div>
        </div>
        
        <div class="course-body">
            <div class="course-content-section">
                <h2>محتوى الكورس</h2>
                <div class="lessons-list">
                    ${lessons.map((lesson, index) => `
                        <div class="lesson-item">
                            <span class="lesson-number">${index + 1}</span>
                            <div class="lesson-info">
                                <h4>${lesson.title}</h4>
                                <span class="lesson-type">${getLessonTypeIcon(lesson.type)} ${getLessonTypeName(lesson.type)}</span>
                            </div>
                            <span class="lesson-duration">${formatLessonDuration(lesson.duration_seconds)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="course-sidebar">
                <div class="price-card">
                    <div class="price-value ${isFree ? 'free' : ''}">${formatPrice(course.price)}</div>
                    ${api.isLoggedIn()
            ? `<button class="btn btn-primary btn-lg" onclick="enrollInCourse(${course.id})">سجل الآن</button>`
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

            // Check for redirect
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'index.html';
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
