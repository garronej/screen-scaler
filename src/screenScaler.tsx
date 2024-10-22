import { assert } from "tsafe/assert";
import { Evt, type Ctx } from "evt";
import { onlyIfChanged } from "evt/operators/onlyIfChanged";
import { getOwnPropertyDescriptor } from "./tools/getOwnPropertyDescriptor";

let ctx: Ctx | undefined = undefined;

export type ScreenScalerParams = {
    targetWindowInnerWidth:
        | (number | undefined)
        | ((params: {
              actualWindowInnerWidth: number;
              actualWindowInnerHeight: number;
              zoomFactor: number;
              isPortraitOrientation: boolean;
          }) => number | undefined);
    rootDivId: string;
};

export function enableScreenScaler(params: ScreenScalerParams): {
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
                "innerHeight": getOwnPropertyDescriptor(window, "innerHeight"),
                "visualViewport": getOwnPropertyDescriptor(window, "visualViewport")
            },
            "Element.prototype": {
                "getBoundingClientRect": getOwnPropertyDescriptor(
                    Element.prototype,
                    "getBoundingClientRect"
                ),
                "getClientRects": getOwnPropertyDescriptor(Element.prototype, "getClientRects"),
                "clientLeft": getOwnPropertyDescriptor(Element.prototype, "clientLeft"),
                "clientTop": getOwnPropertyDescriptor(Element.prototype, "clientTop"),
                "clientWidth": getOwnPropertyDescriptor(Element.prototype, "clientWidth"),
                "clientHeight": getOwnPropertyDescriptor(Element.prototype, "clientHeight")
            },
            "Range.prototype": {
                "getBoundingClientRect": getOwnPropertyDescriptor(
                    Range.prototype,
                    "getBoundingClientRect"
                ),
                "getClientRects": getOwnPropertyDescriptor(Range.prototype, "getClientRects")
            },
            "ResizeObserverEntry.prototype": {
                "contentRect": getOwnPropertyDescriptor(ResizeObserverEntry.prototype, "contentRect")
            },
            "MouseEvent.prototype": {
                "clientX": getOwnPropertyDescriptor(MouseEvent.prototype, "clientX"),
                "clientY": getOwnPropertyDescriptor(MouseEvent.prototype, "clientY"),
                "x": getOwnPropertyDescriptor(MouseEvent.prototype, "x"),
                "y": getOwnPropertyDescriptor(MouseEvent.prototype, "y"),
                "pageX": getOwnPropertyDescriptor(MouseEvent.prototype, "pageX"),
                "pageY": getOwnPropertyDescriptor(MouseEvent.prototype, "pageY"),
                "layerX": getOwnPropertyDescriptor(MouseEvent.prototype, "layerX"),
                "layerY": getOwnPropertyDescriptor(MouseEvent.prototype, "layerY"),
                "offsetX": getOwnPropertyDescriptor(MouseEvent.prototype, "offsetX"),
                "offsetY": getOwnPropertyDescriptor(MouseEvent.prototype, "offsetY"),
                "screenX": getOwnPropertyDescriptor(MouseEvent.prototype, "screenX"),
                "screenY": getOwnPropertyDescriptor(MouseEvent.prototype, "screenY"),
                "movementX": getOwnPropertyDescriptor(MouseEvent.prototype, "movementX"),
                "movementY": getOwnPropertyDescriptor(MouseEvent.prototype, "movementY")
            }
        };

        const RealResizeObserver = window.ResizeObserver;

        ctx.evtDoneOrAborted.attachOnce(() => {
            Object.defineProperties(window, propertyDescriptors.window);

            Object.defineProperties(Element.prototype, propertyDescriptors["Element.prototype"]);
            Object.defineProperties(Element.prototype, propertyDescriptors["Range.prototype"]);
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

        evtActualWindowInnerWidth.toStateless().attach(() => window.dispatchEvent(new Event("resize")));

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
        },
        "visualViewport": {
            ...(() => {
                const windowVisualViewportPd = Object.getOwnPropertyDescriptor(window, "visualViewport");

                assert(windowVisualViewportPd !== undefined);

                return {
                    "get": (() => {
                        const { get: realVisualViewportGetter } = windowVisualViewportPd ?? {};

                        assert(realVisualViewportGetter !== undefined);

                        const proxy = new Proxy(
                            {},
                            {
                                "get": function (_target, prop) {
                                    if (prop === "width") {
                                        return evtState.state.isOutOfRange
                                            ? evtState.state.actualWindowInnerWidth
                                            : evtState.state.targetWindowInnerWidth;
                                    }

                                    if (prop === "height") {
                                        return evtState.state.isOutOfRange
                                            ? evtState.state.actualWindowInnerHeight
                                            : evtState.state.targetWindowInnerHeight;
                                    }

                                    const realVisualViewport = realVisualViewportGetter.call(window);

                                    if (prop === "scale") {
                                        return evtState.state.isOutOfRange
                                            ? realVisualViewport.scale
                                            : evtState.state.scaleFactor;
                                    }

                                    const value = realVisualViewport[prop];

                                    if (typeof value === "function") {
                                        return value.bind(realVisualViewport);
                                    }

                                    return value;
                                }
                            }
                        );

                        return function () {
                            return proxy;
                        };
                    })(),
                    "set": windowVisualViewportPd.set
                };
            })(),
            "enumerable": true,
            "configurable": true
        }
    });

    {
        const getScaleFactor = () => (evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor);

        const getColorCyclical = (() => {
            const colors = ["red", "green", "blue", "yellow", "purple", "orange", "pink"];

            let i = 0;

            return () => {
                const color = colors[i];

                i = (i + 1) % colors.length;

                return color;
            };
        })();

        function getPatchedDomRect(domRect: {
            x: number;
            y: number;
            left: number;
            top: number;
            width: number;
            height: number;
            right: number;
            bottom: number;
        }): DOMRect {
            const getX_patched = () => domRect.x / getScaleFactor();
            const getY_patched = () => domRect.y / getScaleFactor();
            const getWidth_patched = () => domRect.width / getScaleFactor();
            const getHeight_patched = () => domRect.height / getScaleFactor();

            const domRectPatched = new DOMRect(
                getX_patched(),
                getY_patched(),
                getWidth_patched(),
                getHeight_patched()
            );

            Object.defineProperties(domRectPatched, {
                "x": {
                    "enumerable": true,
                    "configurable": true,
                    "get": getX_patched
                },
                "y": {
                    "enumerable": true,
                    "configurable": true,
                    "get": getY_patched
                },
                "width": {
                    "enumerable": true,
                    "configurable": true,
                    "get": getWidth_patched
                },
                "height": {
                    "enumerable": true,
                    "configurable": true,
                    "get": getHeight_patched
                },
                "left": {
                    "enumerable": true,
                    "configurable": true,
                    "get": () => domRect.left / getScaleFactor()
                },
                "top": {
                    "enumerable": true,
                    "configurable": true,
                    "get": () => domRect.top / getScaleFactor()
                },
                "right": {
                    "enumerable": true,
                    "configurable": true,
                    "get": () => domRect.right / getScaleFactor()
                },
                "bottom": {
                    "enumerable": true,
                    "configurable": true,
                    "get": () => domRect.bottom / getScaleFactor()
                },
                "screenScalerPatched": {
                    "enumerable": true,
                    "configurable": false,
                    "writable": false,
                    "value": "yes - DOMRect"
                }
            });

            {
                const element = document.createElement("div");

                //const r = domRectPatched;
                const r = domRect;

                element.style.width = `${r.width}px`;
                element.style.height = `${r.height}px`;
                element.style.position = "fixed";
                element.style.left = `${r.left}px`;
                element.style.top = `${r.top}px`;
                const color = getColorCyclical();
                element.style.boxSizing = "border-box";
                element.style.border = `1px solid ${color}`;
                //element.style.backgroundColor = color;
                element.style.pointerEvents = "none";
                //element.style.zIndex = "-100000";

                document.body.appendChild(element);
            }

            return domRectPatched;
        }

        function getPatchedDomRectList(domRectList: {
            length: number;
            item: (index: number) => DOMRect | null;
        }): DOMRectList {
            const arrayOfPatchedDomRect: DOMRect[] = [];

            {
                for (let i = 0; i < domRectList.length; i++) {
                    const domRect = domRectList.item(i);
                    assert(domRect !== null);
                    arrayOfPatchedDomRect.push(getPatchedDomRect(domRect));
                }
            }

            const properties: PropertyDescriptorMap = {
                [Symbol.iterator]: {
                    "enumerable": false,
                    "configurable": true,
                    "get": () => arrayOfPatchedDomRect[Symbol.iterator]
                },
                "length": {
                    "enumerable": true,
                    "configurable": true,
                    "writable": false,
                    "value": arrayOfPatchedDomRect.length
                },
                "item": {
                    "enumerable": true,
                    "configurable": true,
                    "writable": true,
                    "value": function item(index: number) {
                        return arrayOfPatchedDomRect[index] ?? null;
                    }
                },
                "screenScalerPatched": {
                    "enumerable": true,
                    "configurable": false,
                    "writable": false,
                    "value": "yes - DOMRectList"
                }
            };

            for (let i = 0; i < arrayOfPatchedDomRect.length; i++) {
                properties[i] = {
                    "enumerable": false,
                    "configurable": true,
                    "writable": true,
                    "value": arrayOfPatchedDomRect[i]
                };
            }

            return Object.create(DOMRectList.prototype, properties);
        }

        // Pollute Element.prototype
        {
            const realGetBoundingClientRect = Element.prototype.getBoundingClientRect;
            const realGetClientRects = Element.prototype.getClientRects;

            //Pollute HTMLDivElement.prototype.getBoundingClientRect
            Object.defineProperties(Element.prototype, {
                "getBoundingClientRect": {
                    "enumerable": true,
                    "configurable": true,
                    "writable": false,
                    "value": function getBoundingClientRect(this: Element) {
                        return getPatchedDomRect(realGetBoundingClientRect.call(this));
                    }
                },
                "getClientRects": {
                    "enumerable": true,
                    "configurable": true,
                    "writable": false,
                    "value": function getClientRects(this: Element) {
                        const domRectList = realGetClientRects.call(this);
                        return getPatchedDomRectList(domRectList);
                    }
                },
                "clientLeft": {
                    "enumerable": true,
                    "configurable": true,
                    "get": function (this: Element) {
                        return this.getBoundingClientRect().left;
                    }
                },
                "clientTop": {
                    "enumerable": true,
                    "configurable": true,
                    "get": function (this: Element) {
                        return this.getBoundingClientRect().top;
                    }
                },
                "clientWidth": {
                    "enumerable": true,
                    "configurable": true,
                    "get": function (this: Element) {
                        return this.getBoundingClientRect().width;
                    }
                },
                "clientHeight": {
                    "enumerable": true,
                    "configurable": true,
                    "get": function (this: Element) {
                        return this.getBoundingClientRect().height;
                    }
                }
            });
        }

        // Pollute Range.prototype
        {
            const realGetBoundingClientRect = Range.prototype.getBoundingClientRect;
            const realGetClientRects = Range.prototype.getClientRects;

            //Pollute HTMLDivElement.prototype.getBoundingClientRect
            Object.defineProperties(Range.prototype, {
                "getBoundingClientRect": {
                    "enumerable": true,
                    "configurable": true,
                    "writable": false,
                    "value": function getBoundingClientRect(this: Range) {
                        return getPatchedDomRect(realGetBoundingClientRect.call(this));
                    }
                },
                "getClientRects": {
                    "enumerable": true,
                    "configurable": true,
                    "writable": false,
                    "value": function getClientRects(this: Range) {
                        const domRectList = realGetClientRects.call(this);
                        return getPatchedDomRectList(domRectList);
                    }
                }
            });
        }
    }

    // Pollute the argument of ResizeObserver callback
    {
        const { get: realContentRectGetter } =
            Object.getOwnPropertyDescriptor(ResizeObserverEntry.prototype, "contentRect") ?? {};

        assert(realContentRectGetter !== undefined);

        Object.defineProperty(ResizeObserverEntry.prototype, "contentRect", {
            "configurable": true,
            "enumerable": true,
            "set": undefined,
            "get": function (this: ResizeObserverEntry) {
                const { left, top, width, height, right, bottom } = realContentRectGetter.call(this);

                const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                alert("resize observer");

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
        const { get: realXGetter } = Object.getOwnPropertyDescriptor(MouseEvent.prototype, "x") ?? {};
        const { get: realPageXGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "pageX") ?? {};
        const { get: realLayerXGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "layerX") ?? {};
        const { get: realOffsetXGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "offsetX") ?? {};
        const { get: realScreenXGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "screenX") ?? {};
        const { get: realMovementXGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "movementX") ?? {};

        assert(realClientXGetter !== undefined);
        assert(realXGetter !== undefined);
        assert(realPageXGetter !== undefined);
        assert(realLayerXGetter !== undefined);
        assert(realOffsetXGetter !== undefined);
        assert(realScreenXGetter !== undefined);
        assert(realMovementXGetter !== undefined);

        const { get: realClientYGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "clientY") ?? {};
        const { get: realYGetter } = Object.getOwnPropertyDescriptor(MouseEvent.prototype, "y") ?? {};
        const { get: realPageYGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "pageY") ?? {};
        const { get: realLayerYGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "layerY") ?? {};
        const { get: realOffsetYGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "offsetY") ?? {};
        const { get: realScreenYGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "screenY") ?? {};
        const { get: realMovementYGetter } =
            Object.getOwnPropertyDescriptor(MouseEvent.prototype, "movementY") ?? {};

        assert(realClientYGetter !== undefined);
        assert(realYGetter !== undefined);
        assert(realPageYGetter !== undefined);
        assert(realLayerYGetter !== undefined);
        assert(realOffsetYGetter !== undefined);
        assert(realScreenYGetter !== undefined);
        assert(realMovementYGetter !== undefined);

        Object.defineProperties(MouseEvent.prototype, {
            "clientX": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    const real = realClientXGetter.call(this);

                    const patched = real / scaleFactor;

                    {
                        const v = real;

                        const element = document.createElement("div");

                        element.style.width = "1px";
                        element.style.height = "50px";
                        element.style.position = "fixed";
                        element.style.left = `${v}px`;
                        element.style.top = "0px";
                        element.style.backgroundColor = "red";

                        document.body.appendChild(element);
                    }

                    return real;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "x": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realXGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "pageX": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realPageXGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "layerX": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realLayerXGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "offsetX": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realOffsetXGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "screenX": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realScreenXGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "movementX": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realMovementXGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "clientY": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    const real = realClientYGetter.call(this);

                    const patched = real / scaleFactor;

                    {
                        const v = real;

                        const element = document.createElement("div");

                        element.style.width = "50px";
                        element.style.height = "1px";
                        element.style.position = "fixed";
                        element.style.top = `${v}px`;
                        element.style.left = "0px";
                        element.style.backgroundColor = "red";

                        document.body.appendChild(element);
                    }

                    return patched;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "y": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realYGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "pageY": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realPageYGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "layerY": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realLayerYGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "offsetY": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realOffsetYGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "screenY": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realScreenYGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            },
            "movementY": {
                "get": function (this: MouseEvent) {
                    const scaleFactor = evtState.state.isOutOfRange ? 1 : evtState.state.scaleFactor;

                    return realMovementYGetter.call(this) / scaleFactor - 100;
                },
                "configurable": true,
                "enumerable": true,
                "set": undefined
            }
        });
    }

    {
        const RealResizeObserver = window.ResizeObserver;

        evtState.setMaxHandlers(Infinity);

        class CustomResizeObserver extends RealResizeObserver {
            private ctx = Evt.newCtx();

            constructor(private callback: ResizeObserverCallback) {
                super(callback);
            }

            private targets = new Set<Element>();

            observe(target: Element, options?: ResizeObserverOptions | undefined): void {
                super.observe(target, options);

                this.targets.add(target);

                evtState.toStateless(this.ctx).attach(() => {
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
                    this.ctx = Evt.newCtx();
                }
            }

            disconnect(): void {
                super.disconnect();
                this.ctx.done();
                this.ctx = Evt.newCtx();
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
        const scaleFactor = state.isOutOfRange ? 1 : state.scaleFactor;

        const targetWindowInnerWidth = state.isOutOfRange
            ? state.actualWindowInnerWidth
            : state.targetWindowInnerWidth;
        const targetWindowInnerHeight = state.isOutOfRange
            ? state.actualWindowInnerHeight
            : state.targetWindowInnerHeight;

        document.body.style.transform = `scale(${scaleFactor})`;
        document.body.style.transformOrigin = "0 0";
        document.body.style.width = `${targetWindowInnerWidth}px`;
        document.body.style.height = `${targetWindowInnerHeight}px`;
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
