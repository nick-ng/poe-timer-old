import React from "react";

import Header from "../header";
import NavLink from "./nav-link";

import css from "./styles.css";

const Nav = () => (
  <div className={css.navContainer}>
    <Header />
    <NavLink icon="fa-home" to="/" exact>
      Home
    </NavLink>
    <NavLink icon="fa-clock-o" to="/timer">
      Timer
    </NavLink>
    <NavLink icon="fa-plus" to="/log-combiner">
      Log Combiner
    </NavLink>
    <NavLink icon="fa-plus" to="/stashsummary">
      Stash Summary
    </NavLink>
    <NavLink icon="fa-cog" to="/settings">
      Settings
    </NavLink>
  </div>
);

export default Nav;
