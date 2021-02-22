import _ from "lodash"
import exampleFlows from "../../data/exampleFlows"
import { formatForFlowchart, parseYAML } from "../../helpers"
import {
  ADD_LINK,
  CREATE_NEW_FLOW,
  CREATE_NODE,
  DELETE_FLOW,
  DELETE_LINK,
  DELETE_NODE,
  DUPLICATE_FLOW,
  IMPORT_FLOW,
  initialFlowChart,
  LOAD_FLOW,
  RERENDER,
  SET_FLOW_ARGUMENTS,
  UPDATE_NODE,
  UPDATE_SELECTED_FLOW,
} from "./flows.constants"
import {
  Flow,
  FlowActionTypes,
  Flows,
  FlowState,
  NodeConnection,
  NodeProperties,
} from "./flows.types"
import { nanoid } from "nanoid"
import produce from "immer"
import { Edge, Node, XYPosition } from "react-flow-renderer/dist/types"
import { isEdge, isNode } from "react-flow-renderer"
import { isNodeConnection } from "../../helpers/typeCheckers"

export const createNode = (
  id: string,
  properties: NodeProperties,
  position: XYPosition
): Node => ({
  id,
  type: id === "gateway" ? "input" : "default",
  data: {
    label: id,
    needs: properties.needs ? [...properties.needs] : [],
    send_to: {},
    properties: { ...properties },
    depth: undefined,
  },
  position,
})

export const createLink = (source: string, target: string): Edge => ({
  id: `e-${source}-to-${target}`,
  source,
  target,
})

export const saveFlowsToStorage = (state: FlowState) => {
  let toSave: { [id: string]: Flow } = {}
  const { flows } = state
  Object.entries(flows).forEach(([id, flow]: [string, Flow]) => {
    if (flow.type === "user-generated") toSave[id] = flow
  })
  localStorage.setItem("userFlows", JSON.stringify(toSave))
}

function getUserFlows(): Flows {
  const storedFlows = localStorage.getItem("userFlows")
  const userFlows = storedFlows ? JSON.parse(storedFlows) : null
  return _.isEmpty(userFlows)
    ? {
        _userFlow: {
          name: "Custom Flow 1",
          type: "user-generated",
          flowChart: initialFlowChart,
        },
      }
    : userFlows
}

function getExampleFlows() {
  const flows: Flows = {}

  Object.entries(exampleFlows).forEach(([id, flow]) => {
    const parsed = parseYAML(flow.yaml)
    if (parsed?.data) {
      const formatted = formatForFlowchart(parsed.data)
      flows[id] = {
        ...flow,
        isConnected: false,
        flowChart: formatted,
      }
    }
  })
  return flows
}

const initialState: FlowState = {
  rerender: false,
  selectedFlowId: "_userFlow",
  flows: {
    ...getUserFlows(),
    ...getExampleFlows(),
  },
  flowArguments: {
    version: "0.0",
    flow: [],
    pea: [],
    pod: [],
  },
  tooltipConfig: {
    tooltipsGlobal: {
      showTooltip: true,
      toogleOffWhenClicked: "global",
      text: "Hold Shift and click to select multiple nodes",
    },
  },
}

const flowReducer = produce((draft: FlowState, action: FlowActionTypes) => {
  switch (action.type) {
    case CREATE_NEW_FLOW: {
      draft = _createNewFlow(draft)
      break
    }
    case DUPLICATE_FLOW: {
      draft = _createNewFlow(draft, action.payload)
      break
    }
    case IMPORT_FLOW: {
      draft = _createNewFlow(draft, action.payload)
      break
    }
    case DELETE_FLOW:
      {
        const flowId = action.payload as string
        draft.flows = _.omit(draft.flows, flowId)

        const nonExampleFlows = Object.entries(draft.flows).filter(
          ([id, flow]: [string, Flow]) => flow.type !== "example"
        )

        if (draft.selectedFlowId === flowId && nonExampleFlows.length) {
          const idFirstNonExampleFlow = nonExampleFlows[0][0]
          draft.selectedFlowId = idFirstNonExampleFlow
        } else if (!nonExampleFlows.length) {
          draft.flows._userFlow = {
            name: "Custom Flow 1",
            type: "user-generated",
            isConnected: false,
            flowChart: initialFlowChart,
          }
          draft.selectedFlowId = "_userFlow"
        }
      }
      break
    case UPDATE_SELECTED_FLOW: {
      const flowUpdate = action.payload
      if (draft.selectedFlowId) {
        const selectedFlow = draft.flows[draft.selectedFlowId]
        draft.flows[draft.selectedFlowId] = {
          ...selectedFlow,
          ...flowUpdate,
        }
      }
      break
    }
    case SET_FLOW_ARGUMENTS: {
      draft.flowArguments = action.payload
      break
    }
    case LOAD_FLOW:
      draft.selectedFlowId = action.payload
      break
    case UPDATE_NODE: {
      const { nodeUpdate, nodeId } = action.payload
      const selectedFlow = draft.selectedFlowId
      const oldNodeIndex = draft.flows[
        selectedFlow
      ].flowChart.elements.findIndex((element) => element.id === nodeId)

      if (oldNodeIndex > 0) {
        const oldNode =
          draft.flows[selectedFlow].flowChart.elements[oldNodeIndex]
        const newNode = {
          ...oldNode,
          ...nodeUpdate,
        }
        draft.flows[selectedFlow].flowChart.elements[oldNodeIndex] = newNode
      }
      break
    }
    case DELETE_NODE: {
      const nodeId = action.payload
      const selectedFlow = draft.flows[draft.selectedFlowId]
      const withoutLinksAndNode = selectedFlow.flowChart.elements.filter(
        (element) => {
          if (isNode(element)) return element.id !== nodeId

          if (isEdge(element))
            return element.source !== nodeId || element.target !== nodeId

          return true
        }
      )

      draft.flows[draft.selectedFlowId].flowChart.elements = withoutLinksAndNode
      break
    }
    case CREATE_NODE:
      const { properties, label, position } = action.payload
      const newNode = createNode(label, properties, position)
      draft.flows[draft.selectedFlowId].flowChart.elements.push(newNode)
      break

    case ADD_LINK:
      const { source, target } = action.payload
      const newLink = createLink(source, target)
      draft.flows[draft.selectedFlowId].flowChart.elements.push(newLink)
      break
    case DELETE_LINK:
      if (isNodeConnection(action.payload)) {
        const { source, target } = action.payload as NodeConnection
        draft.flows[draft.selectedFlowId].flowChart.elements = draft.flows[
          draft.selectedFlowId
        ].flowChart.elements.filter(
          (element) =>
            !isEdge(element) &&
            element.source !== source &&
            element.target !== target
        )
      } else {
        const linkId = action.payload
        draft.flows[draft.selectedFlowId].flowChart.elements = draft.flows[
          draft.selectedFlowId
        ].flowChart.elements.filter(
          (element) => !isEdge(element) && linkId !== element.id
        )
      }
      break
    //todo check if this can be deleted with the flow chart lib
    case RERENDER:
      draft.rerender = !draft.rerender
      break
  }

  action.type !== RERENDER && saveFlowsToStorage(draft)
}, initialState)

function _createNewFlow(draft: FlowState, customYAML?: string): FlowState {
  const prefixString = "Custom Flow"

  let userFlows = Object.values(draft.flows).filter((flow: any) =>
    flow.name.startsWith(prefixString)
  )

  const userFlowNumbers = userFlows
    .map(
      (userFlow: Flow) =>
        parseInt(userFlow.name.substring(prefixString.length)) || 0
    )
    .sort((a, b) => a - b)

  const largestNumber = userFlowNumbers[userFlowNumbers.length - 1] || 0

  const id = nanoid()

  let flowChart = initialFlowChart

  if (customYAML) {
    const parsed = parseYAML(customYAML)
    if (parsed?.data) flowChart = formatForFlowchart(parsed.data)
  }

  draft.flows[id] = {
    isConnected: false,
    name: `${prefixString} ${largestNumber + 1}`,
    type: "user-generated",
    flowChart,
  }
  draft.selectedFlowId = id
  return draft
}

export default flowReducer
