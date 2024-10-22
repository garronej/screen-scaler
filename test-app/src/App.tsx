import { BasicSelect } from "./BasicSelect";
import Button from "@mui/material/Button";
//import "./main.css";

export default function App() {

    return (
            <div style={{
                height: "100%",
                backgroundColor: "pink",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
            }}>
                <header
                    style={{
                        height: 100,
                        backgroundColor: "#333",
                        color: "#FFF",
                    }}
                >
                    <h2>Header</h2>
                </header>
                <main style={{
                    flex: 1,
                    display: "flex",
                    overflow: "hidden"
                }}>
                    <aside style={{
                        backgroundColor: "#555",
                        color: "#FFF",
                        width: "20%",
                    }}>
                        <a href="https://example.com" style={{ color: '#AAA' }}>Item 1: foo bar baz hello</a><br />
                        <a href="https://example.com" style={{ color: '#AAA' }}>Item 2: world foo bar baz</a><br />
                    </aside>
                    <article style={{
                        backgroundColor: "#f4f4f4",
                        flex: 1,
                    }}>
                        {/* a grid layout 3 x 3 that uses all the space */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0px 0px',
                            height: '100%',
                        }}>
                            {
                                new Array(4).fill(null).map((_, index) => (
                                    <div key={index} style={{
                                        border: '1px solid #CCC',
                                        padding: 10,
                                        overflow: "visible"
                                    }}>
                                        <h2 style={{ color: '#333' }}>Card {index}</h2>
                                        <BasicSelect />
                                        <Button variant="contained" sx={{ "mt": 2 }}>Contained</Button>
                                        {/*index === 0 && <GetBoundingClientRectTest />*/}
                                        <p style={{ color: '#333' }}>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget
                                            consequat aliquam, nunc nisl aliquet nunc, vitae aliquam nisl nunc vitae nisl.
                                            Nullam euismod, nisl eget consequat aliquam, nunc nisl aliquet nunc, vitae aliquam
                                            nisl nunc vitae nisl. Nullam euismod, nisl eget consequat aliquam, nunc nisl
                                            aliquet nunc, vitae aliquam nisl nunc vitae nisl. Nullam euismod, nisl eget
                                            consequat aliquam, nunc nisl aliquet nunc, vitae aliquam nisl nunc vitae nisl.
                                        </p>
                                    </div>
                                ))
                            }
                        </div>
                    </article>
                </main>
                <footer style={{
                    height: 50,
                    backgroundColor: "#333",
                    color: "#FFF"
                }}>
                    <h3>Footer</h3>
                </footer>


            </div>
    );

}
