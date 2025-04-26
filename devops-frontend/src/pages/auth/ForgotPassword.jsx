import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Title,
  TextInput,
  Button,
  Text,
  Stack,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.passwordReset(email);

      if (response.status === 200) {
        notifications.show({
          title: 'Success',
          message: 'Password reset email has been sent. Please check your inbox.',
          color: 'green',
        });
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
      notifications.show({
        title: 'Error',
        message: err.response?.data?.detail || 'An error occurred. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" my={40}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title order={2} ta="center" mb="lg">
          Forgot Password
        </Title>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              required
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
            <Button
              type="submit"
              fullWidth
              loading={loading}
              mt="md"
            >
              Send Reset Link
            </Button>
            <Button
              variant="subtle"
              onClick={() => navigate('/login')}
              mt="xs"
            >
              Back to Login
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default ForgotPassword; 