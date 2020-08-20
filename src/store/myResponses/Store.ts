import { createStore } from 'satcheljs';
import "../../mutator/MyResponsesMutator";
import * as actionSDK from "@microsoft/m365-action-sdk";

interface ISurveyMyResponsesStore {
    myResponses: actionSDK.ActionDataRow[];
    currentActiveIndex: number;
    // myProfile: actionSDK.UserProfile;
}

const store: ISurveyMyResponsesStore = {
    myResponses: [],
    currentActiveIndex: -1,
    // myProfile: null
}

export default createStore<ISurveyMyResponsesStore>('responsesStore', store);