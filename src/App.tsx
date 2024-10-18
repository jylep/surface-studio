import React from "react";
import { Header } from "./components/header/Header";
import { Studio } from "./components/studio/Studio";

import './App.css';
import './assets/css/font-awesome.min.css';

export const App = () => {

  return (
    <>
      <Header />
      <Studio />
    </>
  )
}