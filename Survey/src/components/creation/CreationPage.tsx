import * as React from "react";
import { InitializationState } from '../../utils/SharedEnum';
import { InputBox } from "../InputBox";
import { ISettingsProps, Settings } from "./settingComponent/Settings";
import { LoaderUI } from "../Loader";
import { SettingsSummaryComponent } from "./settingComponent/SettingsSummaryComponent";
import { INavBarComponentProps, NavBarItemType, NavBarComponent } from "../NavBarComponent";
import { SettingsSections, ISettingsComponentProps, ISettingsComponentStrings } from "../../common/SettingsCommon";
import { SettingsMobile } from "./settingComponent/SettingsMobile";
import { ErrorView } from "../ErrorView";
import { Constants } from "./../../utils/Constants";
import { UxUtils } from "./../../utils/UxUtils";
import { QuestionContainer } from './questionContainer/QuestionContainer';
import { ButtonComponent } from '../Button';
import { AdaptiveMenuItem } from '../Menu';
import getStore, { Page } from "../../store/creation/Store";
import { Flex, FlexItem, Loader, Text, Dialog, SplitButton } from '@fluentui/react-northstar';
import { ArrowDownIcon, AddIcon, BulletsIcon, FormatIcon, CallDialpadIcon, StarIcon, CalendarIcon } from '@fluentui/react-icons-northstar';
import "./../../scss/Creation.scss";
import { QuestionDisplayType } from "./questionContainer/QuestionDisplayType";
import {
    sendAction, addQuestion, updateSettings, updateTitle, previewAction, goToPage, initializeNavBarButtons, fetchCurrentContext,
    setSendSurveyAlertOpen, validateAndSend,setValidationMode, setPreviousPage
} from "../../actions/CreationActions";
import { observer } from "mobx-react";
import ResponsePage from "../response/ResponsePage";
import { toJS } from "mobx";
import * as actionSDK from "@microsoft/m365-action-sdk";
import { UpdateQuestionPage } from "./UpdateQuestionPage";
import { SurveyUtils } from '../../common/SurveyUtils';
import { ResponseViewMode } from "../../store/response/Store";
import { Localizer } from '../../utils/Localizer';
import { ActionSdkHelper } from "../../helper/ActionSdkHelper";

const LOG_TAG = "SurveyCreationPage";
/**
 * This component renders the first page user sees when they wants to create a survey
 */
@observer
export default class CreationPage extends React.Component<any, any> {

    private questionSize = 0;
    private prevPage: Page = null;
    private settingsFooterComponentRef: HTMLElement;

    shouldComponentUpdate() {
        ActionSdkHelper.hideLoadIndicator();
        if (this.prevPage) {
            this.prevPage = null;
            return false;
        }
        return true;
    }

    componentDidUpdate() {
        ActionSdkHelper.hideLoadIndicator();
        if (getStore().previousPage === Page.Settings) {
            this.prevPage = getStore().previousPage;
            setPreviousPage(Page.Main);
            if (this.settingsFooterComponentRef) {
                this.settingsFooterComponentRef.focus();
                return;
            }
        }
        if (getStore().previousPage === Page.UpdateQuestion) {
            this.prevPage = getStore().previousPage;
            setPreviousPage(Page.Main);
            let focusableItem: HTMLElement = getStore().activeQuestionIndex === -1
                ? document.getElementById(SurveyUtils.ADDQUESTIONBUTTONID)
                : document.getElementById(SurveyUtils.QUESTION_DIV_ID_PREFIX + getStore().activeQuestionIndex);
            if (focusableItem) {
                (focusableItem as HTMLElement).focus();
                return;
            }
        }
        if (getStore().questions.length > this.questionSize) {
            this.questionSize = getStore().questions.length;
            const element = document.getElementById("add-question");
            if (element) {
                element.scrollIntoView();
            }
            return;
        } else {
            this.questionSize = getStore().questions.length;
        }
        //Not setting error focus in case new question is added because it will set focus to first invalid element instead of title of newly added question
        //In other cases, when error appears, focus is set to the first element with error
        if (getStore().shouldFocusOnError) {
            let element = document.querySelector(".invalid-error");
            if (element) {
                (element as HTMLElement).focus();
            }
        }
    }

    render() {
        ActionSdkHelper.hideLoadIndicator();
        if (getStore().isInitialized === InitializationState.NotInitialized) {
            return <LoaderUI fill />;
        }
        else if (getStore().isInitialized === InitializationState.Failed) {
            return <ErrorView
                title={Localizer.getString("GenericError")}
                buttonTitle={Localizer.getString("Close")}
            />;
        }
        else if (getStore().initPending) {
            fetchCurrentContext();
            return <Loader />;
        }

        if (UxUtils.renderingForMobile()) {
            initializeNavBarButtons();
        }
        switch (getStore().currentPage) {
            case Page.Main:
                return this.renderMainPage();

            case Page.Preview:
                return this.renderPreviewPage();

            case Page.Settings:
                return this.renderSettingsPage();

            case Page.UpdateQuestion:
                return this.renderUpdateQuestionPage();
        }
    }

    private renderMainPage() {
        if (UxUtils.renderingForMobile()) {
            return (
                <>
                    <Flex className="body-container no-mobile-footer client-mobile">
                        {this.questionView()}
                        <div className="settings-summary-mobile-container">
                            {this.renderFooterSection(true)}
                        </div>
                    </Flex>
                    {this.setupSendSurveyDialog()}
                </>
            );
        } else {
            let shouldShowNext: boolean = true;
            return (
                <>
                    <Flex className="body-container" >
                        {this.questionView()}
                    </Flex>
                    <Flex className="footer-layout" gap={"gap.smaller"}>
                        {this.renderFooterSettingsSection()}
                        <FlexItem push>
                            <ButtonComponent
                                primary
                                content={shouldShowNext ? Localizer.getString("Next") : Localizer.getString("Preview")}
                                className="preview-button"
                                showLoader={getStore().isSendActionInProgress}
                                onClick={() => {
                                    if (shouldShowNext) {
                                        validateAndSend();
                                    } else {
                                        previewAction();
                                    }
                                }} />
                        </FlexItem>
                    </Flex>
                    {this.setupSendSurveyDialog()}
                </>
            );
        }
    }
    private renderFooterSection(isMobileView?: boolean) {
        let className = isMobileView ? "" : "footer-layout";
        let shouldShowNext: boolean = true;
        return (
            <Flex className={className} gap={"gap.smaller"}>
                {this.renderFooterSettingsSection()}
                <FlexItem push>
                <ButtonComponent
                    primary
                    content={shouldShowNext ? Localizer.getString("Next") : Localizer.getString("Preview")}
                    className="preview-button"
                    showLoader={getStore().isSendActionInProgress}
                    onClick={() => {
                        if (shouldShowNext) {
                            validateAndSend();
                        } else {
                            previewAction();
                        }
                    }} />
                </FlexItem>
            </Flex>
        );
    }
    private renderPreviewPage() {
        if (UxUtils.renderingForMobile()) {
            let navBarComponentProps: INavBarComponentProps = {
                title: Localizer.getString("Preview"),
                leftNavBarItem: {
                    icon: <ArrowDownIcon size="large" rotate={90} />,
                    ariaLabel: Localizer.getString("Back"),
                    onClick: () => {
                        goToPage(Page.Main);
                    },
                    type: NavBarItemType.BACK
                }
            };
            return (
                <>
                    <Flex className="body-container no-mobile-footer" column>
                        <NavBarComponent {...navBarComponentProps} />
                        <ResponsePage showTitle responseViewMode={ResponseViewMode.CreationPreview} />
                    </Flex>
                    {this.setupSendSurveyDialog()}
                </>
            );
        }
        else {
            let shouldShowNext: boolean = true;
            let sendButton: JSX.Element = (
                <ButtonComponent primary showLoader={getStore().isSendActionInProgress}
                    content={shouldShowNext ? Localizer.getString("Next") : Localizer.getString("SendSurvey")}
                    onClick={() => {
                        if (SurveyUtils.areAllQuestionsOptional(getStore().questions)) {
                            setSendSurveyAlertOpen(true);
                        } else {
                            sendAction();
                        }
                    }}>
                </ButtonComponent>
            );
            let editButton: JSX.Element = (
                <ButtonComponent primary
                    content={Localizer.getString("Edit")}
                    onClick={() => {
                        goToPage(Page.Main);
                    }}>
                </ButtonComponent>
            );
            return (
                <>
                    <Flex className="body-container">
                        <ResponsePage showTitle responseViewMode={ResponseViewMode.CreationPreview} />
                    </Flex>
                    <Flex className="footer-layout" gap={"gap.smaller"}>
                        {
                            shouldShowNext === true ?
                                <>
                                    <FlexItem push>
                                        {editButton}
                                    </FlexItem>
                                    {sendButton}
                                </>
                                : <FlexItem push>
                                    {sendButton}
                                </FlexItem>
                        }
                        {this.setupSendSurveyDialog()}
                    </Flex>
                </>
            );
        }
    }

    private setupSendSurveyDialog() {
        return <Dialog
            open={getStore().isSendSurveyAlertOpen}
            onOpen={(e, { open }) => setSendSurveyAlertOpen(open)}
            cancelButton={SurveyUtils.getDialogButtonProps(Localizer.getString("AllOptionalSendConfirmation"), Localizer.getString("DontSend"))}
            confirmButton={SurveyUtils.getDialogButtonProps(Localizer.getString("AllOptionalSendConfirmation"), Localizer.getString("SendAnyway"))}
            content={
                <Text content={Localizer.getString("NoRequiredQuestion")} />
            }
            header={Localizer.getString("AllOptionalSendConfirmation")}
            onCancel={() => {
                setSendSurveyAlertOpen(false);
            }}
            onConfirm={() => {
                setSendSurveyAlertOpen(false);
                sendAction();
            }}
            className="optional-questions-alert-dialog"
            aria-label={Localizer.getString("NoRequiredQuestion")}
        />
    }

    private renderSettingsPage() {
        let excludeSettingsSections: SettingsSections[] = [];
        let commonSettingsProps = {
            resultVisibility: getStore().settings.resultVisibility,
            isResponseAnonymous: getStore().settings.isResponseAnonymous,
            isResponseEditable: getStore().settings.isResponseEditable,
            locale: getStore().context.locale,
            dueDate: getStore().settings.dueDate,
            renderForMobile: UxUtils.renderingForMobile(),
            excludeSections: excludeSettingsSections,
            strings: this.getStringsForSettings(),
            onChange: (props: ISettingsComponentProps) => {
                updateSettings(props);
            },
            onMount: () => {
                UxUtils.setFocus(document.body, Constants.FOCUSABLE_ITEMS.All);
            }
        };
        if (UxUtils.renderingForMobile()) {
            let navBarComponentProps: INavBarComponentProps = {
                title: Localizer.getString("Settings"),
                leftNavBarItem: {
                    icon: <ArrowDownIcon size="large" rotate={90} />,
                    ariaLabel: Localizer.getString("Back"),
                    onClick: () => {
                        goToPage(Page.Main);
                    },
                    type: NavBarItemType.BACK
                }
            };

            return (
                <Flex className="body-container no-mobile-footer" column>
                    <NavBarComponent {...navBarComponentProps} />
                    <SettingsMobile {...commonSettingsProps} />
                </Flex>
            );
        } else {
            let settingsProps: ISettingsProps = {
                ...commonSettingsProps,
                onBack: () => {
                    goToPage(Page.Main);
                }
            };
            return <Settings {...settingsProps} />;
        }
    }

    private renderUpdateQuestionPage() {
        return <UpdateQuestionPage />;
    }

    private renderFooterSettingsSection() {
        return <SettingsSummaryComponent
            onRef={(element) => {
                this.settingsFooterComponentRef = element;
            }}
            dueDate={new Date(getStore().settings.dueDate)}
            resultVisibility={getStore().settings.resultVisibility}
            onClick={() => {
                goToPage(Page.Settings);
            }} />
    }

    private questionView(): JSX.Element {
        let showTitleError: boolean = getStore().isValidationModeOn && SurveyUtils.isEmptyOrNull(getStore().title);
        let questionMenuItems = [];
        questionMenuItems.push(
            this.getQuestionAdaptiveMenuItem('1', <BulletsIcon outline={true} className={"menu-icon"} />, "Multichoice", actionSDK.ActionDataColumnValueType.SingleOption, QuestionDisplayType.Select)
        );
        questionMenuItems.push(
            this.getQuestionAdaptiveMenuItem('2', <StarIcon outline={true} className={"menu-icon"} />, "Rating", actionSDK.ActionDataColumnValueType.SingleOption, QuestionDisplayType.FiveStar)
        );
        questionMenuItems.push(
            this.getQuestionAdaptiveMenuItem('3', <FormatIcon outline={true} className={"menu-icon"} />, "Text", actionSDK.ActionDataColumnValueType.Text, QuestionDisplayType.None)
        );
        questionMenuItems.push(
            this.getQuestionAdaptiveMenuItem('4',  <CallDialpadIcon outline={true} className={"menu-icon"} />, "Number", actionSDK.ActionDataColumnValueType.Numeric, QuestionDisplayType.None)
        );
        questionMenuItems.push(
            this.getQuestionAdaptiveMenuItem('5', <CalendarIcon outline={true} className={"menu-icon"} />, "DateText", actionSDK.ActionDataColumnValueType.Date, QuestionDisplayType.None)
        );
        return (
            <Flex column>
                <InputBox key="survey_title" defaultValue={getStore().title} fluid multiline
                    maxLength={240}
                    className="survey-title-container"
                    input={{
                        className: showTitleError ? "title-box invalid-title invalid-error" : "title-box"
                    }}
                    placeholder={Localizer.getString("EnterSurveyTitle")} showError={showTitleError} errorText={Localizer.getString("EmptySurveyTitle")}
                    onBlur={(e) => {
                        if ((e.target as HTMLInputElement).value !== getStore().title) {
                            updateTitle((e.target as HTMLInputElement).value);
                            setValidationMode(false);
                        }
                    }} />
                {
                    <QuestionContainer
                        isValidationModeOn={getStore().isValidationModeOn}
                        questions={toJS(getStore().questions)}
                        activeQuestionIndex={getStore().activeQuestionIndex}
                        className={getStore().questions.length === 0 ? 'hidden' : 'visible'}
                    />
                }
                

                <Flex className="add-question-button-container">
                    <SplitButton
                    aria-label={Localizer.getString("AddQuestionSplitMenu")}
                    key= "show-menu"
                    id="add-question"
                    menu={questionMenuItems}
                    className= 'show-menu-button'
                    button={{
                        content: Localizer.getString("AddQuestion"),
                        className: "add-question-button",
                        icon: <AddIcon />,
                        key: "add",
                        id: SurveyUtils.ADDQUESTIONBUTTONID,
                        size: "large",
                        'aria-label': Localizer.getString("AddQuestion"),
                        onClick: (e, props) => {
                            e.stopPropagation();
                            setValidationMode(false);
                            addQuestion(actionSDK.ActionDataColumnValueType.SingleOption, QuestionDisplayType.Select, {}, UxUtils.renderingForMobile());
                        },
                        onKeyDown: (e) => {
                            //checking whether key pressed in Enter key and is not repeated by holding it down
                            if (!e.repeat && (e.keyCode || e.which) == Constants.CARRIAGE_RETURN_ASCII_VALUE) {
                                addQuestion(actionSDK.ActionDataColumnValueType.SingleOption, QuestionDisplayType.Select, {}, UxUtils.renderingForMobile());
                            }
                        }
                    }}
                    primary
                    toggleButton={{ 'aria-label': 'more-options' }}
                />
                </Flex>
                <label className={(getStore().isValidationModeOn && getStore().questions.length == 0 ? 'invalid' : 'hidden')} >{Localizer.getString("EmptySurveyQuestions")}</label>
            </Flex>
        );
    }

    private getQuestionAdaptiveMenuItem(key: string, iconName: JSX.Element, menuLabel: string, columnType: actionSDK.ActionDataColumnValueType, displayType: QuestionDisplayType): AdaptiveMenuItem {
        let menuItem: AdaptiveMenuItem = {
            key: key,
            icon: iconName,
            content: <Text content={Localizer.getString(menuLabel)} className="menu-icon" />,
            onClick: () => {
                let customProps = {};
                if (columnType == actionSDK.ActionDataColumnValueType.SingleOption && displayType == QuestionDisplayType.FiveStar) {
                    customProps = { type: Localizer.getString("StarText"), level: 5 };
                }
                addQuestion(columnType, displayType, customProps, UxUtils.renderingForMobile());
                setValidationMode(false);
            }
        }
        return menuItem;
    }

    getStringsForSettings(): ISettingsComponentStrings {
        let settingsComponentStrings: ISettingsComponentStrings = {
            dueBy: Localizer.getString("dueBy"),
            multipleResponses: Localizer.getString("multipleResponses"),
            responseOptions: Localizer.getString("responseOptions"),
            resultsVisibleTo: Localizer.getString("resultsVisibleTo"),
            resultsVisibleToAll: Localizer.getString("resultsVisibleToAll"),
            resultsVisibleToSender: Localizer.getString("resultsVisibleToSender"),
            datePickerPlaceholder: Localizer.getString("datePickerPlaceholder"),
            timePickerPlaceholder: Localizer.getString("timePickerPlaceholder")
        }
        return settingsComponentStrings;
    }

    getMenuItems(): AdaptiveMenuItem[] {
        let menuItemList: AdaptiveMenuItem[] = [];

        let deleteSurvey: AdaptiveMenuItem = {
            key: "changeDueDate",
            content: Localizer.getString("deleteSurvey"),
            icon: {},
            onClick: () => {
            }
        };
        menuItemList.push(deleteSurvey);
        return menuItemList;
    }

}
