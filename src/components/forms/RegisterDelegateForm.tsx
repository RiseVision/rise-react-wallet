import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { observer } from 'mobx-react';
import { ChangeEvent, FormEvent } from 'react';
import * as React from 'react';

const styles = (theme: Theme) =>
  createStyles({
    accountAvatar: {
      backgroundColor: 'white'
    },
    input: {
      color: theme.palette.grey['600']
    },
    footer: {
      marginTop: theme.spacing.unit,
      '& button': {
        color: theme.palette.grey['600']
      }
    },
    error: {
      /* TODO from the theme */
      color: 'red'
    },
    form: {
      '& > p + p': {
        marginTop: theme.spacing.unit
      }
    },
    // TODO import from settings.ts
    subsectionTitle: {
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit,
      ['&:first-child']: {
        marginTop: 0
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  onSubmit: (username: string) => void;
  username?: string;
}

export interface State {
  username: string;
}

const stylesDecorator = withStyles(styles);

@observer
class RegisterDelegateForm extends React.Component<Props, State> {
  state: State = {
    username: ''
  };

  handleType = () => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    this.setState({
      username: value
    });
  }

  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO validate the username
    // TODO check if the username has changed
    this.props.onSubmit(this.state.username);
  }

  render() {
    const { classes, username } = this.props;

    return (
      <form onSubmit={this.onSubmit} className={classes.form}>
        <Typography>
          Becoming a delegate requires registration. You may choose your own
          delegate name, which can be used to promote your delegate. Only the
          top 101 delegates are eligible to forge. All fees are shared equally
          between the top 101 delegates.
        </Typography>
        {username ? (
          <React.Fragment>
            <Typography>
              You're already registered as a delegate "{username}". The name
              can't be changed.
            </Typography>
            <div className={classes.footer}>
              <Button type="submit" fullWidth={true}>
                CONTINUE
              </Button>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            {' '}
            <TextField
              className={classes.input}
              label="Delegate Name"
              onChange={this.handleType()}
              margin="normal"
              fullWidth={true}
              autoFocus={true}
              value={this.state.username}
            />
            <div className={classes.footer}>
              <Button type="submit" fullWidth={true}>
                SIGN &amp; BROADCAST
              </Button>
            </div>
          </React.Fragment>
        )}
      </form>
    );
  }
}

export default stylesDecorator(RegisterDelegateForm);
