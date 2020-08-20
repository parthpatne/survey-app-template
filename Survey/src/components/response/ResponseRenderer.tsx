import * as React from 'react';
import getStore, { ResponsePageViewType, ResponseViewMode } from "../../store/response/Store";
import { sendResponse, resetResponse, setResponseViewMode, setCurrentView, setSavedActionInstanceRow, showResponseView, initializeNavBarButtons, setResponseSubmissionFailed } from '../../actions/ResponseActions';
import { Flex, Button, Text } from '@fluentui/react-northstar';
import { ChevronDownIcon, CloseIcon, ArrowDownIcon } from '@fluentui/react-icons-northstar';
import ResponsePage from './ResponsePage';
import { observer } from 'mobx-react';
import * as actionSDK from '@microsoft/m365-action-sdk';
import { MyResponsesListView } from '../myResponses/MyResponsesListView';
import { UserResponseView } from "../summary/UserResponseView";
import { initializeMyResponses } from "../../actions/MyResponsesActions";
import "../../scss/Response.scss";
import {Localizer} from  "../../utils/Localizer";
import { Utils } from '../../utils/Utils';
import {UxUtils} from './../../utils/UxUtils';
import { InitializationState} from './../../utils/SharedEnum';
import {NavBarComponent, INavBarComponentProps, NavBarItemType} from './../NavBarComponent';
import {ErrorView } from './../ErrorView';
import {ButtonComponent } from './../Button';
import {LoaderUI } from './../Loader';
import { ActionSdkHelper } from "../../helper/ActionSdkHelper";

@observer
export default class ResponseRenderer extends React.Component<any, any> {

    render() {
        if (getStore().isActionDeleted) {
            return <ErrorView
                title={Localizer.getString("SurveyDeletedError")}
                subtitle={Localizer.getString("SurveyDeletedErrorDescription")}
                buttonTitle={Localizer.getString("Close")}
            />;
        }

        if (getStore().isInitialized === InitializationState.NotInitialized) {
            return <LoaderUI fill />;
        }
        else if (getStore().isInitialized === InitializationState.Failed) {
            
            return <ErrorView
                title={Localizer.getString("GenericError")}
                buttonTitle={Localizer.getString("Close")}
            />;
        }
        ActionSdkHelper.hideLoadIndicator();
        return this.renderForWebOrDesktop();
    }

    private renderForWebOrDesktop() {
        if (getStore().currentView === ResponsePageViewType.MyResponses) {
            return (
                <>
                    <Flex className="body-container">
                        {this.renderMyResponsesListView()}
                    </Flex>
                    <Flex className="footer-layout" gap={"gap.small"}>
                        <Flex vAlign="center" className="pointer-cursor" {...UxUtils.getTabKeyProps()} onClick={() => {
                            this.myResponsesViewBackButtonHandler();
                        }} >
                            <ChevronDownIcon rotate={90} xSpacing="after" size="small" />
                            <Text content={Localizer.getString("Back")} />
                        </Flex>
                    </Flex>
                </>
            )
        } else if (getStore().currentView === ResponsePageViewType.SelectedResponseView) {
            return this.renderUserResponseView();
        }
        let shouldShowRespondedNTimesLabel = getStore().actionInstance.dataTables[0].canUserAddMultipleRows && getStore().myResponses.length > 0;
        return (
            <>
                <Flex className="body-container">
                    {this.renderResponsePage()}
                </Flex>
                <Flex className="footer-layout space-between" gap="gap.medium" hAlign="end">
                    <Flex column>
                        {shouldShowRespondedNTimesLabel && this.renderYouRespondedNTimesLabel()}
                        {getStore().responseSubmissionFailed &&
                            <Text content={Localizer.getString("ResponseSubmitError")}
                                className={shouldShowRespondedNTimesLabel ? "response-error" : ""} error />}
                    </Flex>
                    <Flex.Item push>
                        {getStore().responseViewMode === ResponseViewMode.DisabledResponse ?
                            <Button content={Localizer.getString("EditResponse")} primary onClick={() => {
                                /* 
                                Any update to this handler should also be made in the NAV_BAR_MENUITEM_EDIT_RESPONSE_ID  
                                section in navBarMenuCallback() in ResponseOrchestrator
                                */
                                setResponseViewMode(ResponseViewMode.UpdateResponse);
                            }} /> :
                            <Flex gap="gap.medium">
                                {getStore().responseViewMode === ResponseViewMode.UpdateResponse &&
                                    <Button content={Localizer.getString("Cancel")} onClick={() => {
                                        this.responsePageCancelButtonHandler();
                                    }} />
                                }
                                {/*Todo: @pragya fix this */}
                                <ButtonComponent
                                    primary
                                    showLoader={getStore().isSendActionInProgress}
                                    content={getStore().responseViewMode === ResponseViewMode.UpdateResponse ? Localizer.getString("UpdateResponse") : Localizer.getString("SubmitResponse")}
                                    onClick={() => {
                                        /* 
                                        Any update to this handler should also be made in the NAV_BAR_MENUITEM_SUBMIT_RESPONSE_ID  
                                        section in navBarMenuCallback() in ResponseOrchestrator
                                        */
                                        sendResponse();
                                    }}>
                                </ButtonComponent>
                            </Flex>
                        }
                    </Flex.Item>
                </Flex>
            </>
        );
    }

    private renderYouRespondedNTimesLabel() {
        return (
            <Flex.Item grow>
                <Text
                    size="small"
                    color="brand"
                    content={getStore().myResponses.length === 1
                        ? Localizer.getString("YouRespondedOnce")
                        : Localizer.getString("YouRespondedNTimes", getStore().myResponses.length)}
                    className="underline" onClick={() => {
                        setSavedActionInstanceRow(getStore().response.row);
                        initializeMyResponses(getStore().myResponses);
                        setCurrentView(ResponsePageViewType.MyResponses);
                    }}
                    {...UxUtils.getTabKeyProps()}
                    aria-label={getStore().myResponses.length === 1
                        ? Localizer.getString("YouRespondedOnce")
                        : Localizer.getString("YouRespondedNTimes", getStore().myResponses.length)}
                />
            </Flex.Item>
        );
    }

    private renderUserResponseView() {
        return (
            <UserResponseView
                responses={getStore().myResponses}
                goBack={() => {
                    setCurrentView(ResponsePageViewType.MyResponses);
                }}
                currentResponseIndex={getStore().currentResponseIndex}
                showResponseView={showResponseView}
                locale={getStore().context ? getStore().context.locale : Utils.DEFAULT_LOCALE} />
        );
    }

    private renderMyResponsesListView() {
        return (
            <MyResponsesListView
                locale={getStore().context ? getStore().context.locale : Utils.DEFAULT_LOCALE}
                onRowClick={(index, dataSource) => {
                    showResponseView(index, dataSource);
                }} />
        );
    }

    private renderResponsePage() {
        return (
            <ResponsePage showTitle responseViewMode={getStore().responseViewMode} />
        );
    }

    private getMobileContainerClassName() {
        let className = "body-container";
        if (!this.shouldShowFooterOnMobile()) {
            className += " no-mobile-footer";
        }
        return className;
    }

    private getNavBar() {
        let navBarComponentProps: INavBarComponentProps;
        if (getStore().responseViewMode === ResponseViewMode.UpdateResponse) {
            navBarComponentProps = {
                title: Localizer.getString("Cancel"),
                leftNavBarItem: {
                    icon: <CloseIcon outline={true} size="large" />,
                    ariaLabel: Localizer.getString("Cancel"),
                    onClick: () => {
                        this.responsePageCancelButtonHandler();
                    },
                    type: NavBarItemType.BACK
                }
            };
        } else if (getStore().currentView === ResponsePageViewType.MyResponses) {
            navBarComponentProps = {
                title: Localizer.getString("Back"),
                leftNavBarItem: {
                    icon: <ArrowDownIcon size="large" rotate={90} />,
                    ariaLabel: Localizer.getString("Back"),
                    onClick: () => {
                        this.myResponsesViewBackButtonHandler();
                    },
                    type: NavBarItemType.BACK
                }
            };
        }

        return (
            <NavBarComponent {...navBarComponentProps} />
        );
    }

    private myResponsesViewBackButtonHandler() {
        resetResponse();
        setCurrentView(ResponsePageViewType.Main);
    }

    private responsePageCancelButtonHandler() {
        setResponseSubmissionFailed(false);
        resetResponse();
        setResponseViewMode(ResponseViewMode.DisabledResponse);
    }

    private shouldShowFooterOnMobile(): boolean {
        return getStore().actionInstance.dataTables[0].canUserAddMultipleRows && getStore().myResponses.length > 0 &&
            getStore().currentView !== ResponsePageViewType.MyResponses &&
            getStore().currentView !== ResponsePageViewType.SelectedResponseView;
    }

    private shouldShowNavBar(): boolean {
        return getStore().responseViewMode === ResponseViewMode.UpdateResponse ||
            getStore().currentView === ResponsePageViewType.MyResponses;
    }
}