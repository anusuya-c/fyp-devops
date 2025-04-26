import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  PasswordInput,
  Button,
  Stack,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    if (!uid || !token) {
      notifications.show({
        title: 'Error',
        message: 'Invalid password reset link',
        color: 'red',
      });
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password1 !== password2) {
      setError('Passwords do not match');
      notifications.show({
        title: 'Error',
        message: 'Passwords do not match',
        color: 'red',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await api.passwordResetConfirm({
        uid: searchParams.get('uid'),
        token: searchParams.get('token'),
        new_password1: password1,
        new_password2: password2,
      });

      if (response.status === 200) {
        notifications.show({
          title: 'Success',
          message: 'Password has been reset successfully. Redirecting to login...',
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
          Reset Password
        </Title>
        <form onSubmit={handleSubmit}>
          <Stack>
            <PasswordInput
              required
              label="New Password"
              placeholder="Enter your new password"
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              error={error}
            />
            <PasswordInput
              required
              label="Confirm New Password"
              placeholder="Confirm your new password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              error={error}
            />
            <Button
              type="submit"
              fullWidth
              loading={loading}
              mt="md"
            >
              Reset Password
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default ResetPassword; 