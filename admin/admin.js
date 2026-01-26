// Admin Dashboard Logic

// Check if user is admin (Simple check for demo)
function checkAdminAuth() {
    if (!api.isLoggedIn()) {
        window.location.href = '../login.html';
        return;
    }

    // In a real app, we would check the user role here
    const user = api.getCurrentUser();
    document.getElementById('adminName').textContent = `مرحباً، ${user.name}`;
}

// Logout function
function logout() {
    api.logout();
    window.location.href = '../index.html';
}

// Toggle Sidebar
document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
});

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        // Fetch all data (In a real app, this should be a single stats endpoint)
        const [coursesData, usersData] = await Promise.all([
            api.getCourses(),
            // We need a getUsers endpoint, for now we'll mock or reuse
            // Since we don't have a getUsers endpoint yet, we'll placeholder
            Promise.resolve({ results: [] })
        ]);

        const courses = coursesData.results || [];

        // Update Stats
        document.getElementById('coursesCount').textContent = courses.length;
        document.getElementById('usersCount').textContent = '7'; // Mocked based on seed
        document.getElementById('enrollmentsCount').textContent = '8'; // Mocked based on seed
        document.getElementById('paymentsCount').textContent = '1.2M'; // Mocked

        // Render Recent Courses
        renderRecentCourses(courses.slice(0, 5));

        // Render Recent Users (Mocking since we can't fetch users yet)
        renderRecentUsers();

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderRecentCourses(courses) {
    const container = document.getElementById('recentCourses');
    if (!container) return;

    if (courses.length === 0) {
        container.innerHTML = '<p class="text-gray">لا توجد كورسات</p>';
        return;
    }

    container.innerHTML = `
        <div class="item-list">
            ${courses.map(course => `
                <div class="list-item">
                    <img src="${course.thumbnail_url}" class="item-img" alt="${course.title}">
                    <div class="item-details">
                        <h4>${course.title}</h4>
                        <p>${course.instructor} • ${course.category}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderRecentUsers() {
    const container = document.getElementById('recentUsers');
    if (!container) return;

    // Mock data based on seed.sql
    const users = [
        { name: 'أحمد المدير', role: 'مدير', avatar: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff' },
        { name: 'محمد الأستاذ', role: 'معلم', avatar: 'https://ui-avatars.com/api/?name=Mohammed&background=10b981&color=fff' },
        { name: 'سارة المعلمة', role: 'معلم', avatar: 'https://ui-avatars.com/api/?name=Sara&background=f59e0b&color=fff' },
        { name: 'علي الطالب', role: 'طالب', avatar: 'https://ui-avatars.com/api/?name=Ali&background=8b5cf6&color=fff' }
    ];

    container.innerHTML = `
        <div class="item-list">
            ${users.map(user => `
                <div class="list-item">
                    <img src="${user.avatar}" class="item-img" alt="${user.name}">
                    <div class="item-details">
                        <h4>${user.name}</h4>
                        <p>${user.role}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();

    // Determine current page
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        loadDashboardStats();
    }
});
