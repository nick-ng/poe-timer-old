import React, { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route as R } from "react-router-dom";

import css from "./styles.css";

import Nav from "./components/nav";
import Home from "./components/home";
import LogCombiner from "./components/poe-timer/log-combiner";
import PoeTimer from "./components/poe-timer";
import StashSummary from "./components/stash-summary";
import Settings from "./components/settings";

import { updateCredentials } from "./utils";

export default function App() {
  useEffect(() => {
    updateCredentials();
  }, []);

  return (
    <Router
      style={{
        backgroundColor: "black",
        color: "white",
      }}
    >
      <div className={css.container}>
        <Nav />
        <div className={css.pageContent}>
          <Switch>
            <R path="/stashsummary">
              <StashSummary />
            </R>
            <R path="/log-combiner">
              <LogCombiner />
            </R>
            <R path="/timer">
              <PoeTimer />
            </R>
            <R path="/settings">
              <Settings />
            </R>
            <R path="/">
              <Home />
            </R>
          </Switch>
        </div>
      </div>
    </Router>
  );
}
