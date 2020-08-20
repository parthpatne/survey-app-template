import * as React from "react";
import { SettingsIcon, Text } from "@fluentui/react-northstar";
import './SettingsSummaryComponent.scss';
import { Localizer } from '../../../utils/Localizer';
import { Utils } from "../../../utils/Utils";
import { ResultVisibility } from "../../../common/SettingsCommon";
import { UxUtils } from "../../../utils/UxUtils";

export interface ISettingsSummaryProps {
    dueDate?: Date;
    resultVisibility?: ResultVisibility;
    onRef?: (element: HTMLElement) => void;
    onClick?: () => void;
    showDefaultTitle?: boolean;
}

export class SettingsSummaryComponent extends React.Component<ISettingsSummaryProps> {
    isFocused: boolean = false;

    updateSettingsSummary(): string {
        let settingsStrings: string[] = [];
        if (this.props.dueDate) {
            let dueIn: {} = Utils.getTimeRemaining(this.props.dueDate);
            if (dueIn[Utils.YEARS] > 0) {
                settingsStrings.push(Localizer.getString(dueIn[Utils.YEARS] == 1 ? "DueInYear" : "DueInYears", dueIn[Utils.YEARS]));
            }
            else if (dueIn[Utils.MONTHS] > 0) {
                settingsStrings.push(Localizer.getString(dueIn[Utils.MONTHS] == 1 ? "DueInMonth" : "DueInMonths", dueIn[Utils.MONTHS]));
            }
            else if (dueIn[Utils.WEEKS] > 0) {
                settingsStrings.push(Localizer.getString(dueIn[Utils.WEEKS] == 1 ? "DueInWeek" : "DueInWeeks", dueIn[Utils.WEEKS]));
            }
            else if (dueIn[Utils.DAYS] > 0) {
                settingsStrings.push(Localizer.getString(dueIn[Utils.DAYS] == 1 ? "DueInDay" : "DueInDays", dueIn[Utils.DAYS]));
            }
            else if (dueIn[Utils.HOURS] > 0 && dueIn[Utils.MINUTES] > 0) {
                if (dueIn[Utils.HOURS] == 1 && dueIn[Utils.MINUTES] == 1) {
                    settingsStrings.push(Localizer.getString("DueInHourAndMinute", dueIn[Utils.HOURS], dueIn[Utils.MINUTES]));
                } else if (dueIn[Utils.HOURS] == 1) {
                    settingsStrings.push(Localizer.getString("DueInHourAndMinutes", dueIn[Utils.HOURS], dueIn[Utils.MINUTES]));
                } else if (dueIn[Utils.MINUTES] == 1) {
                    settingsStrings.push(Localizer.getString("DueInHoursAndMinute", dueIn[Utils.HOURS], dueIn[Utils.MINUTES]));
                } else {
                    settingsStrings.push(Localizer.getString("DueInHoursAndMinutes", dueIn[Utils.HOURS], dueIn[Utils.MINUTES]));
                }
            }
            else if (dueIn[Utils.HOURS] > 0) {
                settingsStrings.push(Localizer.getString(dueIn[Utils.HOURS] == 1 ? "DueInHour" : "DueInHours", dueIn[Utils.HOURS]));
            }
            else if (dueIn[Utils.MINUTES] > 0) {
                settingsStrings.push(Localizer.getString(dueIn["minutes"] == 1 ? "DueInMinute" : "DueInMinutes", dueIn[Utils.MINUTES]));
            } else {
                settingsStrings.push(Localizer.getString("DueInMinutes", dueIn[Utils.MINUTES]));
            }
        }

        if (this.props.resultVisibility) {
            if (this.props.resultVisibility == ResultVisibility.All) {
                settingsStrings.push(Localizer.getString("ResultsVisibilitySettingsSummaryEveryone"));
            } else {
                settingsStrings.push(Localizer.getString("ResultsVisibilitySettingsSummarySenderOnly"));
            }
        }

        return settingsStrings.join(", ");
    }

    render() {
        return (
            <div className="settings-footer" {...UxUtils.getTabKeyProps()} ref={(element) => {
                if (this.props.onRef) {
                    this.props.onRef(element);
                }
            }} onClick={() => {
                this.props.onClick();
            }}>
                <SettingsIcon className="settings-icon" outline={true} color="brand" />
                <Text content={this.props.showDefaultTitle ? Localizer.getString("Settings") : this.updateSettingsSummary()} size="small" color="brand" />
            </div>);
    }
}
