import { HANDLE_NEW_LOG, SHOW_LOG_INDEX } from "./logStream.constants";
import { handleNewLogAction, showLogAtIndexAction } from "./logStream.types";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";

import jinad from "../../flux/jinad";
import store from "..";
import { showBanner } from "../global/global.actions";
import { RawLog } from "../../flux/tranformLog";
import logger from "../../logger";

export function showLogAtIndex(logIndex: number): showLogAtIndexAction {
  return {
    type: SHOW_LOG_INDEX,
    payload: logIndex,
  };
}

export function handleNewLog(log: RawLog): handleNewLogAction {
  return {
    type: HANDLE_NEW_LOG,
    payload: log,
  };
}

export function initLogStream(
  workspace_id: string,
  flow_id: string
): ThunkAction<void, any, unknown, Action<string>> {
  return async function (dispatch) {
    function handleConnection({
      connected,
      message,
    }: {
      connected: boolean;
      message: string;
    }) {
      if (!connected) return dispatch(showBanner(message, "error") as any);
    }

    let logsResult = await jinad.getLogs(workspace_id, flow_id);
    logsResult = await jinad.getLogs(workspace_id, flow_id);

    if (logsResult.status === "error") {
      if (logsResult.message)
        dispatch(showBanner(logsResult.message, "error") as any);
      return;
    }

    function handleLog(log: RawLog) {
      dispatch(handleNewLog(log));
    }

    const { logs } = logsResult;

    logger.log("got logs:", logs);

    logs.forEach(handleLog);

    const settings = store.getState().settingsState.settings;
    jinad.listenForLogs(
      workspace_id,
      flow_id,
      settings,
      handleConnection,
      handleLog
    );
  };
}
