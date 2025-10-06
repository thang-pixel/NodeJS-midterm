import axios from "axios";

const API_BASE = "http://localhost:2000";

export const sendOTP = async (transactionId, email) => {
  try {
    const response = await axios.post(`${API_BASE}/otp`, { transactionId, email });
    return response.data;
  } catch (error) {
    console.error("Error sending OTP:", error.response?.data || error.message);
    throw error;
  }
};

export const verifyOTP = async (transactionId, otp) => {
  try {
    const response = await axios.post(`${API_BASE}/otp/verify`, { transactionId, otp });
    return response.data;
  } catch (error) {
    console.error("Error verifying OTP:", error.response?.data || error.message);
    throw error;
  }
};
