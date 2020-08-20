import * as React from 'react';
import { observer } from 'mobx-react';
import * as actionSDK from '@microsoft/m365-action-sdk';

import { List, ListProps, Flex, basicListItemBehavior } from '@fluentui/react-northstar';
import { ChevronDownIcon } from '@fluentui/react-icons-northstar';
import { QuestionView } from '../../response/questionView/QuestionView';
import { showUpdateQuestionPage } from '../../../actions/CreationActions';
import { SurveyUtils } from '../../../common/SurveyUtils';

export interface IQuestionContainerMobileProps {
    questions: actionSDK.ActionDataColumn[];
    isValidationModeOn: boolean;
}

@observer
export class QuestionContainerMobile extends React.Component<IQuestionContainerMobileProps> {
    render() {
        if (this.props.questions.length === 0) {
            return null;
        }
        const questions: actionSDK.ActionDataColumn[] = this.props.questions;
        let items = [];
        for (let i = 0; i < questions.length; i++) {
            let question: actionSDK.ActionDataColumn = { ...questions[i] };
            let item = JSON.parse("{}");
            item.key = i.toString();
            item.id = SurveyUtils.QUESTION_DIV_ID_PREFIX + i;
            item.content = (
                <Flex vAlign="center" space="between">
                    <QuestionView questionNumber={i + 1} questionText={question.displayName} required={question.allowNullValue ? false : true} />
                    <ChevronDownIcon outline rotate={270} size="smaller" />
                </Flex>
            )
            item.className = (this.props.isValidationModeOn && !SurveyUtils.isQuestionValid(question) ? 'question-box invalid' : 'question-box')

            items.push(item);
        }

        return (
            <List className="question-list-mobile-container" items={items} selectable onSelectedIndexChange={(e, props: ListProps) => {
                showUpdateQuestionPage(props.selectedIndex);
            }} accessibility={basicListItemBehavior} />
        );
    }
}