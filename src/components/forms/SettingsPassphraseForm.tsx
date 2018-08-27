import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { FormattedMessage, InjectedIntlProps, injectIntl } from 'react-intl';
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
  focusField: string | null;
}

@observer
class SettingsPassphraseForm extends React.Component<DecoratedProps, State> {
  state: State = {
    passphrase: '',
    focusField: 'passphrase'
  };

  handleType = (ev: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      passphrase: ev.target.value
    });
  }

  handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    const { onSubmit } = this.props;
    const { passphrase } = this.state;

    ev.preventDefault();
    if (!this.isValid()) {
      return;
    }

    onSubmit(passphrase);
  }

  isValid() {
    return this.isPassphraseValid() && !this.props.error;
  }

  isPassphraseValid = () => {
    return Boolean(this.state.passphrase);
  }

  // TODO extract to FormComponent
  onFocus = (event: FocusEvent) => {
    // @ts-ignore
    this.setState({ focusField: event.target!.name! });
  }

  // TODO extract to FormComponent
  onBlur = () => {
    this.setState({ focusField: null });
  }

  render() {
    const { intl, error, fee } = this.props;

    const formatAmount = (amount: RawAmount) =>
      `${intl.formatNumber(amount.unit.toNumber())} RISE`;
    const { focusField } = this.state;

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
              onChange={this.handleType}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              name="passphrase"
              autoFocus={true}
              fullWidth={true}
              error={Boolean(
                focusField !== 'passphrase' &&
                  !this.isPassphraseValid()
              )}
              helperText={
                focusField !== 'passphrase' &&
                !this.isPassphraseValid() /* TODO translate */ &&
                'Passphrase cannot be empty'
              }
            />
          </Grid>
        )}
        <Grid item={true} xs={12}>
          {!error ? (
            <Button type="submit" fullWidth={true} disabled={!this.isValid()}>
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
