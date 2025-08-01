export type GoogleUserInfo = {
  sub: string;
  name: string;
  email: string;
  error?: string;
  error_description?: string;
  [key: string]: any;
};