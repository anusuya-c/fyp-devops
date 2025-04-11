import { AppSidebar } from "../components/AppSidebar";

export default function HomePage() {

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <AppSidebar />
            <main style={{ flexGrow: 1, padding: 'var(--mantine-spacing-md)', overflowY: 'auto' }}>
                <div>
                    <h1>Chuduus homepage</h1>
                    <p>chuduu is the best</p>
                </div>
                <div>Chudu queen</div>
            </main>
        </div>
    )
}
