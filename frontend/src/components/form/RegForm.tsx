import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { DoReg } from "../../api/DoReg";
import { useNavigate } from "react-router-dom";

// 定义一个 Yup 验证模式
const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  username: Yup.string()
    .min(6, "Username must be at least 6 characters")
    .required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const RegForm: React.FC = () => {
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      email: "",
      username: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      console.log(import.meta.env.VITE_API_URL + "/account/reg");
      console.log("Form values:", values);
      try {
        await DoReg(values);
        alert("注册成功");
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } catch (error) {
        alert(error);
      }
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    formik.handleSubmit(event);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        value={formik.values.email}
      />
      {formik.errors.email && formik.touched.email && (
        <p>{formik.errors.email}</p>
      )}
      <label htmlFor="username">Username</label>
      <input
        id="username"
        name="username"
        type="text"
        onChange={formik.handleChange}
        value={formik.values.username}
      />
      {formik.errors.username && formik.touched.username && (
        <p>{formik.errors.username}</p>
      )}
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        onChange={formik.handleChange}
        value={formik.values.password}
      />
      {formik.errors.password && formik.touched.password && (
        <p>{formik.errors.password}</p>
      )}
      <button type="submit">Submit</button>
    </form>
  );
};

export default RegForm;
