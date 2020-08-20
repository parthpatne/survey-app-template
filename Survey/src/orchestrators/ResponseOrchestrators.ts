import { orchestrator } from "satcheljs";
import { initialize, setActionInstance, sendResponse, setValidationModeOn, setAppInitialized, setSendingFlag, setCurrentView, setSavedActionInstanceRow, showResponseView, updateCurrentResponseIndex, setMyResponses, setResponseViewMode, setCurrentResponse, setContext, initializeNavBarButtons, setResponseSubmissionFailed, updateTopMostErrorIndex, setIsActionDeleted } from "../actions/ResponseActions";
import getStore, { ResponsePageViewType, ResponseViewMode } from "../store/response/Store";
import { toJS } from "mobx";
import * as actionSDK from "@microsoft/m365-action-sdk";
import { InitializationState } from "./../utils/SharedEnum";
import { SurveyUtils } from '../common/SurveyUtils';
import {Localizer} from '../utils/Localizer';
import {ActionUtils} from './../utils/ActionUtils';
import { Utils } from "../utils/Utils";
import { ActionSdkHelper } from "../helper/ActionSdkHelper"

orchestrator(initialize, async() => {
    try{
        let response = await ActionSdkHelper.getContext();
        if(response.success) {
            setContext(response.context);
            Promise.all([
            Localizer.initialize(),
            fetchActionInstanceNow(),
            fetchMyResponsesNow(),
            ])
            .then((results) => {
                if (!getStore().actionInstance.dataTables[0].canUserAddMultipleRows && getStore().myResponses.length > 0) {
                    setCurrentResponse(getStore().myResponses[0]);
                    setResponseViewMode(ResponseViewMode.DisabledResponse);
                }
                setSavedActionInstanceRow(toJS(getStore().response.row));
                setAppInitialized(InitializationState.Initialized);
            })
            .catch((error) => {
                setAppInitialized(InitializationState.Failed);
            });
        }
        else {
            setAppInitialized(InitializationState.Failed);
        }
    }
    catch(error) {
        setAppInitialized(InitializationState.Failed);
    }
  });


function fetchActionInstanceNow(): Promise<boolean> {
    return new Promise<boolean>(async(resolve, reject) => {
        try{
            let response = await ActionSdkHelper.getActionInstance(getStore().context.actionId);
            if(response.success) {
                setActionInstance(response.action);
                resolve(true);
            }
            else {
                reject(response.error);
            }
        }
        catch(error) {
            reject(error);
        }
    });
}
  
function fetchMyResponsesNow(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        SurveyUtils.fetchMyResponses(getStore().context)
            .then((rows) => {
                setMyResponses(rows);
                resolve(true);
            })
            .catch(error => {
                reject(error)
            });
    });
}

orchestrator(sendResponse, async() => {
    setValidationModeOn();
    if (getStore().actionInstance && getStore().actionInstance.dataTables[0].dataColumns.length > 0) {
        let columns = toJS(getStore().actionInstance.dataTables[0].dataColumns);
        let row = toJS(getStore().response.row);
        let addRows = [];
        let updateRows = [];

        for (let i = 0; i < columns.length; i++) {
            if (!SurveyUtils.isValidResponse(row[columns[i].name], columns[i].allowNullValue, columns[i].valueType)) {
                updateTopMostErrorIndex(i + 1);
                setSendingFlag(false);
                return;
            }
        }

        let actionInstanceRow: actionSDK.ActionDataRow = {
            id: getStore().response.id ? getStore().response.id : "",
            actionId: getStore().context.actionId,
            columnValues: row
        };

        if (getStore().actionInstance.dataTables[0].canUserAddMultipleRows) {
            actionInstanceRow.id = "";
        }

        setSendingFlag(true);
        setResponseSubmissionFailed(false);
        Utils.announceText(Localizer.getString("SubmittingResponse"));
        ActionUtils.prepareActionInstanceRow(actionInstanceRow);

        if(getStore().actionInstance.dataTables[0].canUserAddMultipleRows || ! getStore().response.id ){
            addRows.push(actionInstanceRow);
        }
        else{
            updateRows.push(actionInstanceRow);
        }
        try {
            let addOrUpdate = await ActionSdkHelper.addOrUpdateDataRows(addRows, updateRows);
            setSendingFlag(false);
            if (addOrUpdate.success) {
                Utils.announceText(Localizer.getString("Submitted"));
                await ActionSdkHelper.closeCardView();
            } 
            else {
                setResponseSubmissionFailed(true);
                setSendingFlag(false);
                Utils.announceText(Localizer.getString("Failed"));
            }
        }
        catch(error) {
            setResponseSubmissionFailed(true);
            setSendingFlag(false);
            Utils.announceText(Localizer.getString("SubmissionFailed"));
        }

    }
});

orchestrator(showResponseView, (msg) => {
    let index: number = msg.index;
    if (index >= 0 && msg.responses && index < msg.responses.length) {
        setActionInstance(getStore().actionInstance);
        setCurrentResponse(msg.responses[index]);
        updateCurrentResponseIndex(index);
        setCurrentView(ResponsePageViewType.SelectedResponseView);
    }
});

