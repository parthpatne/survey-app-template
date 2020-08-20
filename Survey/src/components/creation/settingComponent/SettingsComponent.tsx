import * as React from "react";
import "./SettingsComponent.scss";
import { RadioGroup, Flex } from '@fluentui/react-northstar';
import { ISettingsComponentProps, ResultVisibility } from "../../../common/SettingsCommon";
import { SettingsUtils } from "./SettingsUtils";
import { DateTimePickerView } from "../../DateTime";

export class SettingsComponent extends React.PureComponent<ISettingsComponentProps> {
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
            locale: this.props.locale,
            resultVisibility: this.props.resultVisibility,
            isResponseAnonymous: this.props.isResponseAnonymous,
            isResponseEditable: this.props.isResponseEditable,
            strings: this.props.strings
        };
        return (
            <Flex column>
                {this.renderDueBySection()}
                {this.renderResultVisibilitySection()}
            </Flex>
        );
    }

    renderDueBySection() {
        if (this.props.renderDueBySection) {
            return this.props.renderDueBySection();
        } else {
            return (
                <Flex className="settings-item-margin" role="group" aria-label={this.getString("dueBy")} column gap="gap.smaller">
                    <label className="settings-item-title">{this.getString("dueBy")}</label>
                    <div className="settings-indentation">
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
                </Flex>
            );
        }
    }

    renderResultVisibilitySection() {
        if (this.props.renderResultVisibilitySection) {
            return this.props.renderResultVisibilitySection();
        } else {
            return (
                <Flex
                    className="settings-item-margin"
                    role="group"
                    aria-label={this.getString("resultsVisibleTo")}
                    column gap="gap.smaller">
                    <label className="settings-item-title">{this.getString("resultsVisibleTo")}</label>
                    <div className="settings-indentation">
                        <RadioGroup
                            vertical
                            checkedValue={this.settingProps.resultVisibility}
                            items={SettingsUtils.getVisibilityItems(this.getString("resultsVisibleToAll"), this.getString("resultsVisibleToSender"))}
                            onCheckedValueChange={(e, props) => {
                                this.settingProps.resultVisibility = props.value as ResultVisibility;
                                this.props.onChange(this.settingProps);
                            }}
                        />
                    </div>
                </Flex>
            );
        }
    }

    getString(key: string): string {
        if (this.props.strings && this.props.strings.hasOwnProperty(key)) {
            return this.props.strings[key];
        }
        return key;
    }
}
