import { Container, Title } from '@mantine/core';
export function PlaceholderPage({ title = "Page Under Construction" }) {
    return (
        <Container>
            <Title order={2} align="center" mt="xl">{title}</Title>
        </Container>
    )
}