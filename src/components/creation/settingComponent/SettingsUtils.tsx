
import { ResultVisibility, SettingsSections } from "../../../common/SettingsCommon";

export class SettingsUtils {
    public static shouldRenderSection(section: SettingsSections, excludedSections: SettingsSections[]) {
        return !excludedSections || (excludedSections.indexOf(section) == -1);
    }

    public static getVisibilityItems(resultsVisibleToAllLabel: string, resultsVisibleToSenderLabel: string) {
        return [
            {
                key: "1",
                label: resultsVisibleToAllLabel,
                value: ResultVisibility.All,
                className: "settings-radio-item"
            },
            {
                key: "2",
                label: resultsVisibleToSenderLabel,
                value: ResultVisibility.Sender,
                className: "settings-radio-item-last"
            },
        ]
    }
}