import React, { Component } from "react";
import { SketchPicker, ChromePicker } from "react-color";
import * as d3 from "d3";
import "../styles/MetaCard.css";
import { paletteSvg, infoSvg } from "../svgs/SVGExports.js";
import colorPalette from "../svgs/color-palette.svg";
export default class MetaCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabMode: "info",
      selectValue: "Segoe UI",
      background: "#ffd",
      textSize: "15"
    };
  }

  componentDidMount() {}

  onSelectChange = event => {
    event.preventDefault();
    this.setState({ selectValue: event.target.value });
  };
  onChange = (color, event) => {
    d3.select("body").style("background", color.hex);
    this.setState({ background: color.hex });
  };
  textSizeDecrement = () => {
    if (this.state.textSize >= 11) {
      this.props.changeGlobalTextSize(Number(this.state.textSize) - 1);
    }
  };

  textSizeIncrement = () => {
    if (this.state.textSize <= 29) {
      this.props.changeGlobalTextSize(Number(this.state.textSize) + 1);
      this.setState({ textSize: Number(this.state.textSize) + 1 });
    }
  };

  onSubmit = e => {
    if (e.target.value <= 30 && e.target.value >= 10) {
      this.setState({ textSize: e.target.value });

      this.props.changeGlobalTextSize(Number(e.target.value));
    } else {
      this.setState({ textSize: Number(this.props.textSize) });
    }
  };

  onTextChange = e => {
    this.setState({ textSize: e.target.value });
  };

  render() {
    return (
      <div className="metaCardContainer">
        <div className="metaCardTabs">
          <div
            className="metaCardTabContainer"
            onClick={() => {
              this.setState({ tabMode: "info" });
            }}
          >
            {infoSvg(this.state.tabMode === "info")}
          </div>
          <div
            className="metaCardTabContainer"
            onClick={() => {
              this.setState({ tabMode: "art" });
            }}
          >
            {paletteSvg(this.state.tabMode === "art")}
          </div>
        </div>

        <div className="metaCardMetaText">Meta</div>

        {this.state.tabMode === "info" ? (
          <div className="metaCardInfoContainer">
            <div className="metaCardFieldContainer">
              <input className="metaCardInput" placeholder="Roadmap Title" />
            </div>
            <div className="metaCardFieldContainer">
              <input
                className="metaCardInput"
                resizable="false"
                placeholder="Roadmap Description"
              />
            </div>
            <div className="metaCardFieldContainer">
              <input
                className="metaCardInput"
                placeholder="Your bio/credentials"
              />
            </div>
            <div className="roadmapPublishButtonContainer">
              <span className="roadmapPublishButton">Publish</span>
            </div>
          </div>
        ) : (
          <div className="metaCardInfoContainer">
            <div className="metaCardFieldContainer">
              <div className="metaCardFieldText">Background Color</div>
              <ChromePicker
                onChange={this.onChange}
                disableAlpha={true}
                color={this.state.background}
              />
            </div>
            <div className="metaCardFieldContainer">
              <div className="metaCardFieldText">Font</div>
              <div className="select">
                <select
                  value={this.state.selectValue}
                  onChange={this.onSelectChange}
                >
                  <option value="Segoe UI">Segoe UI</option>
                  <option value="Roboto" style={{ fontFamily: "Roboto" }}>
                    Roboto
                  </option>
                  <option value="Arial" style={{ fontFamily: "Arial" }}>
                    Arial
                  </option>
                  <option value="Georgia" style={{ fontFamily: "Georgia" }}>
                    Georgia
                  </option>
                  <option value="Verdana" style={{ fontFamily: "Verdana" }}>
                    Verdana
                  </option>
                </select>
              </div>
            </div>
            <div className="metaCardFieldContainer">
              <div className="metaCardFieldText">
                Font Size (Resource Node Text)
              </div>
              <div>
                <div className="textSizeContainer" style={{ marginTop: 0 }}>
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
                    onChange={this.onTextChange}
                    onBlur={this.onTextSizeSubmit}
                    min="0"
                    max="30"
                    maxLength="2"
                  />
                  <span
                    className="input-number-increment"
                    onClick={this.textSizeIncrement}
                  >
                    +
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
