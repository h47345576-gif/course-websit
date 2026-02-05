// API Service Class
class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
    }

    // Get auth token from storage
    getToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    // Set auth token
    setToken(token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    }

    // Remove auth token
    removeToken() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.getToken();
    }

    // Get current user
    getCurrentUser() {
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;

        const headers = {
            ...options.headers
        };

        // Only set JSON content type if not FormData
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        // Add auth token if available
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'حدث خطأ ما');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth Methods
    async login(email, password) {
        const data = await this.request(CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (data.token) {
            this.setToken(data.token);
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
        }

        return data;
    }

    async register(name, email, password, phone = '') {
        const data = await this.request(CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify({ name, email, password, phone }),
        });

        if (data.token) {
            this.setToken(data.token);
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));
        }

        return data;
    }

    async getProfile() {
        return this.request(CONFIG.ENDPOINTS.PROFILE);
    }

    logout() {
        this.removeToken();
        window.location.href = 'index.html';
    }

    // Course Methods
    async getCourses() {
        return this.request(CONFIG.ENDPOINTS.COURSES);
    }

    async getCourse(id) {
        return this.request(CONFIG.ENDPOINTS.COURSE_DETAILS(id));
    }

    async getCourseLessons(id) {
        return this.request(CONFIG.ENDPOINTS.COURSE_LESSONS(id));
    }

    async enrollInCourse(id) {
        return this.request(CONFIG.ENDPOINTS.ENROLL(id), {
            method: 'POST',
        });
    }

    // Course Management Methods (Admin/Teacher)
    async createCourse(courseData) {
        return this.request(CONFIG.ENDPOINTS.COURSES, {
            method: 'POST',
            body: JSON.stringify(courseData),
        });
    }

    async updateCourse(id, courseData) {
        return this.request(`${CONFIG.ENDPOINTS.COURSES}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(courseData),
        });
    }

    async deleteCourse(id) {
        return this.request(`${CONFIG.ENDPOINTS.COURSES}/${id}`, {
            method: 'DELETE',
        });
    }

    // Lesson Management Methods
    async createLesson(courseId, lessonData) {
        return this.request(`${CONFIG.ENDPOINTS.COURSES}/${courseId}/lessons`, {
            method: 'POST',
            body: JSON.stringify(lessonData),
        });
    }

    async updateLesson(lessonId, lessonData) {
        return this.request(`${CONFIG.ENDPOINTS.COURSES}/lessons/${lessonId}`, {
            method: 'PUT',
            body: JSON.stringify(lessonData),
        });
    }

    async deleteLesson(lessonId) {
        return this.request(`${CONFIG.ENDPOINTS.COURSES}/lessons/${lessonId}`, {
            method: 'DELETE',
        });
    }
}

// Create global API instance
const api = new ApiService();
