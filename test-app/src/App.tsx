import { useEffect } from "react";
import { createScreenScaler } from "react-screen-scaler";
import { useDomRect } from "powerhooks/tools/useDomRect";

const { ScreenScaler } = createScreenScaler({
    "expectedWindowInnerWidth": 1920
});

/*
const { ScreenScaler } = createScreenScaler(
    ({ realWindowInnerWidth }) => ({ "expectedWindowInnerWidth": realWindowInnerWidth })
);
*/

//const ScreenScaler = (props: { children: React.ReactNode }) => <>{props.children}</>;

export function App() {

    const { ref, domRect: { width } } = useDomRect();

    useEffect(
        ()=>{

            if( ref.current === null ){
                return;
            }

            // Use resize observer
            const resizeObserver = new ResizeObserver(event => {
                console.log("resizeObserver", Object.getPrototypeOf(event[0]));

            });

            console.log(Object.getOwnPropertyDescriptor(ResizeObserverEntry, "contentRect"));

            resizeObserver.observe(ref.current);


        },
        [ref.current]
    );

    

    console.log(width);

    return (
        <ScreenScaler>
            <h1 style={{ "border": "1px solid blue" }} ref={ref}>Hello World</h1>
        </ScreenScaler>
    );

}

setInterval(
    () => {

        console.log({
            "window.innerWidth": window.innerWidth,
            "window.innerHeight": window.innerHeight,
        });

    },
    5000
);