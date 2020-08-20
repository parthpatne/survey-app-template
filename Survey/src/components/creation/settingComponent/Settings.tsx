import * as React from 'react';
import { Flex, Text, ChevronDownIcon } from '@fluentui/react-northstar';
import { ISettingsComponentProps } from '../../../common/SettingsCommon';
import { SettingsComponent } from './SettingsComponent';
import { UxUtils } from '../../../utils/UxUtils';

export interface ISettingsProps extends ISettingsComponentProps {
    onBack: () => void;
}

export class Settings extends React.PureComponent<ISettingsProps> {

    render() {
        return (
            <Flex className="body-container" column gap="gap.medium">
                <SettingsComponent {...this.props} />
                {this.getBackElement()}
            </Flex>
        );
    }


    private getBackElement() {
        if (true /*!this.props.renderForMobile*/) {
            return (
                <Flex className="footer-layout" gap={"gap.smaller"}>
                    <Flex vAlign="center" className="pointer-cursor" {...UxUtils.getTabKeyProps()} onClick={() => {
                        this.props.onBack();
                    }} >
                        <ChevronDownIcon rotate={90} xSpacing="after" size="small" />
                        <Text content={"Back"} />
                    </Flex>
                </Flex>
            );
        }
    }
}