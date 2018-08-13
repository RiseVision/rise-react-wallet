import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { observer } from 'mobx-react';
import { ChangeEvent, FormEvent } from 'react';

interface Props {
  onSubmit: (state: State) => void;
  name: string;
  id: string;
}

export interface State {
  name: string | null;
}

@observer
class SettingsNameForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      ...this.state,
      name: props.name
    };
  }

  // TODO extract to Form
  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    if (field === 'name') {
      this.setState({
        [field]: value
      });
    }
  }

  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.props.onSubmit({ ...this.state });
  }

  render() {
    return (
      <Grid
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.onSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography>
            <FormattedMessage
              id="forms-settings-name.instructions"
              description="Instructions before the account name input field"
              defaultMessage={'Assign a new name to account {address}. ' +
                'This name will only be visible to you and nobody else.'}
              values={{
                address: this.props.id,
              }}
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            label={
              <FormattedMessage
                id="forms-settings-name.name-input-label"
                description="Account name input label"
                defaultMessage="Account name"
              />
            }
            value={this.state.name || ''}
            onChange={this.handleChange('name')}
            autoFocus={true}
            fullWidth={true}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <Button type="submit" fullWidth={true}>
            <FormattedMessage
              id="forms-settings-name.update"
              description="Update account name button label"
              defaultMessage="Update name"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default SettingsNameForm;
