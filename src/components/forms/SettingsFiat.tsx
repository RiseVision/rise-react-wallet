import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { observer } from 'mobx-react';
import { ChangeEvent, FormEvent } from 'react';
import * as React from 'react';

const styles = (theme: Theme) =>
  createStyles({
    input: {
      color: theme.palette.grey['600'],
      width: '100%',
      marginTop: theme.spacing.unit,
      marginBottom: theme.spacing.unit
    },
    footer: {
      '& button': {
        color: theme.palette.grey['600']
      }
    },
    error: {
      /* TODO from the theme */
      color: 'red'
    }
  });

interface Props extends WithStyles<typeof styles> {
  onSubmit: (state: State) => void;
  fiat: string;
  options: string[];
}

export interface State {
  fiat: string | null;
  global: boolean;
}

const stylesDecorator = withStyles(styles);

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
    const { classes } = this.props;
    const options = this.props.options;

    return (
      <form onSubmit={this.onSubmit}>
        <Typography>
          Select which FIAT currency you prefer to see your RISE account value
          in.
        </Typography>
        <Typography>
          {/* TODO autoFocus={true} */}
          <select
            name="fiat"
            onChange={this.handleChange('fiat')}
            className={classes.input}
          >
            {options.map(name => ( this.props.fiat === name ?
              <option key={name} value={name} selected={true}>
                {name}
              </option> :
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Typography>
        <div className={classes.footer}>
          <Button type="submit">SET FOR THIS ACCOUNT</Button>
          <Button type="submit" onClick={() => this.setState({ global: true })}>
            SET FOR ALL ACCOUNTS
          </Button>
        </div>
      </form>
    );
  }
}

export default stylesDecorator(SettingsFiatForm);
