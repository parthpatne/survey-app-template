import { createStore } from 'satcheljs';
import '../../orchestrators/CreationOrchestrators';
import '../../mutator/CreationMutator';
import * as actionSDK from "@microsoft/m365-action-sdk";
import { Utils } from '../../utils/Utils';
import { ISettingsComponentProps, ResultVisibility } from "./../../common/SettingsCommon";
import { InitializationState } from './../../utils/SharedEnum';


export enum Page {
    Main,
    Settings,
    Preview,
    UpdateQuestion
}

interface ISurveyCreationStore {
    context: actionSDK.ActionSdkContext;
    title: string;
    preview: boolean;
    questions: actionSDK.ActionDataColumn[];
    settings: ISettingsComponentProps;
    activeQuestionIndex: number;
    isValidationModeOn: boolean;
    isInitialized: InitializationState;
    initPending: boolean;
    currentPage: Page;
    previousPage: Page;
    isSendActionInProgress: boolean;
    // teamsGroups: actionSDK.TeamsGroup[];
    teamsGroupInitialized: InitializationState;
    draftActionInstanceId: string;
    openChannelPickerDialog: boolean;
    openSettingDialog: boolean;
    // teamIdToTeamGroupMap: Map<string, actionSDK.TeamsGroup>;
    isSendSurveyAlertOpen: boolean;
    shouldFocusOnError: boolean;
}

const store: ISurveyCreationStore = {
    context: null,
    title: "",
    preview: false,
    questions: [],
    settings: {
        resultVisibility: ResultVisibility.All,
        dueDate: Utils.getDefaultExpiry(7).getTime(),
        // notificationSettings: new NotificationSettings(NotificationSettingMode.Daily, Constants.DEFAULT_DAILY_NOTIFICATION_TIME),
        isResponseEditable: true,
        isResponseAnonymous: false,
        // isMultiResponseAllowed: false,
        strings: null
    },
    activeQuestionIndex: -1,
    isValidationModeOn: false,
    isInitialized: InitializationState.NotInitialized,
    initPending: true,
    currentPage: Page.Main,
    previousPage: Page.Main,
    isSendActionInProgress: false,
    // teamsGroups: new Array<actionSDK.TeamsGroup>(),
    teamsGroupInitialized: InitializationState.NotInitialized,
    draftActionInstanceId: "",
    openChannelPickerDialog: false,
    openSettingDialog: false,
    // teamIdToTeamGroupMap: new Map<string, actionSDK.TeamsGroup>(),
    isSendSurveyAlertOpen: false,
    shouldFocusOnError: false
}

export default createStore<ISurveyCreationStore>('store', store);
