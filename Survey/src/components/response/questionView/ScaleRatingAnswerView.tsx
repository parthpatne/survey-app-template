import * as React from 'react';
import { QuestionView, IRatingAnswerProps } from './QuestionView';
import { ScaleRatingView } from './../../RatingView';

export class ScaleRatingAnswerView extends React.Component<IRatingAnswerProps> {

    render() {

        return (
            <QuestionView {...this.props}>
                <ScaleRatingView
                    max={this.props.count}
                    disabled={!this.props.editable}
                    defaultValue={this.props.response ? this.props.response as number : 0}
                    onChange={(value: number) => {
                        this.props.updateResponse(value.toString());
                    }} />
            </QuestionView>
        );
    }
}