import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { Delegate } from 'dpos-api-wrapper';
import { range } from 'lodash';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import DelegateVoteComponent from '../DelegateVoteComponent';

interface Props {
  onSubmit: (delegate: Delegate, addVote: boolean) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  isSearch: boolean;
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
    const { delegates, votedDelegate, isLoading, isSearch } = this.props;
    const { search } = this.state;

    return (
      <React.Fragment>
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
          <Grid item={true} xs={12}>
            <Typography
              variant="body2"
              color="textSecondary"
              align="left"
            >
              {isSearch ? (
                <FormattedMessage
                  id="forms-vote-delegate.results-title"
                  description="Title for search results"
                  defaultMessage="Search results"
                />
              ) : (
                <FormattedMessage
                  id="forms-vote-delegate.suggested-title"
                  description="Title for suggested delegates"
                  defaultMessage="Suggested delegates"
                />
              )}
            </Typography>
          </Grid>
          {range(3).map(n => {
            const delegate = delegates[n] || null;
            return (
              <Grid key={delegate ? delegate.address : `placeholder-${n}`} item={true} xs={12}>
                <DelegateVoteComponent
                  delegate={delegate}
                  onSubmit={this.props.onSubmit}
                  hasVote={delegate ? votedDelegate === delegate.publicKey : false}
                  isLoading={isLoading}
                />
              </Grid>
            );
          })}
        </Grid>
      </React.Fragment>
    );
  }
}

export default SendTransactionForm;
