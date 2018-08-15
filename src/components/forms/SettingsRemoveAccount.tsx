import Button from '@material-ui/core/Button';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';

const styles = (theme: Theme) =>
  createStyles({
    input: {
      color: theme.palette.grey['600']
    },
    footer: {
      marginTop: theme.spacing.unit,
      '& button': {
        color: theme.palette.grey['600']
      }
    },
    remove: {
      color: 'red'
    }
  });

interface Props extends WithStyles<typeof styles> {
  onSubmit: (state: State) => void;
  id: string;
  name: string | null;
}

export interface State {
  id?: string;
}

const stylesDecorator = withStyles(styles);

@observer
class SettingsRemoveAccountForm extends React.Component<Props, State> {
  state = {
    id: ''
  };

  // TODO extract to Form
  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    this.setState({
      [field]: value
    });
  }

  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (this.state.id !== this.props.id) {
      // TODO error mark the ID field
      return false;
    }
    this.props.onSubmit({ ...this.state });
    return true;
  }

  render() {
    const { name, id, classes } = this.props;

    return (
      <form onSubmit={this.onSubmit}>
        <Typography>
          Are you sure you want to remove {name} account ({id}) from the wallet?
          To confirm, enter the account address in the field below.
        </Typography>
        <div>
          <TextField
            className={classes.input}
            label="Account address"
            value={this.state.id || ''}
            onChange={this.handleChange('id')}
            margin="normal"
            autoFocus={true}
            fullWidth={true}
          />
        </div>
        <div className={classes.footer}>
          <Button type="submit" fullWidth={true}>
            CONTINUE
          </Button>
        </div>
      </form>
    );
  }
}

export default stylesDecorator(SettingsRemoveAccountForm);
