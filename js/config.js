// API Configuration
const CONFIG = {
    API_BASE_URL: 'https://course-api.h47345576.workers.dev/api/v1',

    // Endpoints
    ENDPOINTS: {
        // Auth
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        PROFILE: '/auth/profile',

        // Courses
        COURSES: '/courses',
        COURSE_DETAILS: (id) => `/courses/${id}`,
        COURSE_LESSONS: (id) => `/courses/${id}/lessons`,
        ENROLL: (id) => `/courses/${id}/enroll`,
    },

    // Storage Keys
    STORAGE_KEYS: {
        TOKEN: 'auth_token',
        USER: 'user_data',
    }
};

// Format price to Syrian Pounds
function formatPrice(price) {
    if (price === 0) return 'مجاني';
    return new Intl.NumberFormat('ar-SY').format(price) + ' ل.س';
}

// Format duration
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''}`;
    }
    return `${mins} دقيقة`;
}
