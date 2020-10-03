import React from "react";

import Header from "../header";
import NavLink from "./nav-link";

import css from "./styles.css";

const Nav = () => (
  <div className={css.navContainer}>
    <Header />
    <NavLink icon="fa-clock-o" to="/" exact>
      Timer
    </NavLink>
    <NavLink icon="fa-plus" to="/log-combiner">
      Log Combiner
    </NavLink>
    <NavLink icon="fa-plus" to="/chaosrecipe">
      Chaos Recipe Helper
    </NavLink>
  </div>
);

export default Nav;
