import { withStyles, WithStyles } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar/Avatar';
import Button from '@material-ui/core/Button/Button';
import Grid from '@material-ui/core/Grid/Grid';
import List from '@material-ui/core/List/List';
import ListItem from '@material-ui/core/ListItem/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText/ListItemText';
import { createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography/Typography';
import { reaction, IReactionDisposer, observable, action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import Dialog, {
  SetDialogContent,
  DialogContentProps
} from '../../components/Dialog';
import LedgerConfirmIllustration from '../../components/LedgerConfirmIllustration';
import LedgerConnectIllustration from '../../components/LedgerConnectIllustration';
import { accountSettingsLedgerRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore from '../../stores/account';
import LedgerStore, { LedgerChannel } from '../../utils/ledgerHub';
import RootStore, { RouteLink } from '../../stores/root';
import WalletStore from '../../stores/wallet';
import autoId from '../../utils/autoId';

type Props = WithStyles<typeof styles> &
  DialogContentProps & {
    account: AccountStore;
    navigateBackLink: RouteLink;
    open?: boolean;
  };

type DecoratedProps = Props & InjectedIntlProps;

interface PropsInjected extends Props {
  accountStore: AccountStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
  store: RootStore;
}

interface State {
  confirmed: boolean;
}

const styles = createStyles({
  content: {
    padding: 20,
    textAlign: 'center'
  },
  noPadding: {
    marginLeft: -20,
    marginRight: -20
  },
  accountAvatar: {
    backgroundColor: 'white'
  }
});

const stylesDecorator = withStyles(styles, {
  name: 'VerifyLedgerDialog'
});

const messages = defineMessages({
  connectInstructions: {
    id: 'verify-ledger-address.connect-instructions',
    description:
      'Text instructing the user to open the RISE app on their Ledger device',
    defaultMessage: 'Connect your Ledger & open the RISE app on it.'
  },
  unsupportedBrowser: {
    id: 'verify-ledger-address.unsupported-browser',
    description:
      'Message when trying to use a browser that doesn\'t support Ledger devices',
    defaultMessage:
      'Your browser doesn\'t support using a Ledger device. If you wish to access this feature, ' +
      'you could try again with Google Chrome. It is a browser known to implement support for this.'
  },
  statusConnecting: {
    id: 'verify-ledger-address.status-connecting',
    description: 'Status text when attempting to connect to the Ledger device',
    defaultMessage: 'Trying to connect...'
  },
  accountNrLabel: {
    id: 'verify-ledger-address.account-nr-label',
    description: 'Label for the account number available for import',
    defaultMessage: 'Account #{number}'
  },
  confirmInstructions: {
    id: 'verify-ledger-address.confirm-instructions',
    description:
      'Text instructing the user to confirm their address on their Ledger',
    defaultMessage: 'Please confirm the address above on your Ledger device.'
  },
  closeDialog: {
    id: 'verify-ledger-address.close-dialog',
    description: 'Button to close the dialog after a successful verification',
    defaultMessage: 'Close'
  },
  verificationSuccessful: {
    id: 'verify-ledger-address.success',
    description:
      'Text visible after the user successfully verified the address',
    defaultMessage:
      'You have successfully verified the account address on your Ledger device.'
  },
  dialogTitle: {
    id: 'verify-ledger-address.dialog-title',
    description: 'Verify Ledger Address dialog title',
    defaultMessage: 'Verify Ledger Address'
  },
  statusWaitingConfirmation: {
    id: 'verify-ledger-address.status-waiting-confirmation',
    description: 'Status text when waiting for user to confirm the account',
    defaultMessage:
      'Waiting for confirmation... ({seconds} {seconds, plural,' +
      '  one {second}' +
      '  other {seconds}' +
      '} remaining)'
  }
});

@inject(accountStore)
@inject('walletStore')
@inject('routerStore')
@inject('ledgerStore')
@inject('store')
@observer
class VerifyLedgerDialog extends React.Component<DecoratedProps, State> {
  @autoId dialogContentId: string;
  state: State = {
    confirmed: false
  };
  open: boolean = false;
  private ledger: LedgerChannel;
  private disposeLedgerChangeMonitor: null | IReactionDisposer = null;
  private countdownId: null | number = null;
  @observable private countdownSeconds: number = 0;
  @observable private timeout: null | Date = null;

  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  onOpen = () => {
    if (this.open) {
      return;
    }
    this.open = true;
    const { ledgerStore, intl } = this.injected;
    this.ledger = ledgerStore.openChannel();

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });

    this.disposeLedgerChangeMonitor = reaction(
      () => this.ledger.deviceId,
      this.handleVerifyLedger
    );
    this.handleVerifyLedger();
  }

  onClose = () => {
    if (!this.open) {
      return;
    }
    this.open = false;
    if (this.disposeLedgerChangeMonitor) {
      this.disposeLedgerChangeMonitor();
      this.disposeLedgerChangeMonitor = null;
    }

    this.ledger.close();
    this.setState({ confirmed: false });
  }

  @action
  updateSelectionCountdown = () => {
    const now = new Date();
    const remainMs =
      this.timeout !== null ? this.timeout.getTime() - now.getTime() : 0;
    const isCountdownActive = remainMs > 0;

    if (isCountdownActive) {
      this.countdownSeconds = Math.ceil(remainMs / 1000);
    }

    if (isCountdownActive && this.countdownId === null) {
      this.countdownId = window.setInterval(this.updateSelectionCountdown, 250);
    } else if (!isCountdownActive && this.countdownId !== null) {
      window.clearInterval(this.countdownId);
      this.countdownId = null;
    }
  }

  handleVerifyLedger = async () => {
    if (!this.ledger.deviceId || this.state.confirmed) {
      return;
    }

    this.timeout = new Date(new Date().getTime() + 25000);
    this.updateSelectionCountdown();

    try {
      const confirmed = await this.ledger.confirmAccount(this.account!.hwSlot!);
      this.setState({ confirmed });
    } catch {
      // silent
    }
  }

  handleCloseButton = () => {
    this.onClose();
    this.injected.store.navigateTo(this.injected.navigateBackLink);
  }

  render() {
    const {
      navigateBackLink,
      routerStore,
      open,
      intl,
      classes,
      ledgerStore
    } = this.injected;
    const account = this.account;
    let deviceId;
    let confirmed;

    const isOpen =
      open || routerStore.currentView === accountSettingsLedgerRoute;

    if (isOpen) {
      this.onOpen();

      deviceId = this.ledger.deviceId;
      confirmed = this.state.confirmed;
    }

    return (
      <Dialog open={isOpen} onCloseRoute={navigateBackLink} onClose={this.onClose}>
        {!ledgerStore.hasBrowserSupport ? (
          <Grid container={true} className={classes.content} spacing={16}>
            <Grid item={true} xs={12}>
              <Typography
                children={intl.formatMessage(messages.unsupportedBrowser)}
              />
            </Grid>
          </Grid>
        ) : !deviceId ? (
          <Grid container={true} className={classes.content} spacing={16}>
            <Grid item={true} xs={12}>
              <Typography
                children={intl.formatMessage(messages.connectInstructions)}
              />
            </Grid>
            <Grid item={true} xs={12}>
              <div className={classes.noPadding}>
                <LedgerConnectIllustration />
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography
                children={intl.formatMessage(messages.statusConnecting)}
              />
            </Grid>
          </Grid>
        ) : (
          <React.Fragment>
            <List>
              <ListItem key={account.hwSlot!} divider={true}>
                <ListItemAvatar>
                  <Avatar className={classes.accountAvatar}>
                    <AccountIcon size={24} address={account.id} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={intl.formatMessage(messages.accountNrLabel, {
                    number: account.hwSlot! + 1
                  })}
                  secondary={account.id}
                />
              </ListItem>
            </List>
            {!confirmed && (
              <Grid container={true} className={classes.content} spacing={16}>
                <Grid item={true} xs={12}>
                  <Typography
                    children={intl.formatMessage(messages.confirmInstructions)}
                  />
                </Grid>
                <Grid item={true} xs={12}>
                  <div className={classes.noPadding}>
                    <LedgerConfirmIllustration />
                  </div>
                </Grid>
                <Grid item={true} xs={12}>
                  <Typography
                    children={intl.formatMessage(
                      messages.statusWaitingConfirmation,
                      { seconds: this.countdownSeconds }
                    )}
                  />
                </Grid>
              </Grid>
            )}
            {confirmed && (
              <Grid container={true} className={classes.content} spacing={16}>
                <Grid item={true} xs={12}>
                  <Typography
                    children={intl.formatMessage(
                      messages.verificationSuccessful
                    )}
                  />
                </Grid>
                <Grid item={true} xs={12}>
                  <Button
                    type="submit"
                    fullWidth={true}
                    children={intl.formatMessage(messages.closeDialog)}
                    onClick={this.handleCloseButton}
                  />
                </Grid>
              </Grid>
            )}
          </React.Fragment>
        )}
      </Dialog>
    );
  }
}

export default stylesDecorator(injectIntl(VerifyLedgerDialog));
