import * as React from 'react';
import { Flex, Text } from '@fluentui/react-northstar';
import { ChevronDownIcon, ArrowDownIcon } from '@fluentui/react-icons-northstar';
import { observer } from 'mobx-react';
import ResponsePage from '../response/ResponsePage';
import { NavBarComponent, NavBarItemType, INavBarComponentProps } from './../NavBarComponent';
import { UserInfoView } from './../UserInfoView';
import * as actionSDK from "@microsoft/m365-action-sdk";
import { ResponseViewMode } from '../../store/response/Store';
import getStore from "../../store/summary/Store";
import "../../scss/Response.scss";
import { Utils } from '../../utils/Utils';
import {Localizer} from '../../utils/Localizer';
import {UxUtils} from './../../utils/UxUtils';


export interface IUserResponsePage {
    responses: actionSDK.ActionDataRow[];
    goBack: () => void;
    currentResponseIndex: number;
    showResponseView: (index, dataSource: actionSDK.ActionDataRow[]) => void;
    userProfiles?: { [key: string]: actionSDK.SubscriptionMember };
    locale?: string;
}

@observer
export class UserResponseView extends React.Component<IUserResponsePage, any>  {

    render() {
        return (
            <Flex className={this.getContainerClassName()} column>
                {UxUtils.renderingForMobile() ? this.getNavBar() : null}
                {this.getUserView()}
                <ResponsePage responseViewMode={ResponseViewMode.DisabledResponse} />
                {UxUtils.renderingForMobile() ? null : this.getFooterView()}
            </Flex>
        );
    }

    private getUserView(): JSX.Element {
        let responses = this.props.responses;
        let currentResponseIndex: number = this.props.currentResponseIndex;
        let row: actionSDK.ActionDataRow = responses[currentResponseIndex];
        let userProfile: actionSDK.SubscriptionMember = this.props.userProfiles ? this.props.userProfiles[row.creatorId] : null;
        let displayName: string = Localizer.getString("You");
        if (userProfile) {
            displayName = userProfile.displayName ? userProfile.displayName : displayName;
        }
        let dateOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" };
        let responseDateTime: string = UxUtils.formatDate(new Date(row.updateTime),
            (this.props.locale) ? this.props.locale : Utils.DEFAULT_LOCALE, dateOptions);
        let isFirstResponse = currentResponseIndex === 0;
        let isLastResponse = currentResponseIndex === responses.length - 1;

        return (
            <Flex gap="gap.small" vAlign="center" className="user-view">
                <Flex.Item>
                    <Flex onClick={isFirstResponse ? null : () => {
                        this.props.showResponseView(currentResponseIndex - 1, responses);
                    }}>
                        <ChevronDownIcon
                            {...(!isFirstResponse && UxUtils.getTabKeyProps())}
                            aria-label={Localizer.getString("PreviousResponse")}
                            rotate={90}
                            xSpacing="after"
                            size="medium"
                            className={isFirstResponse ? "" : "pointer-cursor"}
                            aria-disabled={isFirstResponse}
                            disabled={isFirstResponse}
                        />
                    </Flex>
                </Flex.Item>
                <Flex className="overflow-hidden user-response-header">
                    {userProfile ?
                        <UserInfoView
                            userName={displayName}
                            subtitle={responseDateTime}
                        /> :
                        <Text content={responseDateTime} />
                    }
                </Flex>
                <Flex.Item push>
                    <Flex onClick={isLastResponse ? null : () => {
                        this.props.showResponseView(this.props.currentResponseIndex + 1, responses);
                    }}>
                        <ChevronDownIcon
                            {...(!isLastResponse && UxUtils.getTabKeyProps())}
                            aria-label={Localizer.getString("NextResponse")}
                            rotate={270}
                            xSpacing="before"
                            size="medium"
                            className={isLastResponse ? "" : "pointer-cursor"}
                            aria-disabled={isLastResponse}
                            disabled={isLastResponse}
                        />
                    </Flex>
                </Flex.Item>
            </Flex>
        );
    }

    private getContainerClassName(): string {
        if (UxUtils.renderingForMobile()) {
            return "body-container no-mobile-footer";
        } else if (getStore().inPersonalAppMode) {
            return "personal-app-body";
        } else {
            return "body-container response-view";
        }

    }

    private getFooterView() {
        if (getStore().inPersonalAppMode) {
            return null;
        }
        return (
            <Flex className="footer-layout" gap={"gap.smaller"}>
                <Flex vAlign="center" className="pointer-cursor" {...UxUtils.getTabKeyProps()} onClick={() => {
                    this.props.goBack();
                }} >
                    <ChevronDownIcon rotate={90} xSpacing="after" size="small" />
                    <Text content={Localizer.getString("Back")} />
                </Flex>
            </Flex>
        );
    }

    private getNavBar() {
        let navBarComponentProps: INavBarComponentProps = {
            title: Localizer.getString("Back"),
            leftNavBarItem: {
                icon:  <ArrowDownIcon size="large" rotate={90} />,
                ariaLabel: Localizer.getString("Back"),
                onClick: () => {
                    this.props.goBack();
                },
                type: NavBarItemType.BACK
            }
        };

        return (
            <NavBarComponent {...navBarComponentProps} />
        );
    }
}