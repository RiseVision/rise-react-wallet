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
import { onboardingAddAccountRoute } from '../../routes';
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
    },
    remove: {
      color: 'red'
    }
  });

interface Props extends WithStyles<typeof styles> {
  store?: Store;
  userStore?: UserStore;
  onSubmit?: () => void;
}

interface State {
  id?: string;
}

const stylesDecorator = withStyles(styles);

@inject('store')
@inject('userStore')
@observer
class SettingsRemoveAccountForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.setState({ id: '' });
  }

  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    this.setState({
      [field]: value
    });
  };

  onSubmit = () => {
    if (this.state.id !== this.props.userStore!.selectedAccount!.id) {
      // TODO error mark the ID field
      return;
    }
    this.props.userStore!.removeAccount(
      this.props.userStore!.selectedAccount!.id
    );
    this.props.onSubmit();
    if (!this.props.userStore!.selectedAccount) {
      this.props.store!.router.goTo(onboardingAddAccountRoute);
    }
  };

  render() {
    const { userStore, classes } = this.props;

    return (
      <form onSubmit={this.onSubmit}>
        <Typography>
          The second passphrase offers an extra layer of protection for forgers
          whose primary mnemonic is stored on servers which can potentially get
          hacked and compromised the primary mnemonic.
        </Typography>
        <Typography>
          Once the 2nd passphrase has been set it cannot be changed nor removed.
        </Typography>
        {userStore!.selectedAccount!.balance < 5 && (
          <Typography className={classes.remove}>
            You don't have enough funds on your account to pay the network fee
            of 5 RISE to setup a 2nd passphrase!
          </Typography>
        )}
        <TextField
          className={classes.input}
          label="Account address"
          onChange={this.handleChange('id')}
          margin="normal"
          autoFocus={true}
        />
        <div className={classes.footer}>
          <Button fullWidth={true}>
            CONTINUE
          </Button>
        </div>
      </form>
    );
  }
}

export default stylesDecorator(SettingsRemoveAccountForm);
