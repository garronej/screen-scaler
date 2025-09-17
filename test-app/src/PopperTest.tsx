
import Tooltip from "@mui/material/Tooltip";

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