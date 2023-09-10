import { enableScreenScaler as enableScreenScaler_vanilla } from "./screenScaler";
import type { Param0 } from "tsafe";
import { Evt } from "evt";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";

export function enableScreenScaler(params: Param0<typeof enableScreenScaler_vanilla>) {
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
