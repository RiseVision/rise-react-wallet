import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { observer } from 'mobx-react';
import { ChangeEvent, FormEvent } from 'react';
import * as React from 'react';

const styles = (theme: Theme) =>
  createStyles({
    input: {
      color: theme.palette.grey['600']
    },
    footer: {
      '& button': {
        color: theme.palette.grey['600']
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  onSubmit: (state: State) => void;
  name: string;
  id: string;
}

export interface State {
  name: string | null;
}

const stylesDecorator = withStyles(styles);

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
    const { classes } = this.props;

    return (
      <form onSubmit={this.onSubmit}>
        <Typography>
          Assign a new name to account {this.props.id}. This name will only be
          visible to you and nobody else.
        </Typography>
        <div>
          <TextField
            className={classes.input}
            id="account-name"
            label="Account name"
            value={this.state.name || ''}
            onChange={this.handleChange('name')}
            margin="normal"
            autoFocus={true}
            fullWidth={true}
          />
        </div>
        <div className={classes.footer}>
          <Button type="submit" fullWidth={true}>
            UPDATE NAME
          </Button>
        </div>
      </form>
    );
  }
}

export default stylesDecorator(SettingsNameForm);
