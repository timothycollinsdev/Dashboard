import React from "react"
import { Handle, Node, Position } from "react-flow-renderer"
import Pod from "./Pod"
import { showModal } from "../../redux/global/global.actions"
import { useDispatch, useSelector } from "react-redux"
import { selectSelectedFlow } from "../../redux/flows/flows.selectors"
import styled from "@emotion/styled"

export const ChartNodeElement = styled.div`
  min-width: 16rem;
  cursor: move;
  text-align: center;
  font-size: 14px;
  background: #fff;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 0.25em;
  transition: 0.2s;
  border: 1px solid rgba(0, 153, 153, 0.3);
`

type NodePortProps = {
  type: "source" | "target"
}

function NodePort({ type }: NodePortProps) {
  const NodePortTop = styled(Handle)`
    margin-top: -0.2rem;
    background-color: white;
    width: 1rem;
    height: 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(0, 153, 153, 0.3); //todo use theming
    display: flex;
    align-items: center;
    justify-content: center;

    &:after {
      display: block;

      content: "";
      background-color: #099;
      color: white;
      border-radius: 0.25rem;
      width: 0.5rem;
      height: 0.5rem;
    }
  `

  const NodePortBottom = styled(NodePortTop)`
    bottom: -0.45rem;
  `
  switch (type) {
    case "source":
      return <NodePortTop type={type} position={Position.Top} />
    case "target":
      return <NodePortBottom type={type} position={Position.Bottom} />
  }
}

function ChartNodeElement2(props: any) {
  return <ChartNodeElement {...props}>{props.children}</ChartNodeElement>
}

type NodeType = "Pod" | "Gateway"
export default function ChartNode(type: NodeType) {
  switch (type) {
    case "Pod":
      return function ChartNode({ id, data }: Node) {
        const type = useSelector(selectSelectedFlow).type
        const dispatch = useDispatch()
        return (
          <ChartNodeElement2
            onDoubleClick={() => {
              type === "user-generated" &&
                dispatch(showModal("podEdit", { nodeId: id }))
            }}
          >
            <NodePort type="target" />

            <Pod label={data.label} />
            <NodePort type="source" />
          </ChartNodeElement2>
        )
      }
    case "Gateway":
      return function ChartNode({ id, data }: Node) {
        const type = useSelector(selectSelectedFlow).type
        const dispatch = useDispatch()
        return (
          <ChartNodeElement2
            onDoubleClick={() => {
              type === "user-generated" &&
                dispatch(showModal("podEdit", { nodeId: id }))
            }}
          >
            <Pod label={data.label} />
            <NodePort type="target" />
          </ChartNodeElement2>
        )
      }
  }
}
