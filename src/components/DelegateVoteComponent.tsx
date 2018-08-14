import * as React from 'react';
import {
  InjectedIntlProps,
  injectIntl,
  defineMessages,
} from 'react-intl';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import { Delegate } from 'dpos-api-wrapper';
import { observer } from 'mobx-react';
import AccountIcon from './AccountIcon';

const styles = (theme: Theme) => createStyles({
  root: {
  },
  content: {
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
  button: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

interface Props extends WithStyles<typeof styles> {
  onSubmit: (delegate: Delegate, addVote: boolean) => void;
  delegate: Delegate;
  mode: 'add-vote' | 'remove-vote';
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles);

const messages = defineMessages({
  rankTitle: {
    id: 'delegate-vote-component.delegate-rank-title',
    description: 'Title for rank statistic',
    defaultMessage: 'Rank',
  },
  rankAriaLabel: {
    id: 'delegate-vote-component.delegate-rank-aria-label',
    description: 'Aria label for rank statistic',
    defaultMessage: 'Rank: #{rank}',
  },
  uptimeTitle: {
    id: 'delegate-vote-component.delegate-uptime-title',
    description: 'Title for uptime statistic',
    defaultMessage: 'Uptime',
  },
  uptimeAriaLabel: {
    id: 'delegate-vote-component.delegate-uptime-aria-label',
    description: 'Aria label for uptime statistic',
    defaultMessage: 'Uptime: {uptime}',
  },
  approvalTitle: {
    id: 'delegate-vote-component.delegate-approval-title',
    description: 'Title for approval statistic',
    defaultMessage: 'Approval',
  },
  approvalAriaLabel: {
    id: 'delegate-vote-component.delegate-approval-aria-label',
    description: 'Aria label for approval statistic',
    defaultMessage: 'Approval: {approval}',
  },
  addVote: {
    id: 'delegate-vote-component.delegate-add-vote',
    description: 'Add vote button label',
    defaultMessage: 'Cast vote',
  },
  removeVote: {
    id: 'delegate-vote-component.delegate-remove-vote',
    description: 'Remove vote button label',
    defaultMessage: 'Remove vote',
  },
});

@observer
class DelegateVoteComponent extends React.Component<DecoratedProps> {
  handleButtonClick = () => {
    const { onSubmit, delegate, mode } = this.props;
    onSubmit(delegate, mode === 'add-vote');
  }

  render() {
    const { intl, classes, delegate, mode } = this.props;

    const rank = intl.formatNumber(delegate.rank);
    const uptime = intl.formatNumber(delegate.rate / 100, {
      style: 'percent',
      maximumFractionDigits: 2,
    });
    const approval = intl.formatNumber(delegate.approval / 100, {
      style: 'percent',
      maximumFractionDigits: 2,
    });

    return (
      <Paper className={classes.root}>
        <div className={classes.content}>
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
                title={intl.formatMessage(messages.rankTitle)}
                aria-label={intl.formatMessage(messages.rankAriaLabel, { rank })}
              >
                R: #{rank}
              </li>
              <li
                title={intl.formatMessage(messages.uptimeTitle)}
                aria-label={intl.formatMessage(messages.uptimeAriaLabel, { uptime })}
              >
                U: {uptime}
              </li>
              <li
                title={intl.formatMessage(messages.approvalTitle)}
                aria-label={intl.formatMessage(messages.approvalAriaLabel, { approval })}
              >
                A: {approval}
              </li>
            </ul>
          </div>
        </div>
        <Button
          className={classes.button}
          fullWidth={true}
          onClick={this.handleButtonClick}
        >
          {intl.formatMessage(mode === 'add-vote' ? messages.addVote : messages.removeVote)}
        </Button>
      </Paper>
    );
  }
}

export default stylesDecorator(injectIntl(DelegateVoteComponent));
