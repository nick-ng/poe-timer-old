import React from "react";
import { BrowserRouter as Router, Switch, Route as R } from "react-router-dom";

import css from "./styles.css";

import Nav from "./components/nav";
import LogCombiner from "./components/poe-timer/log-combiner";
import PoeTimer from "./components/poe-timer";
import ChaosRecipe from "./components/chaos-recipe";

export default function App() {
  return (
    <Router>
      <div className={css.container}>
        <Nav />
        <div className={css.pageContent}>
          <Switch>
            <R path="/chaosrecipe">
              <ChaosRecipe />
            </R>
            <R path="/log-combiner">
              <LogCombiner />
            </R>
            <R path="/timer">
              <PoeTimer />
            </R>
            <R path="/">
              <div>Hello</div>
            </R>
          </Switch>
        </div>
      </div>
    </Router>
  );
}
