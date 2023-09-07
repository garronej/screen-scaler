import { type ReactNode } from "react";
import { assert } from "tsafe/assert";
import { Evt, onlyIfChanged } from "evt";
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

    document.body.style.margin = "0";

    const evtState = Evt.from(window, "resize")
        .toStateful()
        .pipe(
            (() => {
                const { get: clientWidthGetter } =
                    Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth") ?? {};
                const { get: clientHeightGetter } =
                    Object.getOwnPropertyDescriptor(Element.prototype, "clientHeight") ?? {};

                assert(clientWidthGetter !== undefined);
                assert(clientHeightGetter !== undefined);

                return () => [
                    {
                        //NOTE: Using document dimensions instead of windows's dimensions because on mobile
                        // when we pinch and zoom the window's dimensions changes and we don't want to recomputes the UI
                        // in this case, we want to enable zooming on a portion of the screen.
                        "realWindowInnerWidth": clientWidthGetter.call(
                            window.document.documentElement
                        ) as number,
                        "realWindowInnerHeight": clientHeightGetter.call(
                            window.document.documentElement
                        ) as number
                    }
                ];
            })()
        )
        .pipe(onlyIfChanged())
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
        const realGetBoundingClientRect = Element.prototype.getBoundingClientRect;

        //Pollute HTMLDivElement.prototype.getBoundingClientRect
        Object.defineProperties(Element.prototype, {
            "getBoundingClientRect": {
                "value": function getBoundingClientRect(this: Element) {
                    const { left, top, width, height, right, bottom } =
                        realGetBoundingClientRect.call(this);

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
            },
            "clientLeft": {
                "get": function (this: Element) {
                    return this.getBoundingClientRect().left;
                },
                "enumerable": true,
                "configurable": true
            },
            "clientTop": {
                "get": function (this: Element) {
                    return this.getBoundingClientRect().top;
                },
                "enumerable": true,
                "configurable": true
            },
            "clientWidth": {
                "get": function (this: Element) {
                    return this.getBoundingClientRect().width;
                },
                "enumerable": true,
                "configurable": true
            },
            "clientHeight": {
                "get": function (this: Element) {
                    return this.getBoundingClientRect().height;
                },
                "enumerable": true,
                "configurable": true
            }
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

    {
        const RealResizeObserver = window.ResizeObserver;

        class CustomResizeObserver extends RealResizeObserver {
            private ctx = Evt.newCtx();

            constructor(private callback: ResizeObserverCallback) {
                super(callback);
            }

            private targets = new Set<Element>();

            observe(target: Element, options?: ResizeObserverOptions | undefined): void {
                super.observe(target, options);

                this.targets.add(target);

                evtState.toStateless().attach(this.ctx, () => {
                    this.callback(
                        Array.from(this.targets).map(target => {
                            const contentRect = target.getBoundingClientRect();

                            const boxSize = {
                                "inlineSize": contentRect.width,
                                "blockSize": contentRect.height
                            };

                            const entry: ResizeObserverEntry = {
                                target,
                                contentRect,
                                "borderBoxSize": [boxSize],
                                "contentBoxSize": [boxSize],
                                "devicePixelContentBoxSize": [boxSize]
                            };

                            return entry;
                        }),
                        this
                    );
                });
            }

            unobserve(target: Element): void {
                super.unobserve(target);

                this.targets.delete(target);

                if (this.targets.size === 0) {
                    this.ctx.done();
                }
            }

            disconnect(): void {
                super.disconnect();
                this.ctx.done();
            }
        }

        window.ResizeObserver = CustomResizeObserver;
    }

    function ScreenScaler(props: { children: ReactNode; fallback?: ReactNode }) {
        const { children, fallback } = props;

        useRerenderOnStateChange(evtState);

        const state = evtState.state;

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
