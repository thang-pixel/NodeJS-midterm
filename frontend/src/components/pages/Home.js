import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Box,
  Avatar,
  TextField,
  Button,
  Paper,
} from '@mui/material';
import { jwtDecode } from "jwt-decode";

function Home() {
  const [student, setStudent] = useState(null);
  const [mssv, setMssv] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      console.log("Decoded JWT:", decoded);
      if (decoded.studentId) {
        fetchStudentInfo(decoded.studentId);
      }
    } catch (err) {
      console.error("Lỗi khi giải mã token:", err);
    }
  }, []);

  // Lấy thông tin sinh viên theo MSSV
  const fetchStudentInfo = async (studentId) => {
    try {
      const res = await axios.get(`http://localhost:2000/api/students/users/${studentId}`);
      console.log("Dữ liệu trả về:", res.data);
      setStudent(res.data);
    } catch (err) {
      console.error('Lỗi khi lấy thông tin sinh viên:', err);
      alert('Không tìm thấy sinh viên.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (mssv.trim()) {
      fetchStudentInfo(mssv.trim());
    }
  };

  const handleSendOTP = () => {
    setOtpSent(true);
    alert('OTP đã được gửi đến email của bạn! (giả lập)');
  };

  const handleConfirmPayment = () => {
    if (otp === '123456') {
      alert('Thanh toán thành công!');
    } else {
      alert('Mã OTP không hợp lệ!');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" sx={{ mt: 4, mb: 4 }}>
        Đóng học phí
      </Typography>

      <Grid container spacing={2}>
        {/* Cột trái */}
        <Grid item xs={4} size={4}>
          <Box
            sx={{
              p: 3,
              border: '2px dashed grey',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: '#fafafa',
              borderRadius: 2,
            }}
          >
            <Avatar
              alt="Profile Picture"
              src="https://mui.com/static/images/avatar/1.jpg"
              sx={{ width: 150, height: 150, mb: 2 }}
            />

            <Typography variant="h6" gutterBottom>
              {student?.fullName || 'Đang tải...'}
            </Typography>
            <Typography variant="body1">
              MSSV: {student?.studentId || '---'}
            </Typography>
            <Typography variant="body1">
              Email: {student?.email || '---'}
            </Typography>
            <Typography variant="body1">
              SĐT: {student?.phone || '---'}
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 1, fontWeight: 'bold', color: 'green' }}
            >
              Số dư: {student ? `${student.balance.toLocaleString()}₫` : '---'}
            </Typography>
          </Box>
        </Grid>

        {/* Cột phải */}
        <Grid item xs={8} size={8}>
          <Box
            sx={{
              p: 3,
              border: '2px dashed grey',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Tra cứu thông tin sinh viên
            </Typography>

            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                mt: 2,
                flexWrap: 'wrap',
              }}
            >
              <TextField
                label="Nhập MSSV"
                variant="outlined"
                size="small"
                value={mssv}
                onChange={(e) => setMssv(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              <Button variant="contained" color="primary" type="submit">
                Tìm kiếm
              </Button>
            </Box>

            {student && (
              <>
                <Paper
                  elevation={3}
                  sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: 2,
                    bgcolor: '#f9f9f9',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Kết quả tìm kiếm
                  </Typography>
                  <Typography variant="body1">
                    <strong>Họ và tên:</strong> {student.fullName}
                  </Typography>
                  <Typography variant="body1">
                    <strong>MSSV:</strong> {student.studentId}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Email:</strong> {student.email}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Số dư:</strong> {student.balance.toLocaleString()}₫
                  </Typography>
                </Paper>

                <Paper
                  elevation={3}
                  sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: 2,
                    bgcolor: '#f1f8e9',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Xác nhận thanh toán học phí
                  </Typography>

                  {!otpSent ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleSendOTP}
                    >
                      Xác nhận giao dịch (Gửi OTP)
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
                      >
                        Xác nhận lần cuối
                      </Button>
                    </Box>
                  )}
                </Paper>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Home;
