import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { Delegate } from 'dpos-api-wrapper';
import { range } from 'lodash';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent } from 'react';
import { FormattedMessage, InjectedIntlProps, injectIntl } from 'react-intl';
import { amountToUser } from '../../utils/utils';
import DelegateVoteComponent from '../DelegateVoteComponent';

interface Props {
  onSubmit: (delegate: Delegate, addVote: boolean) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  isSearch: boolean;
  delegates: Delegate[];
  votedDelegate: string | null;
  fee: number;
  error?: null | 'insufficient-funds';
}

type DecoratedProps = Props & InjectedIntlProps;

export interface State {
  search: string;
}

@observer
class SendTransactionForm extends React.Component<DecoratedProps, State> {
  state: State = {
    search: ''
  };

  handleType = () => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    this.setState({
      search: value.trim()
    });
    this.props.onSearch(value);
  };

  render() {
    const {
      intl,
      delegates,
      votedDelegate,
      isLoading,
      isSearch,
      error,
      fee
    } = this.props;
    const { search } = this.state;

    const formatAmount = (amount: number) =>
      `${intl.formatNumber(amountToUser(amount))} RISE`;

    return (
      <React.Fragment>
        <Grid container={true} spacing={16}>
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="forms-vote-delegate.instructions"
                description="Instructions before the delegate search field"
                defaultMessage={
                  'New blocks on the RISE blockchain are forged by the top ' +
                  '101 delegates. You as the user determine who those' +
                  ' delegates are by casting a vote.'
                }
              />
            </Typography>
          </Grid>
          {error === 'insufficient-funds' && (
            <Grid item={true} xs={12}>
              <Typography color="error">
                <FormattedMessage
                  id="forms-register-delegate.insufficient-funds-error"
                  description="Error about not having enough funds to vote for a delegate"
                  defaultMessage={
                    "You don't have enough funds in your account to pay the" +
                    ' network fee of {fee} for casting a vote for a delegate!'
                  }
                  values={{
                    fee: formatAmount(fee)
                  }}
                />
              </Typography>
            </Grid>
          )}
          {!error && (
            <React.Fragment>
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
                <Typography variant="body2" color="textSecondary" align="left">
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
                  <Grid
                    key={delegate ? delegate.address : `placeholder-${n}`}
                    item={true}
                    xs={12}
                  >
                    <DelegateVoteComponent
                      delegate={delegate}
                      onSubmit={this.props.onSubmit}
                      hasVote={
                        delegate ? votedDelegate === delegate.publicKey : false
                      }
                      isLoading={isLoading}
                    />
                  </Grid>
                );
              })}
            </React.Fragment>
          )}
        </Grid>
      </React.Fragment>
    );
  }
}

export default injectIntl(SendTransactionForm);
