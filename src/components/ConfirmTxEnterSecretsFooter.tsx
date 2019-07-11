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
import { Rise } from 'dpos-offline';
import React, { FormEvent } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import {
  AccountIDVersion,
  NetworkTXType,
  derivePublicKey
} from '../utils/utils';
import AccountTip from './AccountTip';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      paddingLeft: theme.spacing.unit * 2,
      paddingRight: theme.spacing.unit * 2,
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      textAlign: 'center',
      '&:first-child': {
        paddingTop: theme.spacing.unit * 2
      },
      '&:last-child': {
        paddingBottom: theme.spacing.unit * 2
      }
    }
  });

const stylesDecorator = withStyles(styles, {
  name: 'ConfirmTxEnterSecretsFooter'
});

const messages = defineMessages({
  invalidMnemonicMissing: {
    id: 'confirm-tx-enter-secrets-footer.invalid-mnemonic-missing',
    description: 'Error label for an invalid mnemonic (missing)',
    defaultMessage:
      'Missing secret. Please enter the mnemonic secret for your account.'
  },
  invalidMnemonicIncorrect: {
    id: 'confirm-tx-enter-secrets-footer.invalid-mnemonic-incorrect',
    description: 'Error label for an invalid mnemonic',
    defaultMessage:
      'Incorrect secret. The secret you entered is not associated with this account.'
  },
  invalidMnemonicNoWords: {
    id: 'confirm-tx-enter-secrets-footer.invalid-mnemonic-no-words',
    description: 'Error label for an invalid mnemonic (no words)',
    defaultMessage:
      'Incorrect secret. The mnemonic usually consists of 12 words separated with spaces.'
  },
  invalidPassphraseMissing: {
    id: 'confirm-tx-enter-secrets-footer.invalid-passphrase-missing',
    description: 'Error label for an invalid passphrase',
    defaultMessage:
      'Missing passphrase. Please enter the passphrase for your account.'
  },
  invalidPassphraseIncorrect: {
    id: 'confirm-tx-enter-secrets-footer.invalid-passphrase-incorrect',
    description: 'Error label for an invalid passphrase',
    defaultMessage:
      'Incorrect passphrase. The passphrase you entered is not associated with this account.'
  },
  mnemonicOK: {
    id: 'confirm-tx-enter-secrets-footer.mnemonic-ok',
    description: 'Info about auto-accepted mnemonic',
    defaultMessage: 'Entered mnemonic is correct'
  }
});

type BaseProps = WithStyles<typeof styles>;

interface Props extends BaseProps {
  address: string;
  addressVersion: AccountIDVersion;
  networkType: NetworkTXType;
  publicKey: string | null;
  secondPublicKey: string | null;
  onConfirm: (data: { mnemonic: string; passphrase: null | string }) => void;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  mnemonic: string;
  mnemonicInvalid: boolean;
  passphrase: string;
  passphraseInvalid: boolean;
  removeInput1: boolean;
}

class ConfirmTxEnterSecretsFooter extends React.Component<
  DecoratedProps,
  State
> {
  state = {
    mnemonic: '',
    mnemonicInvalid: false,
    passphrase: '',
    passphraseInvalid: false,
    removeInput1: false
  };

  // We rely on ref based access to the input elements here because
  // iOS safari auto-fill doesn't work too well with regular onChange
  // and state updates.
  passphraseRef: HTMLInputElement;
  mnemonicRef: HTMLInputElement;

  handleMnemonicChange = () => {
    if (!this.mnemonicRef) {
      return;
    }
    const mnemonic = this.mnemonicRef.value;
    this.setState({
      mnemonic: mnemonic,
      mnemonicInvalid: false
    });
    this.setState({
      removeInput1: !this.mnemonicError(mnemonic)
    });
  }

  handleMnemonicBlur = () => {
    const { mnemonic } = this.state;
    const mnemonicInvalid = !!mnemonic && !!this.mnemonicError();
    this.setState({ mnemonicInvalid });
  }

  handlePassphraseChange = () => {
    if (!this.passphraseRef) {
      return;
    }
    const passphrase = this.passphraseRef.value;
    this.setState({
      passphrase,
      passphraseInvalid: false
    });
  }

  handlePassphraseBlur = () => {
    const { passphrase } = this.state;
    const passphraseInvalid = !!passphrase && !!this.passphraseError();
    this.setState({ passphraseInvalid });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { secondPublicKey, onConfirm } = this.props;

    this.handleMnemonicChange();
    this.handlePassphraseChange();

    const mnemonicInvalid = !!this.mnemonicError();
    const passphraseInvalid = !!secondPublicKey && !!this.passphraseError();

    if (mnemonicInvalid || passphraseInvalid) {
      this.setState({
        mnemonicInvalid,
        passphraseInvalid: passphraseInvalid && this.state.removeInput1,
        removeInput1: !this.mnemonicError()
      });
      return;
    }

    const { mnemonic, passphrase } = this.state;
    onConfirm({
      mnemonic,
      passphrase: secondPublicKey ? passphrase : null
    });
  }

  mnemonicError(secret?: string): string | null {
    const {
      intl,
      address,
      publicKey,
      networkType,
      addressVersion
    } = this.props;
    const mnemonic = secret || this.state.mnemonic;

    if (!mnemonic.trim()) {
      return intl.formatMessage(messages.invalidMnemonicMissing);
    }

    // The derivation takes some CPU cycles, so only do it after the empty check
    let isValid = false;
    if (mnemonic) {
      const derivedKey = derivePublicKey(mnemonic);

      if (publicKey) {
        // Prefer to validate against the account publicKey
        isValid = derivedKey === publicKey;
      } else {
        // Fallback to comparing addresses instead of public
        isValid = Rise.calcAddress(derivedKey) === address;
        isValid =
          address === Rise.calcAddress(derivedKey, networkType, addressVersion);
      }
    }

    if (isValid) {
      return null;
    } else if (mnemonic.indexOf(' ') < 0) {
      return intl.formatMessage(messages.invalidMnemonicNoWords);
    } else {
      return intl.formatMessage(messages.invalidMnemonicIncorrect);
    }
  }

  passphraseError(): string | null {
    const { intl, secondPublicKey } = this.props;
    const { passphrase } = this.state;

    if (!passphrase.trim()) {
      return intl.formatMessage(messages.invalidPassphraseMissing);
    }

    // The derivation takes some CPU cycles, so only do it after the empty check
    let isValid = false;
    if (passphrase) {
      const publicKey = derivePublicKey(passphrase);
      isValid = publicKey === secondPublicKey;
    }

    if (isValid) {
      return null;
    } else {
      return intl.formatMessage(messages.invalidPassphraseIncorrect);
    }
  }

  render() {
    const { classes, secondPublicKey, intl } = this.props;
    const {
      mnemonic,
      mnemonicInvalid,
      passphrase,
      passphraseInvalid,
      removeInput1
    } = this.state;
    const isPassphraseSet = !!secondPublicKey;
    const showMnemonicInput = !isPassphraseSet || !removeInput1;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography>
            {isPassphraseSet ? (
              <FormattedMessage
                id="confirm-tx-enter-secrets-footer.instructions-with-passphrase"
                description="Instructions on how to confirm the transaction (with 2nd passphrase set)."
                defaultMessage={
                  'To confirm this transaction, enter your mnemonic secret ' +
                  'and the 2nd passphrase into the text fields below.'
                }
              />
            ) : (
              <FormattedMessage
                id="confirm-tx-enter-secrets-footer.instructions"
                description="Instructions on how to confirm the transaction."
                defaultMessage={
                  'To confirm this transaction, enter your mnemonic secret ' +
                  'into the text field below.'
                }
              />
            )}
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          {showMnemonicInput ? (
            <TextField
              key="mnemonic"
              type="password"
              label={
                <FormattedMessage
                  id="confirm-tx-enter-secrets-footer.mnemonic-input-label"
                  description="Label for mnemonic text field."
                  defaultMessage="Account mnemonic secret"
                />
              }
              value={mnemonic}
              onChange={this.handleMnemonicChange}
              onBlur={this.handleMnemonicBlur}
              error={mnemonicInvalid}
              helperText={mnemonicInvalid ? this.mnemonicError() : ''}
              autoFocus={true}
              fullWidth={true}
              inputRef={ref => (this.mnemonicRef = ref)}
            />
          ) : (
            <>
              <AccountTip
                key="__mnemonic_ok__"
                open={true}
                message={intl.formatMessage(messages.mnemonicOK)}
              />
              <TextField
                key="passphrase"
                type="password"
                label={
                  <FormattedMessage
                    id="confirm-tx-enter-secrets-footer.passphrase-input-label"
                    description="Label for 2nd passphrase text field."
                    defaultMessage="Second passphrase"
                  />
                }
                autoFocus={true}
                value={passphrase}
                onChange={this.handlePassphraseChange}
                onBlur={this.handlePassphraseBlur}
                error={passphraseInvalid}
                helperText={passphraseInvalid ? this.passphraseError() : ''}
                fullWidth={true}
                inputRef={ref => (this.passphraseRef = ref)}
              />
            </>
          )}
        </Grid>
        <Grid item={true} xs={12}>
          <Button type="submit" fullWidth={true}>
            <FormattedMessage
              id="confirm-tx-enter-secrets-footer.sign-button"
              description="Label for sign & broadcast button."
              defaultMessage="Sign & broadcast"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(ConfirmTxEnterSecretsFooter));
