import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { FormattedMessage, InjectedIntlProps, injectIntl } from 'react-intl';
import { amountToUser } from '../../utils/utils';

interface Props {
  onSubmit: (username: string) => void;
  onClose: () => void;
  fee: number;
  delegateLoaded: boolean;
  registeredUsername?: string;
  error?: null | 'already-registered' | 'insufficient-funds';
}

type DecoratedProps = Props & InjectedIntlProps;

export interface State {
  username: string;
}

@observer
class RegisterDelegateForm extends React.Component<DecoratedProps, State> {
  state: State = {
    username: ''
  };

  handleType = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.setState({
      username: value
    });
  };

  handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const { onSubmit } = this.props;
    const { username } = this.state;

    event.preventDefault();
    if (!this.isValid()) {
      return;
    }
    onSubmit(username);
  };

  isValid() {
    return this.isUsernameValid() && !this.props.error;
  }

  isUsernameValid = () => {
    return Boolean(this.state.username && this.state.username.length >= 3);
  };

  render() {
    const { intl, error, fee, registeredUsername } = this.props;

    const formatAmount = (amount: number) =>
      `${intl.formatNumber(amountToUser(amount))} RISE`;

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
                values={{ fee: formatAmount(fee) }}
              />
            </Typography>
          </Grid>
        )}
        {error === 'already-registered' && (
          <Grid item={true} xs={12}>
            <Typography color="error">
              <FormattedMessage
                id="forms-register-delegate.already-delegate-error"
                description="Error about already being registered as a delegate"
                defaultMessage={
                  "You've already registered as a delegate ({username}). " +
                  'The name cannot be changed.'
                }
                values={{ username: registeredUsername || '' }}
              />
            </Typography>
          </Grid>
        )}
        {!error && (
          <Grid item={true} xs={12}>
            <TextField
              label={
                <FormattedMessage
                  id="forms-register-delegate.username-input-label"
                  description="Label for delegate username text field."
                  defaultMessage="Delegate username"
                />
              }
              value={this.state.username}
              onChange={this.handleType}
              autoFocus={true}
              fullWidth={true}
              error={Boolean(this.state.username && !this.isUsernameValid())}
              helperText={
                this.state.username &&
                !this.isUsernameValid() &&
                /* TODO translate */
                'Username has to be at least 3 characters long.'
              }
            />
          </Grid>
        )}
        <Grid item={true} xs={12}>
          {!error && (
            <Button
              type="submit"
              fullWidth={true}
              disabled={!this.isValid() || !this.props.delegateLoaded}
            >
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
}

export default injectIntl(RegisterDelegateForm);
