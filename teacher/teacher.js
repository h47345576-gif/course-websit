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
        console.log('Current user:', user);

        const data = await api.getCourses();
        console.log('API Response:', data);

        const allCourses = data.results || [];
        console.log('All courses count:', allCourses.length);

        // Filter: Only show courses created by this user (unless admin)
        let myCourses = allCourses;

        // Filter courses where instructor name matches user name
        // This prevents the 403 Forbidden error when trying to delete someone else's course
        if (user.role !== 'admin') {
            myCourses = allCourses.filter(c => c.instructor === user.name);
        }

        if (myCourses.length === 0) {
            grid.innerHTML = '<p>لا توجد كورسات بعد. اضغط على "إضافة كورس جديد" لإنشاء كورس.</p>';
            return;
        }

        grid.innerHTML = myCourses.map(course => `
            <div class="course-card">
                <img src="${course.thumbnail_url || 'https://via.placeholder.com/300x200?text=Course'}" class="course-img" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Course'">
                <div class="course-body">
                    <h4>${course.title}</h4>
                    <p style="font-size:0.9rem; color:#666; margin:5px 0;">${course.category || 'غير مصنف'}</p>
                    <p style="font-size:0.8rem; color:#888;">المدرّس: ${course.instructor || 'غير محدد'}</p>
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
        console.error('Error loading courses:', error);
        grid.innerHTML = `<p class="error">خطأ في تحميل الكورسات: ${error.message}</p>`;
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

    // Handle Image Upload
    const fileInput = document.getElementById('courseThumbnailFile');
    let thumbnailUrl = document.getElementById('courseThumbnail').value.trim();

    // If a file is selected, try to upload it
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadBtn = form.querySelector('button[type="submit"]');
            const originalText = uploadBtn.textContent;
            uploadBtn.textContent = 'جاري رفع الصورة...';
            uploadBtn.disabled = true;

            const uploadResponse = await api.request('/courses/upload', {
                method: 'POST',
                body: formData
            });

            if (uploadResponse && uploadResponse.url) {
                thumbnailUrl = uploadResponse.url;
            }

            uploadBtn.textContent = originalText;
            uploadBtn.disabled = false;
        } catch (error) {
            console.warn('Image upload failed, using URL or default:', error.message);
            // Don't return - continue with URL or default
            const uploadBtn = form.querySelector('button[type="submit"]');
            if (uploadBtn) {
                uploadBtn.textContent = 'حفظ';
                uploadBtn.disabled = false;
            }
        }
    }

    const courseData = {
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        instructor: document.getElementById('courseInstructor').value,
        thumbnail_url: thumbnailUrl,
        duration: document.getElementById('courseDuration').value, // Handled by backend map
        requirements: document.getElementById('courseRequirements').value,
        extra_content: document.getElementById('courseExtraContent').value,
        price: parseFloat(document.getElementById('coursePrice').value) || 0,
        category: document.getElementById('courseCategory').value
    };

    console.log('Sending course data:', courseData);

    try {
        if (courseId) {
            await api.updateCourse(courseId, courseData);
            alert('تم تحديث الكورس بنجاح!');
        } else {
            const result = await api.createCourse(courseData);
            console.log('Course created successfully:', result);
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

async function uploadVideo(file) {
    const progressBar = document.getElementById('uploadProgressBar');
    const statusText = document.getElementById('uploadStatusText');
    const container = document.getElementById('uploadProgressContainer');

    container.style.display = 'block';
    progressBar.style.width = '0%';
    statusText.textContent = 'جاري التحضير للرفع...';

    try {
        // 1. Get Presigned URL
        statusText.textContent = 'جاري طلب رابط الرفع...';
        const presignResponse = await api.request('/courses/upload-url', {
            method: 'POST',
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type
            })
        });

        const { uploadUrl, publicUrl } = presignResponse;

        // 2. Upload to R2 directly using XHR for progress
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressBar.style.width = percentComplete + '%';
                    statusText.textContent = `جاري الرفع: ${percentComplete}%`;
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    progressBar.style.width = '100%';
                    statusText.textContent = 'تم الرفع بنجاح!';
                    resolve(publicUrl);
                } else {
                    reject(new Error('Upload failed with status: ' + xhr.status));
                }
            };

            xhr.onerror = () => reject(new Error('Network error during upload'));

            xhr.send(file);
        });

    } catch (error) {
        container.style.display = 'none';
        throw error;
    }
}

async function submitLessonForm(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;

    const courseId = document.getElementById('courseIdField').value;
    const lessonType = document.getElementById('lessonType').value;
    let contentUrl = document.getElementById('lessonUrl').value;
    let typeToSend = lessonType;

    try {
        // Handle Video Upload
        if (lessonType === 'video_upload') {
            const fileInput = document.getElementById('lessonVideoFile');
            if (fileInput.files.length === 0) {
                throw new Error('يرجى اختيار ملف فيديو للرفع');
            }

            submitBtn.textContent = 'جاري رفع الفيديو...';
            contentUrl = await uploadVideo(fileInput.files[0]);
            typeToSend = 'video'; // Store as standard video type in DB
        }

        const lessonData = {
            title: document.getElementById('lessonTitle').value,
            type: typeToSend,
            content_url: contentUrl,
            duration_seconds: parseInt(document.getElementById('lessonDuration').value) || 0,
            order_num: 0 // Default order
        };

        submitBtn.textContent = 'جاري الحفظ...';
        await api.createLesson(courseId, lessonData);
        alert('تم إضافة الدرس بنجاح!');
        closeLessonModal();

        // Reset form specific elements
        document.getElementById('uploadProgressContainer').style.display = 'none';
        document.getElementById('uploadProgressBar').style.width = '0%';

    } catch (error) {
        alert('خطأ: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderSidebar(); // Initializing dynamic sidebar first
    checkTeacherAuth();

    // Normalize page name
    let page = window.location.pathname.split('/').pop();
    if (page.includes('?')) page = page.split('?')[0];
    if (page.includes('#')) page = page.split('#')[0];
    const pageName = page.replace('.html', '');

    if (pageName === 'index' || pageName === '') {
        loadTeacherStats();
    } else if (pageName === 'courses') {
        loadTeacherCourses();
    } else if (pageName === 'students') {
        // loadTeacherStudents(); // Future implementation
    } else if (pageName === 'profile') {
        // loadTeacherProfile(); // Future implementation
    }

    // Lesson Form Listener
    document.getElementById('addLessonForm')?.addEventListener('submit', submitLessonForm);

    // Lesson Type Toggle Listener
    const lessonTypeSelect = document.getElementById('lessonType');
    const urlGroup = document.getElementById('urlGroup');
    const videoUploadGroup = document.getElementById('videoUploadGroup');

    if (lessonTypeSelect) {
        lessonTypeSelect.addEventListener('change', () => {
            const type = lessonTypeSelect.value;
            if (type === 'video_upload') {
                urlGroup.style.display = 'none';
                videoUploadGroup.style.display = 'block';
                document.getElementById('lessonUrl').required = false;
            } else {
                urlGroup.style.display = 'block';
                videoUploadGroup.style.display = 'none';
                // Reset file input
                document.getElementById('lessonVideoFile').value = '';
                document.getElementById('uploadProgressContainer').style.display = 'none';
            }
        });
    }

    // Course Form Listener
    document.getElementById('courseForm')?.addEventListener('submit', submitCourseForm);
});
