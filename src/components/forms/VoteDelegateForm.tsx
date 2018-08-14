import * as React from 'react';
import {
  InjectedIntlProps,
  injectIntl,
  defineMessages,
  FormattedMessage
} from 'react-intl';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { Delegate } from 'dpos-api-wrapper';
import { observer } from 'mobx-react';
import { ChangeEvent } from 'react';
import AccountIcon from '../AccountIcon';

const styles = (theme: Theme) => createStyles({
  delegateRoot: {
  },
  delegateContent: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      margin: theme.spacing.unit,
    },
    '& > * + *': {
      marginLeft: 0,
    }
  },
  delegateIcon: {
  },
  delegateInfo: {
    flex: 1,
    textAlign: 'left',
  },
  delegateName: {
    ...theme.typography.body2,
  },
  delegateAddress: {
  },
  delegateStats: {
    margin: 0,
    padding: 0,
    listStyleType: 'none',
    ...theme.typography.body1,
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      display: 'block',
      flex: 1,
    },
  },
  delegateButton: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

interface Props extends WithStyles<typeof styles> {
  onSubmit: (delegate: Delegate, addVote: boolean) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  delegates: Delegate[];
  votedDelegate: string | null;
}

type DecoratedProps = Props & InjectedIntlProps;

export interface State {
  search: string;
}

const stylesDecorator = withStyles(styles);

const messages = defineMessages({
  delegateRankTitle: {
    id: 'forms-vote-delegate.delegate-rank-title',
    description: 'Title for rank statistic',
    defaultMessage: 'Rank',
  },
  delegateRankAriaLabel: {
    id: 'forms-vote-delegate.delegate-rank-aria-label',
    description: 'Aria label for rank statistic',
    defaultMessage: 'Rank: #{rank}',
  },
  delegateUptimeTitle: {
    id: 'forms-vote-delegate.delegate-uptime-title',
    description: 'Title for uptime statistic',
    defaultMessage: 'Uptime',
  },
  delegateUptimeAriaLabel: {
    id: 'forms-vote-delegate.delegate-uptime-aria-label',
    description: 'Aria label for uptime statistic',
    defaultMessage: 'Uptime: {uptime}',
  },
  delegateApprovalTitle: {
    id: 'forms-vote-delegate.delegate-approval-title',
    description: 'Title for approval statistic',
    defaultMessage: 'Approval',
  },
  delegateApprovalAriaLabel: {
    id: 'forms-vote-delegate.delegate-approval-aria-label',
    description: 'Aria label for approval statistic',
    defaultMessage: 'Approval: {approval}',
  },
  delegateAddVote: {
    id: 'forms-vote-delegate.delegate-add-vote',
    description: 'Add vote button label',
    defaultMessage: 'Cast vote',
  },
  delegateRemoveVote: {
    id: 'forms-vote-delegate.delegate-remove-vote',
    description: 'Remove vote button label',
    defaultMessage: 'Remove vote',
  },
});

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
      search: value
    });
    this.props.onSearch(value);
  }

  render() {
    const { intl, classes, delegates, votedDelegate, isLoading } = this.props;
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
              <Grid item={true} xs={12}>
                <Paper key={delegate.address} className={classes.delegateRoot}>
                  <div className={classes.delegateContent}>
                    <AccountIcon
                      className={classes.delegateIcon}
                      size={64}
                      address={delegate.address}
                    />
                    <div className={classes.delegateInfo}>
                      <Typography className={classes.delegateName}>{delegate.username}</Typography>
                      <Typography className={classes.delegateAddress}>{delegate.address}</Typography>
                      <ul className={classes.delegateStats}>
                        <li
                          title={intl.formatMessage(messages.delegateRankTitle)}
                          aria-label={intl.formatMessage(messages.delegateRankAriaLabel, {
                            rank: intl.formatNumber(delegate.rank),
                          })}
                        >
                          {'R: #'}
                          {intl.formatNumber(delegate.rank)}
                        </li>
                        <li
                          title={intl.formatMessage(messages.delegateUptimeTitle)}
                          aria-label={intl.formatMessage(messages.delegateUptimeAriaLabel, {
                            uptime: intl.formatNumber(delegate.rate / 100, {
                              style: 'percent',
                              maximumFractionDigits: 2,
                            }),
                          })}
                        >
                          {'U: '}
                          {intl.formatNumber(delegate.rate / 100, {
                            style: 'percent',
                            maximumFractionDigits: 2,
                          })}
                        </li>
                        <li
                          title={intl.formatMessage(messages.delegateApprovalTitle)}
                          aria-label={intl.formatMessage(messages.delegateApprovalAriaLabel, {
                            approval: intl.formatNumber(delegate.approval / 100, {
                              style: 'percent',
                              maximumFractionDigits: 2,
                            }),
                          })}
                        >
                          {'A: '}
                          {intl.formatNumber(delegate.approval / 100, {
                            style: 'percent',
                            maximumFractionDigits: 2,
                          })}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    className={classes.delegateButton}
                    fullWidth={true}
                    onClick={() =>
                      this.props.onSubmit(
                        delegate,
                        votedDelegate !== delegate.publicKey
                      )
                    }
                  >
                    {votedDelegate === delegate.publicKey
                      ? intl.formatMessage(messages.delegateRemoveVote)
                      : intl.formatMessage(messages.delegateAddVote)}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </React.Fragment>
        )}
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(SendTransactionForm));
