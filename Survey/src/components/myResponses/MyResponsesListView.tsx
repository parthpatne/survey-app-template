import * as React from 'react';
import { RecyclerViewComponent, RecyclerViewType } from './../RecyclerViewComponent';
import getStore from "../../store/myResponses/Store";
import { Flex, Text, Divider, Avatar, FlexItem, FocusZone } from '@fluentui/react-northstar';
import { ChevronDownIcon } from '@fluentui/react-icons-northstar';
import { observer } from 'mobx-react';
import * as actionSDK from "@microsoft/m365-action-sdk";
import "../../scss/MyResponses.scss";
import { Constants } from "./../../utils/Constants";
import { Localizer } from '../../utils/Localizer';
import { Utils } from '../../utils/Utils';
import { UxUtils } from './../../utils/UxUtils';

export interface IMyResponsesPage {
    onRowClick?: (index, dataSource) => void;
    locale?: string;
}

@observer
export class MyResponsesListView extends React.Component<IMyResponsesPage, any> {
    private responseTimeStamps: string[] = [];

    private onRowRender(type: RecyclerViewType, index: number, date: string): JSX.Element {
        return (<>
            <Flex
                vAlign="center"
                className="my-response-item"
                onClick={() => {
                    this.props.onRowClick ? this.props.onRowClick(index, getStore().myResponses) : null;
                }}
                {...UxUtils.getTabKeyProps()} >
                <Text content={date} />
                <FlexItem push>
                    <ChevronDownIcon size="smallest" rotate={270} outline></ChevronDownIcon>
                </FlexItem>
            </Flex>
            <Divider />
        </>);
    }

    render() {
        this.responseTimeStamps = [];

        for (var row of getStore().myResponses) {
            this.addUserResponseTimeStamp(row);
        }

        let myUserName: string = Localizer.getString("You");

        return (
            <FocusZone className="zero-padding" isCircularNavigation={true}>
                <Flex column
                    className="list-container"
                    gap="gap.small">
                    <Flex vAlign="center" gap="gap.small">
                        <Flex.Item>
                            <Avatar name={myUserName} size="large" />
                        </Flex.Item>
                        <Flex.Item >
                            <Text content={Localizer.getString("YourResponses(N)", getStore().myResponses.length)} weight="bold" />
                        </Flex.Item>
                    </Flex>
                    <Divider className="divider zero-bottom-margin" />
                    <RecyclerViewComponent
                        data={this.responseTimeStamps}
                        rowHeight={Constants.LIST_VIEW_ROW_HEIGHT}
                        onRowRender={(type: RecyclerViewType, index: number, date: string): JSX.Element => {
                            return this.onRowRender(type, index, date);
                        }} />
                </Flex>
            </FocusZone>
        );

    }

    private addUserResponseTimeStamp(row: actionSDK.ActionDataRow): void {
        if (row) {
            let responseTimeStamp: string = Utils.dateTimeToLocaleString(new Date(row.updateTime),
                (this.props.locale) ? this.props.locale : Utils.DEFAULT_LOCALE);
            this.responseTimeStamps.push(responseTimeStamp);
        }
    }
}