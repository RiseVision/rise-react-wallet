import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { amountToUser } from '../../utils/utils';

interface Props {
  onSubmit: (passphrase: string) => void;
  fee: number;
  error?: null | 'already-set' | 'insufficient-funds';
}

export interface State {
  passphrase: string;
}

@observer
class SettingsPassphraseForm extends React.Component<Props, State> {
  state: State = {
    passphrase: '',
  };

  handleType = (ev: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      passphrase: ev.target.value,
    });
  }

  handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    const { onSubmit } = this.props;
    const { passphrase } = this.state;

    ev.preventDefault();
    onSubmit(passphrase);
  }

  render() {
    const { error, fee } = this.props;

    return (
      <form onSubmit={this.handleSubmit}>
        <Typography>
          The second passphrase offers an extra layer of protection for forgers
          whose primary mnemonic is stored on servers which can potentially get
          hacked and compromised the primary mnemonic.
        </Typography>
        <Typography>
          Once the 2nd passphrase has been set it cannot be changed nor removed.
        </Typography>
        {!error && (
          <TextField
            label="2nd passphrase"
            onChange={this.handleType}
            autoFocus={true}
            fullWidth={true}
          />
        )}
        {error === 'insufficient-funds' && (
          <Typography color="error">
            You don't have enough funds on your account to pay the network fee
            of {amountToUser(fee)} RISE to setup a 2nd passphrase!
          </Typography>
        )}
        {error === 'already-set' && (
          <Typography color="error">
            You've already set the 2nd passphrase, it can't be changed. Transfer
            you funds to a new address to set a new 2nd passphrase.
          </Typography>
        )}
        <div>
          <Button type="submit" fullWidth={true}>
            {!error ? 'Continue' : 'Close'}
          </Button>
        </div>
      </form>
    );
  }
}

export default SettingsPassphraseForm;
