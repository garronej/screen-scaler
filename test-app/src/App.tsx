import { ScreenScaler } from "react-screen-scaler/ScreenScaler";

export function App() {
    return (
        <ScreenScaler
            getConfig={()=>({
                "expectedWindowInnerWidth": 1920,
            })}
        >
            <h1>Hello World</h1>
        </ScreenScaler>
    );
}