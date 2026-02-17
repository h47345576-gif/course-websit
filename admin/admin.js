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

    // Initialize notifications
    initNotifications();
});

// ===== Notification System =====
let notificationInterval = null;

function initNotifications() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    // Inject notification bell HTML
    const bellWrapper = document.createElement('div');
    bellWrapper.className = 'notification-wrapper';
    bellWrapper.innerHTML = `
        <button class="notification-bell" id="notificationBell" onclick="toggleNotifications(event)">
            🔔
            <span class="notification-badge hidden" id="notificationBadge">0</span>
        </button>
        <div class="notification-dropdown" id="notificationDropdown">
            <div class="notification-dropdown-header">
                <h4>🔔 الإشعارات</h4>
                <button class="mark-all-read-btn" onclick="markAllRead(event)">تعيين الكل كمقروء</button>
            </div>
            <div class="notification-list" id="notificationList">
                <div class="notification-empty">
                    <span>🔔</span>
                    <p>لا توجد إشعارات</p>
                </div>
            </div>
            <div class="notification-dropdown-footer">
                <a href="payments.html">عرض كل المدفوعات</a>
            </div>
        </div>
    `;

    headerActions.prepend(bellWrapper);

    // Load initial count and start polling
    updateNotificationCount();
    notificationInterval = setInterval(updateNotificationCount, 30000);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationDropdown');
        const bell = document.getElementById('notificationBell');
        if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

async function updateNotificationCount() {
    try {
        const data = await api.getNotificationCount();
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        const count = data.count || 0;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch (error) {
        // Silently fail — user might not be admin
    }
}

function toggleNotifications(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    const isShowing = dropdown.classList.contains('show');
    if (isShowing) {
        dropdown.classList.remove('show');
    } else {
        dropdown.classList.add('show');
        loadNotifications();
    }
}

async function loadNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    list.innerHTML = '<div class="notification-empty"><p>جاري التحميل...</p></div>';

    try {
        const data = await api.getNotifications(15);
        const items = data.results || [];

        if (items.length === 0) {
            list.innerHTML = `
                <div class="notification-empty">
                    <span>✅</span>
                    <p>لا توجد إشعارات</p>
                </div>
            `;
            return;
        }

        list.innerHTML = items.map(notif => {
            const isUnread = !notif.is_read;
            const timeAgo = getTimeAgo(notif.created_at);
            const icon = getNotificationIcon(notif.type);

            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="handleNotificationClick(${notif.id}, event)">
                    <div class="notification-icon-circle">${icon}</div>
                    <div class="notification-content">
                        <div class="notif-title">${notif.title}</div>
                        <div class="notif-message">${notif.message}</div>
                        <div class="notif-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        list.innerHTML = `
            <div class="notification-empty">
                <span>⚠️</span>
                <p>خطأ في تحميل الإشعارات</p>
            </div>
        `;
    }
}

async function handleNotificationClick(notifId, e) {
    e.stopPropagation();
    try {
        await api.markNotificationRead(notifId);
        updateNotificationCount();

        // Update the clicked item visually
        const item = e.currentTarget;
        item.classList.remove('unread');
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllRead(e) {
    e.stopPropagation();
    try {
        await api.markAllNotificationsRead();
        updateNotificationCount();

        // Update all items visually
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'receipt_uploaded': return '🧾';
        case 'new_payment': return '💳';
        case 'new_enrollment': return '📝';
        default: return '🔔';
    }
}

function getTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr + 'Z'); // Treat as UTC
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar');
}
