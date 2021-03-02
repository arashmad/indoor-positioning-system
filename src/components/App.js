// -----------------------------
// developed by HanaTech Team
// Hanatech IOT Solutions
// (PERN) PostgreSQL / Express / React / Node
//------------------------------


import '../asset/css/style.css';
import React, { Component } from 'react'
import 'typeface-roboto';

import Map from './Map.compnent'


export default class App extends Component {

  constructor() {
    super();
    this.state = {
      mapHeight: 0
    }
  }

  componentDidMount() {
    const mapHeight = window.innerHeight;
    this.setState({ mapHeight });
  }

  render() {
    const { mapHeight } = this.state;
    return (
      <div>
        <Map mapW='100%' mapH={mapHeight} />
      </div>
    )
  }
}