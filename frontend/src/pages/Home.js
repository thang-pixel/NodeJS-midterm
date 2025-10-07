import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, Grid } from "@mui/material";
import { jwtDecode } from "jwt-decode";

import ProfilePanel from "../components/LeftPanel.js";
import SearchPanel from "../components/SearchPanel.js";
import PaymentPanel from "../components//PaymentPanel.js";
import Navbar from "../components/Navbar.js";
function Home() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const [searchedStudent, setSearchedStudent] = useState(null);

  // Lấy thông tin sinh viên đăng nhập từ JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token);
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      console.log("Decoded JWT:", decoded);

      if (decoded.studentId) {
        fetchStudentInfo(decoded.studentId, true);
      }
    } catch (err) {
      console.error("Lỗi khi giải mã token:", err);
    }
  }, []);

  // Gọi API tới user-service để lấy thông tin sinh viên
  const fetchStudentInfo = async (studentId, isLoggedInUser = false) => {
  try {
    const res = await axios.get(
      `http://localhost:2000/api/students/users/${studentId}`
    );
    console.log("Dữ liệu trả về:", res.data);

    // Lấy thông tin học phí
    const tuitionRes = await axios.get(
      `http://localhost:2000/api/tuitions/tuitions/${studentId}`
    );
    
    // Gộp thông tin sinh viên và học phí
    const studentWithTuition = {
      ...res.data,
      tuitionAmount: tuitionRes.data.tuitionAmount,
      tuitionStatus: tuitionRes.data.status,
      dueDate: tuitionRes.data.duedate
    };

    if (isLoggedInUser) {
      setLoggedInStudent(studentWithTuition);
    } else {
      setSearchedStudent(studentWithTuition);
    }
  } catch (err) {
    console.error("Lỗi khi lấy thông tin sinh viên:", err);
    alert("Không tìm thấy sinh viên hoặc thông tin học phí.");
  }
};

  // Khi người dùng tìm sinh viên khác bằng MSSV
  const handleSearchStudent = (mssv) => {
    if (mssv.trim()) {
      fetchStudentInfo(mssv.trim(), false);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" align="center" sx={{ mb: 4 }}>
          Đóng học phí
        </Typography>

        <Grid container spacing={2}>
          {/* Cột trái: thông tin người đăng nhập */}
          <Grid item xs={4}>
            <ProfilePanel loggedInStudent={loggedInStudent} />
          </Grid>

          {/* Cột phải: tra cứu & thanh toán */}
          <Grid item xs={8}>
            <SearchPanel onSearch={handleSearchStudent} />
            <PaymentPanel 
              searchedStudent={searchedStudent} 
              loggedInStudent={loggedInStudent}
              onUpdateLoggedInStudent={setLoggedInStudent}
              onUpdateSearchedStudent={setSearchedStudent}
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default Home;
