import * as React from 'react';
import { IQuestionProps, QuestionView } from './QuestionView';
import { Input, InputProps } from '@fluentui/react-northstar';
import {Localizer} from '../../../utils/Localizer';

export class NumericAnswerView extends React.Component<IQuestionProps> {

    shouldComponentUpdate(nextProps) {
        if (isNaN(nextProps.response))
            return false;
        return true;
    }

    render() {
        let props: InputProps = {
            placeholder: Localizer.getString("EnterNumber"),
            type: "number",
            fluid: true,
            required: this.props.required //adding required field to be able to capture valueMissing error
        }
        let value: string = isNaN(parseFloat(this.props.response)) ? "" : this.props.response as string;
        if (this.props.editable) {
            props = {
                ...props,
                defaultValue: value,
                onBlur: (event) => {
                    //Input type number, in case of bad input, has value attribute set to ""
                    //Due to this, we cannot validate the numeric responses at the time of submission
                    //To capture bad input, we're storing "badInput" in store against numeric questions
                    //Upon submission we check for isNaN on numeric responses
                    //Responses go through only when numeric responses have valid input.
                    if (event.currentTarget.validity.badInput) {
                        this.props.updateResponse('badInput');
                    } else if (event.currentTarget.validity.valueMissing) {
                        //saving "" in store whenever currentTarget validity.valueMissing is true
                        //so that empty response validation is taken care of
                        this.props.updateResponse("");
                    } else {
                        this.props.updateResponse(Number(event.currentTarget.value).toString());
                    }
                }
            }
        } else {
            props = {
                ...props,
                value: value,
                disabled: true
            }
        }
        return (
            <QuestionView {...this.props}>
                <Input {...props} />
            </QuestionView>
        );
    }
}