import * as React from 'react';
import { CssBaseline } from 'material-ui';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import { lightGreen } from 'material-ui/colors';

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
