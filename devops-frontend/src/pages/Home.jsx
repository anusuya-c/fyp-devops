import { AppSidebar } from "../components/AppSidebar";

export default function HomePage() {

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <AppSidebar />
            <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto' }}>
                <div>
                    <h1>DevSecOps Security Monitor</h1>
                    <p>-Secure -Automate -Monitor</p>
                </div>
                <div></div>
            </main>
        </div>
    )
}
