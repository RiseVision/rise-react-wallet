import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import { Rise } from 'dpos-offline';
import React from 'react';
import { ChangeEvent, FormEvent, ReactEventHandler } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import AccountIcon from '../AccountIcon';
import {
  DialogContentProps,
  SetDialogContent,
  ICloseInterruptFormProps
} from '../Dialog';
import autoId from '../../utils/autoId';
import { RawAmount } from '../../utils/amounts';
import {
  normalizeAddress,
  normalizeUsername,
  formatAmount,
  normalizeMnemonic,
  AccountIDVersion
} from '../../utils/utils';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
    },
    accountContainer: {
      display: 'flex',
      alignItems: 'center'
    }
  });

const stylesDecorator = withStyles(styles, {
  name: 'RegisterDelegateDialogContent'
});

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  onSubmit: () => void;
  onClose: ReactEventHandler<{}>;
  delegateFee: RawAmount;
  registeredUsername?: string;
  username: string;
  onUsernameChange: (username: string) => void;
  error?: null | 'already-registered' | 'insufficient-funds';
  getPublicKey(mnemonic: string): string;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  usernameInvalid: boolean;
  address: string | null;
  mnemonic: string;
  mnemonicInvalid: boolean;
}

const messages = defineMessages({
  dialogTitle: {
    id: 'register-delegate-dialog-content.dialog-title',
    description: 'Register delegate dialog title',
    defaultMessage: 'Delegate registration'
  },
  invalidUsername: {
    id: 'forms-register-delegate.invalid-username',
    description: 'Error label for invalid username text input',
    defaultMessage:
      'Invalid delegate username. A valid username consists ' +
      'of letters (a-z), numbers (0-9) and/or some symbols (!@$&_.)'
  },
  invalidUsernameTooLong: {
    id: 'forms-register-delegate.invalid-username-too-long',
    description: 'Error label for username text input exceeding max length',
    defaultMessage:
      'Too long delegate username. Maximum length is 20 characters.'
  },
  invalidUsernameLikeAddress: {
    id: 'forms-register-delegate.invalid-username-like-address',
    description:
      'Error label for username text input that looks like an address',
    defaultMessage:
      'Invalid delegate username. The username cannot resemble an address.'
  },
  invalidUsernameUppercase: {
    id: 'forms-register-delegate.invalid-username-uppercase',
    description:
      'Error label for invalid username text input that contains uppercase letters',
    defaultMessage:
      'Invalid delegate username. The username cannot contain ' +
      'uppercase characters'
  },
  invalidMnemonicGeneric: {
    id: 'forms-register-delegate.invalid-mnemonic-generic',
    description: 'Error label for invalid mnemonic text input',
    defaultMessage: 'Invalid mnemonic. A valid mnemonic is a list of 12 words.'
  }
});

class RegisterDelegateDialogContent extends React.Component<
  DecoratedProps,
  State
> {
  @autoId dialogContentId: string;

  state: State = {
    usernameInvalid: false,
    address: null,
    mnemonic: null,
    mnemonicInvalid: null
  };

  constructor(props: DecoratedProps) {
    super(props);
  }

  handleUsernameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const username = ev.target.value.trim();
    const { onUsernameChange, onFormChanged } = this.props;

    this.setState({
      usernameInvalid: false
    });

    onUsernameChange(username);
    onFormChanged(Boolean(username));
  };

  handleUsernameBlur = () => {
    const { username } = this.props;
    const usernameInvalid = !!username && !!this.usernameError();
    this.setState({ usernameInvalid });
  };

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { onSubmit } = this.props;

    const usernameInvalid = !!this.usernameError();
    if (usernameInvalid) {
      this.setState({
        usernameInvalid
      });
      return;
    }

    onSubmit();
  };

  handleMnemonicChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const mnemonic = ev.target.value;

    this.setState({
      address: this.getAddressFromMnemonic(mnemonic),
      mnemonic,
      mnemonicInvalid: false
    });
  };

  getAddressFromMnemonic = (mnemonic: string) => {
    const { getPublicKey } = this.props;
    const normalized = normalizeMnemonic(mnemonic);
    if (normalized) {
      return getPublicKey(mnemonic);
    }
    return null;
  };

  handleMnemonicBlur = () => {
    const { mnemonic } = this.state;
    if (!this.getAddressFromMnemonic(mnemonic)) {
      this.setState({ mnemonicInvalid: true });
    }
  };

  usernameError(): string | null {
    const { intl, username } = this.props;

    if (normalizeUsername(username)) {
      return null;
    } else if (username.length > 20) {
      return intl.formatMessage(messages.invalidUsernameTooLong);
    } else if (normalizeAddress(username) !== '') {
      return intl.formatMessage(messages.invalidUsernameLikeAddress);
    } else if (username !== username.toLowerCase()) {
      return intl.formatMessage(messages.invalidUsernameUppercase);
    } else {
      return intl.formatMessage(messages.invalidUsername);
    }
  }

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });
  }

  mnemonicError(): string | null {
    const { intl } = this.props;
    const { address } = this.state;

    if (address) {
      return null;
    }

    return intl.formatMessage(messages.invalidMnemonicGeneric);
  }

  render() {
    const {
      intl,
      classes,
      error,
      delegateFee,
      registeredUsername,
      username
    } = this.props;
    const { usernameInvalid } = this.state;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography id={this.dialogContentId}>
            <FormattedMessage
              id="forms-register-delegate.instructions"
              description="Instructions for delegate registration form"
              defaultMessage={
                'Becoming a delegate requires registration. You may choose your own ' +
                'delegate name, which can be used to promote your delegate. Only the ' +
                'top 101 delegates are eligible to forge. All fees are shared equally ' +
                'between the top 101 delegates.'
              }
            />
          </Typography>
        </Grid>
        {error === 'insufficient-funds' && (
          <Grid item={true} xs={12}>
            <Typography color="error">
              <FormattedMessage
                id="forms-register-delegate.insufficient-funds-error"
                description="Error about not having enough funds to register as a delegate"
                defaultMessage={
                  "You don't have enough funds in your account to pay the network fee " +
                  'of {fee} for registering as a delegate!'
                }
                values={{ fee: formatAmount(intl, delegateFee) }}
              />
            </Typography>
          </Grid>
        )}
        {this.renderUsername()}
        {this.renderForgingKey()}
        <Grid item={true} xs={12}>
          {!error && (
            <Button type="submit" fullWidth={true}>
              <FormattedMessage
                id="forms-register-delegate.continue-button"
                description="Label for continue button."
                defaultMessage="Continue"
              />
            </Button>
          )}
          {error && (
            <Button fullWidth={true} onClick={this.props.onClose}>
              <FormattedMessage
                id="forms-register-delegate.close-button"
                description="Label for close button."
                defaultMessage="Close"
              />
            </Button>
          )}
        </Grid>
      </Grid>
    );
  }

  renderForgingKey() {
    const {
      intl,
      classes,
      error,
      delegateFee,
      registeredUsername,
      username
    } = this.props;
    const { usernameInvalid } = this.state;

    return this.renderMnemonic();
  }

  renderUsername() {
    const {
      intl,
      classes,
      error,
      delegateFee,
      registeredUsername,
      username
    } = this.props;
    const { usernameInvalid } = this.state;

    return (
      !error && (
        <Grid item={true} xs={12}>
          <TextField
            autoFocus={true}
            label={
              <FormattedMessage
                id="forms-register-delegate.username-input-label"
                description="Label for delegate username text field."
                defaultMessage="Delegate username"
              />
            }
            value={username}
            fullWidth={true}
            error={usernameInvalid}
            FormHelperTextProps={{
              error: usernameInvalid
            }}
            helperText={usernameInvalid ? this.usernameError() || '' : ''}
            onChange={this.handleUsernameChange}
            onBlur={this.handleUsernameBlur}
          />
        </Grid>
      )
    );
  }

  renderMnemonic() {
    const {
      intl,
      classes,
      error,
      delegateFee,
      registeredUsername,
      username
    } = this.props;
    const { mnemonic, mnemonicInvalid, address } = this.state;
    const { usernameInvalid } = this.state;

    return (
      <>
        <Grid item={true} xs={12}>
          <div className={classes.accountContainer}>
            <TextField
              type="password"
              label={
                <FormattedMessage
                  id="onboarding-mnemonic-account.mnemonic-input-label"
                  description="Account mnemonic input label"
                  defaultMessage="Account mnemonic"
                />
              }
              error={mnemonicInvalid}
              value={mnemonic}
              FormHelperTextProps={{
                error: mnemonicInvalid
              }}
              helperText={mnemonicInvalid ? this.mnemonicError() || '' : ''}
              onChange={this.handleMnemonicChange}
              onBlur={this.handleMnemonicBlur}
            />
          </div>
        </Grid>;
        {address && (
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-mnemonic-account.account-address-text"
                description="Account address for the inputted mnemonic"
                defaultMessage="Your account address is {address}."
                values={{ address }}
              />
            </Typography>
          </Grid>
        )}
      </>
    );
  }
}

export default stylesDecorator(injectIntl(RegisterDelegateDialogContent));
