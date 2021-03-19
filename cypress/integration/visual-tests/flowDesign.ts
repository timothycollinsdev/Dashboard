import defaultPods from "../../../src/data/defaultPods"

describe("Flow design workflow", () => {
  beforeEach(() => {
    cy.visit("/#/flow")
  })

  const moveSideBarItemToCanvas = (
    sideBarItemId: number,
    x: number,
    y: number
  ) => {
    const dataTransfer = new DataTransfer()
    cy.dataName(`SideBarItem-${sideBarItemId}`).trigger("dragstart", {
      dataTransfer,
      force: true,
    })
    cy.get(".chart-section-container").trigger("drop", x, y, { dataTransfer })
  }

  context("When a new flow is created", () => {
    it("successfully let you pull new pods and connect them", () => {
      let firstPortLabel = "gateway"
      let secondPortLabel = defaultPods[1].name
      defaultPods.forEach((pod, idx) => {
        if (idx !== 0 && idx < defaultPods.length - 1) {
          moveSideBarItemToCanvas(idx, 315, 100 + 50 * idx)
          cy.dataName(`NodePortBottom-${firstPortLabel}`).trigger("mousedown", {
            force: true,
          })
          cy.dataName(`NodePortTop-${secondPortLabel}`).trigger("mouseup", {
            force: true,
          })
          firstPortLabel = secondPortLabel
          secondPortLabel = defaultPods[idx + 1].name
        }
      })

      cy.percySnapshot("flow-design")
    })
  })
})
