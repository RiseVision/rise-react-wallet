import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Backdrop from '@material-ui/core/Backdrop';
import { inject, observer } from 'mobx-react';
import { ChangeEvent } from 'react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { onboardingAddAccountRoute } from '../../routes';
import Store from '../../stores/store';
import UserStore from '../../stores/user';

const styles = (theme: Theme) => createStyles({
  content: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    '& p': {
      marginBottom: 0
    }
  },
  input: {
    color: 'gray',
    width: '100%'
  },
  footer: {
    '& button': {
      color: 'gray'
    }
  },
  remove: {
    color: 'red'
  }
});

interface Props extends WithStyles<typeof styles> {
  store?: Store;
  userStore?: UserStore;
  field: string;
  onClose: Function;
}

interface State {
  name: string | null;
  fiat: string;
  mnemonic2: string;
  remove: string;
}

const stylesDecorator = withStyles(styles);

@inject('store')
@inject('userStore')
@observer
class SettingsDialog extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const account = props.userStore!.selectedAccount!;
    this.state = {
      name: account.name,
      fiat: account.fiatCurrency,
      mnemonic2: '',
      remove: ''
    };
  }

  handleBackClick = () => {
    this.props.onClose();
  }

  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    if (field === 'name') {
      this.setState({
        name: value
      });
    } else if (field === 'fiat') {
      this.setState({
        fiat: value
      });
    } else if (field === 'mnemonic2') {
      this.setState({
        mnemonic2: value
      });
    } else if (field === 'remove') {
      this.setState({
        remove: value
      });
    }
  }

  updateName = () => {
    this.props.userStore!.updateAccountName(this.state.name!);
    this.props.onClose();
  }

  updateFiat = (global: boolean) => () => {
    this.props.userStore!.updateFiat(this.state.fiat, global);
    this.props.onClose();
  }

  updateMnemonic2 = () => {
    alert('TODO');
    this.props.onClose();
  }

  removeAccount = () => {
    this.props.userStore!.removeAccount(
      this.props.userStore!.selectedAccount!.id
    );
    this.props.onClose();
    if (!this.props.userStore!.selectedAccount) {
      this.props.store!.router.goTo(onboardingAddAccountRoute);
    }
  }

  escListener = (event: KeyboardEvent) => {
    if (event.keyCode === 27) {
      this.props.onClose();
    }
  }

  componentDidMount() {
    document.addEventListener('keyup', this.escListener);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.escListener);
  }

  render() {
    const { userStore, store, classes } = this.props;

    return (
      <ModalPaper open={true} backdrop={Backdrop}>
        {this.props.field === 'name' && (
          <React.Fragment>
            <ModalPaperHeader
              closeButton={true}
              onCloseClick={this.handleBackClick}
            >
              <FormattedMessage
                id="account-settings.title"
                description="New account screen title"
                defaultMessage="Update account name"
              />
            </ModalPaperHeader>
            <div className={classes.content}>
              <Typography>
                Assign a new name to account {userStore!.selectedAccount!.id}.
                This name will only be visible to you and nobody else.
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
                  inputProps={{
                    onKeyPress: (event: KeyboardEvent) => {
                      // enter
                      if (event.charCode === 13) {
                        this.updateName();
                      }
                    }
                  }}
                />
              </div>
              <div className={classes.footer}>
                <Button onClick={this.updateName} fullWidth={true}>UPDATE NAME</Button>
              </div>
            </div>
          </React.Fragment>
        )}
        {this.props.field === 'delegate' && (
          <React.Fragment>
            <ModalPaperHeader
              closeButton={true}
              onCloseClick={this.handleBackClick}
            >
              <FormattedMessage
                id="account-settings.vote"
                description="New account screen title"
                defaultMessage="Voted delegate"
              />
            </ModalPaperHeader>
            <div className={classes.content}>
              <Typography>TODO CONTENT</Typography>
              <div className={classes.footer}>
                <Button onClick={this.updateName} fullWidth={true}>BUTTON</Button>
              </div>
            </div>
          </React.Fragment>
        )}
        {this.props.field === 'fiat' && (
          <React.Fragment>
            <ModalPaperHeader
              closeButton={true}
              onCloseClick={this.handleBackClick}
            >
              <FormattedMessage
                id="account-settings.fiat"
                description="New account screen title"
                defaultMessage="Displayed FIAT currency"
              />
            </ModalPaperHeader>
            <div className={classes.content}>
              <Typography>
                Select which FIAT currency you prefer to see your RISE account
                value in.
              </Typography>
              <Typography>
                {/* TODO autoFocus={true} */}
                <select
                  name="fiat"
                  onChange={this.handleChange('fiat')}
                  className={classes.input}
                >
                  {store!.config.fiat_currencies.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Typography>
              <div className={classes.footer}>
                <Button onClick={this.updateFiat(false)}>
                  SET FOR THIS ACCOUNT
                </Button>
                <Button onClick={this.updateFiat(true)}>
                  SET FOR ALL ACCOUNTS
                </Button>
              </div>
            </div>
          </React.Fragment>
        )}
        {this.props.field === 'deletageRegistration' && (
          <React.Fragment>
            <ModalPaperHeader
              closeButton={true}
              onCloseClick={this.handleBackClick}
            >
              <FormattedMessage
                id="account-settings.title"
                description="Register..."
                defaultMessage="Delegate registration"
              />
            </ModalPaperHeader>
            <div className={classes.content}>
              <Typography>TODO CONTENT</Typography>
              <div className={classes.footer}>
                <Button onClick={this.updateFiat(false)} fullWidth={true}>BUTTON</Button>
              </div>
            </div>
          </React.Fragment>
        )}
        {this.props.field === 'mnemonic2' && (
          <React.Fragment>
            <ModalPaperHeader
              closeButton={true}
              onCloseClick={this.handleBackClick}
            >
              <FormattedMessage
                id="account-settings.mnemonic2"
                defaultMessage="Setup 2nd passphrase"
              />
            </ModalPaperHeader>
            <div className={classes.content}>
              <Typography>
                The second passphrase offers an extra layer of protection for
                forgers whose primary mnemonic is stored on servers which can
                potentially get hacked and compromised the primary mnemonic.
              </Typography>
              <Typography>
                Once the 2nd passphrase has been set it cannot be changed nor
                removed.
              </Typography>
              {userStore!.selectedAccount!.balance < 5 && (
                <Typography className={classes.remove}>
                  You don't have enough funds on your account to pay the network
                  fee of 5 RISE to setup a 2nd passphrase!
                </Typography>
              )}
              <TextField
                className={classes.input}
                label="2nd passphrase"
                onChange={this.handleChange('mnemonic2')}
                margin="normal"
                autoFocus={true}
                inputProps={{
                  onKeyPress: (event: KeyboardEvent) => {
                    // enter
                    if (event.charCode === 13) {
                      this.updateMnemonic2();
                    }
                  }
                }}
              />
              <div className={classes.footer}>
                <Button onClick={this.updateMnemonic2} fullWidth={true}>CONTINUE</Button>
              </div>
            </div>
          </React.Fragment>
        )}
        {this.props.field === 'removeAccount' && (
          <React.Fragment>
            <ModalPaperHeader
              closeButton={true}
              onCloseClick={this.handleBackClick}
            >
              <FormattedMessage
                id="account-settings.remove-account"
                defaultMessage="Remove account"
              />
            </ModalPaperHeader>
            <div className={classes.content}>
              <Typography>
                Are you sure you want to remove{' '}
                {userStore!.selectedAccount!.name} account ({
                  userStore!.selectedAccount!.id
                }) from the wallet? To confirm, enterthe account address in the
                field below.
              </Typography>
              <div>
                <TextField
                  className={classes.input}
                  label="Account address"
                  value={this.state.remove || ''}
                  onChange={this.handleChange('remove')}
                  margin="normal"
                />
              </div>
              <div className={classes.footer}>
                <Button onClick={this.removeAccount} fullWidth={true}>REMOVE ACCOUNT</Button>
              </div>
            </div>
          </React.Fragment>
        )}
      </ModalPaper>
    );
  }
}

export default stylesDecorator(SettingsDialog);
