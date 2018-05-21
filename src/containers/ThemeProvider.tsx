import * as React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import lightGreen from '@material-ui/core/colors/lightGreen';
import jdenticon from '../utils/jdenticon';

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#ffffff',
      main: '#eeeeee',
      dark: '#bcbcbc',
      contrastText: '#000000',
    },
    secondary: lightGreen,
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
