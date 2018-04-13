import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Icon } from 'material-ui';
import './App.css';

const logo = require('../images/logo.svg');

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">
            <FormattedMessage
              id="app.welcome"
              defaultMessage="Welcome to React"
              description="Welcome message"
            />
          </h1>
        </header>
        <p className="App-intro">
          <FormattedMessage
            id="app.to-get-started"
            defaultMessage="To get started, edit {filename} and save to reload."
            values={{ filename: <code>src/containers/App.tsx</code> }}
            description="Get started"
          />
        </p>
        <Button variant="raised" color="primary">
          <Icon>done</Icon> Material UI button
        </Button>
      </div>
    );
  }
}

export default App;
