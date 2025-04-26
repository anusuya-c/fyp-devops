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
    Tabs,
    Flex,
    Anchor,
    Image, // Import Anchor for links
} from "@mantine/core";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api/api";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    // State to control the active tab
    const [activeTab, setActiveTab] = useState('login'); // Default to 'login'

    // --- Login State ---
    const [loginFormData, setLoginFormData] = useState({
        username: "",
        userpassword: "",
    });
    const [loginErrors, setLoginErrors] = useState({
        username: "",
        userpassword: "",
        general: "",
    });

    // --- Register State ---
    const [registerFormData, setRegisterFormData] = useState({
        username: "",
        email: "",
        password1: "",
        password2: "",
    });
    const [registerErrors, setRegisterErrors] = useState({
        username: "",
        email: "",
        password1: "",
        password2: "",
        general: "",
    });

    // --- Login Handlers (keep as before) ---
    const handleLoginChange = (event) => {
        const { name, value } = event.target;
        setLoginFormData((prevData) => ({ ...prevData, [name]: value }));
        if (loginErrors[name]) {
            setLoginErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
        }
        if (loginErrors.general) {
            setLoginErrors((prevErrors) => ({ ...prevErrors, general: "" }));
        }
    };

    const validateLoginForm = () => {
        let isValid = true;
        const newErrors = { username: "", userpassword: "", general: "" };
        if (!loginFormData.username) {
            newErrors.username = "Username is required"; isValid = false;
        }
        if (!loginFormData.userpassword) {
            newErrors.userpassword = "Password is required"; isValid = false;
        } else if (loginFormData.userpassword.length < 6) {
            newErrors.userpassword = "Password must be at least 6 characters"; isValid = false;
        }
        setLoginErrors(newErrors);
        return isValid;
    };

    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        if (!validateLoginForm()) {
            setLoginErrors((prevErrors) => ({ ...prevErrors, general: "Please fix the errors above." }));
            return;
        }
        setLoginErrors({ username: "", userpassword: "", general: "" }); // Clear errors on successful validation
        const payload = { username: loginFormData.username, password: loginFormData.userpassword };
        await login(payload);
    };

    // --- Register Handlers (keep as before) ---
    const handleRegisterChange = (event) => {
        const { name, value } = event.target;
        setRegisterFormData((prevData) => ({ ...prevData, [name]: value }));
        if (registerErrors[name]) {
            setRegisterErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
        }
        if (registerErrors.general) {
            setRegisterErrors((prevErrors) => ({ ...prevErrors, general: "" }));
        }
    };

    const validateRegisterForm = () => {
        let isValid = true;
        const newErrors = { username: "", email: "", password1: "", password2: "", general: "" };
        if (!registerFormData.username) {
             newErrors.username = "Username is required"; isValid = false;
        }
        if (!registerFormData.email) {
            newErrors.email = "Email is required"; isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(registerFormData.email)) {
            newErrors.email = "Invalid email format"; isValid = false;
        }
        if (!registerFormData.password1) {
            newErrors.password1 = "Password is required"; isValid = false;
        } else if (registerFormData.password1.length < 6) {
            newErrors.password1 = "Password must be at least 6 characters"; isValid = false;
        }
        if (!registerFormData.password2) {
            newErrors.password2 = "Password confirmation is required"; isValid = false;
        } else if (registerFormData.password1 && registerFormData.password1 !== registerFormData.password2) {
            newErrors.password2 = "Passwords do not match"; isValid = false;
        }
        setRegisterErrors(newErrors);
        return isValid;
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();
        if (!validateRegisterForm()) {
            setRegisterErrors((prevErrors) => ({ ...prevErrors, general: "Please fix the errors above." }));
            return;
        }
        setRegisterErrors({ username: "", email: "", password1: "", password2: "", general: "" }); // Clear errors on successful validation
        const payload = {
            username: registerFormData.username,
            email: registerFormData.email,
            password1: registerFormData.password1,
            password2: registerFormData.password2,
        };
        try {
            await api.register(payload);
            notifications.show({
                title: 'Registration Successful',
                message: `User ${registerFormData.username} registered! Please log in.`,
                color: 'green',
            });
            setRegisterFormData({ username: "", email: "", password1: "", password2: "" });
            setActiveTab('login'); // Switch to login tab after successful registration
        } catch (error) {
            console.error("Registration Error:", error);
            const errorMessage = error.response?.data?.detail ||
                                error.response?.data?.username?.[0] ||
                                error.response?.data?.email?.[0] ||
                                error.response?.data?.password1?.[0] ||
                                error.response?.data?.password2?.[0] ||
                                'An error occurred during registration.';
            notifications.show({
                title: 'Registration Failed',
                message: errorMessage,
                color: 'red',
            });
            setRegisterErrors((prevErrors) => ({ ...prevErrors, general: errorMessage }));
        }
    };

    // --- Min height for tab panels to prevent layout shifts ---
    const panelMinHeight = 420; // Adjust this value as needed

    return (
        <Container size="lg" my={40}>
            <Flex
                mih={"80vh"}
                gap="xl"
                justify="space-around"
                align="center"
                direction="row"
                wrap="wrap"
            >
                {/* Logo */}
                <Image
                    src="/logo.png"
                    alt="DevSecOps Monitor Logo"
                    w={"50%"}
                />

                {/* Combined Login/Register Card + Switch Links */}
                <Stack align="center" miw={420}> {/* Stack to hold Paper and switch links */}
                    <Paper withBorder shadow="md" p={30} radius="md" style={{ maxWidth: 420, width: '100%'}}>
                        <Tabs
                            value={activeTab} // Controlled component
                            onTabChange={setActiveTab} // Update state on change
                            variant="pills" // Optional: Different tab style
                            radius="md" // Optional: Style
                        >
                            {/* <Tabs.List grow>
                                <Tabs.Tab value="login">Login</Tabs.Tab>
                                <Tabs.Tab value="register">Register</Tabs.Tab>
                            </Tabs.List> */}

                            {/* Login Panel */}
                            <Tabs.Panel value="login" pt="lg" >
                                <Title ta="center" order={3} mb="xs">Welcome back!</Title>
                                <form onSubmit={handleLoginSubmit}>
                                    <Stack>
                                        <TextInput required label="Username" placeholder="Your username" name="username" value={loginFormData.username} onChange={handleLoginChange} error={loginErrors.username || null} />
                                        <PasswordInput required label="Password" placeholder="Your password" name="userpassword" value={loginFormData.userpassword} onChange={handleLoginChange} error={loginErrors.userpassword || null} />
                                        <Anchor component="button" type="button" onClick={() => navigate('/forgot-password')} size="sm" ta="right">
                                            Forgot password?
                                        </Anchor>
                                        {loginErrors.general && <Text c="red" size="sm" ta="center">{loginErrors.general}</Text>}
                                        <Button type="submit" fullWidth mt="md">Login</Button>
                                    </Stack>
                                </form>
                            </Tabs.Panel>

                            {/* Register Panel */}
                            <Tabs.Panel value="register" pt="lg" style={{ minHeight: panelMinHeight }}>
                                <Title ta="center" order={3} mb="xs">Create Account</Title>
                                <form onSubmit={handleRegisterSubmit}>
                                    <Stack>
                                        <TextInput required label="Username" placeholder="Choose a username" name="username" value={registerFormData.username} onChange={handleRegisterChange} error={registerErrors.username || null} />
                                        <TextInput required label="Email" placeholder="your@email.com" name="email" value={registerFormData.email} onChange={handleRegisterChange} error={registerErrors.email || null} />
                                        <PasswordInput required label="Password" placeholder="Create a password (min. 6 chars)" name="password1" value={registerFormData.password1} onChange={handleRegisterChange} error={registerErrors.password1 || null} />
                                        <PasswordInput required label="Confirm Password" placeholder="Confirm your password" name="password2" value={registerFormData.password2} onChange={handleRegisterChange} error={registerErrors.password2 || null} />
                                        {registerErrors.general && <Text c="red" size="sm" ta="center">{registerErrors.general}</Text>}
                                        <Button type="submit" fullWidth mt="md">Register</Button>
                                    </Stack>
                                </form>
                            </Tabs.Panel>
                        </Tabs>
                    </Paper>

                    {/* Switch Links Below Paper */}
                    <Text ta="center" size="sm" mt="md">
                        {activeTab === 'login' ? (
                            <>
                                Don&apos;t have an account?{' '}
                                <Anchor component="button" type="button" onClick={() => setActiveTab('register')}>
                                    Register now
                                </Anchor>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <Anchor component="button" type="button" onClick={() => setActiveTab('login')}>
                                    Login
                                </Anchor>
                            </>
                        )}
                    </Text>
                </Stack>
            </Flex>
        </Container>
    );
}