import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import NativeSelect from '@material-ui/core/NativeSelect';
import Typography from '@material-ui/core/Typography';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { FormattedMessage } from 'react-intl';

interface Props {
  onSubmit: (state: State) => void;
  fiat: string;
  options: string[];
}

export interface State {
  fiat: string | null;
  global: boolean;
}

@observer
class SettingsFiatForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      ...this.state,
      fiat: props.fiat,
      global: false
    };
  }

  // TODO extract to Form
  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    if (field === 'fiat') {
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
    const { options } = this.props;

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
              id="forms-settings-fiat.instructions"
              description="Instructions before the fiat currency field"
              defaultMessage={
                'Select which FIAT currency you prefer to see your ' +
                'RISE account value in.'
              }
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <NativeSelect
            value={this.state.fiat || this.props.fiat}
            onChange={this.handleChange('fiat')}
            fullWidth={true}
          >
            {options.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </NativeSelect>
        </Grid>
        <Grid item={true} xs={12} sm={6}>
          <Button type="submit" fullWidth={true}>
            <FormattedMessage
              id="forms-settings-fiat.update-for-one"
              description="Update FIAT for one account button label"
              defaultMessage="Set for this account"
            />
          </Button>
        </Grid>
        <Grid item={true} xs={12} sm={6}>
          <Button
            type="submit"
            onClick={() => this.setState({ global: true })}
            fullWidth={true}
          >
            <FormattedMessage
              id="forms-settings-fiat.update-for-all"
              description="Update FIAT for all accounts button label"
              defaultMessage="Set for all accounts"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default SettingsFiatForm;
