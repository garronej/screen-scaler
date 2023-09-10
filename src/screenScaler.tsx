import { assert } from "tsafe/assert";
import { Evt, onlyIfChanged, type Ctx } from "evt";
import { getOwnPropertyDescriptor } from "./tools/getOwnPropertyDescriptor";

let ctx: Ctx | undefined = undefined;

export function enableScreenScaler(params: {
    targetWindowInnerWidth:
        | (number | undefined)
        | ((params: {
              actualWindowInnerWidth: number;
              actualWindowInnerHeight: number;
              zoomFactor: number;
              isPortraitOrientation: boolean;
          }) => number | undefined);
    rootDivId: string;
}): {
    disableScreenScaler: () => void;
} {
    ctx?.done();

    ctx = Evt.newCtx();

    const getTargetWindowInnerWidth = (() => {
        const { targetWindowInnerWidth: param } = params;

        return typeof param === "function" ? param : () => param;
    })();

    const { rootDivId } = params;

    {
        const rootElement = document.getElementById(rootDivId);

        assert(rootElement !== null);

        const initialStyles = {
            "body": {
                "margin": document.body.style.margin,
                "transform": document.body.style.transform,
                "transformOrigin": document.body.style.transformOrigin,
                "width": document.body.style.width,
                "height": document.body.style.height,
                "overflow": document.body.style.overflow
            },
            "html": {
                "height": document.documentElement.style.height,
                "overflow": document.documentElement.style.overflow
            },
            "root":
                rootElement === undefined
                    ? undefined
                    : {
                          "height": rootElement.style.height,
                          "overflow": rootElement.style.overflow
                      }
        };

        const propertyDescriptors = {
            "window": {
                "innerWidth": getOwnPropertyDescriptor(window, "innerWidth"),
                "innerHeight": getOwnPropertyDescriptor(window, "innerHeight")
            },
            "Element.prototype": {
                "getBoundingClientRect": getOwnPropertyDescriptor(
                    Element.prototype,
                    "getBoundingClientRect"
                ),
                "clientLeft": getOwnPropertyDescriptor(Element.prototype, "clientLeft"),
                "clientTop": getOwnPropertyDescriptor(Element.prototype, "clientTop"),
                "clientWidth": getOwnPropertyDescriptor(Element.prototype, "clientWidth"),
                "clientHeight": getOwnPropertyDescriptor(Element.prototype, "clientHeight")
            },
            "ResizeObserverEntry.prototype": {
                "contentRect": getOwnPropertyDescriptor(ResizeObserverEntry.prototype, "contentRect")
            },
            "MouseEvent.prototype": {
                "clientX": getOwnPropertyDescriptor(MouseEvent.prototype, "clientX"),
                "clientY": getOwnPropertyDescriptor(MouseEvent.prototype, "clientY")
            }
        };

        const RealResizeObserver = window.ResizeObserver;

        ctx.evtDoneOrAborted.attachOnce(() => {
            Object.defineProperties(window, propertyDescriptors.window);

            Object.defineProperties(Element.prototype, propertyDescriptors["Element.prototype"]);
            Object.defineProperty(
                ResizeObserverEntry.prototype,
                "contentRect",
                propertyDescriptors["ResizeObserverEntry.prototype"].contentRect
            );

            Object.defineProperties(MouseEvent.prototype, propertyDescriptors["MouseEvent.prototype"]);

            window.ResizeObserver = RealResizeObserver;

            Object.assign(document.body.style, initialStyles.body);
            Object.assign(document.documentElement.style, initialStyles.html);

            Object.assign(rootElement.style, initialStyles.root);
        });
    }

    document.body.style.margin = "0";

    type State = {
        actualWindowInnerHeight: number;
        actualWindowInnerWidth: number;
    } & (
        | {
              isOutOfRange: false;
              scaleFactor: number;
              targetWindowInnerWidth: number;
              targetWindowInnerHeight: number;
          }
        | { isOutOfRange: true }
    );

    const evtZoomFactor = Evt.from(ctx, window, "resize")
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

    const { evtActualWindowInnerWidth } = (() => {
        const { get: clientWidthGetter } =
            Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth") ?? {};

        const { get: clientHeightGetter } =
            Object.getOwnPropertyDescriptor(Element.prototype, "clientHeight") ?? {};

        assert(clientWidthGetter !== undefined);
        assert(clientHeightGetter !== undefined);

        const evtActualWindowInnerWidth = Evt.from(ctx, ResizeObserver, window.document.documentElement)
            .toStateful()
            .pipe(() => [
                {
                    //NOTE: Using document dimensions instead of windows's dimensions because on mobile
                    // when we pinch and zoom the window's dimensions changes and we don't want to recomputes the UI
                    // in this case, we want to enable zooming on a portion of the screen.
                    "actualWindowInnerWidth": clientWidthGetter.call(
                        window.document.documentElement
                    ) as number,
                    "actualWindowInnerHeight": clientHeightGetter.call(
                        window.document.documentElement
                    ) as number,
                    "zoomFactor": evtZoomFactor.state
                }
            ])
            .pipe(onlyIfChanged());

        return { evtActualWindowInnerWidth };
    })();

    const evtState = Evt.merge([evtActualWindowInnerWidth, evtZoomFactor])
        .toStateful()
        .pipe(() => [
            {
                ...evtActualWindowInnerWidth.state,
                "zoomFactor": evtZoomFactor.state
            }
        ])
        .pipe(({ actualWindowInnerHeight, actualWindowInnerWidth, zoomFactor }): [State] => {
            const targetWindowInnerWidth = getTargetWindowInnerWidth({
                actualWindowInnerWidth,
                actualWindowInnerHeight,
                zoomFactor,
                "isPortraitOrientation": (() => {
                    const isPortraitOrientation = actualWindowInnerWidth * 1.3 < actualWindowInnerHeight;

                    return isPortraitOrientation;
                })()
            });

            if (targetWindowInnerWidth === undefined) {
                return [
                    {
                        "isOutOfRange": true,
                        actualWindowInnerHeight,
                        actualWindowInnerWidth
                    }
                ];
            }

            const scaleFactor = actualWindowInnerWidth / targetWindowInnerWidth;

            return [
                {
                    "isOutOfRange": false,
                    scaleFactor,
                    targetWindowInnerWidth,
                    "targetWindowInnerHeight": actualWindowInnerHeight / scaleFactor,
                    actualWindowInnerHeight,
                    actualWindowInnerWidth
                }
            ];
        });

    Object.defineProperties(window, {
        "innerWidth": {
            "get": () =>
                evtState.state.isOutOfRange
                    ? evtState.state.actualWindowInnerWidth
                    : evtState.state.targetWindowInnerWidth,
            "set": undefined,
            "enumerable": true,
            "configurable": true
        },
        "innerHeight": {
            "get": () =>
                evtState.state.isOutOfRange
                    ? evtState.state.actualWindowInnerHeight
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

    // Pollute the mouse event
    {
        const { get: realClientXGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "clientX") ?? {};

        const { get: realClientYGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "clientY") ?? {};

        assert(realClientXGetter !== undefined);
        assert(realClientYGetter !== undefined);

        Object.defineProperties(MouseEvent.prototype, {
            "clientX": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realClientXGetter.call(this) / scaleFactor;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "clientY": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realClientYGetter.call(this) / scaleFactor;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
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

    document.documentElement.style.height = "100vh";
    document.documentElement.style.overflow = "hidden";

    {
        const rootElement = document.getElementById(rootDivId);

        assert(rootElement !== null);

        rootElement.style.height = "100%";
        rootElement.style.overflow = "auto";
    }

    evtState.attach(state => {
        if (state.isOutOfRange) {
            return;
        }
        document.body.style.transform = `scale(${state.scaleFactor})`;
        document.body.style.transformOrigin = "0 0";
        document.body.style.width = `${state.targetWindowInnerWidth}px`;
        document.body.style.height = `${state.targetWindowInnerHeight}px`;
        document.body.style.overflow = "hidden";
    });

    function disableScreenScaler() {
        assert(ctx !== undefined);
        ctx.done();
    }

    return { disableScreenScaler };
}

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
