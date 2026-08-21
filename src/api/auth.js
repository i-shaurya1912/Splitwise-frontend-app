import API from './axios';

export const verifyOTP = (email, otp) => API.post('/auth/verify-otp', { email, otp });
export const resendOTP = (email) => API.post('/auth/resend-otp', { email });