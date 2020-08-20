
import * as React from 'react';
import { Flex, Text, Menu } from '@fluentui/react-northstar';
import { ChevronDownIcon, ArrowDownIcon } from '@fluentui/react-icons-northstar';
import { ResponderView } from './ResponderView';
import getStore, { SummaryPageViewType, ResponsesListViewType } from "../../store/summary/Store";
import { NonResponderView } from './NonResponderView';
import { setCurrentView, goBack } from "../../actions/SummaryActions";
import { INavBarComponentProps, NavBarItemType, NavBarComponent } from './../NavBarComponent';
import { UxUtils} from "./../../utils/UxUtils";
import { Constants} from "./../../utils/Constants";
import * as actionSDK from "@microsoft/m365-action-sdk";
import {Localizer} from '../../utils/Localizer';
import { observer } from 'mobx-react';

/**
 * This class creates the tabs for Responder's and NonResponder's list
 * ResponderView: Shows responder's list and each responder row redirects to response of corresponding user
 * NonResponderView: Shows non-responder's list
*/
@observer
export class TabView extends React.Component<any, any> {

    componentDidMount() {
        UxUtils.setFocus(document.body, Constants.FOCUSABLE_ITEMS.All);
    }

    private items = [
        {
            key: 'responders',
            role: "tab",
            "aria-selected": getStore().currentView == SummaryPageViewType.ResponderView,
            "aria-label": Localizer.getString("Responders"),
            content: Localizer.getString("Responders"),
            onClick: () => {
                setCurrentView(SummaryPageViewType.ResponderView)
            }
        },
        {
            key: 'nonResponders',
            role: "tab",
            "aria-selected": getStore().currentView == SummaryPageViewType.NonResponderView,
            "aria-label": Localizer.getString("NonResponders"),
            content: Localizer.getString("NonResponders"),
            onClick: () => {
                setCurrentView(SummaryPageViewType.NonResponderView)
            }
        }
    ];

    render() {
        var participationString: string = getStore().actionSummary.rowCount === 1 ?
            Localizer.getString("ParticipationIndicatorSingular", getStore().actionSummary.rowCount, getStore().memberCount)
            : Localizer.getString("ParticipationIndicatorPlural", getStore().actionSummary.rowCount, getStore().memberCount);
        if (getStore().actionInstance && getStore().actionInstance.dataTables[0].canUserAddMultipleRows) {
            participationString = (getStore().actionSummary.rowCount === 0)
                ? Localizer.getString("NoResponse")
                : (getStore().actionSummary.rowCount === 1)
                    ? Localizer.getString("SingleResponse")
                    : Localizer.getString("XResponsesByYMembers", getStore().actionSummary.rowCount, (getStore().actionSummary.rowCreatorCount));
        }
        return (

            <Flex column className={getStore().inPersonalAppMode ? "personal-app-body" : "body-container tabview-container no-mobile-footer"}>
                {this.getNavBar()}
                {getStore().responseViewType === ResponsesListViewType.AllResponses &&
                    <>
                        <Text className="participation-title" size="small" weight="bold">{participationString}</Text>
                        <Menu role="tablist" className="tab-view" fluid defaultActiveIndex={0} items={this.items} underlined primary />
                    </>}
                {getStore().currentView == SummaryPageViewType.ResponderView ? <ResponderView /> : <NonResponderView />}

                {this.getFooterElement()}
            </Flex>
        );
    }

    private getFooterElement() {

        if (!UxUtils.renderingForMobile() && !getStore().inPersonalAppMode) {
            return (
                <Flex className="footer-layout tab-view-footer" gap={"gap.smaller"}>
                    <Flex vAlign="center" className="pointer-cursor" {...UxUtils.getTabKeyProps()} onClick={() => {
                        goBack();
                    }} >
                        <ChevronDownIcon rotate={90} xSpacing="after" size="small" />
                        <Text content={Localizer.getString("Back")} />
                    </Flex>
                </Flex>
            );
        } else {
            return null;
        }
    }

    private getNavBar() {
        if (UxUtils.renderingForMobile()) {
            let navBarComponentProps: INavBarComponentProps = {
                title: Localizer.getString("ViewResponses"),
                leftNavBarItem: {
                    icon: <ArrowDownIcon size="large" rotate={90} />,
                    ariaLabel: Localizer.getString("Back"),
                    onClick: () => {
                        goBack();
                    },
                    type: NavBarItemType.BACK
                }
            }

            return (
                <NavBarComponent {...navBarComponentProps} />
            );
        } else {
            return null;
        }
    }

    private isCurrentUserCreator(): boolean {
        return getStore().actionInstance && getStore().context.userId == getStore().actionInstance.creatorId;
    }

    private isSurveyActive(): boolean {
        return getStore().actionInstance && getStore().actionInstance.status == actionSDK.ActionStatus.Active;
    }
}