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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    useremail: "",
    userpassword1: "",
    userpassword2: "",
  });

  const [errors, setErrors] = useState({
    useremail: "",
    userpassword1: "",
    userpassword2: "",
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
      useremail: "",
      userpassword1: "",
      userpassword2: "",
      general: "",
    };

    // Email validation
    if (!formData.useremail) {
      newErrors.useremail = "Email is required";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.useremail)) {
      newErrors.useremail = "Invalid email format";
      isValid = false;
    }

    if (!formData.userpassword1) {
      newErrors.userpassword1 = "Password is required";
      isValid = false;
    } else if (formData.userpassword1.length < 6) {
      newErrors.userpassword1 = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!formData.userpassword2) {
      newErrors.userpassword2 = "Password confirmation is required";
      isValid = false;
    } else if (
      formData.userpassword1 &&
      formData.userpassword1 !== formData.userpassword2
    ) {
      newErrors.userpassword2 = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
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
      useremail: formData.useremail,
      userpassword1: formData.userpassword1,
      userpassword2: formData.userpassword2,
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
    // setFormData({ useremail: '', userpassword1: '', userpassword2: '' });
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
              label="Email"
              placeholder="your@email.com"
              name="useremail"
              value={formData.useremail}
              onChange={handleChange}
              error={errors.useremail || null}
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              name="userpassword1"
              value={formData.userpassword1}
              onChange={handleChange}
              error={errors.userpassword1 || null}
            />

            <PasswordInput
              required
              label="Confirm Password"
              placeholder="Confirm your password"
              name="userpassword2"
              value={formData.userpassword2}
              onChange={handleChange}
              error={errors.userpassword2 || null}
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
