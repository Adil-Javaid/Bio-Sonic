require("dotenv").config();
require("./DataBase/connection");
const cors = require("cors");
const path = require("path");
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/SignUp-Verification Routes/SignUp");
const loginRoutes = require("./routes/SignUp-Verification Routes/login");

const setupGoogleAuth = require("./routes/SignUp-Verification Routes/auth");
const userRoute = require("./routes/SignUp-Verification Routes/user");

const logoutRoutes = require("./routes/SignUp-Verification Routes/logout");
const emailVerifyRoutes = require("./routes/SignUp-Verification Routes/mail");


const otpRoutes = require("./routes/SignUp-Verification Routes/otpMail"); 


app.use(
  cors({
    origin: [
      "http://localhost:8081",
      "http://192.168.100.9:8081",
      "http://192.168.1.19:8081",
    ],
    methods: "GET, POST, PUT, DELETE",
    credentials: true,
  })
);


app.use("/auth", otpRoutes);
app.use("/api/user", authRoutes);
app.use("/login", loginRoutes);
app.use("/", logoutRoutes);  
app.use("/api/email-verify", emailVerifyRoutes); 
app.use("/api/user", userRoute); 

app.listen(process.env.port, () => {
  console.log(`Server is running at port: ${port}`);
});
