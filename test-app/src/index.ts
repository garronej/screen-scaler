
import { enableScreenScaler } from "screen-scaler";

enableScreenScaler({
    getTargetWindowInnerWidth: ({ zoomFactor, isPortraitOrientation }) =>
        isPortraitOrientation ?
            undefined :
            1500 * zoomFactor,
    //getTargetWindowInnerWidth: ({ actualWindowInnerWidth }) => actualWindowInnerWidth,
    rootDivId: "root"
});

import("./index.lazy");
