import { type ReactNode } from "react";
import { assert } from "tsafe/assert";
import { Evt } from "evt";
import { useRerenderOnStateChange } from "evt/hooks";

export function createScreenScaler(
    expectedDimensions:
        | { targetWindowInnerWidth: number }
        | ((params: {
              realWindowInnerWidth: number;
              realWindowInnerHeight: number;
          }) => { targetWindowInnerWidth: number } | undefined)
) {
    const calculateExpectedDimensions =
        typeof expectedDimensions === "function" ? expectedDimensions : () => expectedDimensions;

    type State = {
        realWindowInnerHeight: number;
        realWindowInnerWidth: number;
    } & (
        | {
              isOutOfRange: false;
              zoomFactor: number;
              targetWindowInnerWidth: number;
              targetWindowInnerHeight: number;
          }
        | { isOutOfRange: true }
    );

    const evtState = Evt.from(window, "resize")
        .toStateful()
        .pipe(
            (() => {
                const { get: innerWidthGetter } =
                    Object.getOwnPropertyDescriptor(window, "innerWidth") ?? {};
                const { get: innerHeightGetter } =
                    Object.getOwnPropertyDescriptor(window, "innerHeight") ?? {};

                assert(innerWidthGetter !== undefined);
                assert(innerHeightGetter !== undefined);

                return () => [
                    {
                        "realWindowInnerWidth": innerWidthGetter.call(window),
                        "realWindowInnerHeight": innerHeightGetter.call(window)
                    }
                ];
            })()
        )
        .pipe(({ realWindowInnerHeight, realWindowInnerWidth }): [State] => {
            const result = calculateExpectedDimensions({
                realWindowInnerWidth,
                realWindowInnerHeight
            });

            if (result === undefined) {
                return [
                    {
                        "isOutOfRange": true,
                        realWindowInnerHeight,
                        realWindowInnerWidth
                    }
                ];
            }

            const { targetWindowInnerWidth } = result;

            const zoomFactor = realWindowInnerWidth / targetWindowInnerWidth;

            return [
                {
                    "isOutOfRange": false,
                    zoomFactor,
                    targetWindowInnerWidth,
                    "targetWindowInnerHeight": realWindowInnerHeight / zoomFactor,
                    realWindowInnerHeight,
                    realWindowInnerWidth
                }
            ];
        });

    document.body.style.margin = "0";

    Object.defineProperties(window, {
        "innerWidth": {
            "get": () =>
                evtState.state.isOutOfRange
                    ? evtState.state.realWindowInnerWidth
                    : evtState.state.targetWindowInnerWidth,
            "set": undefined,
            "enumerable": true,
            "configurable": true
        },
        "innerHeight": {
            "get": () =>
                evtState.state.isOutOfRange
                    ? evtState.state.realWindowInnerHeight
                    : evtState.state.targetWindowInnerHeight,
            "set": undefined,
            "enumerable": true,
            "configurable": true
        }
    });

    // Pollute getBoundingClientRect
    {
        const realGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

        //Pollute HTMLDivElement.prototype.getBoundingClientRect
        Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
            "value": function getBoundingClientRect(this: HTMLElement) {
                const { left, top, width, height, right, bottom } = realGetBoundingClientRect.call(this);

                const zoomFactor = evtState.state.isOutOfRange ? 1 : evtState.state.zoomFactor;

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

                const zoomFactor = evtState.state.isOutOfRange ? 1 : evtState.state.zoomFactor;

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

    const evtStateNoPinchAndZoom = evtState
        .toStateless()
        .pipe(state => (window.scrollY !== 0 || window.scrollX !== 0 ? null : [state]))
        .toStateful(evtState.state);

    function ScreenScaler(props: { children: ReactNode; fallback?: ReactNode }) {
        const { children, fallback } = props;

        useRerenderOnStateChange(evtStateNoPinchAndZoom);

        const state = evtStateNoPinchAndZoom.state;

        if (state.isOutOfRange) {
            return <>{fallback ?? <>ScreenScaler out of range</>}</>;
        }

        const { zoomFactor, targetWindowInnerWidth, targetWindowInnerHeight } = state;

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
                        "width": targetWindowInnerWidth,
                        "height": targetWindowInnerHeight,
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
