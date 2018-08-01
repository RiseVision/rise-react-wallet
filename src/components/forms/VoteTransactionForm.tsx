import Avatar from '@material-ui/core/Avatar';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
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
import { amountToUser } from '../../utils/utils';
import AccountIcon from '../AccountIcon';

const styles = (theme: Theme) =>
  createStyles({
    accountAvatar: {
      backgroundColor: 'white'
    },
    input: {
      color: theme.palette.grey['600']
    },
    footer: {
      marginTop: theme.spacing.unit,
      '& button': {
        color: theme.palette.grey['600']
      }
    },
    error: {
      /* TODO from the theme */
      color: 'red'
    },
    form: {
      '& > p + p': {
        marginTop: theme.spacing.unit
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  onSubmit: (state: State) => void;
  onSearch: (query: string) => void;
  delegates: {
    id: string;
    name: string;
    rank: number;
    uptime: number;
    approval: number;
  }[];
}

export interface State {
  selectedId: string | null;
}

const stylesDecorator = withStyles(styles);

// TODO address book
@observer
class SendTransactionForm extends React.Component<Props, State> {
  state: State = {
    selectedId: null
  };

  // TODO extract to Form
  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    const fields = ['recipientId', 'amount'];
    if (fields.includes(field)) {
      // @ts-ignore TODO make it generic
      this.setState({
        [field]: value
      });
    }
  };

  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    // TODO validate the destination ID
    // TODO validate the amount (number, balance)
    event.preventDefault();
    this.props.onSubmit({ ...this.state });
  };

  render() {
    const { classes, delegates } = this.props;

    return (
      <form onSubmit={this.onSubmit} className={classes.form}>
        <Typography>
          New blocks on the RISE blockchain are forged by the top 101 delegates.
          You as the user determine who those delegates are by casting a vote.
        </Typography>
        <TextField
          className={classes.input}
          label="Find delegates by username or address"
          onChange={this.handleChange('recipientId')}
          margin="normal"
          fullWidth={true}
        />
        {/* TODO 'Suggested' only when no search query? */}
        <Typography>Suggested delegates</Typography>
        {delegates.map(delegate => (
          <React.Fragment>
            <Avatar className={classes.accountAvatar}>
              <AccountIcon size={24} address={delegate.id} />
            </Avatar>
            <Typography>{delegate.name}</Typography>
            <Typography>{delegate.id}</Typography>
            <ul>
              <li>R: {delegate.rank}</li>
              <li>U: {delegate.uptime}%</li>
              <li>A: {delegate.approval}%</li>
            </ul>
            <Button type="submit" fullWidth={true}>
              CAST VOTE
            </Button>
          </React.Fragment>
        ))}
      </form>
    );
  }
}

export default stylesDecorator(SendTransactionForm);
