import { withStyles, WithStyles } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar/Avatar';
import Grid from '@material-ui/core/Grid/Grid';
import List from '@material-ui/core/List/List';
import ListItem from '@material-ui/core/ListItem/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText/ListItemText';
import Typography from '@material-ui/core/Typography/Typography';
import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import Dialog from '../../components/Dialog';
import LedgerConfirmIllustration from '../../components/LedgerConfirmIllustration';
import LedgerConnectIllustration from '../../components/LedgerConnectIllustration';
import { accountSettingsRemoveRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore from '../../stores/account';
import LedgerStore, { LedgerChannel } from '../../stores/ledger';
import { RouteLink } from '../../stores/root';
import WalletStore from '../../stores/wallet';
import { createStyles } from '@material-ui/core/styles';

interface Props extends WithStyles<typeof styles> {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

type DecoratedProps = Props & InjectedIntlProps;

interface InjectedProps extends DecoratedProps {
  accountStore: AccountStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
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

@inject(accountStore)
@inject('walletStore')
@inject('routerStore')
@inject('ledgerStore')
@observer
class VerifyLedgerDialog extends React.Component<DecoratedProps, State> {
  private ledger: LedgerChannel;
  private disposeAccountLoader: null | IReactionDisposer = null;

  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  componentWillMount() {
    const { ledgerStore } = this.injected;
    this.ledger = ledgerStore.openChannel();

    this.disposeAccountLoader = reaction(
      () => this.ledger.deviceId,
      this.handleVerifyLedger
    );
    this.handleVerifyLedger();
  }

  componentWillUnmount() {
    if (this.disposeAccountLoader) {
      this.disposeAccountLoader();
      this.disposeAccountLoader = null;
    }

    this.ledger.close();
  }

  handleVerifyLedger = async () => {
    try {
      const success = await this.ledger.confirmAccount(this.account.hwSlot!);
      this.setState({
        confirmed: success
      });
    } catch {
      this.setState({
        confirmed: false
      });
    }
  };

  render() {
    const {
      navigateBackLink,
      routerStore,
      open,
      intl,
      classes,
      ledgerStore
    } = this.injected;
    const { deviceId } = this.ledger;

    const isOpen =
      open || routerStore.currentView === accountSettingsRemoveRoute;

    const account = this.account

    return (
      <Dialog open={isOpen} closeLink={navigateBackLink}>
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
        ) : account ? (
          <>
            <List>
              <ListItem key={account.hwSlot!} divider={true}>
                <ListItemAvatar>
                  <Avatar className={classes.accountAvatar}>
                    <AccountIcon
                      size={24}
                      address={account.id}
                    />
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
                    { seconds: countdownSeconds }
                  )}
                />
              </Grid>
            </Grid>
          </>
        ) : null}
      </Dialog>
    );
  }
}

const messages = defineMessages({
  connectInstructions: {
    id: 'onboarding-ledger-account.connect-instructions',
    description:
      'Text instructing the user to open the RISE app on their Ledger device',
    defaultMessage: 'Connect your Ledger & open the RISE app on it.'
  },
  unsupportedBrowser: {
    id: 'onboarding-ledger-account.unsupported-browser',
    description:
      "Message when trying to use a browser that doesn't support Ledger devices",
    defaultMessage:
      "Your browser doesn't support using a Ledger device. If you wish to access this feature, " +
      'you could try again with Google Chrome. It is a browser known to implement support for this.'
  },
  statusConnecting: {
    id: 'onboarding-ledger-account.status-connecting',
    description: 'Status text when attempting to connect to the Ledger device',
    defaultMessage: 'Trying to connect...'
  },
  accountNrLabel: {
    id: 'onboarding-ledger-account.account-nr-label',
    description: 'Label for the account number available for import',
    defaultMessage: 'Account #{number}'
  },
  confirmInstructions: {
    id: 'onboarding-ledger-account.confirm-instructions',
    description:
      'Text instructing the user to confirm their address on their Ledger',
    defaultMessage: 'Please confirm the address above on your Ledger device.'
  },
  statusWaitingConfirmation: {
    id: 'onboarding-ledger-account.status-waiting-confirmation',
    description: 'Status text when waiting for user to confirm the account',
    defaultMessage:
      'Waiting for confirmation... ({seconds} {seconds, plural,' +
      '  one {second}' +
      '  other {seconds}' +
      '} remaining)'
  }
});

export default stylesDecorator(injectIntl(VerifyLedgerDialog));
