import { createScreenScaler } from "react-screen-scaler";

const { ScreenScaler } = createScreenScaler({
    "targetWindowInnerWidth": ({ zoomFactor, isPortraitOrientation })=> 
        isPortraitOrientation ? 
            undefined : 
            1920 * zoomFactor,
});

export function App() {
    return (
        <ScreenScaler
            fallback={<h1>Rotate your phone</h1>}
        >
            <h1>Hello World</h1>
            <p>
                Lorem ipsum dolor sit amet consectetur adipi sicing elit. Quisquam
                voluptates, quibusdam, quos, quas voluptatum quia quod quae
                voluptatibus quidem quae voluptates, quibusdam, quos, quas
                voluptatum quia quod quae voluptatibus quidem quae voluptates,
                quibusdam, quos, quas voluptatum quia quod quae voluptatibus
                quidem quae voluptates, quibusdam, quos, quas voluptatum quia quod
                quae voluptatibus quidem quae voluptates, quibusdam, quos, quas
                voluptatum quia quod quae voluptatibus quidem quae voluptates,
                quibusdam, quos, quas voluptatum quia quod quae voluptatibus
                quidem quae voluptates, quibusdam, quos, quas voluptatum quia quod
            </p>
        </ScreenScaler>
    );

}
