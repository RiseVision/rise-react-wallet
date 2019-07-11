import blue from '@material-ui/core/es/colors/blue';
import IconButton from '@material-ui/core/es/IconButton';
import Paper from '@material-ui/core/es/Paper';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import CloseIcon from '@material-ui/icons/Close';
import InfoIcon from '@material-ui/icons/Info';
import classNames from 'classnames';
import React, { ReactEventHandler } from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import autoId from '../utils/autoId';

const styles = (theme: Theme) => {
  const backgroundColor = blue[600];
  return createStyles({
    root: {
      ...theme.typography.body2,
      backgroundColor,
      color: theme.palette.getContrastText(backgroundColor),
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      padding: '6px 24px',
      marginBottom: theme.spacing.unit
    },
    icon: {
      fontSize: 20
    },
    messageIcon: {
      opacity: 0.9,
      marginRight: theme.spacing.unit
    },
    message: {
      padding: '8px 0',
      display: 'flex',
      alignItems: 'center'
    },
    action: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
      paddingLeft: 24,
      marginRight: -8
    }
  });
};

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  message: string;
  onDismiss?: ReactEventHandler<{}>;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'AccountTip' });

const messages = defineMessages({
  dismissAriaLabel: {
    id: 'account-tip.dismiss-aria-label',
    description: 'Accessibility label for dismiss tip button',
    defaultMessage: 'Dismiss'
  }
});

class AccountTip extends React.Component<DecoratedProps> {
  @autoId accountTipMessageId: string;

  render() {
    const { intl, classes, open, message, onDismiss } = this.props;

    if (!open) {
      return null;
    }

    return (
      <Paper
        className={classes.root}
        aria-describedby={this.accountTipMessageId}
      >
        <div className={classes.message}>
          <InfoIcon className={classNames(classes.icon, classes.messageIcon)} />
          <span id={this.accountTipMessageId}>{message}</span>
        </div>
        <div className={classes.action}>
          {!!onDismiss && (
            <IconButton
              aria-label={intl.formatMessage(messages.dismissAriaLabel)}
              color="inherit"
            >
              <CloseIcon className={classes.icon} />
            </IconButton>
          )}
        </div>
      </Paper>
    );
  }
}

export default stylesDecorator(injectIntl(AccountTip));
