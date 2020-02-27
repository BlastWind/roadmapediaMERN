import React, { Component } from "react";
import "./App.css";
//import PageContainer from "./PageContainer.js";
import GraphEditor from "./Roadmapedia.jsx";
//import Home from "./Home.jsx";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

export default class App extends Component {
  state = { username: null };

  componentDidMount() {}

  render() {
    return (
      <React.Fragment>
        <Router>
          <Route path="" component={GraphEditor} />
        </Router>
      </React.Fragment>
    );
  }
}
