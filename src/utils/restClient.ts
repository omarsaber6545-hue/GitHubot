import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_TIMEOUT_MS } from '../config/constants.js';
import { logger } from './logger.js';

export interface ApiErrorDetails {
  status: number;
  message: string;
  isRateLimit: boolean;
  isNotFound: boolean;
  isTimeout: boolean;
  retryAfterSeconds?: number;
}

export class RestClient {
  private client: AxiosInstance;

  constructor(baseURL?: string, defaultHeaders?: Record<string, string>) {
    this.client = axios.create({
      baseURL,
      timeout: API_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Discord-Developer-Assistant-Bot/1.0.0 (https://github.com/developer-bot)',
        Accept: 'application/json',
        ...defaultHeaders,
      },
    });
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, url);
    }
  }

  private handleError(error: unknown, endpoint: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<any>;
      const status = axiosErr.response?.status || 500;
      const data = axiosErr.response?.data;

      const isRateLimit = status === 429 || (status === 403 && axiosErr.response?.headers['x-ratelimit-remaining'] === '0');
      const isNotFound = status === 404;
      const isTimeout = axiosErr.code === 'ECONNABORTED' || axiosErr.message.includes('timeout');

      let retryAfter: number | undefined;
      if (isRateLimit) {
        const resetHeader = axiosErr.response?.headers['x-ratelimit-reset'] || axiosErr.response?.headers['retry-after'];
        if (resetHeader) {
          const resetVal = Number(resetHeader);
          if (resetVal > 1000000000) {
            // Unix timestamp
            retryAfter = Math.max(1, Math.round(resetVal - Date.now() / 1000));
          } else {
            // Seconds
            retryAfter = resetVal;
          }
        }
      }

      let message = axiosErr.message;
      if (isNotFound) {
        message = 'Resource not found.';
      } else if (isRateLimit) {
        message = `API rate limit exceeded. Please try again ${retryAfter ? `in ${retryAfter}s` : 'later'}.`;
      } else if (isTimeout) {
        message = 'Request timed out while contacting external service.';
      } else if (data?.message) {
        message = String(data.message);
      }

      logger.warn(`API Error [${status}] on ${endpoint}: ${message}`);

      const customError = new Error(message) as Error & { details: ApiErrorDetails };
      customError.name = 'ApiError';
      customError.details = {
        status,
        message,
        isRateLimit,
        isNotFound,
        isTimeout,
        retryAfterSeconds: retryAfter,
      };

      return customError;
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}
