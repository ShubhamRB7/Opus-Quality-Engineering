import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import * as types from '../types';

/**
 * Opus-Quality API Client
 * Handles OAuth2 authentication, request/response interceptors, and error handling
 */

class OpusApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private baseURL: string;

  constructor(baseURL: string = process.env.REACT_APP_OPUS_API_URL || 'https://api.opus-quality.example.com/api/v1') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '1.0.0',
      },
      withCredentials: true, // Send cookies with requests
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors for auth and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor: Attach JWT token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        // Add request ID for tracing
        config.headers['X-Request-ID'] = this.generateRequestId();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle token refresh and errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Token expired, attempt refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshAccessToken();
            if (this.accessToken) {
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        return this.handleError(error);
      }
    );
  }

  /**
   * Authenticate with OAuth2 client credentials
   */
  async authenticate(clientId: string, clientSecret: string): Promise<void> {
    try {
      const response = await this.client.post('/auth/token', new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.setTokens(
        response.data.access_token,
        response.data.refresh_token,
        response.data.expires_in
      );
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate with OAuth2 authorization code flow
   */
  async authenticateWithCode(code: string, redirectUri: string): Promise<void> {
    try {
      const response = await this.client.post('/auth/token', new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.REACT_APP_OAUTH_CLIENT_ID || '',
        client_secret: process.env.REACT_APP_OAUTH_CLIENT_SECRET || '',
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.setTokens(
        response.data.access_token,
        response.data.refresh_token,
        response.data.expires_in
      );
    } catch (error) {
      console.error('Authorization code flow failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.client.post('/auth/token', new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.setTokens(
        response.data.access_token,
        response.data.refresh_token || this.refreshToken,
        response.data.expires_in
      );
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Set token and expiration
   */
  private setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = Date.now() + expiresIn * 1000;

    // Store in secure storage (httpOnly cookie is preferred, but we also store in memory)
    sessionStorage.setItem('opus_access_token', accessToken);
    sessionStorage.setItem('opus_refresh_token', refreshToken);
  }

  /**
   * Clear tokens
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = 0;
    sessionStorage.removeItem('opus_access_token');
    sessionStorage.removeItem('opus_refresh_token');
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    return Date.now() >= this.tokenExpiresAt - 60000; // Refresh 1 min before expiry
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    this.clearTokens();
    window.location.href = '/login';
  }

  /**
   * Handle API errors
   */
  private async handleError(error: AxiosError): Promise<never> {
    const apiError: types.ApiError = {
      error: error.code || 'UNKNOWN_ERROR',
      message: error.message,
      status_code: error.response?.status || 0,
      timestamp: new Date().toISOString(),
      request_id: (error.config as any)?.headers?.['X-Request-ID'] || '',
    };

    if (error.response?.data) {
      const responseData = error.response.data as any;
      apiError.message = responseData.message || apiError.message;
      apiError.details = responseData.details;
    }

    console.error('API Error:', apiError);
    throw apiError;
  }

  /**
   * Generate unique request ID for tracing
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // MODULE 1: REQUIREMENT SYNTHESIZER ENDPOINTS
  // ============================================================================

  /**
   * Analyze requirements and generate test specifications
   */
  async analyzeRequirement(
    request: types.RequirementAnalysisRequest
  ): Promise<types.ApiResponse<types.RequirementAnalysisResponse>> {
    return this.client.post('/requirements/analyze', request);
  }

  // ============================================================================
  // MODULE 2: ENVIRONMENT TWIN & MIRROR ENGINE ENDPOINTS
  // ============================================================================

  /**
   * Provision ephemeral test environment
   */
  async provisionEnvironment(
    request: types.EnvironmentProvisionRequest
  ): Promise<types.ApiResponse<types.EnvironmentProvisionResponse>> {
    return this.client.post('/environment/provision', request);
  }

  /**
   * Get environment status
   */
  async getEnvironmentStatus(
    environmentId: string
  ): Promise<types.ApiResponse<types.EnvironmentProvisionResponse>> {
    return this.client.get(`/environment/${environmentId}`);
  }

  /**
   * Destroy ephemeral environment
   */
  async destroyEnvironment(environmentId: string): Promise<void> {
    return this.client.delete(`/environment/${environmentId}`);
  }

  // ============================================================================
  // MODULE 3: PREDICTIVE REGRESSION & CONTINUOUS RUNNER ENDPOINTS
  // ============================================================================

  /**
   * Analyze code changes and determine impacted tests
   */
  async analyzeCodeImpact(
    request: types.ImpactAnalysisRequest
  ): Promise<types.ApiResponse<types.ImpactAnalysisResponse>> {
    return this.client.post('/ci/impact-analysis', request);
  }

  // ============================================================================
  // MODULE 4: SELF-HEALING AUTOMATION MAINTENANCE ENDPOINTS
  // ============================================================================

  /**
   * Request healing of broken UI locator
   */
  async healLocator(
    request: types.HealLocatorRequest
  ): Promise<types.ApiResponse<types.HealLocatorResponse>> {
    return this.client.post('/telemetry/heal-locator', request);
  }

  /**
   * Report test failure for analysis
   */
  async reportTestFailure(metrics: types.TestExecutionMetrics): Promise<void> {
    return this.client.post('/telemetry/test-failure', metrics);
  }

  // ============================================================================
  // SYSTEM ENDPOINTS
  // ============================================================================

  /**
   * Health check
   */
  async healthCheck(): Promise<types.ApiResponse<{ status: string; version: string }>> {
    return this.client.get('/health');
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    this.clearTokens();
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && !this.isTokenExpired();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Export singleton instance
export const opusApiClient = new OpusApiClient();

export default opusApiClient;
