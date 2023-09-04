import { type ReactNode, useReducer } from "react";
import { useGuaranteedMemo } from "./tools/useGuaranteedMemo";
import { useEffect } from "react";
import { useConst } from "./tools/useConst";
import { assert } from "tsafe/assert";
import { createGetRealWindowDimensions } from "./getRealWindowDimensions";

export class ScreenScalerOutOfRangeError extends Error {
    constructor(public readonly fallbackNode: ReactNode) {
        super();

        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export type ScreenScalerProps = {
    /**
     * May throw 'import { ScreenScalerOutOfRangeError } from "react-screen-scaler";'
     * to specify a fallback screen on edge cases.
     */
    getConfig: (props: { realWindowInnerWidth: number; realWindowInnerHeight: number }) => {
        expectedWindowInnerWidth: number;
    };
    children: ReactNode;
};

export function ScreenScaler(props: ScreenScalerProps) {
    const { getConfig, children } = props;

    const { realWindowInnerWidth, realWindowInnerHeight } = (function useClosure() {
        const { getRealWindowDimensions } = createGetRealWindowDimensions();

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
                | { isOutOfRange: true; fallbackNode: ReactNode }
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

            let viewPortConfig: ReturnType<typeof getConfig>;

            try {
                viewPortConfig = getConfig({
                    realWindowInnerWidth,
                    realWindowInnerHeight
                });
            } catch (error) {
                if (!(error instanceof ScreenScalerOutOfRangeError)) {
                    throw error;
                }

                const { fallbackNode } = error;

                refResultOfGetConfig.current = {
                    "isOutOfRange": true,
                    fallbackNode
                };

                return;
            }

            const zoomFactor = realWindowInnerWidth / viewPortConfig.expectedWindowInnerWidth;

            refResultOfGetConfig.current = {
                "isOutOfRange": false,
                zoomFactor,
                "expectedWindowInnerWidth": viewPortConfig.expectedWindowInnerWidth,
                "expectedWindowInnerHeight": realWindowInnerHeight / zoomFactor
            };

            //Pollute window.innerWidth and window.innerHeight
            Object.defineProperties(window, {
                "innerWidth": {
                    "value": refResultOfGetConfig.current.expectedWindowInnerWidth,
                    "enumerable": true,
                    "configurable": true,
                    "writable": false
                },
                "innerHeight": {
                    "value": refResultOfGetConfig.current.expectedWindowInnerHeight,
                    "enumerable": true,
                    "configurable": true,
                    "writable": false
                }
            });

            function getBoundingClientRect(this: HTMLElement) {
                const { left, top, width, height, right, bottom } =
                    getBoundingClientRect.real.call(this);

                return {
                    "left": left / zoomFactor,
                    "top": top / zoomFactor,
                    "width": width / zoomFactor,
                    "height": height / zoomFactor,
                    "right": right / zoomFactor,
                    "bottom": bottom / zoomFactor
                };
            }

            getBoundingClientRect.real =
                (HTMLDivElement.prototype.getBoundingClientRect as { real?: () => DOMRect }).real ??
                Element.prototype.getBoundingClientRect;

            //Pollute HTMLDivElement.prototype.getBoundingClientRect
            Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
                "value": getBoundingClientRect,
                "enumerable": true,
                "configurable": true,
                "writable": false
            });
        }, [getConfig, realWindowInnerWidth, realWindowInnerHeight]);

        assert(refResultOfGetConfig.current !== undefined);

        return { "resultOfGetConfig": refResultOfGetConfig.current };
    })();

    if (resultOfGetConfig.isOutOfRange) {
        const { fallbackNode } = resultOfGetConfig;
        return <>{fallbackNode}</>;
    }

    const { zoomFactor, expectedWindowInnerWidth, expectedWindowInnerHeight } = resultOfGetConfig;

    return (
        <div
            about={`${ScreenScaler.name} outer wrapper`}
            style={{ "height": "100vh", "overflow": "hidden", "border": "1px solid red" }}
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
