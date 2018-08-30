import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { Delegate } from 'dpos-api-wrapper';
import { range } from 'lodash';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent } from 'react';
import { FormattedMessage, InjectedIntlProps, injectIntl } from 'react-intl';
import { RawAmount } from '../../utils/amounts';
import DelegateVoteComponent from '../DelegateVoteComponent';

interface Props {
  onSubmit: (delegate: Delegate, addVote: boolean) => void;
  onClose: () => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  isSearch: boolean;
  delegates: Delegate[];
  votedDelegate: string | null;
  fee: RawAmount;
  query?: string;
  error?: null | 'insufficient-funds';
}

type DecoratedProps = Props & InjectedIntlProps;

export interface State {
  query: string;
}

@observer
class VoteDelegateForm extends React.Component<DecoratedProps, State> {
  state: State = {
    query: ''
  };

  constructor(props: DecoratedProps) {
    super(props);
    this.state.query = props.query || '';
  }

  handleType = () => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const query = event.target.value.trim().toLowerCase();
    this.setState({ query });
    this.props.onSearch(query);
  }

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
    const { query } = this.state;

    const formatAmount = (amount: RawAmount) =>
      `${intl.formatNumber(amount.unit.toNumber())} RISE`;

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
            <React.Fragment>
              <Grid item={true} xs={12}>
                <Typography color="error">
                  <FormattedMessage
                    id="forms-vote-delegate.insufficient-funds-error"
                    description="Error about not having enough funds to vote for a delegate"
                    defaultMessage={
                      'You don\'t have enough funds in your account to pay the' +
                      ' network fee of {fee} for casting a vote for a delegate!'
                    }
                    values={{
                      fee: formatAmount(fee)
                    }}
                  />
                </Typography>
              </Grid>
              <Grid item={true} xs={12}>
                <Button fullWidth={true} onClick={this.props.onClose}>
                  <FormattedMessage
                    id="forms-vote-delegate.close-button"
                    description="Label for close button."
                    defaultMessage="Close"
                  />
                </Button>
              </Grid>
            </React.Fragment>
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
                  value={query}
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

export default injectIntl(VoteDelegateForm);
