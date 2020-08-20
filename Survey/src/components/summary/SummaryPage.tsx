import * as React from "react";
import { observer } from "mobx-react";
import getStore, { SummaryPageViewType, ResponsesListViewType } from "../../store/summary/Store";
import { goBack, showResponseView, setCurrentView, setProgressStatus } from "../../actions/SummaryActions";
import SummaryView from "./SummaryView";
import { UserResponseView } from "./UserResponseView";
import * as actionSDK from "@microsoft/m365-action-sdk";
import { Localizer } from '../../utils/Localizer';
import { TabView } from "./TabView";
import { Flex, Text } from '@fluentui/react-northstar';
import { ChevronDownIcon, MoreIcon } from '@fluentui/react-icons-northstar';
import "../../scss/homeview.scss";
import ResponseAggregationView from "./ResponseAggregationView";
import { Utils } from "../../utils/Utils";
import { LoaderUI } from './../Loader';
import { ProgressState } from './../../utils/SharedEnum';
import { ButtonComponent } from './../Button';
import { ErrorView } from './../ErrorView';
import { AdaptiveMenu, AdaptiveMenuItem, AdaptiveMenuRenderStyle } from "./../Menu";
import { ActionSdkHelper } from "../../helper/ActionSdkHelper";

/**
 * This class creates the complete SummaryPage with different Views
 * SummaryView: first Page user sees when View Result button is clicked
 * TabView: Responder's and NonResponder's tab
 * ResponseAggregationView: Responses per question
*/

@observer
export default class SummaryPage extends React.Component<any, any> {

    render() {
        ActionSdkHelper.hideLoadIndicator();
        if (getStore().isActionDeleted) {
            return <ErrorView
                title={Localizer.getString("SurveyDeletedError")}
                subtitle={Localizer.getString("SurveyDeletedErrorDescription")}
                buttonTitle={Localizer.getString("Close")}
            />;
        }

        if (getStore().progressStatus.actionInstance == ProgressState.Failed
            || getStore().progressStatus.actionSummary == ProgressState.Failed
            || getStore().progressStatus.localizationState == ProgressState.Failed
            || getStore().progressStatus.memberCount == ProgressState.Failed) {
                ActionSdkHelper.hideLoadIndicator();
            return <ErrorView
                title={Localizer.getString("GenericError")}
                buttonTitle={Localizer.getString("Close")}
            />;
        }

        if (getStore().progressStatus.actionInstance != ProgressState.Completed
            || getStore().progressStatus.actionSummary != ProgressState.Completed
            || getStore().progressStatus.localizationState != ProgressState.Completed
            || getStore().progressStatus.memberCount != ProgressState.Completed) {
            return <LoaderUI fill />;
        }

        return this.getView();
    }

    private getPersonalView(): JSX.Element {
        return (
            <>
                {this.getPersonalAppHeaderContainer()}
                {this.getPageView()}
                {this.getPersonalAppFooter()}
            </>
        );
    }

    private getView(): JSX.Element {
        if (getStore().inPersonalAppMode) {
            return this.getPersonalView();
        }
        else {
            ActionSdkHelper.hideLoadIndicator();
            return this.getPageView();
        }
    }

    private getPageView(): JSX.Element {
        if (getStore().currentView == SummaryPageViewType.Main) {
            return <SummaryView />;
        } else if (getStore().currentView == SummaryPageViewType.ResponderView || getStore().currentView == SummaryPageViewType.NonResponderView) {
            return <TabView />;
        } else if (getStore().currentView === SummaryPageViewType.ResponseAggregationView) {
            return (<ResponseAggregationView questionInfo={getStore().selectedQuestionDrillDownInfo} />);
        } else if (getStore().currentView == SummaryPageViewType.ResponseView) {
            let dataSource: actionSDK.ActionDataRow[] = (getStore().responseViewType === ResponsesListViewType.AllResponses)
                ? getStore().actionInstanceRows : getStore().myRows;
            let goBackToView: SummaryPageViewType = SummaryPageViewType.ResponderView;
            if (getStore().responseViewType === ResponsesListViewType.MyResponses && dataSource.length === 1) {
                goBackToView = SummaryPageViewType.Main;
            }
            return (
                <UserResponseView
                    responses={dataSource}
                    goBack={() => { setCurrentView(goBackToView); }}
                    currentResponseIndex={getStore().currentResponseIndex}
                    showResponseView={showResponseView}
                    userProfiles={getStore().userProfile}
                    locale={getStore().context ? getStore().context.locale : Utils.DEFAULT_LOCALE} />);
        }
    }

    private handleCloseBackPress() {
        setProgressStatus({
            actionInstance: ProgressState.NotStarted,
            actionSummary: ProgressState.NotStarted,
            localizationState: ProgressState.NotStarted,
            currentContext: ProgressState.NotStarted
        });
        this.props.onBackPress();
    }

    private getPersonalAppHeaderContainer(): JSX.Element {
        return (
            <Flex space="between" className="header-container">
                <Flex gap="gap.small" onClick={() => { getStore().currentView == SummaryPageViewType.Main ? this.handleCloseBackPress() : goBack(); }}>
                    <ChevronDownIcon rotate={90} />
                    <Text content={getStore().actionInstance.displayName} weight="bold" size="medium" color="brand" />
                </Flex>
                <Flex gap="gap.small">
                    {this.getMenu()}
                    <ButtonComponent secondary
                        content={Localizer.getString("Close")} className="secondary-button"
                        onClick={() => {
                            this.handleCloseBackPress();
                        }} />
                </Flex>
            </Flex>
        );
    }

    private getPersonalAppFooter(): JSX.Element {
        return (
            <Flex className={"personal-footer-layout"} gap={"gap.smaller"} hAlign="end" >
                <ButtonComponent secondary
                    content={Localizer.getString("DownloadResponses")} />
                <ButtonComponent primary
                    content={Localizer.getString("DownloadImage")} />
            </Flex>
        );
    }

    private getMenu() {
        let menuItems: AdaptiveMenuItem[] = this.getMenuItems();
        if (menuItems.length == 0) {
            return null;
        }
        return (
            <AdaptiveMenu
                key="header_options"
                renderAs={AdaptiveMenuRenderStyle.MENU}
                content={<MoreIcon outline className="header-menu" />}
                menuItems={menuItems}
                dismissMenuAriaLabel={Localizer.getString("DismissMenu")}
            />
        );
    }

    getMenuItems(): AdaptiveMenuItem[] {
        let menuItemList: AdaptiveMenuItem[] = [];
        let changeDueDate: AdaptiveMenuItem = {
            key: "changeDueDate",
            content: Localizer.getString("ChangeDueDate"),
            icon: {},
            onClick: () => {
            }
        };
        menuItemList.push(changeDueDate);

        let duplicateSurvey: AdaptiveMenuItem = {
            key: "duplicateSurvey",
            content: Localizer.getString("DuplicateSurvey"),
            icon: {},
            onClick: () => {
            }
        };
        menuItemList.push(duplicateSurvey);

        let closeSurvey: AdaptiveMenuItem = {
            key: "close",
            content: Localizer.getString("CloseSurvey"),
            icon: {},
            onClick: () => {
            }
        };
        menuItemList.push(closeSurvey);

        let deleteSurvey: AdaptiveMenuItem = {
            key: "delete",
            content: Localizer.getString("DeleteSurvey"),
            icon: {},
            onClick: () => {
            }
        };
        menuItemList.push(deleteSurvey);

        let getLinkToResult: AdaptiveMenuItem = {
            key: "getLinkToResult",
            content: Localizer.getString("GetLinkToResult"),
            icon: {},
            onClick: () => {
            }
        };
        menuItemList.push(getLinkToResult);


        return menuItemList;
    }

}