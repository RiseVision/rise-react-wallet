import Button from '@material-ui/core/es/Button';
import Paper from '@material-ui/core/es/Paper';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/es/styles';
import Typography from '@material-ui/core/es/Typography';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import { Delegate } from 'risejs/dist/es5/types/beans';
import { FullDelegate } from '../utils/utils';
import AccountIcon from './AccountIcon';
import LoadingIndicator from './LoadingIndicator';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      position: 'relative'
    },
    inactive: {
      opacity: 0.5
    },
    hidden: {
      visibility: 'hidden'
    },
    content: {
      display: 'flex',
      flexDirection: 'row',
      '& > *': {
        margin: theme.spacing.unit
      },
      '& > * + *': {
        marginLeft: 0
      }
    },
    delegateIcon: {},
    delegateInfo: {
      flex: 1,
      textAlign: 'left'
    },
    delegateName: {
      ...theme.typography.body2,
      fontWeight: 500
    },
    delegateAddress: {},
    delegateStats: {
      margin: 0,
      padding: 0,
      listStyleType: 'none',
      ...theme.typography.body2,
      display: 'flex',
      flexDirection: 'row',
      '& > *': {
        display: 'block',
        flex: 1
      }
    },
    button: {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  });

interface Props extends WithStyles<typeof styles> {
  onSubmit: (delegate: Delegate, addVote: boolean) => void;
  delegate:
    | FullDelegate| null;
  hasVote: boolean;
  isLoading: boolean;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles);

const messages = defineMessages({
  rankTitle: {
    id: 'delegate-vote-component.rank-title',
    description: 'Title for rank statistic',
    defaultMessage: 'Rank'
  },
  rankAriaLabel: {
    id: 'delegate-vote-component.rank-aria-label',
    description: 'Aria label for rank statistic',
    defaultMessage: 'Rank: #{rank}'
  },
  uptimeTitle: {
    id: 'delegate-vote-component.uptime-title',
    description: 'Title for uptime statistic',
    defaultMessage: 'Uptime'
  },
  uptimeAriaLabel: {
    id: 'delegate-vote-component.uptime-aria-label',
    description: 'Aria label for uptime statistic',
    defaultMessage: 'Uptime: {uptime}'
  },
  approvalTitle: {
    id: 'delegate-vote-component.approval-title',
    description: 'Title for approval statistic',
    defaultMessage: 'Approval'
  },
  approvalAriaLabel: {
    id: 'delegate-vote-component.approval-aria-label',
    description: 'Aria label for approval statistic',
    defaultMessage: 'Approval: {approval}'
  },
  addVote: {
    id: 'delegate-vote-component.add-vote',
    description: 'Add vote button label',
    defaultMessage: 'Cast vote'
  },
  removeVote: {
    id: 'delegate-vote-component.remove-vote',
    description: 'Remove vote button label',
    defaultMessage: 'Remove vote'
  },
  noResult: {
    id: 'delegate-vote-component.no-result',
    description: 'No results label',
    defaultMessage: 'No result to display'
  }
});

@observer
class DelegateVoteComponent extends React.Component<DecoratedProps> {
  handleButtonClick = () => {
    const { onSubmit, delegate, hasVote } = this.props;
    if (delegate) {
      onSubmit(delegate, !hasVote);
    }
  }

  render() {
    const { intl, classes, delegate, hasVote, isLoading } = this.props;

    const display = isLoading ? 'loading' : delegate ? 'delegate' : 'empty';

    const { username, address, rank, uptime, approval } = delegate
      ? {
          username: delegate.username,
          address: delegate.address,
          rank: intl.formatNumber(delegate.infos.rankV2),
          uptime: intl.formatNumber(
            parseInt(delegate.infos.productivity, 10) / 100,
            {
              style: 'percent',
              maximumFractionDigits: 2
            }
          ),
          approval: intl.formatNumber(
            parseInt(delegate.infos.approval, 10) / 100,
            {
              style: 'percent',
              maximumFractionDigits: 2
            }
          )
        }
      : {
          username: 'N/A',
          address: 'N/A',
          rank: 'N/A',
          uptime: 'N/A',
          approval: 'N/A'
        };

    return (
      <Paper
        className={classNames(
          classes.root,
          display === 'empty' && classes.inactive
        )}
      >
        <div
          className={classNames(
            classes.content,
            display === 'delegate' || classes.hidden
          )}
        >
          <AccountIcon
            className={classes.delegateIcon}
            size={64}
            address={address}
          />
          <div className={classes.delegateInfo}>
            <Typography className={classes.delegateName}>{username}</Typography>
            <Typography className={classes.delegateAddress}>
              {address}
            </Typography>
            <ul className={classes.delegateStats}>
              <li
                title={intl.formatMessage(messages.rankTitle)}
                aria-label={intl.formatMessage(messages.rankAriaLabel, {
                  rank
                })}
              >
                R: #{rank}
              </li>
              <li
                title={intl.formatMessage(messages.uptimeTitle)}
                aria-label={intl.formatMessage(messages.uptimeAriaLabel, {
                  uptime
                })}
              >
                U: {uptime}
              </li>
              <li
                title={intl.formatMessage(messages.approvalTitle)}
                aria-label={intl.formatMessage(messages.approvalAriaLabel, {
                  approval
                })}
              >
                A: {approval}
              </li>
            </ul>
          </div>
        </div>
        <Button
          className={classNames(
            classes.button,
            display === 'delegate' || classes.hidden
          )}
          fullWidth={true}
          onClick={this.handleButtonClick}
        >
          {intl.formatMessage(
            !hasVote ? messages.addVote : messages.removeVote
          )}
        </Button>
        {display === 'empty' && (
          <div className={classes.overlay}>
            <Typography>{intl.formatMessage(messages.noResult)}</Typography>
          </div>
        )}
        {display === 'loading' && <LoadingIndicator />}
      </Paper>
    );
  }
}

export default stylesDecorator(injectIntl(DelegateVoteComponent));
