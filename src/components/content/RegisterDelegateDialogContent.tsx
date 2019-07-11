import Button from '@material-ui/core/es/Button';
import Grid from '@material-ui/core/es/Grid';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/es/styles';
import TextField from '@material-ui/core/es/TextField';
import Typography from '@material-ui/core/es/Typography';
import React, { ChangeEvent, FormEvent, ReactEventHandler } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import { RawAmount } from '../../utils/amounts';
import autoId from '../../utils/autoId';
import {
  normalizeAddress,
  normalizeUsername,
  formatAmount,
  derivePublicKey
} from '../../utils/utils';
import {
  DialogContentProps,
  SetDialogContent,
  ICloseInterruptFormProps
} from '../Dialog';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
    },
    forgingLabel: {
      textAlign: 'left',
      padding: 8
    }
  });

const stylesDecorator = withStyles(styles, {
  name: 'RegisterDelegateDialogContent'
});

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  delegateFee: RawAmount;
  registeredUsername?: string;
  forgingPK: string | null;
  error?: null | 'insufficient-funds';
  onSubmit: (data: StateForm) => void;
  onClose: ReactEventHandler<{}>;
}

type DecoratedProps = Props & InjectedIntlProps;

export interface StateForm {
  username: string;
  mnemonic: string;
  forgingPK: string;
}

interface State extends StateForm {
  usernameInvalid: boolean;
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
    defaultMessage: 'Invalid secret. Any string is a valid one.'
  }
});

class RegisterDelegateDialogContent extends React.Component<
  DecoratedProps,
  State
> {
  @autoId dialogContentId: string;

  state: State = {
    username: '',
    usernameInvalid: false,
    mnemonic: '',
    mnemonicInvalid: false,
    forgingPK: ''
  };

  componentDidMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });

    this.mnemonicToForgingKey();
  }

  handleUsernameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const username = ev.target.value.trim();
    const { onFormChanged } = this.props;

    this.setState({
      username,
      usernameInvalid: false
    });

    onFormChanged(true);
  };

  handleUsernameBlur = () => {
    this.setState({
      usernameInvalid: Boolean(this.usernameError())
    });
  };

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    const { onSubmit, registeredUsername } = this.props;

    ev.preventDefault();

    const usernameError = Boolean(this.usernameError());
    const mnemonicError = Boolean(this.mnemonicError());
    if ((!registeredUsername && usernameError) || mnemonicError) {
      this.setState({
        usernameInvalid: !registeredUsername ? usernameError : false,
        mnemonicInvalid: mnemonicError
      });
      return;
    }

    const { username, mnemonic, forgingPK } = this.state;

    onSubmit({
      username,
      mnemonic,
      forgingPK
    });
  };

  mnemonicToForgingKey() {
    const mnemonic = (this.state.mnemonic || '').trim();
    const forgingPK = mnemonic ? derivePublicKey(mnemonic) : '';
    this.setState({
      forgingPK
    });
  }

  handleMnemonicChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      mnemonic: ev.target.value,
      mnemonicInvalid: false
    });
  };

  handleMnemonicBlur = () => {
    this.mnemonicToForgingKey();
    const mnemonic = (this.state.mnemonic || '').trim();
    const forgingPK = mnemonic ? derivePublicKey(mnemonic) : '';
    this.setState({
      mnemonicInvalid: !Boolean(mnemonic) || !Boolean(forgingPK)
    });
    this.props.onFormChanged(true);
  };

  usernameError(): string | null {
    const { intl } = this.props;
    const { username } = this.state;

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
    const { intl, classes, error, delegateFee } = this.props;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
        id={this.dialogContentId}
      >
        <Grid item={true} xs={12}>
          <Typography>
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
        {!error && this.renderUsername()}
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
    const { registeredUsername } = this.props;
    const { username, usernameInvalid } = this.state;

    const usernameToShow = registeredUsername || username;

    const alreadyRegistered = Boolean(registeredUsername);

    if (alreadyRegistered) {
      return null;
    }

    return (
      <Grid item={true} xs={12}>
        <TextField
          autoFocus={true}
          label={
            <FormattedMessage
              id="forms-register-delegate.username-input-label"
              description="Label for delegate username text field."
              defaultMessage="Username"
            />
          }
          value={usernameToShow}
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
    );
  }

  renderMnemonic() {
    const { mnemonic, mnemonicInvalid } = this.state;
    const { registeredUsername, classes } = this.props;

    const forgingPK = this.state.forgingPK || this.props.forgingPK || '';
    const alreadyRegistered = Boolean(registeredUsername);

    return (
      <>
        {alreadyRegistered && (
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="forms-register-delegate.change-forging-pk"
                description="Instructions for changing the forging public key"
                defaultMessage={
                  'Type in a new secret to change your Forging Public Key.'
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
                id="forms-register-delegate.secret-input-label"
                description="Secret for the forging key"
                defaultMessage="Secret for the forging key"
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
        <Grid item={true} xs={12} className={classes.forgingLabel}>
          <Typography>
            <FormattedMessage
              id="forms-register-delegate.forging-pk-input-label"
              description="Label for the forging key."
              defaultMessage="Forging Key"
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            autoFocus={true}
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
