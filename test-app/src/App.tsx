import { createScreenScaler } from "react-screen-scaler";

const { ScreenScaler } = createScreenScaler({
    "expectedWindowInnerWidth": 1920
});

export function App() {

    return (
        <ScreenScaler>
            <h1>Hello World</h1>
        </ScreenScaler>
    );

}