// Teacher Dashboard Logic

// Check Auth
function checkTeacherAuth() {
    if (!api.isLoggedIn()) {
        window.location.href = '../login.html';
        return;
    }
    const user = api.getCurrentUser();
    // In real app, check role === 'teacher'
    document.getElementById('teacherName').textContent = `مرحباً، ${user.name}`;
}

function logout() {
    api.logout();
    window.location.href = '../index.html';
}

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
        const myCourses = allCourses.filter(c => c.instructor.includes(user.name.split(' ')[0]));

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
        // Mock filtering
        const myCourses = (data.results || []).filter(c => c.instructor.includes(user.name.split(' ')[0]));

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
                    <a href="../course.html?id=${course.id}" class="btn-link" style="display:block; text-align:center; margin-top:5px;">عرض الكورس</a>
                </div>
            </div>
        `).join('');

    } catch (error) {
        grid.innerHTML = `<p class="error">خطأ: ${error.message}</p>`;
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

// Init
document.addEventListener('DOMContentLoaded', () => {
    checkTeacherAuth();

    const page = window.location.pathname.split('/').pop();
    if (page === 'index.html' || page === '') {
        loadTeacherStats();
    } else if (page === 'courses.html') {
        loadTeacherCourses();
    }

    // Form Listener
    document.getElementById('addLessonForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('سيتم إضافة الدرس قريباً! (يحتاج endpoint في API)');
        closeLessonModal();
    });
});
