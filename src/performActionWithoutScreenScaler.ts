type PerformActionWithoutScreenScaler = <T>(action: () => T) => T;

let injectedImpl: PerformActionWithoutScreenScaler | undefined = undefined;

export function injectPerformActionWithoutScreenScalerImpl(impl: PerformActionWithoutScreenScaler) {
    injectedImpl = impl;
}

export function performActionWithoutScreenScaler<T>(action: () => T): T {
    if (injectedImpl === undefined) {
        return action();
    }

    return injectedImpl(action);
}
