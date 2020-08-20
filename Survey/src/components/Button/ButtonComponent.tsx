import * as React from "react";
import * as ReactDOM from "react-dom";
import { Button, ButtonProps, Loader } from "@fluentui/react-northstar";


/***
 * This component provides a button with loader functionality which can be enabled/ disabled based on showLoader flag.
 * When loader has to show, it shows on top of button so that button doesn't resize. The button text and other styling 
 * is removed when loader shows
 * 
 * Note: Caller shouldn't give width of button in styles for this component. This component automatically does width calculation.
 */

export interface IButtonProps extends ButtonProps {
    showLoader?: boolean
}

export class ButtonComponent extends React.Component<IButtonProps> {

    private button: HTMLButtonElement = null;

    render() {

        if (!this.button) {
            this.button = ReactDOM.findDOMNode(this) as HTMLButtonElement;
        }
        if (this.button) {
            if (this.props.showLoader) {
                this.button.style.width = this.button.clientWidth + "px";
            } else {
                this.button.style.width = "";
            }
        }


        return (
            <Button {...this.props} disabled={this.props.showLoader || this.props.disabled}>
                {this.props.showLoader ? <Loader size="small" /> : null}
            </Button>
        );
    }
}