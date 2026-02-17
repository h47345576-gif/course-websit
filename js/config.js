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

        // Payments
        PAYMENTS: '/payments',
        SUBMIT_PAYMENT: '/payments',
        UPLOAD_RECEIPT: (id) => `/payments/${id}/receipt`,
        MY_PAYMENTS: '/payments/my',
        PAYMENT_DETAILS: (id) => `/payments/${id}`,
    },

    // Storage Keys
    STORAGE_KEYS: {
        TOKEN: 'auth_token',
        USER: 'user_data',
    }
};

// Format price to Syrian Pounds
function formatPrice(price, originalPrice = null, discountPercentage = null) {
    if (price === 0 && (!originalPrice || originalPrice === 0)) return 'مجاني';

    const hasDiscount = discountPercentage > 0 && originalPrice > 0;
    const formattedPrice = new Intl.NumberFormat('ar-SY').format(price) + ' ل.س';

    if (hasDiscount) {
        const formattedOriginal = new Intl.NumberFormat('ar-SY').format(originalPrice) + ' ل.س';
        return `<span style="text-decoration: line-through; color: #888; font-size: 0.85rem; margin-left: 8px;">${formattedOriginal}</span> ${formattedPrice}`;
    }

    return formattedPrice;
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
