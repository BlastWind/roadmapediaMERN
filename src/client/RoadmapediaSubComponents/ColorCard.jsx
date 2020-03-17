import * as d3 from "d3";
import React, { Component } from "react";
import "../styles/ColorCard.css";

export default class ColorCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { textSize: this.props.textSize };
  }
  componentWillReceiveProps(newProps) {
    this.setState({ textSize: newProps.textSize });
  }

  textSizeDecrement = () => {
    if (this.state.textSize >= 11) {
      this.props.changeAttribute(
        "Node",
        "textSize",
        Number(this.state.textSize) - 1
      );
    }
  };

  textSizeIncrement = () => {
    if (this.state.textSize <= 29) {
      this.props.changeAttribute(
        "Node",
        "textSize",
        Number(this.state.textSize) + 1
      );
      this.setState({ textSize: Number(this.state.textSize) + 1 });
    }
  };

  onSubmit = e => {
    if (e.target.value <= 30 && e.target.value >= 10) {
      this.setState({ textSize: e.target.value });

      this.props.changeAttribute("Node", "textSize", Number(e.target.value));
    } else {
      this.setState({ textSize: Number(this.props.textSize) });
    }
  };

  changeColor = (type, color) => {
    this.props.changeAttribute("Node", type, color);
  };

  changeLinkColor = color => {
    this.props.changeAttribute("Link", "linkColor", color);
  };

  onChange = e => {
    this.setState({ textSize: e.target.value });
  };

  render() {
    //need 15
    // 4 for black to white
    // others for
    var colorArray = [
      "black",
      "#737373",
      "#a6a6a6",
      "white",
      "#ff1616",
      "#ff66c4",
      "#cb6ce6",
      "#5e17eb",
      "#03989e",
      "#5ce1e6",
      "#38b6ff",
      "#004aad",
      "#008037",
      "#c9e265",
      "#ffde59",
      "#ff914d"
    ];
    var selectedNode = this.props.selectedNode;
    var selectedLink = this.props.selectedLink;
    var selectedBackgroundColor, selectedStrokeColor, selectedTextColor;
    const backgroundColorArray = colorArray;
    const strokeColorArray = colorArray;
    if (selectedNode) {
      selectedBackgroundColor = this.props.selectedNode.backgroundColor;
      selectedStrokeColor = this.props.selectedNode.strokeColor;
      selectedTextColor = this.props.selectedNode.textColor;
    }

    var cardType = null;
    var textContent = null;
    if (selectedNode && selectedNode.type === "text") {
      textContent = (
        <React.Fragment>
          <div>
            <a className="colorCardA">Text Color</a>
          </div>
          <div className="textColorGrid">
            {strokeColorArray.map(eachColor =>
              eachColor === selectedTextColor ? (
                <div
                  className="textColorBlock selected"
                  style={{ backgroundColor: eachColor }}
                ></div>
              ) : (
                <div
                  className="textColorBlock"
                  style={{ backgroundColor: eachColor }}
                  onClick={() => {
                    this.changeColor("textColor", eachColor);
                  }}
                ></div>
              )
            )}
          </div>
          <div>
            <a className="colorCardA">Text Size</a>
            <div className="textSizeContainer">
              <span
                className="input-number-decrement"
                onClick={this.textSizeDecrement}
              >
                –
              </span>
              <input
                className="input-number"
                type="integer"
                value={this.state.textSize}
                onChange={this.onChange}
                onBlur={this.onSubmit}
                min="0"
                max="30"
                maxlength="2"
              />
              <span
                className="input-number-increment"
                onClick={this.textSizeIncrement}
              >
                +
              </span>
            </div>
          </div>
        </React.Fragment>
      );
    }
    if (this.props.selectedNode) {
      if (selectedNode.type === "text") {
        cardType = "colorCardContainer text";
      } else {
        cardType = "colorCardContainer";
      }
    } else {
      cardType = "colorCardContainer path";
    }
    const nodeCard = (
      <div className={cardType}>
        <div className="colorCardContainerInner">
          <div>
            <a className="colorCardA">Background Color</a>
          </div>
          <div className="backgroundColorGrid">
            {backgroundColorArray.map(eachColor =>
              eachColor === selectedBackgroundColor ? (
                <div
                  className="backgroundColorBlock selected"
                  style={{ backgroundColor: eachColor }}
                ></div>
              ) : (
                <div
                  className="backgroundColorBlock"
                  style={{ backgroundColor: eachColor }}
                  onClick={() => {
                    this.changeColor("backgroundColor", eachColor);
                  }}
                ></div>
              )
            )}
          </div>
          <div>
            <a className="colorCardA">Stroke Color</a>
          </div>
          <div className="strokeColorGrid">
            {strokeColorArray.map(eachColor =>
              eachColor === selectedStrokeColor ? (
                <div
                  className="strokeColorBlock selected"
                  style={{ backgroundColor: eachColor }}
                ></div>
              ) : (
                <div
                  className="strokeColorBlock"
                  style={{ backgroundColor: eachColor }}
                  onClick={() => {
                    this.changeColor("strokeColor", eachColor);
                  }}
                ></div>
              )
            )}
          </div>
          {textContent}
        </div>
      </div>
    );
    const pathCard = (
      <React.Fragment>
        <div className={"colorCardContainer path"}>
          <div className="colorCardContainerInner">
            <div>
              <a className="colorCardA">Path Color</a>
            </div>
            <div className="backgroundColorGrid">
              {backgroundColorArray.map(eachColor =>
                eachColor === selectedBackgroundColor ? (
                  <div
                    className="backgroundColorBlock selected"
                    style={{ backgrounColor: eachColor }}
                  ></div>
                ) : (
                  <div
                    className="backgroundColorBlock"
                    style={{ backgroundColor: eachColor }}
                    onClick={() => {
                      this.changeLinkColor(eachColor);
                    }}
                  ></div>
                )
              )}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
    return (
      <React.Fragment>
        {this.props.selectedNode ? nodeCard : pathCard}
      </React.Fragment>
    );
  }
}
