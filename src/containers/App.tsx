import * as React from 'react';
import { Button } from 'react-bootstrap';
import './App.css';

const logo = require('../images/logo.svg');

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/containers/App.tsx</code> and save to reload.
        </p>
        <Button bsStyle="primary">Bootstrap button</Button>
      </div>
    );
  }
}

export default App;
