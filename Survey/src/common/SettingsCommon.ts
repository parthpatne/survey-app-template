/**
* If ResultVisibility is set to:
*    All: Everyone can see the result of survey
*    Sender: Only the craetor of survey can see the result
*/
export enum ResultVisibility {
    All = "All",
    Sender = "Sender"
}
/**
* These are the two custom parameters provided in survey app, which can be set/modiifed by creator of survey
*/
export enum SettingsSections {
    DUE_BY,
    RESULTS_VISIBILITY
}

export interface ISettingsComponentProps {
    dueDate: number;
    locale?: string;
    resultVisibility: ResultVisibility;
    isResponseEditable: boolean;
    isResponseAnonymous: boolean;
    renderForMobile?: boolean;
    strings: ISettingsComponentStrings;
    renderDueBySection?: () => React.ReactElement<any>;
    renderResultVisibilitySection?: () => React.ReactElement<any>;
    renderNotificationsSection?: () => React.ReactElement<any>;
    renderResponseOptionsSection?: () => React.ReactElement<any>;
    onChange?: (props: ISettingsComponentProps) => void;
    onMount?: () => void;
}

export interface ISettingsComponentStrings {
    dueBy?: string;
    multipleResponses?: string;
    responseOptions?: string;
    resultsVisibleTo?: string;
    resultsVisibleToAll?: string;
    resultsVisibleToSender?: string;
    datePickerPlaceholder?: string;
    timePickerPlaceholder?: string;
}