import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { inject, observer } from 'mobx-react';
import { ChangeEvent, FormEvent } from 'react';
import * as React from 'react';
import Store from '../../stores/store';
import UserStore from '../../stores/user';

const styles = (theme: Theme) =>
  createStyles({
    input: {
      color: theme.palette.grey['100']
    },
    footer: {
      '& button': {
        color: theme.palette.grey['100']
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  store?: Store;
  userStore?: UserStore;
  onSubmit?: () => void;
}

interface State {
  name: string | null;
}

const stylesDecorator = withStyles(styles);

@inject('store')
@inject('userStore')
@observer
class SettingsNameForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const account = props.userStore!.selectedAccount!;
    this.setState({
      name: account.name
    })
  }

  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    if (field === 'name') {
      this.setState({
        [field]: value
      });
    }
  };

  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.props.userStore!.updateAccountName(this.state.name!);
    if (this.props.onSubmit) {
      this.props.onSubmit();
    }
  };

  render() {
    const { userStore, store, classes } = this.props;

    return (
      <form onSubmit={this.onSubmit}>
        <Typography>
          Assign a new name to account {userStore!.selectedAccount!.id}. This
          name will only be visible to you and nobody else.
        </Typography>
        <div>
          <TextField
            className={classes.input}
            id="account-name"
            label="Account name"
            value={this.state.name || ''}
            onChange={this.handleChange('name')}
            margin="normal"
            autoFocus={true}
          />
        </div>
        <div className={classes.footer}>
          <Button type="submit" fullWidth={true}>
            UPDATE NAME
          </Button>
        </div>
      </form>
    );
  }
}

export default stylesDecorator(SettingsNameForm);
