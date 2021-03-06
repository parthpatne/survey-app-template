import * as React from 'react';
import { QuestionView, IQuestionProps } from './QuestionView';
import { ToggleRatingView } from './../../RatingView';

export class LikeToggleRatingAnswerView extends React.Component<IQuestionProps> {

    render() {

        let response: boolean;
        if (this.props.response != undefined) {
            response = (this.props.response != true);
        }
        return (
            <QuestionView {...this.props}>
                <ToggleRatingView
                    defaultValue={response}
                    disabled={!this.props.editable}
                    onChange={(value: boolean) => {
                        this.props.updateResponse((value ? 0 : 1).toString());
                    }}
                    isPreview={this.props.isPreview}
                />
            </QuestionView>
        );
    }
}