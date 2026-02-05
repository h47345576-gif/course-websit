// Teacher Dashboard Logic

// Check Auth
function checkTeacherAuth() {
    if (!api.isLoggedIn()) {
        window.location.href = '../login.html';
        return;
    }
    const user = api.getCurrentUser();
    // In real app, check role === 'teacher'
    const teacherNameEl = document.getElementById('teacherName');
    if (teacherNameEl) {
        teacherNameEl.textContent = `مرحباً، ${user.name}`;
    }
}

function logout() {
    api.logout();
    window.location.href = '../index.html';
}

// Sidebar Rendering Logic
function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Robust page detection
    const path = window.location.pathname;
    let page = path.split('/').pop();

    // Handle URL parameters or hashes
    if (page.includes('?')) page = page.split('?')[0];
    if (page.includes('#')) page = page.split('#')[0];

    // Handle trailing slash or empty path
    if (page === '') page = 'index.html';

    // Normalize to page name without extension
    const currentPageName = page.replace('.html', '');

    const menuItems = [
        { name: 'الرئيسية', icon: '📊', link: 'index.html' },
        { name: 'كورساتي', icon: '📚', link: 'courses.html' },
        { name: 'طلابي', icon: '👥', link: 'students.html' },
        { name: 'الملف الشخصي', icon: '👤', link: 'profile.html' }
    ];

    const menuHtml = menuItems.map(item => {
        const itemPageName = item.link.replace('.html', '');
        // Check exact match or if current page implies this item (e.g. sub-pages)
        const isActive = currentPageName === itemPageName;

        return `
        <a href="${item.link}" class="nav-item ${isActive ? 'active' : ''}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.name}</span>
        </a>
    `}).join('');

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <span class="logo-icon">👨‍🏫</span>
            <span class="logo-text">لوحة المعلم</span>
        </div>
        <nav class="sidebar-nav">
            ${menuHtml}
        </nav>
        <div class="sidebar-footer">
            <a href="../index.html" class="nav-item">
                <span class="nav-icon">🌐</span>
                <span>عرض الموقع</span>
            </a>
            <button class="nav-item logout-btn" onclick="logout()">
                <span class="nav-icon">🚪</span>
                <span>تسجيل الخروج</span>
            </button>
        </div>
    `;

    // Mobile Menu Toggle Logic
    setupMobileMenu();
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    // Remove existing listeners to avoid duplicates if re-rendered
    const newToggle = menuToggle?.cloneNode(true);
    if (menuToggle && newToggle) {
        menuToggle.parentNode.replaceChild(newToggle, menuToggle);

        newToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 &&
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            extractMenuToggle(e.target) !== newToggle) {

            // Helper to check if target is toggle or child of toggle
            function extractMenuToggle(el) {
                return el.closest('#menuToggle');
            }

            // If click is not on toggle button
            if (!e.target.closest('#menuToggle')) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Logic for Index Page
// Logic for Index Page
async function loadTeacherStats() {
    const coursesCountEl = document.getElementById('myCoursesCount');
    if (!coursesCountEl) return;

    try {
        // Fetch all courses and filter by current user name (Mock logic)
        // In real app, API would return only my courses
        const user = api.getCurrentUser();
        const data = await api.getCourses();
        const allCourses = data.results || [];

        // Filter courses where instructor name matches user name (Simple mock)
        // For debugging/demo, we'll show all courses if filter returns empty, or just show all
        let myCourses = allCourses.filter(c => c.instructor.includes(user.name.split(' ')[0]));

        // Fallback: If no courses match, show all (since we are using mismatched seed names vs login names)
        if (myCourses.length === 0) {
            myCourses = allCourses;
        }

        coursesCountEl.textContent = myCourses.length;
        document.getElementById('myStudentsCount').textContent = Math.floor(Math.random() * 50) + 10; // Mock
        document.getElementById('rating').textContent = '4.8';

        loadRecentEnrollments();
    } catch (error) {
        console.error(error);
    }
}

function loadRecentEnrollments() {
    const container = document.getElementById('recentEnrollments');
    if (!container) return;

    // Mock data
    const students = [
        { name: 'علي الطالب', course: 'تطوير الويب', date: 'منذ ساعتين' },
        { name: 'فاطمة', course: 'Flutter', date: 'منذ 5 ساعات' },
        { name: 'عمر', course: 'الرياضيات', date: 'أمس' }
    ];

    container.innerHTML = `
        <div class="item-list">
            ${students.map(s => `
                <div class="list-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                    <div>
                        <strong>${s.name}</strong> سجل في <span>${s.course}</span>
                    </div>
                    <span style="color:#888; font-size:0.8rem">${s.date}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Logic for Courses Page
async function loadTeacherCourses() {
    const grid = document.getElementById('myCoursesGrid');
    if (!grid) return;

    try {
        const user = api.getCurrentUser();
        const data = await api.getCourses();
        const allCourses = data.results || [];

        // Filter by exact instructor name matching current user
        let myCourses = allCourses.filter(c => c.instructor === user.name);

        // Fallback for demo/existing data
        if (myCourses.length === 0) {
            myCourses = allCourses.filter(c => c.instructor.includes(user.name.split(' ')[0]));
        }

        if (myCourses.length === 0) {
            grid.innerHTML = '<p>لا توجد كورسات لك بعد.</p>';
            return;
        }

        grid.innerHTML = myCourses.map(course => `
            <div class="course-card">
                <img src="${course.thumbnail_url}" class="course-img">
                <div class="course-body">
                    <h4>${course.title}</h4>
                    <p style="font-size:0.9rem; color:#666; margin:5px 0;">${course.category}</p>
                    <button class="btn-primary" style="width:100%; margin-top:10px;" onclick="openAddLesson(${course.id})">
                        + إضافة درس
                    </button>
                    <div class="course-actions">
                        <button class="btn-action btn-edit" onclick="editCourse(${course.id})">تعديل</button>
                        <button class="btn-action btn-delete" onclick="deleteCourse(${course.id})">حذف</button>
                    </div>
                    <a href="../course.html?id=${course.id}" class="btn-link" style="display:block; text-align:center; margin-top:5px;">عرض الكورس</a>
                </div>
            </div>
        `).join('');

    } catch (error) {
        grid.innerHTML = `<p class="error">خطأ: ${error.message}</p>`;
    }
}

// Course Modal Functions
function openAddCourseModal() {
    document.getElementById('courseModalTitle').textContent = 'إضافة كورس جديد';
    document.getElementById('courseForm').reset();
    document.getElementById('editCourseId').value = '';

    // Set default instructor to current user
    const user = api.getCurrentUser();
    if (user) {
        document.getElementById('courseInstructor').value = user.name;
    }

    document.getElementById('courseModal').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeCourseModal() {
    document.getElementById('courseModal').classList.remove('active');
    document.body.classList.remove('modal-open');
    document.getElementById('courseForm').reset();
    document.getElementById('editCourseId').value = '';
}

async function editCourse(courseId) {
    try {
        const data = await api.getCourses();
        const course = (data.results || []).find(c => c.id === courseId);

        if (course) {
            document.getElementById('courseModalTitle').textContent = 'تعديل الكورس';
            document.getElementById('editCourseId').value = courseId;
            document.getElementById('courseTitle').value = course.title || '';
            document.getElementById('courseDescription').value = course.description || '';
            document.getElementById('courseInstructor').value = course.instructor || '';
            document.getElementById('courseThumbnail').value = course.thumbnail_url || '';
            document.getElementById('courseDuration').value = course.duration || '';
            document.getElementById('courseRequirements').value = course.requirements || '';
            document.getElementById('courseExtraContent').value = course.extra_content || '';
            document.getElementById('coursePrice').value = course.price || 0;
            document.getElementById('courseCategory').value = course.category || 'برمجة';

            document.getElementById('courseModal').classList.add('active');
            document.body.classList.add('modal-open');
        }
    } catch (error) {
        alert('خطأ في تحميل بيانات الكورس: ' + error.message);
    }
}

async function deleteCourse(courseId) {
    if (!confirm('هل أنت متأكد من حذف هذا الكورس؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }

    try {
        await api.deleteCourse(courseId);
        alert('تم حذف الكورس بنجاح!');
        loadTeacherCourses();
    } catch (error) {
        alert('خطأ في حذف الكورس: ' + error.message);
    }
}

async function submitCourseForm(event) {
    event.preventDefault();

    const form = event.target;
    const courseId = document.getElementById('editCourseId').value;

    const courseData = {
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        instructor: document.getElementById('courseInstructor').value,
        thumbnail_url: document.getElementById('courseThumbnail').value,
        duration: document.getElementById('courseDuration').value,
        requirements: document.getElementById('courseRequirements').value,
        extra_content: document.getElementById('courseExtraContent').value,
        price: parseFloat(document.getElementById('coursePrice').value) || 0,
        category: document.getElementById('courseCategory').value
    };

    try {
        if (courseId) {
            await api.updateCourse(courseId, courseData);
            alert('تم تحديث الكورس بنجاح!');
        } else {
            await api.createCourse(courseData);
            alert('تم إضافة الكورس بنجاح!');
        }

        closeCourseModal();
        loadTeacherCourses();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
}

// Modal Logic
function openAddLesson(courseId) {
    document.getElementById('courseIdField').value = courseId;
    document.getElementById('addLessonModal').classList.add('active');
}

function closeLessonModal() {
    document.getElementById('addLessonModal').classList.remove('active');
}

async function submitLessonForm(event) {
    event.preventDefault();

    const courseId = document.getElementById('courseIdField').value;
    const lessonData = {
        title: document.getElementById('lessonTitle').value,
        type: document.getElementById('lessonType').value,
        content_url: document.getElementById('lessonUrl').value,
        duration_seconds: parseInt(document.getElementById('lessonDuration').value) || 0,
        order_num: 0 // Default order
    };

    try {
        await api.createLesson(courseId, lessonData);
        alert('تم إضافة الدرس بنجاح!');
        closeLessonModal();
    } catch (error) {
        alert('خطأ في إضافة الدرس: ' + error.message);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderSidebar(); // Initializing dynamic sidebar first
    checkTeacherAuth();

    const page = window.location.pathname.split('/').pop();
    if (page === 'index.html' || page === '') {
        loadTeacherStats();
    } else if (page === 'courses.html') {
        loadTeacherCourses();
    }

    // Lesson Form Listener
    document.getElementById('addLessonForm')?.addEventListener('submit', submitLessonForm);

    // Course Form Listener
    document.getElementById('courseForm')?.addEventListener('submit', submitCourseForm);
});
