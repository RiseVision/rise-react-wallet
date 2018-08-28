import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl,
} from 'react-intl';
import { RawAmount } from '../../utils/amounts';

interface Props {
  onSubmit: (passphrase: string) => void;
  onClose: () => void;
  fee: RawAmount;
  error?: null | 'already-set' | 'insufficient-funds';
}

type DecoratedProps = Props & InjectedIntlProps;

export interface State {
  passphrase: string;
  passphraseInvalid: boolean;
}

const messages = defineMessages({
  invalidPassphrase: {
    id: 'forms-passphrase.invalid-passphrase',
    description: 'Error label for invalid passphrase text input',
    defaultMessage: 'Invalid passphrase. Passphrase cannot be empty.'
  },
});

@observer
class SettingsPassphraseForm extends React.Component<DecoratedProps, State> {
  state: State = {
    passphrase: '',
    passphraseInvalid: false,
  };

  handlePassphraseChanged = (ev: ChangeEvent<HTMLInputElement>) => {
    const passphrase = ev.target.value;

    this.setState({
      passphrase,
      passphraseInvalid: false,
    });
  }

  handlePassphraseBlur = () => {
    const { passphrase } = this.state;
    const passphraseInvalid = !!passphrase && !!this.passphraseError();
    this.setState({ passphraseInvalid });
  }

  handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { onSubmit } = this.props;
    const { passphrase } = this.state;

    const passphraseInvalid = !!this.passphraseError();
    if (passphraseInvalid) {
      this.setState({
        passphraseInvalid,
      });
      return;
    }

    onSubmit(passphrase);
  }

  passphraseError(): string | null {
    const { intl } = this.props;
    const { passphrase } = this.state;

    if (passphrase.trim() !== '') {
      return null;
    } else {
      return intl.formatMessage(messages.invalidPassphrase);
    }
  }

  render() {
    const { intl, error, fee } = this.props;
    const { passphrase, passphraseInvalid } = this.state;

    const formatAmount = (amount: RawAmount) =>
      `${intl.formatNumber(amount.unit.toNumber())} RISE`;

    return (
      <Grid
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography>
            <FormattedMessage
              id="forms-passphrase.instructions-about"
              description="Instructions for setup 2nd passphrase form"
              defaultMessage={
                'The second passphrase offers an extra layer of protection for forgers ' +
                'whose primary mnemonic is stored on servers which can potentially get ' +
                'hacked and compromise the primary mnemonic.'
              }
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <Typography>
            <FormattedMessage
              id="forms-passphrase.instructions-immutable"
              description="Warning about the 2nd passphrase being immutable"
              defaultMessage="Once the 2nd passphrase has been set it cannot be changed nor removed."
            />
          </Typography>
        </Grid>
        {error === 'insufficient-funds' && (
          <Grid item={true} xs={12}>
            <Typography color="error">
              <FormattedMessage
                id="forms-passphrase.insufficient-funds-error"
                description="Error about not having enough funds to setup a passphrase"
                defaultMessage={
                  'You don\'t have enough funds in your account to pay the network fee ' +
                  'of {fee} to setup a 2nd passphrase!'
                }
                values={{
                  fee: formatAmount(fee)
                }}
              />
            </Typography>
          </Grid>
        )}
        {error === 'already-set' && (
          <Grid item={true} xs={12}>
            <Typography color="error">
              <FormattedMessage
                id="forms-passphrase.already-set-error"
                description="Error about the 2nd passphrase being set already"
                defaultMessage={
                  'You\'ve already set a 2nd passphrase for this account. You need to ' +
                  'create a new account should you wish to change your passphrase.'
                }
              />
            </Typography>
          </Grid>
        )}
        {!error && (
          <Grid item={true} xs={12}>
            <TextField
              label={
                <FormattedMessage
                  id="forms-passphrase.passphrase-input-label"
                  description="Label for 2nd passphrase text field."
                  defaultMessage="2nd passphrase"
                />
              }
              value={passphrase}
              onChange={this.handlePassphraseChanged}
              onBlur={this.handlePassphraseBlur}
              fullWidth={true}
              error={passphraseInvalid}
              FormHelperTextProps={{
                error: passphraseInvalid,
              }}
              helperText={passphraseInvalid ? (this.passphraseError() || '') : ''}
            />
          </Grid>
        )}
        <Grid item={true} xs={12}>
          {!error ? (
            <Button type="submit" fullWidth={true}>
              <FormattedMessage
                id="forms-passphrase.continue-button"
                description="Label for continue button."
                defaultMessage="Continue"
              />
            </Button>
          ) : (
            <Button onClick={this.props.onClose} fullWidth={true}>
              <FormattedMessage
                id="forms-passphrase.close-button"
                description="Label for close button."
                defaultMessage="Close"
              />
            </Button>
          )}
        </Grid>
      </Grid>
    );
  }
}

export default injectIntl(SettingsPassphraseForm);
