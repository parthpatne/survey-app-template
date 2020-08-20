import * as React from "react";
import "./SettingsComponent.scss";
import { Flex, Divider } from '@fluentui/react-northstar';
import { ISettingsComponentProps, ResultVisibility } from "../../../common/SettingsCommon";
import { SettingsComponent } from "./SettingsComponent";
import { DateTimePickerView } from "../../DateTime";
import { RadioGroupMobile } from "../../RadioGroupMobile";
import { SettingsUtils } from "./SettingsUtils";

export class SettingsMobile extends React.PureComponent<ISettingsComponentProps> {
    private settingProps: ISettingsComponentProps;
    constructor(props: ISettingsComponentProps) {
        super(props);
    }

    componentDidMount() {
        if (this.props.onMount) {
            this.props.onMount();
        }
    }

    render() {
        this.settingProps = {
            dueDate: this.props.dueDate,
            resultVisibility: this.props.resultVisibility,
            locale: this.props.locale,
            isResponseAnonymous: this.props.isResponseAnonymous,
            isResponseEditable: this.props.isResponseEditable,
            strings: this.props.strings
        };
        return <SettingsComponent {...this.props}
            renderDueBySection={() => { return this.renderDueBySection() }}
            renderResultVisibilitySection={() => { return this.renderResultVisibilitySection() }}
        
        />
    }

    private renderDueBySection() {
        return (
            <Flex column className="settings-item-margin">
                <label className="settings-item-title">{this.getString("dueBy")}</label>
                <div className="due-by-pickers-container date-time-equal">
                    <DateTimePickerView showTimePicker
                        minDate={new Date()}
                        locale={this.props.locale}
                        value={new Date(this.props.dueDate)}
                        placeholderDate={this.getString("datePickerPlaceholder")}
                        placeholderTime={this.getString("timePickerPlaceholder")}
                        renderForMobile={this.props.renderForMobile}
                        onSelect={(date: Date) => {
                            this.settingProps.dueDate = date.getTime();
                            this.props.onChange(this.settingProps);
                        }} />
                </div>
                <Divider className="zero-padding" />
            </Flex>
        );
    }

    private renderResultVisibilitySection() {
        return (
            <Flex column className="settings-item-margin">
                <label className="settings-item-title">{this.getString("resultsVisibleTo")}</label>
                <RadioGroupMobile
                    checkedValue={this.settingProps.resultVisibility}
                    items={SettingsUtils.getVisibilityItems(this.getString("resultsVisibleToAll"), this.getString("resultsVisibleToSender"))}
                    checkedValueChanged={(value) => {
                        this.settingProps.resultVisibility = value as ResultVisibility;
                        this.props.onChange(this.settingProps);
                    }}
                />
                <Divider className="zero-padding" />
            </Flex>
        );
    }

    private getString(key: string): string {
        if (this.props.strings && this.props.strings.hasOwnProperty(key)) {
            return this.props.strings[key];
        }
        return key;
    }
}
