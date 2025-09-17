
import { useEffect, useState } from "react";

export default function GetBoundingClientRectTest() {

    const [element, setElement] = useState<React.ElementRef<"div"> | null>(null);
    const [domRect, setDomRect] = useState<DOMRect | undefined>(undefined);

    useEffect(() => {
        if (element === null) {
            return;
        }

        const domRect = element.getBoundingClientRect();

        setDomRect(domRect);

    }, [element]);

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
                ref={setElement}
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