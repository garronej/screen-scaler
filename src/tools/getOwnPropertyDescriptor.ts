import { assert } from "tsafe/assert";

/** Same function as the one in the standard library but asserts the property is defined (else throws) */
export const getOwnPropertyDescriptor = (o: any, p: PropertyKey): PropertyDescriptor => {
    const pd = Object.getOwnPropertyDescriptor(o, p);
    assert(pd !== undefined);
    return pd;
};
