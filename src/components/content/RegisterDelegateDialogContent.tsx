import Button from '@material-ui/core/es/Button';
import TextField from '@material-ui/core/es/TextField';
import Typography from '@material-ui/core/es/Typography';
import Grid from '@material-ui/core/es/Grid';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/es/styles';
import bip39 from 'bip39';
import React from 'react';
import { ChangeEvent, FormEvent, ReactEventHandler } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
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
  derivePublicKey
} from '../../utils/utils';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
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
  forgingPK: string;
  error?: null | 'insufficient-funds';
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  usernameInvalid: boolean;
  mnemonic: string;
  mnemonicInvalid: boolean;
  forgingPK?: string;
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
    mnemonic: null,
    mnemonicInvalid: null
  };

  static getDerivedStateFromProps(
    nextProps: Readonly<Props>,
    prevState: State
  ): State {
    return {
      ...prevState,
      forgingPK: nextProps.forgingPK,
      mnemonic:
        !nextProps.registeredUsername && !prevState.mnemonic
          ? bip39.generateMnemonic()
          : prevState.mnemonic
    };
  }

  componentDidMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });
  }

  handleUsernameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const username = ev.target.value.trim();
    const { onUsernameChange, onFormChanged } = this.props;

    this.setState({
      usernameInvalid: false
    });

    onUsernameChange(username);
    onFormChanged(true);
  };

  handleUsernameBlur = () => {
    this.setState({
      usernameInvalid: Boolean(this.usernameError())
    });
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

  mnemonicToForgingKey() {
    const mnemonic = normalizeMnemonic(this.state.mnemonic);
    this.setState({
      forgingPK: mnemonic ? derivePublicKey(mnemonic) : '',
      mnemonicInvalid: !Boolean(mnemonic)
    });
  }

  handleMnemonicChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ mnemonic: ev.target.value });
  };

  handleMnemonicBlur = () => {
    this.mnemonicToForgingKey();
    this.props.onFormChanged(true);
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

  mnemonicError(): string | null {
    const { intl } = this.props;

    if (!this.state.mnemonicInvalid) {
      return null;
    }

    return intl.formatMessage(messages.invalidMnemonicGeneric);
  }

  render() {
    const { classes, error } = this.props;
    // debugger;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
      >
        {this.renderUsername()}
        {!error && this.renderMnemonic()}
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

  renderUsername() {
    const {
      registeredUsername,
      username,
      intl,
      error,
      delegateFee
    } = this.props;
    const { usernameInvalid } = this.state;

    const alreadyRegistered = Boolean(registeredUsername);

    if (alreadyRegistered) {
      return null;
    }

    // TODO move to msgs
    const label = (
      <FormattedMessage
        id="forms-register-delegate.username-input-label"
        description="Label for delegate username text field."
        defaultMessage="Username"
      />
    );

    return (
      <>
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
        {!error && (
          <Grid item={true} xs={12}>
            <TextField
              autoFocus={true}
              label={label}
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
        )}
      </>
    );
  }

  renderMnemonic() {
    const { mnemonic, mnemonicInvalid, forgingPK } = this.state;
    const { registeredUsername } = this.props;

    const alreadyRegistered = Boolean(registeredUsername);

    return (
      <>
        {alreadyRegistered && (
          <Grid item={true} xs={12}>
            <Typography id={this.dialogContentId}>
              <FormattedMessage
                id="forms-register-delegate.instructions"
                description="Instructions for delegate registration form"
                defaultMessage={
                  'Type in a new mnemonic to change your Forging Public Key.'
                }
              />
            </Typography>
          </Grid>
        )}
        <Grid item={true} xs={12}>
          <TextField
            fullWidth={true}
            label={
              <FormattedMessage
                id="onboarding-mnemonic-account.mnemonic-input-label"
                description="Account mnemonic input label"
                defaultMessage="Mnemonic for the forging key"
              />
            }
            error={mnemonicInvalid}
            value={mnemonic}
            helperText={this.mnemonicError()}
            FormHelperTextProps={{
              error: mnemonicInvalid
            }}
            onChange={this.handleMnemonicChange}
            onBlur={this.handleMnemonicBlur}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            autoFocus={true}
            label={
              <FormattedMessage
                id="forms-register-delegate.username-input-label"
                description="Label for delegate username text field."
                defaultMessage="Forging Key"
              />
            }
            value={forgingPK}
            fullWidth={true}
            disabled={true}
          />
        </Grid>
      </>
    );
  }
}

export default stylesDecorator(injectIntl(RegisterDelegateDialogContent));
