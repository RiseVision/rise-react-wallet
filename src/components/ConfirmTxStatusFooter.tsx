import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import InfoIcon from '@material-ui/icons/Info';
import DoneIcon from '@material-ui/icons/Done';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ReactEventHandler } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      paddingLeft: theme.spacing.unit * 2,
      paddingRight: theme.spacing.unit * 2,
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      textAlign: 'center',
      '&:first-child': {
        paddingTop: theme.spacing.unit * 2
      },
      '&:last-child': {
        paddingBottom: theme.spacing.unit * 2
      }
    },
    statusContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 2 * theme.spacing.unit,
      marginRight: 2 * theme.spacing.unit,
      marginTop: theme.spacing.unit,
      marginBottom: theme.spacing.unit,
      '& > * + *': {
        marginLeft: 2 * theme.spacing.unit
      }
    },
    statusIcon: {
      fontSize: 48
    },
    statusMessage: {
      textAlign: 'left'
    }
  });

const stylesDecorator = withStyles(styles, { name: 'ConfirmTxStatusFooter' });

const messages = defineMessages({
  errorIconAria: {
    id: 'confirm-tx-status-footer.error-icon-aria',
    description: 'Error status icon label for accessibility',
    defaultMessage: 'Error indicator icon'
  },
  infoIconAria: {
    id: 'confirm-tx-status-footer.info-icon-aria',
    description: 'Info status icon label for accessibility',
    defaultMessage: 'Info indicator icon'
  },
  successIconAria: {
    id: 'confirm-tx-status-footer.success-icon-aria',
    description: 'Success status icon label for accessibility',
    defaultMessage: 'Success indicator icon'
  },
  ledgerDoubleConfirmLink: {
    id: 'confirm-tx-status-footer.ledger-dobule-confirm-link',
    description: 'text content for the ledger issue link',
    defaultMessage: 'known issue'
  }
});

type BaseProps = WithStyles<typeof styles>;

interface Props extends BaseProps {
  type:
    | 'broadcasting'
    | 'broadcast-succeeded'
    | 'broadcast-failed'
    | 'ledger-not-supported'
    | 'ledger-not-connected'
    | 'ledger-another-device'
    | 'ledger-confirming';
  onRetry?: ReactEventHandler<{}>;
  onClose?: ReactEventHandler<{}>;
  reason?: string;
  timeout?: number;
}

type DecoratedProps = Props & InjectedIntlProps;

class ConfirmTxStatusFooter extends React.Component<DecoratedProps> {
  render() {
    const {
      intl,
      classes,
      type,
      reason,
      timeout,
      onRetry,
      onClose
    } = this.props;

    return (
      <Grid className={classes.content} container={true} spacing={16}>
        <Grid item={true} xs={12} className={classes.statusContainer}>
          {type === 'broadcasting' || type === 'ledger-not-connected' ? (
            <div>
              <CircularProgress color="primary" />
            </div>
          ) : type === 'broadcast-succeeded' ? (
            <DoneIcon
              className={classes.statusIcon}
              color="primary"
              aria-label={intl.formatMessage(messages.successIconAria)}
            />
          ) : type === 'broadcast-failed' ||
          type === 'ledger-another-device' ||
          type === 'ledger-not-supported' ? (
            <ErrorOutlineIcon
              className={classes.statusIcon}
              color="error"
              aria-label={intl.formatMessage(messages.errorIconAria)}
            />
          ) : type === 'ledger-confirming' ? (
            <InfoIcon
              className={classes.statusIcon}
              color="inherit"
              aria-label={intl.formatMessage(messages.infoIconAria)}
            />
          ) : null}
          <Typography className={classes.statusMessage}>
            {type === 'broadcasting' ? (
              <FormattedMessage
                id="confirm-tx-dialog-content.broadcasting-msg"
                description="Message for when a transaction is being broadcast."
                defaultMessage="Broadcasting transaction to the network. Please wait..."
              />
            ) : type === 'broadcast-succeeded' ? (
              <FormattedMessage
                id="confirm-tx-status-footer.success-msg"
                description="Message for when a transaction broadcast succeeded."
                defaultMessage="The transaction was successfully broadcast to the network!"
              />
            ) : type === 'broadcast-failed' ? (
              <FormattedMessage
                id="confirm-tx-status-footer.error-msg"
                description="Message for when a transaction failed to broadcast."
                defaultMessage={
                  'Failed to broadcast the transaction to the network: {error}'}
                values={{
                  error: reason || 'N/A'
                }}
              />
            ) : type === 'ledger-not-supported' ? (
              <FormattedMessage
                id="confirm-tx-status-footer.ledger-not-supported-msg"
                description="Message for when the browser doesn't support Ledger."
                defaultMessage="Your browser doesn't support interfacing with Ledger devices."
              />
            ) : type === 'ledger-another-device' ? (
              <FormattedMessage
                id="confirm-tx-status-footer.ledger-another-device-msg"
                description="Message for when the user has connected the wrong Ledger."
                defaultMessage={
                  'The connected Ledger doesn\'t manage this account. Either you used ' +
                  'an additional passphrase (in your Ledger) when adding this account ' +
                  'or you have plugged in a device with a different mnemonic.'
                }
              />
            ) : type === 'ledger-not-connected' ? (
              <FormattedMessage
                id="confirm-tx-status-footer.ledger-not-connected-msg"
                description="Message for when the Ledger device isn't connected."
                defaultMessage={
                  'Please connect your Ledger and open the RISE app on it. ' +
                  'Waiting for Ledger...'
                }
              />
            ) : type === 'ledger-confirming' ? (
              <React.Fragment>
                <FormattedMessage
                  id="confirm-tx-status-footer.ledger-confirming-msg"
                  description="Message for when the user needs to confirm the transaction on Ledger."
                  defaultMessage={
                    'Please confirm the transaction on your Ledger. Waiting for confirmation... ' +
                    '({seconds} {seconds, plural,' +
                    '  one {second}' +
                    '  other {seconds}' +
                    '} remaining)'
                  }
                  values={{ seconds: timeout || 0 }}
                />
                <br />
                <br />
                <FormattedMessage
                  id="confirm-tx-status-footer.ledger-confirming-msg-twice"
                  description="Double confirmation issue notification."
                  defaultMessage={
                    'You may have to confirm twice. Its a {link}.'}
                  values={{
                    seconds: timeout || 0,

                    link: (
                      <a
                        href="https://support.ledger.com/hc/en-us/articles/360018810413-U2F-timeout-in-Chrome-browser"
                        target="_blank"
                      >
                        {intl.formatMessage(messages.ledgerDoubleConfirmLink)}
                      </a>
                    )
                  }}
                />
              </React.Fragment>
            ) : null}
          </Typography>
        </Grid>
        {onRetry && (
          <Grid item={true} xs={12} sm={onClose ? 6 : 12}>
            <Button onClick={onRetry} fullWidth={true}>
              <FormattedMessage
                id="confirm-tx-status-footer.try-again-button"
                description="Label for try again button."
                defaultMessage="Try again"
              />
            </Button>
          </Grid>
        )}
        {onClose && (
          <Grid item={true} xs={12} sm={onRetry ? 6 : 12}>
            <Button
              onClick={onClose}
              fullWidth={true}
              buttonRef={ref => {
                // focus on render
                if (ref) {
                  ref.focus();
                }
              }}
            >
              <FormattedMessage
                id="confirm-tx-status-footer.close-button"
                description="Label for close button."
                defaultMessage="Close"
              />
            </Button>
          </Grid>
        )}
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(ConfirmTxStatusFooter));
