
import "./main.css";
import Tooltip from "@mui/material/Tooltip";
import { enableScreenScaler } from "screen-scaler/react";

enableScreenScaler({
    "targetWindowInnerWidth": 300,
    "rootDivId": "root"
});

export function PopperTest() {

    return (
        <div
            style={{
                "position": "relative",
                "margin": 0
            }}
        >
            <Tooltip
                title="I am the popper"
                open
                PopperProps={{
                    placement: "bottom",
                }}
                arrow
            >
                <div
                    style={{
                        "border": "1px solid red",
                        "position": "absolute",
                        "right": 0,
                    }}
                >anchor</div>
            </Tooltip>
        </div>

    );


}