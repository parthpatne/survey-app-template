import { orchestrator } from "satcheljs"
import {
    updateDueDate,
    fetchNonResponders,
    fetchMemberCount,
    fetchMyResponse,
    fetchLocalization,
    fetchActionInstance,
    fetchActionInstanceRows,
    fetchActionInstanceSummary,
    updateSummary,
    initialize,
    setContext,
    updateActionInstance,
    fetchUserDetails,
    updateUserProfileMap,
    setCurrentView,
    setProgressStatus,
    updateMyRows,
    fetchUserProfilePic,
    updateMemberCount,
    addActionInstanceRows,
    updateContinuationToken,
    updateCurrentResponseIndex,
    surveyCloseAlertOpen,
    surveyDeleteAlertOpen,
    surveyExpiryChangeAlertOpen,
    updateNonResponders,
    closeSurvey,
    deleteSurvey,
    downloadCSV,
    showResponseView,
    setIsActionDeleted
} from "../actions/SummaryActions";
import { initializeExternal } from "../actions/ResponseActions";
import getStore, { SummaryPageViewType } from '../store/summary/Store';
import * as actionSDK from "@microsoft/m365-action-sdk";
import { ProgressState } from "./../utils/SharedEnum";
import { SurveyUtils } from '../common/SurveyUtils';
import {ActionError} from './../Utils/ActionError';
import {Localizer} from '../utils/Localizer';
import {Constants} from "./../utils/Constants";
import { ActionSdkHelper } from "../helper/ActionSdkHelper"

const handleErrorResponse = (error: actionSDK.ApiError) => {
    if (error && error.code == "404") {
        setIsActionDeleted(true);
    }
};
const handleError = (error: actionSDK.ApiError, requestType: string) => {
    handleErrorResponse(error);
    setProgressStatus({ [requestType]: ProgressState.Failed });
}

/*
* This function call is to fetch the data to be shown on ResultView.
* It initializes all the variables for all the views in ResultView.
* setContext(): set the context for the instance
* fetchLocalization(): string localization
* fetchActionInstance(): get action instance id
* fetchMyResponse(): get the response of user accessing the instance (response of logged in user)
* fetchMemberCount(): get count of members in a subscription
*/
orchestrator(initialize, async () => {
    if (getStore().progressStatus.currentContext == ProgressState.NotStarted
        || getStore().progressStatus.currentContext == ProgressState.Failed) {
        setProgressStatus({ currentContext: ProgressState.InProgress });
        try {
            let response = await ActionSdkHelper.getContext();
            if(response.success) {
                setContext(response.context);
                fetchLocalization();
                fetchActionInstance(true);
                fetchActionInstanceSummary();
                fetchMyResponse();
                fetchMemberCount();
                setProgressStatus({ currentContext: ProgressState.Completed });
            }
            else {
                handleError(response.error, "currentContext");
            }
        }
        catch(error) {
            handleError(error, "currentContext");
        }
    }
});

/**
* fetchLocalization(): Get the string localization for all the strings used in the ResultView
* and store it for this session to avoid making multiple network calls.
*/
orchestrator(fetchLocalization, (msg) => {
    if (getStore().progressStatus.localizationState == ProgressState.NotStarted
        || getStore().progressStatus.localizationState == ProgressState.Failed) {
        setProgressStatus({ localizationState: ProgressState.InProgress });
        Localizer.initialize()
            .then(() => {
                setProgressStatus({ localizationState: ProgressState.Completed });
            })
            .catch((error: ActionError) => {
                setProgressStatus({ localizationState: ProgressState.Failed });
            });
    }
})

/**
* fetchMyResponse(): Get the response of user accessing the instance (response of logged in user)
* and store it for this session to avoid making multiple network calls.
*/
orchestrator(fetchMyResponse, () => {
    if (getStore().progressStatus.myActionInstanceRow == ProgressState.NotStarted
        || getStore().progressStatus.myActionInstanceRow == ProgressState.Failed) {
        setProgressStatus({ myActionInstanceRow: ProgressState.InProgress });
        SurveyUtils.fetchMyResponses(getStore().context)
            .then((rows) => {
                updateMyRows(rows);
                fetchUserDetails([getStore().context.userId]);
                setProgressStatus({ myActionInstanceRow: ProgressState.Completed });
            }).catch((error: ActionError) => {
                setProgressStatus({ myActionInstanceRow: ProgressState.Failed });
            });
    }
});

/**
* fetchMemberCount(): get count of members in a subscription
* and store it for this session to avoid making multiple network calls.
*/
orchestrator(fetchMemberCount, async(msg) => {
    if (getStore().progressStatus.memberCount == ProgressState.NotStarted
        || getStore().progressStatus.memberCount == ProgressState.Failed) {
        setProgressStatus({ memberCount: ProgressState.InProgress });
        try {
            let response = await ActionSdkHelper.getMemberCount(getStore().context.subscription);
            if(response.success) {
                updateMemberCount(response.memberCount);
                setProgressStatus({ memberCount: ProgressState.Completed });
            }
            else {
                setProgressStatus({ memberCount: ProgressState.Failed });
                handleError(response.error, "fetchMemberCount");
            }
        }
        catch(error) {
            setProgressStatus({ memberCount: ProgressState.Failed });
            handleError(error, "fetchMemberCount");
        }
    }
})

/**
* fetchActionInstance(): Get the action instance
* and store it for this session to avoid making multiple network calls.
*/
orchestrator(fetchActionInstance, async(msg) => {
    if (getStore().progressStatus.actionInstance != ProgressState.InProgress) {
        if (msg.updateState) {
            setProgressStatus({ actionInstance: ProgressState.InProgress });
        }
        try {
            let response = await ActionSdkHelper.getActionInstance(getStore().context.actionId);
            if(response.success) {
                updateActionInstance(response.action);
                if (msg.updateState) {
                    setProgressStatus({ actionInstance: ProgressState.Completed })
                }
            }
            else {
                if (msg.updateState) {
                    setProgressStatus({ actionInstance: ProgressState.Failed })
                }
                handleError(response.error, "fetchActionInstance");
            }
        }
        catch(error) {
            if (msg.updateState) {
                setProgressStatus({ actionInstance: ProgressState.Failed })
            }
            handleError(error, "fetchActionInstance");
        }
    }
});

/**
* fetchUserDetails(): Get the user Details for all the responders of the survey
* and store it for this session to avoid making multiple network calls.
*/
orchestrator(fetchUserDetails, async(msg) => {
    let userIds: string[] = msg.userIds;
    try {
        let response = await ActionSdkHelper.getResponderDetails(getStore().context.subscription, userIds);
        if(response.success && response.members) {
            let users: {
                [key: string]: actionSDK.SubscriptionMember;
            } = {};
            response.members.forEach(member => {
                users[member.id] = {id: member.id, displayName: member.displayName}
            });
            updateUserProfileMap(users);
            if (response.memberIdsNotFound) {
                let userProfile: {
                    [key: string]: actionSDK.SubscriptionMember;
                } = {};
                for (var userId of response.memberIdsNotFound) {
                    userProfile[userId] = { id: userId, displayName: null };
                }
                updateUserProfileMap(userProfile);
            }
        }
        else {
            handleError(response.error, "fetchUserDetails");
        }
    }
    catch(error){
        handleError(error, "fetchUserDetails");
    }
});

orchestrator(fetchUserProfilePic, (msg) => {
    let userIds: string[] = msg.userIds;

    if (msg.userIds.length > 10) {
        fetchUserProfilePic(userIds.slice(10, userIds.length));
        userIds = userIds.slice(0, 10);
    }
    /*********************** YET TO IMPLEMENT IN NEW SDK (Will remove after PR)*********************/
    /*
    ActionSDK.APIs.getUserProfilePhotos(userIds)
        .then((profilePhotosFetchResult: ActionSDK.ProfilePhotosFetchResult) => {
            updateUserProfilePic(profilePhotosFetchResult.userIdToPhotoMap);
        })
        .catch((error: ActionError) => {
            // addLog(ActionSDK.LogLevel.Error, `fetchUserProfilePic failed, Error: ${error.errorCode}, ${error.errorMessage}`);
        });
    */
});

/**
* fetchActionInstanceRows(): Get all the responses for the survey
* and store it for this session to avoid making multiple network calls.
*/
orchestrator(fetchActionInstanceRows, async(msg) => {
    if (getStore().progressStatus.actionInstanceRow == ProgressState.Partial
        || getStore().progressStatus.actionInstanceRow == ProgressState.Failed
        || getStore().progressStatus.actionInstanceRow == ProgressState.NotStarted) {
        setProgressStatus({ actionInstanceRow: ProgressState.InProgress });
        try {
            let response = await ActionSdkHelper.getActionDataRows(getStore().context, null, getStore().continuationToken, 30, null);
            if(response.success) {
                let rows: actionSDK.ActionDataRow[] = [];
                for (var row of response.dataRows) {
                    rows.push(row);
                }

                let userIds: string[] = [];
                for (var row of rows) {
                    userIds.push(row.creatorId);
                }

                addActionInstanceRows(rows);
                if (userIds.length > 0) {
                    fetchUserDetails(userIds);
                }
                if (response.continuationToken ) {
                    updateContinuationToken(response.continuationToken);
                    setProgressStatus({ actionInstanceRow: ProgressState.Partial });
                } else {
                    setProgressStatus({ actionInstanceRow: ProgressState.Completed });
                }
            }
            else {
                setProgressStatus({ actionInstanceRow: ProgressState.Failed });
                handleError(response.error, "fetchActionInstanceRows");
            }
        }
        catch(error) {
            setProgressStatus({ actionInstanceRow: ProgressState.Failed });
            handleError(error, "fetchActionInstanceRows");
        }
    }
});

/**
* fetchNonResponders(): Get all the non-participants for the survey
* and store it for this session to avoid making multiple network calls.
*/
orchestrator(fetchNonResponders, async() => {
    if (getStore().progressStatus.nonResponder == ProgressState.NotStarted
        || getStore().progressStatus.nonResponder == ProgressState.Failed) {
        setProgressStatus({ nonResponder: ProgressState.InProgress });
        try {
            let response = await ActionSdkHelper.getNonResponders(getStore().context.actionId, getStore().context.subscription.id);
            if(response.success) {
               
                let userProfile: { [key: string]: actionSDK.SubscriptionMember } = {}
                if(response.nonParticipants){
                response.nonParticipants.forEach((user: actionSDK.SubscriptionMember) => {
                    userProfile[user.id] = user;
                });
            }
                updateUserProfileMap(userProfile);
                fetchUserProfilePic(Object.keys(userProfile));
                updateNonResponders(response.nonParticipants);
                setProgressStatus({ nonResponder: ProgressState.Completed });
            }
            else {
                setProgressStatus({ nonResponder: ProgressState.Failed });
                handleError(response.error, "fetchNonResponders");
            }
        }
        catch(error) {
            setProgressStatus({ nonResponder: ProgressState.Failed });
            handleError(error, "fetchNonResponders");
        }
    }
});

/**
* closeSurvey(): Close the survey. Sbuscribers will no longer able to respond.
* This is available only for the creator of survey
*/
orchestrator(closeSurvey, async() => {
    if (getStore().progressStatus.closeActionInstance != ProgressState.InProgress) {
        let failedCallback = () => {
            setProgressStatus({ closeActionInstance: ProgressState.Failed });
            fetchActionInstance(false);
        };

        setProgressStatus({ closeActionInstance: ProgressState.InProgress });
        var actionInstanceUpdateInfo: actionSDK.ActionUpdateInfo = {
            id: getStore().context.actionId,
            version: getStore().actionInstance.version,
            status: actionSDK.ActionStatus.Closed
        };
        try {
            let updateActionInstance = await ActionSdkHelper.updateActionInstanceStatus(actionInstanceUpdateInfo);
            if (updateActionInstance.success) {
                    surveyCloseAlertOpen(false);
                    await ActionSdkHelper.closeCardView();
            } 
            else {
                failedCallback();
                handleError(updateActionInstance.error, "closeSurvey");
            }
        }
        catch (error) {
            failedCallback();
            handleError(error, "closeSurvey");
        }
    }
});

/**
* deleteSurvey(): Delete the survey. This is available only for the creator of survey
*/
orchestrator(deleteSurvey, async() => {
    if (getStore().progressStatus.deleteActionInstance != ProgressState.InProgress) {
        let failedCallback = () => {
            setProgressStatus({ deleteActionInstance: ProgressState.Failed });
            fetchActionInstance(false);
        };

        setProgressStatus({ deleteActionInstance: ProgressState.InProgress });
        try {
            let deleteInstance = await ActionSdkHelper.deleteActionInstance(getStore().context.actionId);
            if (deleteInstance.success) {
                surveyDeleteAlertOpen(false);
                await ActionSdkHelper.closeCardView();
            }
            else {
                failedCallback();
                handleError(deleteInstance.error, "deleteInstance");
            }
        }
        catch(error) {
            failedCallback();
            handleError(error, "deleteInstance");
        }
    }
});

/**
* updateDueDate(): Change the due date of Survey
*/
orchestrator(updateDueDate, async(actionMessage) => {
    if (getStore().progressStatus.updateActionInstance != ProgressState.InProgress) {
        let callback = (success: boolean) => {
            setProgressStatus({ updateActionInstance: success ? ProgressState.Completed : ProgressState.Failed });
            fetchActionInstance(false);
        };

        setProgressStatus({ updateActionInstance: ProgressState.InProgress });
        var actionInstanceUpdateInfo: actionSDK.ActionUpdateInfo = {
            id: getStore().context.actionId,
            version: getStore().actionInstance.version,
            expiryTime: actionMessage.dueDate
        };
        try {
            let updateActionInstance = await ActionSdkHelper.updateActionInstanceStatus(actionInstanceUpdateInfo);
            if(updateActionInstance.success) {
                callback(true)
                    surveyExpiryChangeAlertOpen(false);
            } 
            else {
                callback(false);
                handleError(updateActionInstance.error, "updateDueDate");
            }
        }
        catch(error) {
            callback(false);
            handleError(error, "updateDueDate");
        }
    }
});

/**
* fetchActionInstanceSummary(): Fetch the aggregate summary for responses of all the questions
*/
orchestrator(fetchActionInstanceSummary, async() => {
    if (getStore().progressStatus.actionSummary != ProgressState.InProgress) {
        setProgressStatus({ actionSummary: ProgressState.InProgress });
        try {
            let response = await ActionSdkHelper.getActionSummary(getStore().context.actionId);
            if(response.success) {
                updateSummary(response.summary);
                setProgressStatus({ actionSummary: ProgressState.Completed });
            }
            else {
                setProgressStatus({ actionSummary: ProgressState.Failed });
                handleError(response.error, "fetchActionInstanceSummary");
            }
        }
        catch(error) {
            setProgressStatus({ actionSummary: ProgressState.Failed });
            handleError(error, "fetchActionInstanceSummary");
        }
    }
});

/**
* downloadCSV(): It allows user the downlaod all response in a csv file
*/
orchestrator(downloadCSV, async(msg) => {
    if (getStore().progressStatus.downloadData != ProgressState.InProgress) {
        setProgressStatus({ downloadData: ProgressState.InProgress });
        try {
            let downloadResponseCSV = await ActionSdkHelper.downloadResponseAsCSV(
                    getStore().context.actionId,
                    Localizer.getString(
                        "SurveyResult",
                        getStore().actionInstance.dataTables[0].dataColumns[0].displayName
                    ).substring(0, Constants.ACTION_RESULT_FILE_NAME_MAX_LENGTH)
                );
            if(downloadResponseCSV.success) {
                setProgressStatus({ downloadData: ProgressState.Completed });
             }
            else {
                setProgressStatus({ downloadData: ProgressState.Failed });
                handleError(downloadResponseCSV.error, "downloadCSV");
            }
        }
        catch(error) {
            setProgressStatus({ downloadData: ProgressState.Failed });
            handleError(error, "downloadCSV");
        }
    }
});

orchestrator(showResponseView, (msg) => {
    let index: number = msg.index;
    if (index >= 0 && msg.responses && index < msg.responses.length) {
        initializeExternal(getStore().actionInstance, msg.responses[index]);
        updateCurrentResponseIndex(index);
        setCurrentView(SummaryPageViewType.ResponseView);
    }
});