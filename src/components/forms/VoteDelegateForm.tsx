import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import { Delegate } from 'dpos-api-wrapper';
import { observer } from 'mobx-react';
import { ChangeEvent } from 'react';
import DelegateVoteComponent from '../DelegateVoteComponent';

interface Props {
  onSubmit: (delegate: Delegate, addVote: boolean) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  delegates: Delegate[];
  votedDelegate: string | null;
}

export interface State {
  search: string;
}

@observer
class SendTransactionForm extends React.Component<Props, State> {
  state: State = {
    search: ''
  };

  handleType = () => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    this.setState({
      search: value
    });
    this.props.onSearch(value);
  }

  render() {
    const { delegates, votedDelegate, isLoading } = this.props;
    const { search } = this.state;
    const emptySearch = !search || !search.trim();

    let display: 'loading' | 'suggestions' | 'results' | 'empty';
    if (isLoading) {
      display = 'loading';
    } else if (delegates.length === 0) {
      display = 'empty';
    } else if (emptySearch) {
      display = 'suggestions';
    } else {
      display = 'results';
    }

    return (
      <Grid
        container={true}
        spacing={16}
      >
        <Grid item={true} xs={12}>
          <Typography>
            <FormattedMessage
              id="forms-vote-delegate.instructions"
              description="Instructions before the delegate search field"
              defaultMessage={'New blocks on the RISE blockchain are forged by the top 101 delegates. ' +
                'You as the user determine who those delegates are by casting a vote.'}
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            label={
              <FormattedMessage
                id="forms-vote-delegate.search-box-label"
                description="Delegate search box label"
                defaultMessage="Find delegates by username or address"
              />
            }
            value={search}
            fullWidth={true}
            onChange={this.handleType()}
          />
        </Grid>
        {display === 'loading' ? (
          <Typography>Loading...</Typography>
        ) : (
          <React.Fragment>
            <Grid item={true} xs={12}>
              <Typography
                variant="body2"
                color="textSecondary"
                align="left"
              >
                {display === 'suggestions' ? (
                  <FormattedMessage
                    id="forms-vote-delegate.suggested-title"
                    description="Title for suggested delegates"
                    defaultMessage="Suggested delegates"
                  />
                ) : display === 'results' ? (
                  <FormattedMessage
                    id="forms-vote-delegate.results-title"
                    description="Title for search results"
                    defaultMessage="Search results"
                  />
                ) : (
                  <FormattedMessage
                    id="forms-vote-delegate.no-results-title"
                    description="Title for no results"
                    defaultMessage="No results"
                  />
                )}
              </Typography>
            </Grid>
            {delegates.map(delegate => (
              <Grid key={delegate.address} item={true} xs={12}>
                <DelegateVoteComponent
                  delegate={delegate}
                  onSubmit={this.props.onSubmit}
                  mode={votedDelegate !== delegate.publicKey ? 'add-vote' : 'remove-vote'}
                />
              </Grid>
            ))}
          </React.Fragment>
        )}
      </Grid>
    );
  }
}

export default SendTransactionForm;
