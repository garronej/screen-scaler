import { type ReactNode, useReducer } from "react";
import { useGuaranteedMemo } from "./tools/useGuaranteedMemo";
import { useEffect } from "react";
import { useConst } from "./tools/useConst";
import { assert } from "tsafe/assert";

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

    const { updateDOMOverrides } = (() => {
        let zoomFactor = 1;

        {
            const { get: innerWidthGetter } =
                Object.getOwnPropertyDescriptor(window, "innerWidth") ?? {};
            const { get: innerHeightGetter } =
                Object.getOwnPropertyDescriptor(window, "innerHeight") ?? {};

            assert(innerWidthGetter !== undefined);
            assert(innerHeightGetter !== undefined);

            Object.defineProperties(window, {
                "innerWidth": {
                    "get": () => innerWidthGetter.call(window) / zoomFactor,
                    "enumerable": true,
                    "configurable": true,
                    "writable": false
                },
                "innerHeight": {
                    "get": () => innerHeightGetter.call(window) / zoomFactor,
                    "enumerable": true,
                    "configurable": true,
                    "writable": false
                }
            });
        }

        // Pollute getBoundingClientRect
        {
            const realGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

            //Pollute HTMLDivElement.prototype.getBoundingClientRect
            Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
                "value": function getBoundingClientRect(this: HTMLElement) {
                    const { left, top, width, height, right, bottom } =
                        realGetBoundingClientRect.call(this);

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
        }

        // Pollute the argument of ResizeObserver callback
        {
            const { get: realContentRectGetter } =
                Object.getOwnPropertyDescriptor(ResizeObserverEntry.prototype, "contentRect") ?? {};

            assert(realContentRectGetter !== undefined);

            Object.defineProperty(ResizeObserver.prototype, "contentRect", {
                "configurable": true,
                "enumerable": true,
                "set": undefined,
                "get": function (this: ResizeObserverEntry) {
                    const { left, top, width, height, right, bottom } = realContentRectGetter.call(this);

                    return {
                        "left": left / zoomFactor,
                        "top": top / zoomFactor,
                        "width": width / zoomFactor,
                        "height": height / zoomFactor,
                        "right": right / zoomFactor,
                        "bottom": bottom / zoomFactor
                    };
                }
            });
        }

        function updateDOMOverrides(params: { zoomFactor: number }) {
            zoomFactor = params.zoomFactor;
        }

        return { updateDOMOverrides };
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

                updateDOMOverrides({ zoomFactor });

                refResultOfGetConfig.current = {
                    "isOutOfRange": false,
                    zoomFactor,
                    expectedWindowInnerWidth,
                    "expectedWindowInnerHeight": realWindowInnerHeight / zoomFactor
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
