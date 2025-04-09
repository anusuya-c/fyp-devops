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

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    userpassword: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    userpassword: "",
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
      userpassword: "",
      general: "",
    };

    // Email validation
    if (!formData.username) {
      newErrors.username = "Username is required";
      isValid = false;
    }

    if (!formData.userpassword) {
      newErrors.userpassword = "Password is required";
      isValid = false;
    } else if (formData.userpassword.length < 6) {
      newErrors.userpassword = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (event) => {
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
      userpassword: formData.userpassword,
    };

    console.log("Submitting JSON Payload:", JSON.stringify(payload, null, 2));

    // Example: Send payload to an API endpoint
    // fetch('/api/login', { // Or '/api/signup'
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // })
    // .then(response => response.json())
    // .then(data => console.log('Success:', data))
    // .catch(error => {
    //     console.error('Error:', error);
    //     setErrors(prev => ({...prev, general: 'Submission failed. Please try again.'}))
    //  });

    // Optionally clear the form after successful submission
    // setFormData({ username: '', userpassword1: '', userpassword2: '' });
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center" order={2} mb="lg">
          Login
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              required
              label="Username"
              placeholder="Your username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username || null}
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              name="userpassword1"
              value={formData.userpassword}
              onChange={handleChange}
              error={errors.userpassword || null}
            />

            {errors.general && (
              <Text c="red" size="sm" ta="center">
                {errors.general}
              </Text>
            )}

            <Button type="submit" fullWidth mt="xl">
              Register
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
