import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Alert } from "@mui/material";
import axios from "axios";
import { useEffect } from "react";
function PaymentPanel({ searchedStudent, loggedInStudent,onUpdateLoggedInStudent, 
  onUpdateSearchedStudent  }) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [transactionId, setTransactionId] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

    // Reset state khi chuyển sinh viên khác
  useEffect(() => {
    if (searchedStudent) {
      setOtpSent(false);
      setOtp("");
      setMessage("");
      setTransactionId(null);
      setIsVerified(false);
      setLoading(false);
    }
  }, [searchedStudent?.studentId]); // Reset khi studentId thay đổi

  if (!searchedStudent) return null;

  if (searchedStudent.tuitionStatus === 'paid') {
    return (
      <>
        {/* Thông tin sinh viên */}
        <Paper elevation={3} sx={{ mt: 3, p: 3, borderRadius: 2, bgcolor: "#f9f9f9" }}>
          <Typography variant="h6" gutterBottom>Kết quả tìm kiếm</Typography>
          <Typography variant="body1"><strong>Họ và tên:</strong> {searchedStudent.fullName}</Typography>
          <Typography variant="body1"><strong>MSSV:</strong> {searchedStudent.studentId}</Typography>
          <Typography variant="body1"><strong>Email:</strong> {searchedStudent.email}</Typography>
          <Typography variant="body1" sx={{ color: 'red', fontWeight: 'bold' }}>
            <strong>Số tiền cần nộp:</strong>
            <span
              style={{
                textDecoration: searchedStudent.tuitionStatus === 'paid' ? 'line-through' : 'none',
                marginLeft: 4
              }}
            >
              {searchedStudent.tuitionAmount?.toLocaleString('vi-VN')} VNĐ
            </span>
          </Typography>
          <Typography variant="body1">
            <strong>Trạng thái:</strong> 
            <span style={{ color: 'green', fontWeight: 'bold' }}>Đã thanh toán</span>
          </Typography>
        </Paper>

        {/* Thông báo đã thanh toán */}
        <Paper elevation={3} sx={{ mt: 3, p: 3, borderRadius: 2, bgcolor: "#e8f5e8" }}>
          <Typography variant="h6" gutterBottom color="success">
            ✅ Học phí đã được thanh toán.
          </Typography>
          <Typography variant="body1">
            Sinh viên này đã hoàn thành thanh toán học phí. Không cần thực hiện giao dịch mới.
          </Typography>
        </Paper>
      </>
    );
  }


  // Gửi OTP thật qua Payment Service
  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await axios.post("http://localhost:2000/api/transaction/payments", {
        payerId: loggedInStudent.studentId, // Hoặc lấy từ user đăng nhập
        studentId: searchedStudent.studentId,
        email: loggedInStudent.email,
      });

      setTransactionId(res.data.paymentId); // Lưu paymentId làm transactionId
      setOtpSent(true);
      setMessage(`OTP đã được gửi tới email của bạn .`);
  } catch (err) {
      console.error("Lỗi tạo giao dịch:", err);
      const errorMsg = err.response?.data?.message || "Không thể tạo giao dịch. Vui lòng thử lại.";
      setMessage(errorMsg);
  } finally {
      setLoading(false);
  }
};

    // Gửi lại OTP (không tạo payment mới)
  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setMessage("");
      await axios.post("http://localhost:2000/api/notifications/otp/resend", {
        transactionId,
        email: loggedInStudent.email,
      });

      setMessage("OTP mới đã được gửi tới email của bạn.");
      setOtp(""); // Xóa OTP cũ
    } catch (err) {
      console.error("Lỗi gửi lại OTP:", err);
      const errorMsg = err.response?.data?.message || "Không thể gửi lại OTP. Vui lòng thử lại.";
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

    
  // Xác minh OTP thật qua Notification Service
  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      setMessage("");
      
      // 1. Xác thực OTP
      await axios.post("http://localhost:2000/api/notifications/otp/verify", {
        transactionId,
        otp,
      });

      // 2. Cập nhật trạng thái payment sang completed
      await axios.put(`http://localhost:2000/api/transaction/payments/${transactionId}/status`, {
        status: 'completed'
      });

      // 3. Refresh thông tin sinh viên để cập nhật UI
      await refreshStudentInfo();

      setIsVerified(true);
      setMessage("Xác thực OTP thành công. Thanh toán hoàn tất.");
    } catch (err) {
      console.error("Lỗi xác minh OTP:", err);
      const msg = err.response?.data?.message || "Lỗi không xác định.";

      if (msg.includes("expired")) {
        setMessage("Mã OTP đã hết hạn. Vui lòng nhập lại mã mới.");
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

  // Hàm refresh thông tin sinh viên
  const refreshStudentInfo = async () => {
    try {
      // Refresh thông tin người đăng nhập (số dư)
      const loggedInRes = await axios.get(
        `http://localhost:2000/api/students/users/${loggedInStudent.studentId}`
      );
      const loggedInTuitionRes = await axios.get(
        `http://localhost:2000/api/tuitions/tuitions/${loggedInStudent.studentId}`
      );
      
      // Refresh thông tin sinh viên được tìm kiếm (trạng thái học phí)
      const searchedRes = await axios.get(
        `http://localhost:2000/api/students/users/${searchedStudent.studentId}`
      );
      const searchedTuitionRes = await axios.get(
        `http://localhost:2000/api/tuitions/tuitions/${searchedStudent.studentId}`
      );

      // Cập nhật state để trigger re-render
      onUpdateLoggedInStudent({
        ...loggedInRes.data,
        tuitionAmount: loggedInTuitionRes.data.tuitionAmount,
        tuitionStatus: loggedInTuitionRes.data.status,
        dueDate: loggedInTuitionRes.data.duedate
      });

      onUpdateSearchedStudent({
        ...searchedRes.data,
        tuitionAmount: searchedTuitionRes.data.tuitionAmount,
        tuitionStatus: searchedTuitionRes.data.status,
        dueDate: searchedTuitionRes.data.duedate
      });

    } catch (error) {
      console.error("Lỗi khi refresh thông tin:", error);
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
        <Typography
          variant="body1"
          sx={{
            color: 'red',
            fontWeight: 'bold',
            textDecoration: searchedStudent.tuitionStatus === 'paid' ? 'line-through' : 'none'
          }}
        >
          Số tiền cần nộp: {searchedStudent.tuitionAmount?.toLocaleString('vi-VN')} VNĐ
        </Typography>
        <Typography variant="body1">
          <strong>Trạng thái:</strong> 
          <span style={{ 
            color: searchedStudent.tuitionStatus === 'paid' ? 'green' : 'orange',
            fontWeight: 'bold' 
    }}>
          {searchedStudent.tuitionStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
      </span>
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
                onClick={handleResendOTP}
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
