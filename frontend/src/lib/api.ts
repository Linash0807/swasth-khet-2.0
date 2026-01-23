const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'))
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL.replace(/\/$/, '')}${path}`;

    console.log(`[API] Fetching: ${url}`);
    const response = await fetch(url, config);

    let data: any;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error(`[API] JSON parse error for ${url}:`, e);
        throw new Error(`Invalid JSON response from server at ${url}`);
      }
    } else {
      // Not JSON, maybe empty or HTML error
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      data = text as any;
    }

    if (!response.ok) {
      throw new Error(data?.message || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async postFile<T>(endpoint: string, file: File): Promise<T> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    apiClient.post<{ success: boolean; data: { user: any; token: string } }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<{ success: boolean; data: { user: any; token: string } }>('/auth/login', data),

  getMe: () =>
    apiClient.get<{ success: boolean; data: any }>('/auth/me'),
};

// Farms API
export const farmAPI = {
  getFarms: () =>
    apiClient.get<{ success: boolean; data: any[] }>('/farms'),

  createFarm: (data: { name: string; location: string; area: number }) =>
    apiClient.post<{ success: boolean; data: any }>('/farms', data),

  updateFarm: (id: string, data: { name: string; location: string; area: number }) =>
    apiClient.put<{ success: boolean; data: any }>(`/farms/${id}`, data),

  deleteFarm: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/farms/${id}`),
};

// Crops API
export const cropAPI = {
  getCrops: (farmId?: string) =>
    apiClient.get<{ success: boolean; data: any[] }>(farmId ? `/crops?farmId=${farmId}` : '/crops'),

  createCrop: (data: any) =>
    apiClient.post<{ success: boolean; data: any }>('/crops', data),

  updateCrop: (id: string, data: any) =>
    apiClient.put<{ success: boolean; data: any }>(`/crops/${id}`, data),

  deleteCrop: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/crops/${id}`),
};

// Disease Detection API
export const diseaseAPI = {
  analyzeImage: (file: File) =>
    apiClient.postFile<{ success: boolean; data: { report: any; analysis: any } }>('/disease/analyze', file),

  getReports: () =>
    apiClient.get<{ success: boolean; data: any[] }>('/disease/reports'),
};

// Weather API
export const weatherAPI = {
  getCurrentWeather: (lat?: number, lon?: number) =>
    apiClient.get<{ success: boolean; data: any }>(
      lat && lon ? `/weather/current?lat=${lat}&lon=${lon}` : '/weather/current'
    ),

  getForecast: (lat?: number, lon?: number) =>
    apiClient.get<{ success: boolean; data: any }>(
      lat && lon ? `/weather/forecast?lat=${lat}&lon=${lon}` : '/weather/forecast'
    ),

  getRecommendations: (lat?: number, lon?: number) =>
    apiClient.get<{ success: boolean; data: string[] }>(
      lat && lon ? `/weather/recommendations?lat=${lat}&lon=${lon}` : '/weather/recommendations'
    ),

  getHistory: () =>
    apiClient.get<{ success: boolean; data: any[] }>('/weather/history'),
};

// Marketplace API
export const marketplaceAPI = {
  getListings: (filters?: { crop?: string; location?: string; minPrice?: number; maxPrice?: number }) => {
    const params = new URLSearchParams();
    if (filters?.crop) params.append('crop', filters.crop);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    const queryString = params.toString();
    return apiClient.get<{ success: boolean; data: any[] }>(`/marketplace${queryString ? '?' + queryString : ''}`);
  },

  getUserListings: () =>
    apiClient.get<{ success: boolean; data: any[] }>('/marketplace/user/listings'),

  getPriceSuggestion: (crop: string, quantity?: number, quality?: string, organic?: boolean) => {
    const params = new URLSearchParams({ crop });
    if (quantity) params.append('quantity', quantity.toString());
    if (quality) params.append('quality', quality);
    if (organic) params.append('organic', 'true');
    return apiClient.get<{ success: boolean; data: any }>(`/marketplace/price-suggestion?${params}`);
  },

  getPriceComparison: (crop: string) =>
    apiClient.get<{ success: boolean; data: any }>(`/marketplace/price-comparison/${crop}`),

  createListing: (data: any) =>
    apiClient.post<{ success: boolean; data: any }>('/marketplace', data),

  updateListing: (id: string, data: any) =>
    apiClient.put<{ success: boolean; data: any }>(`/marketplace/${id}`, data),

  deleteListing: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/marketplace/${id}`),

  sendInquiry: (id: string, message: string) =>
    apiClient.post<{ success: boolean }>(`/marketplace/${id}/inquiry`, { message }),

  getStats: () =>
    apiClient.get<{ success: boolean; data: any }>('/marketplace/stats'),
};

// Carbon Footprint API
export const carbonAPI = {
  calculateFootprint: (data: any) =>
    apiClient.post<{ success: boolean; data: any }>('/carbon/calculate', data),

  getHistory: () =>
    apiClient.get<{ success: boolean; data: any[] }>('/carbon/history'),

  getRecommendations: () =>
    apiClient.get<{ success: boolean; data: any[] }>('/carbon/recommendations'),

  getSustainabilityScore: () =>
    apiClient.get<{ success: boolean; data: any }>('/carbon/score'),

  getCarbonCredits: () =>
    apiClient.get<{ success: boolean; data: any }>('/carbon/credits'),
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: (message: string, language: string = 'english') =>
    apiClient.post<{ success: boolean; data: { response: string } }>('/chatbot/message', { message, language }),

  getDiseaseInfo: (diseaseName: string, language?: string) => {
    const params = language ? `?language=${language}` : '';
    return apiClient.get<{ success: boolean; data: any }>(`/chatbot/disease/${diseaseName}${params}`);
  },

  getTips: (crop?: string, season?: string, language?: string) => {
    const params = new URLSearchParams();
    if (crop) params.append('crop', crop);
    if (season) params.append('season', season);
    if (language) params.append('language', language);
    const queryString = params.toString();
    return apiClient.get<{ success: boolean; data: any }>(`/chatbot/tips${queryString ? '?' + queryString : ''}`);
  },
};


