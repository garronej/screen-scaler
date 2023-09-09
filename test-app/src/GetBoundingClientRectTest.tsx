
import { useEffect, useState } from "react";


export function GetBoundingClientRectTest() {

    const [ref, setRef] = useState<React.ElementRef<"div"> | null>(null);
    const [domRect, setDomRect] = useState<DOMRect | undefined>(undefined);

    useEffect(() => {
        if (ref === null) {
            return;
        }

        const domRect = ref.getBoundingClientRect();

        setDomRect(domRect);

    }, [ref]);



    return (
        <div
            style={{
                "position": "relative",
                "width": 100,
                "height": 100,
                "backgroundColor": "blue"
            }}
        >
            <div
                ref={setRef}
                style={{
                    "position": "absolute",
                    "top": 10,
                    "left": 10,
                    "width": 20,
                    "height": 20,
                    "backgroundColor": "red"
                }}
            >
                {
                    domRect !== undefined && (
                        <div
                            style={{
                                "position": "fixed",
                                "top": domRect.top,
                                "left": domRect.left,
                                "width": domRect.width,
                                "height": domRect.height,
                                "border": "1px solid white"
                            }}
                        />
                    )
                }

            </div>

        </div>
    );



}