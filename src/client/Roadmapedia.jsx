import React, { Component } from "react";
import Manual from "./Manual.jsx";
import * as d3 from "d3";
import { select, event } from "d3-selection";
import "d3-selection-multi";
import "./GraphEditor.css";
import notFocused from "./svgs/network.svg";
import focused from "./svgs/network_purple.svg";
import manual from "./svgs/manual.svg";
import close from "./svgs/close.svg";
import check from "./svgs/check.svg";
import { eyeSvg, focusSvg, manualSvg } from "./svgs/SVGExports.js";
import preview_purple from "./svgs/preview_purple.svg";
import open_new_tab from "./svgs/open_new_tab.png";
import theming from "./svgs/painting.svg";
import theming_purple from "./svgs/painting_purple.svg";
import loadingGif from "./svgs/giphy2.gif";
import alphabetT from "./svgs/t-alphabet.svg";
import alphabetTPurple from "./svgs/t-alphabet-purple.svg";
import purpleLink from "./svgs/purpleLink.svg";
import colorPalette from "./svgs/color-palette.svg";
import link from "./svgs/link.svg";
import { textArrToHTML } from "./helperFunctions/StringHelperFunctions.js";
import {
  getTranslateString,
  pureDecodeTranslate,
  decodeTranslateString,
  translateFromCenterToDefault,
  translateToDefault,
  translateBackLastMoved,
  transformCloseCurrentNode,
  transformOpenCurrentNode,
  updateBasePeriod,
  makeTransitionNodeData
} from "./helperFunctions/TransitionNodesHelperFunctions.js";
import {
  getInitialSVG,
  setSVGDefs,
  setSVGEvents,
  getInitialDrag,
  getInitialForce,
  setDefsGradient
} from "./helperFunctions/setUp.js";

import {
  nodeMouseDown,
  nodeMouseUp,
  textNodeClick,
  textNodeDblClick,
  circleNodeClick,
  saveTransitionNodeData
} from "./helperFunctions/mouseFunctions.js";

import {
  windowClick,
  windowMouseUp,
  windowMouseDown,
  windowMouseMove,
  keyup,
  keydown,
  keypress,
  resize
} from "./helperFunctions/windowMouseFunctions.js";
import {
  invertOptionGroupVisibility,
  isOptionGroupFormVisible,
  stretchCloseOptionGroupForm,
  stretchOutOptionGroupForm,
  isTransitionCircleShowing,
  closeForm,
  closeNode
} from "./helperFunctions/transitionFormFunctions.js";
import { updateStroke } from "./helperFunctions/updateFunctions.js";

import {
  setOptionGroupLinkMouseEvents,
  setOptionGroupTextMouseEvents
} from "./helperFunctions/optionGroupClicks.js";
import "./styles/RmapCreatorToolBar.scss";
import "./styles/toggleButton.scss";
import PreviewCard from "./RoadmapediaSubComponents/PreviewCard.jsx";
import ColorCard from "./RoadmapediaSubComponents/ColorCard.jsx";
import MetaCard from "./RoadmapediaSubComponents/MetaCard.jsx";

const initialNodes = [
  {
    type: "text",
    id: 0,
    width: 150,
    height: 60,
    text: [""],
    x: 100,
    y: 300,
    backgroundColor: "white",
    strokeColor: "black",
    groupID: null,
    textColor: "black",
    textSize: 15
  },
  {
    type: "circle",
    id: 1,
    width: 150,
    height: 40,
    text: [""],
    x: 300,
    y: 200,
    storedInfo: {
      url: "",
      info:
        "Join Coursera for free and learn online. Build skills with courses from top universities like Yale, Michigan, Stanford, and leading companies like Google and IBM. Advance your career with degrees, certificates, Specializations, &amp; MOOCs in data science, computer science, business, and dozens of o",
      picture:
        "https://forked-besticon.herokuapp.com//icon?url=http://www.google.com&size=80..120..200",
      title:
        "Coursera | Build Skills with Online Courses from Top InstitutionsListLoupe CopyLoupe CopyLoupe CopyChevron LeftChevron Right"
    },
    backgroundColor: "white",
    strokeColor: "black",
    groupID: null
  },
  {
    type: "circle",
    id: 2,
    width: 150,
    height: 40,
    text: [""],
    x: 300,
    y: 200,
    storedInfo: {
      url: "",
      info: "",
      picture: "",
      title: ""
    },
    backgroundColor: "white",
    strokeColor: "black",
    groupID: null
  }
];

const initialLinks = [
  {
    source: initialNodes[0],
    target: initialNodes[1],
    linkDistance: 250,
    linkColor: "black"
  }
];

class GraphEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showManual: false,
      focus: true,
      errMsg: "",
      preview: false,
      theming: false,
      shouldViewText: false
    };

    this.nodes = initialNodes;
    this.links = initialLinks;

    // mouse logic variables
    this.selectedNode = null;
    this.selectedLink = null;
    this.mousedownLink = null;
    this.mousedownNode = null;
    this.mouseupNode = null;

    // DOM selection global variables
    this.svg = null;
    this.container = null;
    this.dragLine = null;
    this.path = null;
    this.rectGroups = null;
    this.circleGroups = null;
    this.texts = null;
    this.textBox = null;
    this.resourceForm = null;
    this.optionGroup = null;
    this.optionGroupG = null;
    this.optionGroupConnector = null;
    this.force = null;
    this.drag = null;

    // DOM Transition Nodes
    this.transitionGs = null;
    this.transitionGsEnter = null;

    // conditional handling variabels
    this.startText = null;
    this.previousTransform = null;
    this.isDragging = false;
    this.isTyping = false;
    this.shouldTransitionGsAnimate = true;
    this.animationAlreadyCompleted = false;
    this.shouldTransitionGsEnterAnimation = true;

    //history
    this.history = [
      {
        nodes: JSON.stringify([...initialNodes]),
        links: JSON.stringify([...initialLinks])
      }
    ];
    this.historyStep = 0;
  }

  storeToHistory(command) {
    this.history = this.history.slice(0, this.historyStep + 1);
    this.history = this.history.concat([command]);
    this.historyStep += 1;
    console.log("new history", this.history);
  }

  undo() {
    if (this.historyStep !== 0) {
      var inverseCommand = this.history[this.historyStep].inverse;
      if (this.isFormShowing && !this.isTyping) {
        //this.setError("Please save form before undo", 2000);
        return;
      }
      switch (inverseCommand.type) {
        case "delNode":
          if (
            this.selectedNode &&
            this.selectedNode.id === inverseCommand.node.id
          ) {
            if (this.selectedNode.type === "circle") {
              this.lastClickedCircle = null;
              this.optionG
                .selectAll("circle.permanent")
                .transition()
                .duration(500)
                .delay(this.isFormShowing ? 500 : 0)
                .attr("r", 0);
              this.optionG
                .selectAll("image.permanent")
                .transition()
                .duration(500)
                .delay(this.isFormShowing ? 500 : 0)
                .attr("width", 0)
                .attr("height", 0)
                .attr("x", 0)
                .attr("y", 0);
            }

            this.selectedNode = null;
          }
          this.nodes = this.nodes.filter(n => n.id !== inverseCommand.node.id);
          break;

        case "delLink":
          this.links = this.links.filter(
            l => l.index !== inverseCommand.link.index
          );
          if (
            this.selectedLink &&
            this.selectedLink.index === inverseCommand.link.index
          ) {
            this.selectedLink = null;
            this.restart();
            this.forceUpdate();
          }

          break;

        case "addLink":
          this.links.push({
            source: inverseCommand.link.source,
            target: inverseCommand.link.target,
            linkDistance: inverseCommand.link.linkDistance,
            index: inverseCommand.link.index
          });

          break;

        case "delNodeLink":
          console.log(inverseCommand.node.id, inverseCommand.links);
          this.nodes = this.nodes.filter(n => n.id !== inverseCommand.node.id);
          this.links = this.links.filter(l => {
            //if l.index is found in any link in inverseCommand.links, return false
            var keepLink = true;
            inverseCommand.links.map(eachCommandLink => {
              if (eachCommandLink.index === l.index) {
                keepLink = false;
              }
            });
            return keepLink;
          });
          console.log("new", this.links);
          break;

        case "addNodeLink":
          this.nodes.push(inverseCommand.node);

          inverseCommand.links.map(eachLink => {
            this.links.push({
              source: eachLink.source,
              target: eachLink.target,
              linkDistance: eachLink.linkDistance,
              index: eachLink.index
            });
          });

          break;

        case "modifyText":
          this.nodes.map(n => {
            if (n.id === inverseCommand.node.id) {
              n.text = inverseCommand.text;
            }
          });
          break;

        case "modifyResourceNode":
          // if we blurred form but it's still out and try to ctrl z
          this.nodes.map(n => {
            if (n.id === inverseCommand.node.id) {
              this.setError("Node information Updated");
              n.storedInfo = inverseCommand.storedInfo;
              this.circleGroups.selectAll(".nodeImage").each(function(d) {
                if (d.id !== inverseCommand.node.id) return;

                if (
                  !inverseCommand.node.storedInfo.picture ||
                  inverseCommand.node.storedInfo.picture === ""
                ) {
                  // if there's nothing appended, href null
                  d3.select(this).attr("href", null);
                } else {
                  d3.select(this).attr(
                    "href",
                    inverseCommand.storedInfo.picture
                  );
                }
              });
            }
          });

          break;

        case "modifyAttribute":
          var { object, attribute, attributeValue } = inverseCommand;
          object[attribute] = attributeValue;
          break;
      }
      this.historyStep -= 1;
    } else {
      this.setError("Nothing to Undo");
      return;
    }
    this.restart();
    this.forceUpdate();
  }

  redo() {
    if (this.historyStep !== this.history.length - 1) {
      this.historyStep += 1;
      var actionCommand = this.history[this.historyStep].action;
      switch (actionCommand.type) {
        case "addNode":
          this.nodes.push(actionCommand.node);
          break;
        case "addLink":
          this.links.push({
            source: actionCommand.link.source,
            target: actionCommand.link.target,
            linkDistance: actionCommand.link.linkDistance,
            index: actionCommand.link.index
          });
          break;
        case "delLink":
          this.links = this.links.filter(
            l => l.index !== actionCommand.link.index
          );
          break;

        case "addNodeLink":
          this.nodes.push(actionCommand.node);

          actionCommand.links.map(eachLink => {
            this.links.push({
              source: eachLink.source,
              target: eachLink.target,
              linkDistance: eachLink.linkDistance,
              index: eachLink.index
            });
          });
          break;
        case "delNodeLink":
          this.nodes = this.nodes.filter(n => n.id !== actionCommand.node.id);
          this.links = this.links.filter(l => {
            var existArray = actionCommand.links.map(eachLink => {
              return eachLink.id === l.id;
            });
            if (existArray.includes(true)) {
              return false;
            } else return true;
          });
          break;

        case "modifyText":
          this.nodes.map(n => {
            if (n.id === actionCommand.node.id) {
              n.text = actionCommand.text;
            }
          });

          break;

        case "modifyResourceNode":
          this.nodes.map(n => {
            if (n.id === actionCommand.node.id) {
              this.setError("Node information Updated");
              n.storedInfo = actionCommand.storedInfo;
              this.circleGroups.selectAll(".nodeImage").each(function(d) {
                if (d.id !== actionCommand.node.id) return;

                if (
                  !actionCommand.node.storedInfo.picture ||
                  actionCommand.node.storedInfo.picture === ""
                ) {
                  // if there's nothing appended, href null
                  d3.select(this).attr("href", null);
                } else {
                  d3.select(this).attr(
                    "href",
                    actionCommand.storedInfo.picture
                  );
                }
              });
            }
          });
          break;
        case "modifyAttribute":
          var { object, attribute, attributeValue } = actionCommand;
          object[attribute] = attributeValue;
          break;
      }

      this.restart();
      this.forceUpdate();
    } else {
      this.setError("Nothing to Redo");
    }
  }

  setError(error, waitTime) {
    var app = this;
    this.setState(
      {
        errMsg: error
      },
      function() {
        if (app.isErroring) {
          d3.select(".errMsginner").interrupt();
          d3.select(".errMsginner").style("opacity", 1);
        }
        setTimeout(function() {
          d3.select(".errMsginner")
            .style("opacity", 1)
            .transition()
            .duration(1000)
            .style("opacity", 0)
            .on("start", () => {
              app.isErroring = true;
            })
            .on("end", function() {
              app.setState({ errMsg: "" });
              app.isErroring = false;
            });
          //  app.setState({ errMsg: "" });
        }, waitTime);
      }
    );
  }

  componentDidMount() {
    var app = this;

    // set up SVG & Defs
    this.svg = getInitialSVG();
    setSVGDefs(this.svg);
    setSVGEvents(this.svg, app);
    var defs = this.svg.append("defs");
    setDefsGradient(defs);

    // set up container, DOM groups empty selection,
    this.container = this.svg
      .append("svg:g")
      .attr("class", "gContainer")
      .attrs({
        transform: this.previousTransform ? this.previousTransform : null
      });
    // set up dragLine
    this.dragLine = this.container
      .append("svg:path")
      .attr("class", "link dragline hidden")
      .attr("d", "M0,0L0,0")
      .classed("hidden", true);

    this.path = this.container.append("svg:g").selectAll("path");
    this.rectGroups = this.container.append("svg:g").selectAll("g.nodeGroup");
    this.texts = this.container.append("svg:g").selectAll("g");
    this.circleGroups = this.container.append("svg:g").selectAll("g");

    this.textBox = this.container.append("foreignObject");
    this.resourceForm = this.container
      .append("foreignObject")
      .attr("class", "resourceForm");
    this.optionGroup = this.container
      .append("g")
      .attr("opacity", 0)
      .attr("visibility", "hidden");

    this.optionGroupG = this.optionGroup
      .append("g")
      .attr("transform", getTranslateString(0, 0));

    this.optionG = this.container.append("g").attr("class", "optionG");

    this.optionGroupConnector = this.optionGroup
      .append("rect")
      .attrs({ height: 3, width: 0, x: -10, y: 25, stroke: "black" });

    // don't need to select optionGroupRect again, so use var
    this.optionGroupG
      .append("g")
      .append("rect")
      .attrs({
        x: -10,
        y: 0,
        width: 135,
        height: 50,
        stroke: "black",
        fill: "white",
        rx: 6
      })
      .style("stroke-width", 2);

    // Border
    this.optionGroupG
      .append("line")
      .attrs({ x1: 57.5, y1: 9, x2: 57.5, y2: 42, stroke: "black" })
      .attr("stroke-width", 2);

    // The T Symbol
    var optionGroupText = this.optionGroupG
      .append("image")
      .attr("xlink:href", alphabetT)
      .attrs({ width: 50, height: 50, x: 75 });

    //  The Link Symbol
    var optionGroupLink = this.optionGroupG
      .append("image")
      .attr("xlink:href", link)
      .attrs({
        width: 30,
        height: 30,
        y: 10,
        color: "purple",
        stroke: "purple"
      });

    setOptionGroupTextMouseEvents(app, optionGroupText);
    setOptionGroupLinkMouseEvents(app, optionGroupLink);

    // initialize drag, force, zoom
    this.drag = getInitialDrag(app);
    this.force = getInitialForce(app);
    var zoom = d3.zoom().on("zoom", function() {
      app.container.attr("transform", d3.event.transform);
    });

    this.svg.call(zoom).on("dblclick.zoom", null);
    //    .attr("transform", "scale(1.15)");

    d3.select(window)
      .on("keydown", function() {
        keydown(app);
      })
      .on("keyup", function() {
        keyup(app);
      })
      .on("keypress", function() {
        keypress(app);
      })
      .on("resize", function() {
        resize(app);
      });

    // start rendering
    this.restart();
  }

  tick() {
    var app = this;
    if (
      this.selectedNode &&
      this.optionGroupConnector.attr("visibility") === "visible"
    )
      this.optionGroup.attr("transform", function(d) {
        if (app.selectedNode.type === "circle")
          return getTranslateString(
            app.selectedNode.x + 115,
            app.selectedNode.y - 5
          );

        return `translate(${app.selectedNode.x +
          app.selectedNode.width +
          10},${app.selectedNode.y + app.selectedNode.height / 2 - 25})`;
      });

    this.path.attr("d", d => {
      if (!this.state.focus) {
        this.links.map(eachLink => {
          if (eachLink.index === d.index) {
            eachLink.linkDistance = Math.sqrt(
              Math.pow(d.source.x - d.target.x, 2) +
                Math.pow(d.source.y - d.target.y, 2)
            );
          }
        });
      }

      //WARNING: TURNS OUT, AFTER WE PUT IN FORCE.NODES AND ALL THAT, D.X & D.Y STOP CHANGING
      return `M${d.source.x + d.source.width / 2},${d.source.y +
        d.source.height / 2}L${d.target.x + d.target.width / 2},${d.target.y +
        d.target.height / 2}`;
    });

    this.rectGroups.attr("transform", d => {
      if (this.textInputCircle)
        if (d.id === this.textInputCircle.id) {
          this.textInputCircle.x = d.x;
          this.textInputCircle.y = d.y;
        }
      return `translate(${d.x},${d.y})`;
    });

    this.circleGroups.attr("transform", d => getTranslateString(d.x, d.y));

    if (this.textBox.attr("x")) {
      this.textBox
        .attr("x", this.textInputCircle.x + 25)
        .attr("y", this.textInputCircle.y);

      /* "y" used to add
+
  (this.selectedNode.height -
    this.selectedNode.text.length * this.selectedNode.textSize) /
    2 -
  this.selectedNode.textSize
*/
    }

    if (this.selectedNode && this.selectedNode.type === "circle") {
      this.optionG.attr(
        "transform",
        getTranslateString(this.selectedNode.x + 75, this.selectedNode.y + 20)
      );
    }
  }

  restart() {
    var app = this;
    const exitDuration = 400;
    var globalRadius = 35;
    d3.select("#firstNodeText").remove();
    if (this.nodes.length === 0) {
      this.container
        .append("svg:text")
        .lower()
        .attrs({
          x: window.innerWidth / 2 - 80,
          y: window.innerHeight / 2 - 20,
          id: "firstNodeText"
        })
        .text("Hey! To get started, press ctrl + click!");
    }

    //JOIN DATA
    this.path = this.path.data(this.links);

    // update existing this.links
    this.path
      .classed("selected", d => d === this.selectedLink)
      .style("marker-end", "url(#end-arrow)");

    // EXIT
    var pathExit = this.path.exit();
    pathExit
      .attr("opacity", 1)
      .style("marker-end", null)
      .transition()
      .duration(exitDuration / 2)
      .attr("opacity", 0)
      .on("end", function() {
        d3.select(this).remove();
      });

    // UPDATE
    this.path = this.path
      .enter()
      .append("svg:path")
      .merge(this.path);
    this.path
      .attr("class", "link")
      .classed("selected", d => d === this.selectedLink)
      .style("stroke", d => d.linkColor)
      .style("marker-end", "url(#end-arrow)")
      .on("mousedown", d => {
        if (d3.event.ctrlKey) return;
        var duration = 500;
        if (app.selectedNode && app.selectedNode.type === "circle") {
          app.lastClickedCircle = null;
          // if we were selecting circles, close them
          if (app.isFormShowing) {
            saveTransitionNodeData(app, app.lastClickedId);
            closeForm(app);
            closeNode(app);
          }

          app.optionG
            .selectAll("circle.permanent")
            .transition()
            .duration(500)
            .delay(app.isFormShowing ? 500 : 0)
            .attr("r", 0);
          app.optionG
            .selectAll("image.permanent")
            .transition()
            .duration(500)
            .delay(app.isFormShowing ? 500 : 0)
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", 0)
            .attr("y", 0);
        }
        // select link
        this.mousedownLink = d;
        this.selectedLink =
          this.mousedownLink === this.selectedLink ? null : this.mousedownLink;
        this.selectedNode = null;
        this.forceUpdate();
        this.restart();
      });

    this.rectGroups = this.rectGroups.data(
      this.nodes.filter(eachNode => eachNode.type === "text"),
      d => d.id
    );

    var rectGroupsExit = this.rectGroups.exit();

    rectGroupsExit
      .attr("background", "red")
      .attr("opacity", 1)
      .transition()
      .duration(exitDuration)
      .attr("opacity", 0)
      .on("end", function() {
        d3.select(this).remove();
      });

    var rectGroupsEnter = this.rectGroups
      .enter()
      .append("svg:g")
      .attr("class", "nodeGroup");

    // a selection of rect
    var rect = rectGroupsEnter.append("svg:rect");

    this.circleGroups = this.circleGroups.data(
      this.nodes.filter(eachNode => eachNode.type === "circle"),
      d => d.id
    );

    var circleGroupsExit = this.circleGroups.exit();
    circleGroupsExit
      .attr("opacity", 1)
      .transition()
      .duration(exitDuration)
      .attr("opacity", 0)
      .on("end", function() {
        d3.select(this).remove();
      });

    var circleGroupsEnter = this.circleGroups
      .enter()
      .append("g")
      .attr("class", "circleGroup");

    var clipPaths = circleGroupsEnter
      .append("clipPath")
      .attr("id", function(d, i) {
        //look lke: clipPath0
        return "clipPath" + i;
      })
      .append("circle")
      .attrs({ cx: 75, cy: 20, r: globalRadius - 1 });

    var circles = circleGroupsEnter
      .append("svg:circle")
      .attrs({
        r: globalRadius,
        cx: 75,
        cy: 20,
        fill: "white",
        class: "node"
      })
      .style("stroke-width", 3);

    circles
      .merge(d3.selectAll("circle.node"))
      .attr("stroke", function(d, i) {
        if (app.selectedNode && d.id === app.selectedNode.id) {
          return "url(#svgGradient)";
        }
        return d.strokeColor;
      })
      .attr("fill", function(d) {
        if (d.backgroundColor) {
          return d.backgroundColor;
        }
      });

    var images = circleGroupsEnter
      .append("svg:image")
      .attr("class", "nodeImage")
      .attrs({
        width: globalRadius * 2 - 1,
        height: globalRadius * 2 - 1,
        x: 40,
        y: -15
      })
      .attr("clip-path", function(d, i) {
        return "url(#clipPath" + i + ")";
      });

    images.merge(d3.selectAll(".nodeImage")).each(function(d) {
      if (!d.storedInfo.picture || d3.select(this).attr("href") !== null) {
        // if picture already there or don't have a picture
        return;
      }
      var img = new Image();
      var pictureRef = this;
      img.onload = function() {
        d3.select(pictureRef).attr("href", img.src);
      };
      img.onerror = function() {
        app.setError(
          "Image not found, did you use a proper image address?",
          2000
        );
        d3.select(pictureRef).attr("href", null);
      };
      img.src = d.storedInfo.picture;

      d3.select(this).attr("href", loadingGif);
    });
    this.circleGroups = this.circleGroups.merge(circleGroupsEnter);
    this.circleGroups
      .on("mousedown", function(d, i) {
        nodeMouseDown(d, i, this, app);
      })
      .on("mouseup", function(d, i) {
        // nodeMouseUp's this is GraphEditor instead of this.circleGroupsNow
        nodeMouseUp(d, i, this, app);
      })
      .on("click", function(d, i) {
        circleNodeClick(d, i, this, app);
      })
      .call(this.drag);

    var textContainers = rectGroupsEnter
      .append("svg:g")
      .attr("class", "textContainer");

    textContainers = textContainers
      .merge(d3.selectAll("g.textContainer"))

      .on("mouseup", function(d, i) {
        nodeMouseUp(d, i, this, app);
      })
      .attr("opacity", d => d.opacity)
      //.attr("text-anchor", "middle")
      .attr("dy", function(d) {
        var nwords = d.text.length;
        return "-" + (nwords - 1) * 12;
      })

      .on("click", function(d, i) {
        textNodeClick(d, i, this, app);
      })
      .on("dblclick", function(d, i) {
        updateStroke(app);
        textNodeDblClick(d, i, this, app);
        //updateStroke(app);
      })
      .on("mousedown", function(d, i) {
        nodeMouseDown(d, i, this, app);
      })
      .on("click", function(d, i) {
        textNodeClick(d, i, this, app);
      });

    var texts = textContainers.selectAll("text").data(d => d.text);
    texts.exit().remove();
    texts = texts
      .enter()
      .append("text")
      .merge(texts);
    texts.html(function(d, i) {
      if (!d) {
        return;
      }
      var a = d;
      while (a.includes(" ")) {
        a = a.replace(" ", "&nbsp;");
      }
      return a;
    });

    textContainers
      .each(function(d, i) {
        d3.select(this)
          .selectAll("text")
          .style("font-size", d.textSize + "px")
          .style("fill", d.textColor)
          .attr("y", (_, i) => d.textSize * i + (d.textSize - 12) + "px");

        var eachTextHeight = d3
          .select(this)
          .select("text")
          .node()
          .getBBox().height;
        var textGroup = d3.select(this).selectAll("text");
        var widthArray = [],
          heightArray = [];
        textGroup.each(function() {
          heightArray.push(
            d3
              .select(this)
              .node()
              .getBBox().height
          );
          widthArray.push(
            d3
              .select(this)
              .node()
              .getBBox().width
          );
        });
        //console.log(eachTextHeight);
        d.width = Math.max(...widthArray) + 50;
        //console.log(d.text);
        d.height =
          d.text.length === 1 && d.text[0] === ""
            ? d.text.length * (d.textSize + 5) + d.textSize + 15
            : d.text.length * Math.max(...heightArray) + d.textSize + 15;
      })
      .style("transform", function(d) {
        console.log("triggered again?");

        var bboxWidth = d3
          .select(this)
          .node()
          .getBBox().width;

        var bboxHeight = d3
          .select(this)
          .node()
          .getBBox().height;
        var toShiftX = 25;
        var toShiftY = (d.height - bboxHeight) / 2 + 12.5;
        return "translate(" + toShiftX + "px, " + toShiftY + "px)";
      });

    rect
      .merge(d3.selectAll("rect.node"))
      .attrs({
        class: "node",
        rx: 6,
        ry: 6,
        width: d => d.width + "px",
        height: d => d.height + "px",
        fill: "white"
      })
      .style("stroke-width", 2)
      .attr("stroke", function(d) {
        if (app.selectedNode && d.id === app.selectedNode.id) {
          return "url(#svgGradient)";
        }
        return d.strokeColor;
      })
      .attr("fill", d => d.backgroundColor)
      .on("click", function(d, i) {
        textNodeClick(d, i, this, app);
      })
      .on("dblclick", function(d, i) {
        updateStroke(app);
        textNodeDblClick(d, i, this, app);
        //updateStroke(app);
      })
      .on("mousedown", function(d, i) {
        nodeMouseDown(d, i, this, app);
      })
      .on("mouseup", function(d, i) {
        nodeMouseUp(d, i, this, app);
      })
      .on("click", function(d, i) {
        textNodeClick(d, i, this, app);
      });

    this.rectGroups = this.rectGroups.merge(rectGroupsEnter);
    this.rectGroups.call(this.drag);

    this.force.nodes(this.nodes);

    if (this.state.focus)
      this.force.force(
        "link",
        d3
          .forceLink(this.links)
          .id(d => d.id)
          .distance(function(d) {
            return d.linkDistance;
          })
      );

    this.force.alphaTarget(0.3).restart();
  }

  toggleFocus = () => {
    var app = this;
    var prevFocus = this.state.focus;

    if (prevFocus === false) {
      this.force = d3
        .forceSimulation(this.nodes)
        .force(
          "link",
          d3
            .forceLink(this.links)
            .id(d => d.id)
            .distance(function(d) {
              return d.linkDistance;
            })
        )
        .force("charge", d3.forceManyBody().strength(-100))
        .on("tick", () => {
          app.tick();
        });

      this.force.alphaTarget(0.3).restart();
      this.setError("Force Enabled", 1000);
    } else {
      this.setError(
        "Force disabled. Dragging connected nodes changes link distance",
        3000
      );

      this.force.force("link", null).force("charge", null);
    }

    this.previousTransform = d3.select("g.gContainer").attr("transform");
    this.setState({ focus: !this.state.focus }, () => {
      app.restart();
    });
  };

  togglePreview = () => {
    if (this.isFormShowing) {
      this.setError("Please submit form before previewing roadmap", 4000);
      return;
    }

    var app = this;
    var previousPreview = this.state.preview;

    if (previousPreview === false) {
      this.setError("Preview Mode Enabled", 1000);
      if (isOptionGroupFormVisible(app)) {
        stretchCloseOptionGroupForm(app, invertOptionGroupVisibility);
      }
      this.setState({ preview: !this.state.preview });

      if (isTransitionCircleShowing(app)) {
        if (this.isFormShowing) {
          saveTransitionNodeData(app, app.lastClickedId);
          closeForm(app);
          closeNode(app);
        }
        this.optionG
          .selectAll("circle.permanent")
          .transition()
          .duration(500)
          .delay(this.isFormShowing ? 500 : 0)
          .attr("r", 0);
        this.optionG
          .selectAll("image.permanent")
          .transition()
          .duration(500)
          .delay(this.isFormShowing ? 500 : 0)
          .attr("width", 0)
          .attr("height", 0)
          .attr("x", 0)
          .attr("y", 0)
          .on("end", function() {
            app.optionG.selectAll("g").remove();
          });
      }
    } else {
      this.setError("Preview Mode Disabled", 1000);
      if (this.state.shouldViewText) {
        this.setState({ shouldViewText: false }, () => {
          d3.selectAll("g.circleGroup")
            .selectAll("foreignObject")
            .remove();
        });
      }

      this.setState({ preview: !this.state.preview }, () => {
        //.on("end", restart());
        if (app.selectedNode && app.selectedNode.type === "circle") {
          var toDispatch = d3
            .selectAll(".circleGroup")
            .filter(function(d, i, list) {
              return d.id === app.selectedNode.id;
            });

          app.restart();

          toDispatch.dispatch("click");
        }
      });
    }
  };

  changeAttribute = (objectType, objectAttribute, newAttributeValue) => {
    var prevAttributeValue = this["selected" + objectType][objectAttribute];
    this["selected" + objectType][objectAttribute] = newAttributeValue;
    var command = {
      action: {
        type: "modifyAttribute",
        object: this["selected" + objectType],
        attribute: objectAttribute,
        attributeValue: newAttributeValue
      },
      inverse: {
        type: "modifyAttribute",
        object: this["selected" + objectType],
        attribute: objectAttribute,
        attributeValue: prevAttributeValue
      }
    };
    this.storeToHistory(command);
    this.restart();
    this.forceUpdate();
  };

  onLoadIt = (
    app,
    lastClickedId,
    newClickedId,
    newInputValue,
    selectedNode
  ) => {
    app.showModal = false;
    app.forceUpdate();

    if (!newInputValue.includes("http") & newInputValue.includes("www")) {
      newInputValue = "http://" + newInputValue;
    }

    function rebindTransitionNodesImage() {
      app.transitionGs = app.optionG
        .selectAll("g")
        .data(app.transitionGDataset);
      d3.selectAll("image.permanent").attrs({ href: d => d.href });
    }
    // if user is just opening and closing, don't do shit
    if (newInputValue === selectedNode.storedInfo.url) return;
    if (
      selectedNode.storedInfo.url.trim().length === 0 &&
      newInputValue.trim().length === 0
    ) {
      return;
    }
    // else, prompt if user wants to load associating information
    var prevInfo = JSON.parse(JSON.stringify(selectedNode.storedInfo));

    // if load all, fetch all and set all, then, storeToHistory new URL, and everything together
    const loadInfo = newClickedId !== 1;
    const loadPicture = newClickedId !== 2;
    const loadTitle = newClickedId !== 3;
    const fetchImageURL =
      "https://forked-besticon.herokuapp.com//icon?url=" +
      newInputValue +
      "&size=80..120..200";
    if (app.selectedNode && selectedNode.id === app.selectedNode.id) {
      if (loadInfo) {
        app.transitionGDataset[1].href = loadingGif;
        app.transitionGDataset[1].isLoading = true;
      }
      if (loadPicture) {
        app.transitionGDataset[2].href = loadingGif;
        app.transitionGDataset[2].isLoading = true;
      }
      if (loadTitle) {
        app.transitionGDataset[3].href = loadingGif;
        app.transitionGDataset[3].isLoading = true;
      }
      rebindTransitionNodesImage();
    }

    // update node URL
    selectedNode.storedInfo.url = newInputValue;

    // load title & info, on end, store new title, info, picture to history
    fetch("/api/getTitleAtURL", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: newInputValue })
    })
      .then(res => res.json())
      .then(json => {
        if (json.message === "THIS IS AN ERROR") {
          app.setError("Website unfetchable, perhaps URL invalid", 2000);
        } else {
          var errorBuilder = "Node ";
          if (loadInfo) errorBuilder += "Info ";
          if (loadTitle) errorBuilder += "Title ";
          if (loadPicture) errorBuilder += "Picture ";
          errorBuilder += "Updated";
          app.setError(errorBuilder, 2000);
          if (loadInfo) {
            selectedNode.storedInfo.info = json.metaDescription
              ? json.metaDescription.substring(0, 300)
              : json.metaDescription;
          }
          if (loadTitle) {
            selectedNode.storedInfo.title = json.title
              ? json.title.substring(0, 150)
              : json.title;
          }
        }

        app.transitionGDataset[1].href =
          "https://image.flaticon.com/icons/png/512/84/84380.png";
        app.transitionGDataset[1].isLoading = false;
        app.transitionGDataset[3].href =
          "https://www.svgimages.com/svg-image/s6/t-alphabet-256x256.png";
        app.transitionGDataset[3].isLoading = false;
        rebindTransitionNodesImage();

        var newStoredInfo = {
          url: newInputValue,
          picture: loadPicture
            ? fetchImageURL
            : selectedNode.storedInfo.picture,
          info:
            loadInfo && !json.message
              ? json.metaDescription
              : selectedNode.storedInfo.info,
          title:
            loadTitle && json.message
              ? json.title
              : selectedNode.storedInfo.title
        };
        var command = {
          action: {
            type: "modifyResourceNode",
            node: selectedNode,
            storedInfo: newStoredInfo
          },
          inverse: {
            type: "modifyResourceNode",
            node: selectedNode,
            storedInfo: prevInfo
          }
        };
        app.storeToHistory(command);
      });

    if (loadPicture) {
      var pictureRef = d3
        .selectAll(".nodeImage")
        .filter(d => d.id === selectedNode.id);

      var img = new Image();
      img.onload = function() {
        pictureRef.attr("href", img.src);
        app.transitionGDataset[2].href =
          "https://cdn1.iconfinder.com/data/icons/social-17/48/photos2-512.png";
        app.transitionGDataset[2].isLoading = false;
        selectedNode.storedInfo.picture = img.src;
        rebindTransitionNodesImage();
      };

      img.onerror = function() {};
      pictureRef.attr("href", loadingGif);
      img.src = fetchImageURL;
    }
  };
  onNoLoad = (
    app,
    lastClickedId,
    newClickedId,
    newInputValue,
    selectedNode
  ) => {
    app.showModal = false;
    app.forceUpdate();
    var app = this;
    this.selectedNode.storedInfo.url = newInputValue;
    var command = {
      action: {
        type: "modifyResourceNode",
        node: selectedNode,
        storedInfo: selectedNode.storedInfo
      },
      inverse: {
        type: "modifyResourceNode",
        node: selectedNode,
        storedInfo: prevInfo
      }
    };
    this.storeToHistory(command);
  };

  toggleViewTextButton = () => {
    var globalRadius = 35;
    if (this.state.shouldViewText) {
      d3.selectAll("g.circleGroup")
        .selectAll("foreignObject")
        .remove();
    } else {
      d3.selectAll("g.circleGroup").each(function(d, i) {
        var textCardContainer = d3
          .select(this)
          .append("foreignObject")
          .style("max-width", "200px")
          .attrs({ x: "-25px", y: "20px", width: "200px", height: "1000px" });

        // max width - min width = padding + border + etc
        var textCard = textCardContainer
          .append("xhtml:div")
          .attrs({ class: "speechBubbleDiv" })
          .style("min-width", "178px")
          .style("max-width", "200px");

        var textInfo = textCard
          .append("xhtml:p")
          .html(d.storedInfo.info)
          .style("font-size", "13px");

        var triangle = textCardContainer
          .append("xhtml:div")
          .attrs({ class: "triangleDiv" });
        var ay = d3.select(".gContainer").attr("transform");

        var scaleToMultiplyBy;
        if (!ay) {
          scaleToMultiplyBy = 1;
        } else if (ay.indexOf("scale(") === -1) {
          scaleToMultiplyBy = 1;
        } else {
          scaleToMultiplyBy = ay.substring(
            ay.indexOf("scale(") + 6,
            ay.lastIndexOf(")")
          );
        }

        var bound = textCard.node().getBoundingClientRect();

        textCardContainer.attrs({
          height: (bound.height * 1) / scaleToMultiplyBy + 10 + "px"
        });
      });
    }

    this.setState({ shouldViewText: !this.state.shouldViewText });
    // for each cirlcegroup
  };

  colorPaletteClick = event => {
    var colorPaletteRef = event.target;
    var colorPaletteTransformValue = d3
      .select(colorPaletteRef)
      .style("transform");
    var className = d3.select(".colorCardContainer").node().className;
    const pathCardHeight = 180,
      resourceCardHeight = 330,
      textCardHeight = 570;

    if (
      colorPaletteTransformValue !== "none" &&
      !colorPaletteTransformValue.includes("rotate(0deg)") &&
      !colorPaletteTransformValue.includes("rotate(45deg)")
    ) {
      return;
    }
    if (
      colorPaletteTransformValue === "none" ||
      colorPaletteTransformValue.includes("rotate(0deg)")
    ) {
      // hide
      d3.select(colorPaletteRef)
        .style("transform", "rotate(0deg)")
        .transition()
        .duration(750)
        .style("transform", "rotate(45deg)");

      d3.select(".colorCardContainer")
        .style("overflow", "hidden")
        .style("opacity", 1)
        .transition()
        .duration(750)
        .style("width", "0px")
        .style("height", "0px")
        .style("margin-top", () => {
          if (className.includes("text")) {
            return textCardHeight / 2 + "px";
          }
          if (className.includes("path")) {
            return pathCardHeight / 2 + "px";
          }
          return resourceCardHeight / 2 + "px";
        })
        .style("opacity", 0)
        .on("end", () => {
          d3.select(colorPaletteRef).style(
            "box-shadow",
            "0px 0px 11px 2px #87d5d6"
          );
        });
    } else if (colorPaletteTransformValue.includes("rotate(45deg)")) {
      d3.select(colorPaletteRef)
        .style("transform", "rotate(45deg)")
        .transition()
        .duration(750)
        .style("transform", "rotate(0deg)");

      d3.select(".colorCardContainer")
        .transition()
        .duration(750)
        .style("margin-top", "0px")
        .style("width", "250px")
        .style("height", () => {
          if (className.includes("text")) {
            return textCardHeight + "px";
          }
          if (className.includes("path")) {
            return pathCardHeight + "px";
          }
          return resourceCardHeight + "px";
        })
        .style("opacity", 1)
        .on("end", function() {
          d3.select(this)
            .style("width", null)
            .style("height", null)
            .style("opacity", null);
          d3.select(colorPaletteRef).style("box-shadow", null);
        });
    }
  };

  render() {
    let errDisplay = (
      <div className="errMsginner">
        <span style={{ color: "white" }} id="errMsg">
          {this.state.errMsg}
        </span>
      </div>
    );

    if (this.state.errMsg === "") {
      errDisplay = null;
    }
    return (
      <React.Fragment>
        <div id="editorsContainer" className="">
          {this.state.showManual ? (
            <Manual toggleManual={this.toggleManual} />
          ) : null}
          <div className="GraphEditorContainer" />
          <div className="errMsg">{errDisplay}</div>
          {!this.state.preview && !this.selectedNode && !this.selectedLink ? (
            <MetaCard />
          ) : null}

          {!this.state.preview && (this.selectedNode || this.selectedLink) ? (
            <div className="colorCardContainerOuter">
              <ColorCard
                selectedNode={this.selectedNode}
                selectedLink={this.selectedLink}
                textSize={
                  this.selectedNode && this.selectedNode.type === "text"
                    ? this.selectedNode.textSize
                    : null
                }
                changeAttribute={this.changeAttribute}
              />
              <img
                className="colorCardToggle"
                src={colorPalette}
                onClick={this.colorPaletteClick}
              />
            </div>
          ) : null}
          {this.state.preview ? (
            <div
              className="toggleAllTextsButtonWrapper"
              onClick={this.toggleViewTextButton}
            >
              <a className="fancy-button pop-onhover bg-gradient1">
                {this.state.shouldViewText ? (
                  <span>Hide All Resource Node Texts</span>
                ) : (
                  <span>View All Resource Node Texts</span>
                )}
              </a>
            </div>
          ) : null}

          {this.state.preview &&
          this.selectedNode &&
          this.selectedNode.type === "circle" ? (
            <React.Fragment>
              <PreviewCard node={this.selectedNode.storedInfo} />
            </React.Fragment>
          ) : null}

          {this.showModal ? (
            <div className="modalContainer-outer">
              <div className="modalContainer">
                <div className="modalContainer-inner">
                  URL changed, fetch related information?
                </div>
                <div>
                  <div className="modalContainerBtnContainer">
                    <button className="btn ok">Sure</button>
                    <button className="btn no">Nope</button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="toolbar">
            <div className="iconContainer" onClick={this.toggleManual}>
              {manualSvg(this.state.manual)}
              <span
                className={
                  !this.state.manual ? "iconName" : "iconName selected"
                }
              >
                Manual
              </span>
            </div>
            <div className="iconContainer" onClick={this.toggleFocus}>
              {focusSvg(this.state.focus)}
              <span
                className={!this.state.focus ? "iconName" : "iconName selected"}
                style={{ top: "5px", position: "relative" }}
              >
                {this.state.focus ? "Force Enabled" : "Force Disabled"}
              </span>
            </div>
            <div className="iconContainer" onClick={this.togglePreview}>
              {eyeSvg(this.state.preview)}
              <span
                className={
                  !this.state.preview ? "iconName" : "iconName selected"
                }
              >
                {this.state.preview ? "Preview Enabled" : "Preview Disabled"}
              </span>
            </div>
            {/*<img
              className="icon"
              id="themeIcon"
              src={this.state.theming ? theming_purple : theming}
            /> */}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default GraphEditor;
