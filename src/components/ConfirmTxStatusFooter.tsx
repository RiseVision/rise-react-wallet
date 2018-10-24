import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
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
        paddingTop: theme.spacing.unit * 2,
      },
      '&:last-child': {
        paddingBottom: theme.spacing.unit * 2,
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
  successIconAria: {
    id: 'confirm-tx-status-footer.success-icon-aria',
    description: 'Success status icon label for accessibility',
    defaultMessage: 'Success indicator icon'
  }
});

type BaseProps = WithStyles<typeof styles>;

interface Props extends BaseProps {
  type: 'in-progress' | 'success' | 'failure';
  onRetry?: ReactEventHandler<{}>;
  onClose?: ReactEventHandler<{}>;
  reason?: string;
}

type DecoratedProps = Props & InjectedIntlProps;

class ConfirmTxStatusFooter extends React.Component<DecoratedProps> {
  render() {
    const {
      intl,
      classes,
      type,
      reason,
      onRetry,
      onClose,
    } = this.props;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
      >
        <Grid item={true} xs={12} className={classes.statusContainer}>
          {type === 'in-progress' ? (
            <CircularProgress color="primary" />
          ) : type === 'success' ? (
            <DoneIcon
              className={classes.statusIcon}
              color="primary"
              aria-label={intl.formatMessage(messages.successIconAria)}
            />
          ) : type === 'failure' ? (
            <ErrorOutlineIcon
              className={classes.statusIcon}
              color="error"
              aria-label={intl.formatMessage(messages.errorIconAria)}
            />
          ) : null}
          <Typography className={classes.statusMessage}>
            {type === 'in-progress' ? (
              <FormattedMessage
                id="confirm-tx-dialog-content.broadcasting-msg"
                description="Message for when a transaction is being broadcast."
                defaultMessage="Broadcasting transaction to the network. Please wait..."
              />
            ) : type === 'success' ? (
              <FormattedMessage
                id="confirm-tx-status-footer.success-msg"
                description="Message for when a transaction broadcast succeeded."
                defaultMessage="The transaction was successfully broadcast to the network!"
              />
            ) : type === 'failure' ? (
              <FormattedMessage
                id="confirm-tx-status-footer.error-msg"
                description="Message for when a transaction failed to broadcast."
                defaultMessage={
                  'Failed to broadcast the transaction to the network: {error}'}
                values={{
                  error: reason || 'N/A'
                }}
              />
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
            <Button onClick={onClose} fullWidth={true}>
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
