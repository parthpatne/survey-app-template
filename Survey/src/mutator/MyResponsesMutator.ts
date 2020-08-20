import { mutator } from "satcheljs";
import getStore from "../store/myResponses/Store";
import { initializeMyResponses } from "../actions/MyResponsesActions";

mutator(initializeMyResponses, (msg) => {
    const store = getStore();
    store.myResponses = msg.actionInstanceRows;
});
