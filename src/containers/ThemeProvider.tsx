import green from '@material-ui/core/colors/green';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import * as React from 'react';
import jdenticon from '../utils/jdenticon';

const theme = createMuiTheme({
  palette: {
    primary: green,
    secondary: {
      light: '#75a7ff',
      main: '#2979ff', // blue.A700
      dark: '#004ecb',
      contrastText: '#fff',
    },
  },
  overrides: {
    MuiAppBar: {
      colorDefault: {
        backgroundColor: '#eee',
      },
    },
  },
});

interface Props {
  children: React.ReactNode;
}

class ThemeProvider extends React.Component<Props> {
  componentWillMount() {
    jdenticon.config = {
      lightness: {
        color: [0.40, 0.80],
        grayscale: [0.30, 0.90]
      },
      saturation: {
          color: 0.50,
          grayscale: 0.00
      },
      replaceMode: 'never',
    };
  }

  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {this.props.children}
      </MuiThemeProvider>
    );
  }
}

export default ThemeProvider;
