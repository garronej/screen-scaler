import { type ReactNode, useReducer } from "react";
import { useGuaranteedMemo } from "./tools/useGuaranteedMemo";
import { useEffect } from "react";
import { useConst } from "./tools/useConst";
import { assert } from "tsafe/assert";
import { createGetRealWindowDimensions } from "./getRealWindowDimensions";

export function createScreenScaler(
    expectedDimensions:
        | { expectedWindowInnerWidth: number }
        | ((params: {
              realWindowInnerWidth: number;
              realWindowInnerHeight: number;
          }) => { expectedWindowInnerWidth: number } | undefined)
) {
    const calculateExpectedDimensions =
        typeof expectedDimensions === "function" ? expectedDimensions : () => expectedDimensions;

    document.body.style.margin = "0";

    const { getRealWindowDimensions } = createGetRealWindowDimensions();

    const { updateGetBoundingClientRect } = (() => {
        const realGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

        let zoomFactor = 1;

        //Pollute HTMLDivElement.prototype.getBoundingClientRect
        Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
            "value": function getBoundingClientRect(this: HTMLElement) {
                const { left, top, width, height, right, bottom } = realGetBoundingClientRect.call(this);

                return {
                    "left": left / zoomFactor,
                    "top": top / zoomFactor,
                    "width": width / zoomFactor,
                    "height": height / zoomFactor,
                    "right": right / zoomFactor,
                    "bottom": bottom / zoomFactor
                };
            },
            "enumerable": true,
            "configurable": true,
            "writable": false
        });

        function updateGetBoundingClientRect(params: { zoomFactor: number }) {
            zoomFactor = params.zoomFactor;
        }

        return { updateGetBoundingClientRect };
    })();

    function ScreenScaler(props: { children: ReactNode; fallback?: ReactNode }) {
        const { children, fallback } = props;

        const { realWindowInnerWidth, realWindowInnerHeight } = (function useClosure() {
            const [realWindowDimensions, updateRealWindowDimensions] = useReducer(
                () => getRealWindowDimensions(),
                getRealWindowDimensions()
            );

            useEffect(() => {
                const onResize = () => updateRealWindowDimensions();

                window.addEventListener("resize", onResize);

                return () => {
                    window.removeEventListener("resize", onResize);
                };
            }, []);

            return realWindowDimensions;
        })();

        const { resultOfGetConfig } = (function useClosure() {
            const refResultOfGetConfig = useConst<{
                current:
                    | {
                          isOutOfRange: false;
                          zoomFactor: number;
                          expectedWindowInnerWidth: number;
                          expectedWindowInnerHeight: number;
                      }
                    | { isOutOfRange: true }
                    | undefined;
            }>(() => ({ "current": undefined }));

            useGuaranteedMemo(() => {
                //We skip refresh when pinch and zoom
                if (
                    refResultOfGetConfig.current !== undefined &&
                    (window.scrollY !== 0 || window.scrollX !== 0)
                ) {
                    return;
                }

                const result = calculateExpectedDimensions({
                    realWindowInnerWidth,
                    realWindowInnerHeight
                });

                if (result === undefined) {
                    refResultOfGetConfig.current = {
                        "isOutOfRange": true
                    };

                    return;
                }

                const { expectedWindowInnerWidth } = result;

                const zoomFactor = realWindowInnerWidth / expectedWindowInnerWidth;

                const expectedWindowInnerHeight = realWindowInnerHeight / zoomFactor;

                //Pollute window.innerWidth and window.innerHeight
                Object.defineProperties(window, {
                    "innerWidth": {
                        "value": expectedWindowInnerWidth,
                        "enumerable": true,
                        "configurable": true,
                        "writable": false
                    },
                    "innerHeight": {
                        "value": expectedWindowInnerHeight,
                        "enumerable": true,
                        "configurable": true,
                        "writable": false
                    }
                });

                updateGetBoundingClientRect({ zoomFactor });

                refResultOfGetConfig.current = {
                    "isOutOfRange": false,
                    zoomFactor,
                    expectedWindowInnerWidth,
                    expectedWindowInnerHeight
                };
            }, [realWindowInnerWidth, realWindowInnerHeight]);

            assert(refResultOfGetConfig.current !== undefined);

            return { "resultOfGetConfig": refResultOfGetConfig.current };
        })();

        if (resultOfGetConfig.isOutOfRange) {
            return <>{fallback ?? <>ScreenScaler out of range</>}</>;
        }

        const { zoomFactor, expectedWindowInnerWidth, expectedWindowInnerHeight } = resultOfGetConfig;

        return (
            <div
                about={`${ScreenScaler.name} outer wrapper`}
                style={{ "height": "100vh", "overflow": "hidden" }}
            >
                <div
                    about={`${ScreenScaler.name} inner wrapper`}
                    style={{
                        "transform": `scale(${zoomFactor})`,
                        "transformOrigin": "0 0",
                        "width": expectedWindowInnerWidth,
                        "height": expectedWindowInnerHeight,
                        "overflow": "hidden"
                    }}
                >
                    {children}
                </div>
            </div>
        );
    }

    return { ScreenScaler };
}
