import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { FormattedMessage } from 'react-intl';

interface Props {
  onSubmit: (state: State) => void;
  address: string;
  name: string | null;
}

export interface State {
  address: string;
}

@observer
class SettingsRemoveAccountForm extends React.Component<Props, State> {
  state = {
    address: ''
  };

  handleType = (
    ev: ChangeEvent<HTMLInputElement>
  ) => {
    this.setState({
      address: ev.target.value,
    });
  }

  handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (this.state.address !== this.props.address) {
      // TODO error mark the ID field
      return false;
    }
    this.props.onSubmit({ ...this.state });
    return true;
  }

  render() {
    const { name, address } = this.props;

    return (
      <Grid
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography>
            {name ? (
              <FormattedMessage
                id="forms-remove-account.prompt-text"
                description="Prompt for named account removal form"
                defaultMessage={(
                  'Are you sure you want to remove {name} ({address}) from the wallet? ' +
                  'To confirm, enter the account address in the field below.'
                )}
                values={{ name, address }}
              />
            ) : (
              <FormattedMessage
                id="forms-remove-account.prompt-text"
                description="Prompt for unnamed account removal form"
                defaultMessage={(
                  'Are you sure you want to remove account {address} from the wallet? ' +
                  'To confirm, enter the account address in the field below.'
                )}
                values={{ address }}
              />
            )}
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            label={(
              <FormattedMessage
                id="forms-remove-account.address-input-label"
                description="Label for account address text field."
                defaultMessage="Account address"
              />
            )}
            value={this.state.address}
            onChange={this.handleType}
            autoFocus={true}
            fullWidth={true}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <Button type="submit" fullWidth={true}>
            <FormattedMessage
              id="forms-remove-account.remove-button"
              description="Label for remove account button."
              defaultMessage="Remove account"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default SettingsRemoveAccountForm;
