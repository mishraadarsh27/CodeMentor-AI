const API_BASE_URL = '/api';

const api = {
    // --- Auth ---
    async signup(username, email, password) {
        return this.request('/auth/signup', 'POST', { username, email, password });
    },

    async login(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
        }
        return data;
    },

    logout() {
        localStorage.removeItem('token');
        window.location.href = '/login';
    },

    // --- AI ---
    async analyzeCode(code, language) {
        return this.request('/analyze', 'POST', { code, language });
    },

    async chat(message, context_code = null) {
        return this.request('/chat', 'POST', { message, context_code });
    },

    // --- Execution ---
    async executeCode(code, language, stdin = "") {
        return this.request('/execute', 'POST', { code, language, stdin });
    },

    // --- Projects & Files ---
    async getProjects() {
        return this.request('/projects/', 'GET');
    },

    async createProject(name, description = "") {
        return this.request('/projects/', 'POST', { name, description });
    },

    async getProject(id) {
        return this.request(`/projects/${id}`, 'GET');
    },

    async createFile(projectId, name, language, parentFolderId = null) {
        return this.request(`/projects/${projectId}/files`, 'POST', { 
            name, language, project_id: projectId, parent_folder_id: parentFolderId 
        });
    },

    async updateFile(fileId, name, content, language) {
        return this.request(`/projects/files/${fileId}`, 'PUT', { name, content, language });
    },

    // --- Helper ---
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                if (!window.location.pathname.includes('login') && !window.location.pathname.includes('signup')) {
                    window.location.href = '/login';
                }
            }
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (e) {
            console.error(`API Error [${endpoint}]:`, e);
            throw e;
        }
    }
};

window.api = api;
