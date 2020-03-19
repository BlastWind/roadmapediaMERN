import React, { Component } from "react";
import { SketchPicker, ChromePicker } from "react-color";
import * as d3 from "d3";
import "../styles/MetaCard.css";
import { paletteSvg, infoSvg } from "../svgs/SVGExports.js";
import wheel from "../svgs/wheel.svg";
import colorPalette from "../svgs/color-palette.svg";
export default class MetaCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabMode: "info",
      selectValue: "Segoe UI",
      background: this.props.backgroundColor,
      textSize: "15"
    };
  }

  componentDidMount() {}

  onSelectChange = event => {
    event.preventDefault();
    this.setState({ selectValue: event.target.value });
    this.props.setGlobalFont(event.target.value);
  };
  onChange = (color, event) => {
    d3.select("svg").style("background", color.hex);
    this.setState({ background: color.hex });
  };

  onChangeComplete = color => {
    this.props.setGlobalBackground(color);
  };

  wheelToggle = event => {
    this.props.hideCard(event.target, "wheel");
  };

  render() {
    return (
      <div className="metaCardContainerOuter">
        <div
          className="metaCardContainer"
          style={{ opacity: this.props.isCardHidden ? 0 : 1 }}
        >
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
                  onChangeComplete={this.onChangeComplete}
                  disableAlpha={true}
                  color={this.state.background}
                />
              </div>
              <div
                className="metaCardFieldContainer"
                style={{ paddingBottom: "2rem" }}
              >
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
            </div>
          )}
        </div>
        <img
          src={wheel}
          className={
            this.props.isCardHidden
              ? "colorCardToggle hidden"
              : "colorCardToggle"
          }
          onClick={this.wheelToggle}
          style={{
            transform: this.props.isCardHidden
              ? "rotate(90deg)"
              : "rotate(0deg)"
          }}
        />
      </div>
    );
  }
}
