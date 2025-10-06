import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Alert } from "@mui/material";
import axios from "axios";

function PaymentPanel({ searchedStudent }) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [transactionId, setTransactionId] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!searchedStudent) return null;

  // Gửi OTP thật qua Notification Service
  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await axios.post("http://localhost:2000/api/notifications/otp", {
        transactionId: `TXN-${Date.now()}`,
        email: searchedStudent.email,
      });

      setTransactionId(res.data.transactionId);
      setOtpSent(true);
      setMessage("OTP đã được gửi tới email của bạn.");
    } catch (err) {
      console.error("Lỗi gửi OTP:", err);
      setMessage("Không thể gửi OTP. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Xác minh OTP thật qua Notification Service
  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      setMessage("");
      await axios.post("http://localhost:2000/api/notifications/otp/verify", {
        transactionId,
        otp,
      });

      setIsVerified(true);
      setMessage("Xác thực OTP thành công. Thanh toán hoàn tất.");
    } catch (err) {
      console.error("Lỗi xác minh OTP:", err);
      const msg = err.response?.data?.message || "Lỗi không xác định.";

      if (msg.includes("expired")) {
        setMessage("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
      } else if (msg.includes("Invalid")) {
        setMessage("Mã OTP không hợp lệ. Vui lòng kiểm tra lại.");
      } else {
        setMessage("Có lỗi xảy ra khi xác minh OTP.");
      }

      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Thông tin sinh viên */}
      <Paper
        elevation={3}
        sx={{
          mt: 3,
          p: 3,
          borderRadius: 2,
          bgcolor: "#f9f9f9",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Kết quả tìm kiếm
        </Typography>
        <Typography variant="body1">
          <strong>Họ và tên:</strong> {searchedStudent.fullName}
        </Typography>
        <Typography variant="body1">
          <strong>MSSV:</strong> {searchedStudent.studentId}
        </Typography>
        <Typography variant="body1">
          <strong>Email:</strong> {searchedStudent.email}
        </Typography>
      </Paper>

      {/* Xác nhận thanh toán */}
      <Paper
        elevation={3}
        sx={{
          mt: 3,
          p: 3,
          borderRadius: 2,
          bgcolor: "#f1f8e9",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Xác nhận thanh toán học phí
        </Typography>

        {/* Thông báo */}
        {message && (
          <Alert
            severity={
              message.includes("thành công") || message.includes("đã được gửi")
                ? "success"
                : "warning"
            }
            sx={{ mb: 2 }}
          >
            {message}
          </Alert>
        )}

        {/* Gửi OTP hoặc nhập mã */}
        {!otpSent ? (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSendOTP}
            disabled={loading}
          >
            {loading ? "Đang gửi..." : "Xác nhận giao dịch (Gửi OTP)"}
          </Button>
        ) : (
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Nhập mã OTP"
              variant="outlined"
              size="small"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              color="success"
              onClick={handleConfirmPayment}
              disabled={loading || isVerified}
            >
              {loading ? "Đang xác minh..." : "Xác nhận lần cuối"}
            </Button>

            {!isVerified && (
              <Button
                variant="text"
                color="secondary"
                onClick={handleSendOTP}
                sx={{ ml: 2 }}
              >
                Gửi lại mã OTP
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </>
  );
}

export default PaymentPanel;
