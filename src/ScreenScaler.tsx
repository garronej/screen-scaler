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
              zoomFactor: number;
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
              scaleFactor: number;
              targetWindowInnerWidth: number;
              targetWindowInnerHeight: number;
          }
        | { isOutOfRange: true }
    );

    document.body.style.margin = "0";

    const { getPersistedZoomLevelState, persistZoomLevelState } = (() => {
        const key = "screen-scaler-zoom-level";

        type State = { devicePixelRatio: number; zoomLevel: number };

        function getPersistedZoomLevelState(): State | undefined {
            const serializedState = localStorage.getItem(key);

            if (serializedState === null) {
                return undefined;
            }

            return JSON.parse(serializedState);
        }

        function persistZoomLevelState(state: State): void {
            localStorage.setItem(key, JSON.stringify(state));
        }

        return {
            getPersistedZoomLevelState,
            persistZoomLevelState
        };
    })();

    const evtZoomFactor = Evt.from(window, "resize")
        .toStateful()
        .pipe([
            (_data, prev) =>
                prev.devicePixelRatio === devicePixelRatio
                    ? [prev]
                    : [
                          {
                              devicePixelRatio,
                              "zoomLevel":
                                  prev.zoomLevel + (devicePixelRatio > prev.devicePixelRatio ? 1 : -1)
                          }
                      ],

            getPersistedZoomLevelState() ?? { devicePixelRatio, "zoomLevel": 0 }
        ])
        .pipe(onlyIfChanged())
        .pipe(
            (data, registerSideEffect) => (registerSideEffect(() => persistZoomLevelState(data)), [data])
        )
        .pipe(({ zoomLevel }) => [
            1 /
                (() => {
                    switch (Math.max(-7, Math.min(9, zoomLevel))) {
                        case -7:
                            return 0.25;
                        case -6:
                            return 0.33;
                        case -5:
                            return 0.5;
                        case -4:
                            return 0.66;
                        case -3:
                            return 0.75;
                        case -2:
                            return 0.8;
                        case -1:
                            return 0.9;
                        case 0:
                            return 1;
                        case 1:
                            return 1.1;
                        case 2:
                            return 1.25;
                        case 3:
                            return 1.5;
                        case 4:
                            return 1.75;
                        case 5:
                            return 2;
                        case 6:
                            return 2.5;
                        case 7:
                            return 3;
                        case 8:
                            return 4;
                        case 9:
                            return 5;
                    }
                    assert(false);
                })()
        ]);

    const evtState = Evt.merge([Evt.from(window, "resize"), evtZoomFactor])
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
                        ) as number,
                        "zoomFactor": evtZoomFactor.state
                    }
                ];
            })()
        )
        .pipe(onlyIfChanged())
        .pipe(({ realWindowInnerHeight, realWindowInnerWidth, zoomFactor }): [State] => {
            const result = calculateExpectedDimensions({
                realWindowInnerWidth,
                realWindowInnerHeight,
                zoomFactor
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

            const scaleFactor = realWindowInnerWidth / targetWindowInnerWidth;

            return [
                {
                    "isOutOfRange": false,
                    scaleFactor,
                    targetWindowInnerWidth,
                    "targetWindowInnerHeight": realWindowInnerHeight / scaleFactor,
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

                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return {
                        "left": left / scaleFactor,
                        "top": top / scaleFactor,
                        "width": width / scaleFactor,
                        "height": height / scaleFactor,
                        "right": right / scaleFactor,
                        "bottom": bottom / scaleFactor
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

                const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                return {
                    "left": left / scaleFactor,
                    "top": top / scaleFactor,
                    "width": width / scaleFactor,
                    "height": height / scaleFactor,
                    "right": right / scaleFactor,
                    "bottom": bottom / scaleFactor
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

        const { scaleFactor, targetWindowInnerWidth, targetWindowInnerHeight } = state;

        return (
            <div
                about={`${ScreenScaler.name} outer wrapper`}
                style={{ "height": "100vh", "overflow": "hidden" }}
            >
                <div
                    about={`${ScreenScaler.name} inner wrapper`}
                    style={{
                        "transform": `scale(${scaleFactor})`,
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
