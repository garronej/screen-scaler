import { assert } from "tsafe/assert";
import { memoize } from "./tools/memoize";

const createGetRealDimensionX = (dimension: "Width" | "Height"): (() => number) => {
    const pd = Object.getOwnPropertyDescriptor(window, `inner${dimension}`);

    assert(pd !== undefined);

    const { get } = pd;

    assert(get !== undefined);

    return get.bind(window);
};

/**
 * Must be called (the first time) before the window.innerWidth/innerHeight is polluted.
 * Memoized, can safely be called repeatedly.
 * */
export const createGetRealWindowDimensions = memoize(() => {
    const getRealWindowInnerWidth = createGetRealDimensionX("Width");
    const getRealWindowInnerHeight = createGetRealDimensionX("Height");

    function getRealWindowDimensions() {
        return {
            "realWindowInnerWidth": getRealWindowInnerWidth(),
            "realWindowInnerHeight": getRealWindowInnerHeight()
        };
    }

    return { getRealWindowDimensions };
});
