import {
    enableScreenScaler as enableScreenScaler_vanilla,
    type ScreenScalerParams
} from "./screenScaler";
import { Evt } from "evt";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";

export type { ScreenScalerParams };

export function enableScreenScaler(params: ScreenScalerParams) {
    const { rootDivId, targetWindowInnerWidth: targetWindowInnerWidth_params } = params;

    const evtIsOutOfRange = Evt.create(false);

    enableScreenScaler_vanilla({
        rootDivId,
        "targetWindowInnerWidth":
            typeof targetWindowInnerWidth_params !== "function"
                ? targetWindowInnerWidth_params
                : params => {
                      const targetWindowInnerWidth = targetWindowInnerWidth_params(params);

                      evtIsOutOfRange.state = targetWindowInnerWidth === undefined;

                      return targetWindowInnerWidth;
                  }
    });

    function useIsOutOfRange() {
        useRerenderOnStateChange(evtIsOutOfRange);
        return evtIsOutOfRange.state;
    }

    return { useIsOutOfRange };
}
