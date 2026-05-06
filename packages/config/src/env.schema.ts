export interface ApiEnvSchema {
  DATABASE_URL: string;
  RABBITMQ_URL: string;
  JWT_SECRET: string;
  MFDS_API_KEY: string;
  SMTP_HOST: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  KAKAO_API_KEY: string;
  PORT?: string;
  NODE_ENV?: 'development' | 'production' | 'test';
}

export interface WebEnvSchema {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: string;
}
