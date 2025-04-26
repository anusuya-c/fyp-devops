import React, { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Container,
  Stack,
  Text,
} from "@mantine/core";
import { api } from "../../api/api";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password1: "",
    password2: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password1: "",
    password2: "",
    general: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }
    if (errors.general) {
      setErrors((prevErrors) => ({ ...prevErrors, general: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      username: "",
      email: "",
      password1: "",
      password2: "",
      general: "",
    };

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (!formData.password1) {
      newErrors.password1 = "Password is required";
      isValid = false;
    } else if (formData.password1.length < 6) {
      newErrors.password1 = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!formData.password2) {
      newErrors.password2 = "Password confirmation is required";
      isValid = false;
    } else if (
      formData.password1 &&
      formData.password1 !== formData.password2
    ) {
      newErrors.password2 = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      console.log("Form validation failed");
      setErrors((prevErrors) => ({
        ...prevErrors,
        general: "Please fix the errors above.",
      }));
      return;
    }

    setErrors((prevErrors) => ({ ...prevErrors, general: "" }));

    const payload = {
      username: formData.username,
      email: formData.email,
      password1: formData.password1,
      password2: formData.password2,
    };

    try {
      console.log(payload);
      const response = await api.register(payload);
      if (response.status === 201) {
        notifications.show({
          title: 'Registration Successful',
          message: `User ${formData.username} has been registered successfully!`,
          color: 'green'
        });

        setFormData({
          username: "",
          email: "",
          password1: "",
          password2: "",
        });

        navigate('/login');
      }
    } catch (error) {
      console.error("Registration error:", error.response?.data);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.password1?.[0] || 
                          error.response?.data?.password2?.[0] ||
                          'There was an error while trying to register';
      
      notifications.show({
        title: 'Registration Failed',
        message: errorMessage,
        color: 'red'
      });

      // Update form errors if specific field errors are returned
      if (error.response?.data) {
        setErrors({
          ...errors,
          password1: error.response.data.password1?.[0] || "",
          password2: error.response.data.password2?.[0] || "",
          general: errorMessage
        });
      }
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center" order={2} mb="lg">
          Register
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              required
              label="Username"
              placeholder="Your Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username || null}
            />
            <TextInput
              required
              label="Email"
              placeholder="your@email.com"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email || null}
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              name="password1"
              value={formData.password1}
              onChange={handleChange}
              error={errors.password1 || null}
            />

            <PasswordInput
              required
              label="Confirm Password"
              placeholder="Confirm your password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              error={errors.password2 || null}
            />

            {errors.general && (
              <Text c="red" size="sm" ta="center">
                {errors.general}
              </Text>
            )}

            <Button type="submit" fullWidth mt="xl">
              Submit
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
