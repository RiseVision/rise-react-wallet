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
import { Delegate } from 'dpos-api-wrapper';
import { observer } from 'mobx-react';
import { ChangeEvent, FormEvent } from 'react';
import * as React from 'react';
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
    },
    // TODO import from settings.ts
    subsectionTitle: {
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit,
      ['&:first-child']: {
        marginTop: 0
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  onSubmit: (id: string) => void;
  onSearch: (query: string) => void;
  delegates: Delegate[];
}

export interface State {
  search: string | null;
}

const stylesDecorator = withStyles(styles);

// TODO address book
@observer
class SendTransactionForm extends React.Component<Props, State> {
  state: State = {
    search: ''
  };

  handleType = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    this.setState({
      search: value
    });
    this.props.onSearch(value);
  };

  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    // TODO validate the destination ID
    // TODO validate the amount (number, balance)
    event.preventDefault();
    this.props.onSubmit(this.state.search);
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
          onChange={this.handleType('search')}
          margin="normal"
          fullWidth={true}
        />
        {/* TODO 'Suggested' only when no search query? */}
        <Typography
          className={classes.subsectionTitle}
          variant="body2"
          color="textSecondary"
        >
          Suggested delegates
        </Typography>
        {delegates.map(delegate => (
          <React.Fragment key={delegate.address}>
            <Avatar className={classes.accountAvatar}>
              <AccountIcon size={24} address={delegate.address} />
            </Avatar>
            <Typography>{delegate.username}</Typography>
            <Typography>{delegate.address}</Typography>
            <ul>
              <li>R: {delegate.rank}</li>
              <li>U: {delegate.rate}%</li>
              <li>A: {delegate.approval}%</li>
            </ul>
            <Button
              type="submit"
              fullWidth={true}
              onClick={() => this.props.onSubmit(delegate.address)}
            >
              CAST VOTE
            </Button>
          </React.Fragment>
        ))}
      </form>
    );
  }
}

export default stylesDecorator(SendTransactionForm);
