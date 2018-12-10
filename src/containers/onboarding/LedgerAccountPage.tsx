import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { observable, reaction, IReactionDisposer, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import LedgerConfirmIllustration from '../../components/LedgerConfirmIllustration';
import LedgerConnectIllustration from '../../components/LedgerConnectIllustration';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { onboardingAddAccountRoute, accountOverviewRoute } from '../../routes';
import { AccountType } from '../../stores/account';
import LedgerStore from '../../stores/ledger';
import OnboardingStore from '../../stores/onboarding';
import WalletStore from '../../stores/wallet';
import { LedgerAccount, LedgerChannel } from '../../utils/ledgerHub';

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

interface Props extends WithStyles<typeof styles> {}

type DecoratedProps = Props & InjectedIntlProps;

interface PropsInjected extends DecoratedProps {
  onboardingStore: OnboardingStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingLedgerAccountPage'
});

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
      'Message when trying to use a browser that doesn\'t support Ledger devices',
    defaultMessage:
      'Your browser doesn\'t support using a Ledger device. If you wish to access this feature, ' +
      'you could try again with Google Chrome. It is a browser known to implement support for this.'
  },
  statusConnecting: {
    id: 'onboarding-ledger-account.status-connecting',
    description: 'Status text when attempting to connect to the Ledger device',
    defaultMessage: 'Trying to connect...'
  },
  statusConnectingHelp: {
    id: 'onboarding-ledger-account.status-connecting-help',
    description: 'Link to the help page regarding Ledger connection problems',
    defaultMessage:
      'In case of problems please <a href="https://support.ledger.com/hc/' +
      'en-us/articles/115005165269-Fix-connection-issues" target="_blank">' +
      'visit the support page</a>.'
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

class AccountData {
  @observable data: null | LedgerAccount = null;

  constructor(ledger: LedgerChannel, readonly slot: number) {
    this.load(ledger);
  }

  private async load(ledger: LedgerChannel) {
    try {
      const resp = await ledger.getAccount(this.slot);
      runInAction(() => {
        this.data = resp;
      });
    } catch (ex) {
      // Ignore failures
    }
  }
}

@inject('onboardingStore')
@inject('routerStore')
@inject('walletStore')
@inject('ledgerStore')
@observer
class LedgerAccountPage extends React.Component<DecoratedProps> {
  private ledger: LedgerChannel;
  private disposeAccountLoader: null | IReactionDisposer = null;
  private countdownId: null | number = null;

  @observable private selectedAccount: null | AccountData = null;
  @observable private selectionTimeout: null | Date = null;
  @observable private countdownSeconds: number = 0;
  @observable private accounts = observable.array<AccountData>([]);

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  componentWillMount() {
    const { ledgerStore } = this.injected;
    this.ledger = ledgerStore.openChannel();

    this.disposeAccountLoader = reaction(
      () => this.ledger.deviceId,
      this.accountLoader
    );
    this.accountLoader();
  }

  componentWillUnmount() {
    if (this.disposeAccountLoader) {
      this.disposeAccountLoader();
      this.disposeAccountLoader = null;
    }

    this.ledger.close();
  }

  render() {
    const { intl, classes, ledgerStore } = this.injected;
    const { deviceId } = this.ledger;
    const { selectedAccount, countdownSeconds } = this;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingAddAccountRoute }}>
          <FormattedMessage
            id="onboarding-ledger-account.title"
            description="Import a Ledger account screen title"
            defaultMessage="Import a Ledger account"
          />
        </ModalPaperHeader>
        {ledgerStore.hasSupport === false ? (
          <Grid container={true} className={classes.content} spacing={16}>
            <Grid item={true} xs={12}>
              <Typography
                children={intl.formatMessage(messages.unsupportedBrowser)}
              />
            </Grid>
          </Grid>
        ) : deviceId === null ? (
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
              <Typography
                dangerouslySetInnerHTML={{
                  __html: intl.formatHTMLMessage(messages.statusConnectingHelp)
                }}
              />
            </Grid>
          </Grid>
        ) : selectedAccount !== null ? (
          <React.Fragment>
            <List>
              <ListItem key={selectedAccount.slot} divider={true}>
                <ListItemAvatar>
                  <Avatar className={classes.accountAvatar}>
                    <AccountIcon
                      size={24}
                      address={
                        selectedAccount.data ? selectedAccount.data.address : ''
                      }
                    />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={intl.formatMessage(messages.accountNrLabel, {
                    number: selectedAccount.slot + 1
                  })}
                  secondary={
                    selectedAccount.data ? selectedAccount.data.address : '...'
                  }
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
          </React.Fragment>
        ) : (
          <List>
            {this.accounts.map((acc, idx) => (
              <ListItem
                key={acc.slot}
                divider={idx + 1 < this.accounts.length}
                button={true}
                onClick={() => this.confirmImport(acc)}
              >
                <ListItemAvatar>
                  <Avatar className={classes.accountAvatar}>
                    <AccountIcon
                      size={24}
                      address={acc.data ? acc.data.address : ''}
                    />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={intl.formatMessage(messages.accountNrLabel, {
                    number: acc.slot + 1
                  })}
                  secondary={acc.data ? acc.data.address : '...'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </ModalPaper>
    );
  }

  private updateSelectionCountdown = () => {
    const now = new Date();
    const remainMs =
      this.selectionTimeout !== null
        ? this.selectionTimeout.getTime() - now.getTime()
        : 0;
    const isCountdownActive = remainMs > 0;

    runInAction(() => {
      if (isCountdownActive) {
        this.countdownSeconds = Math.ceil(remainMs / 1000);
      } else {
        // Make sure that the timeout clears the selected account
        this.selectedAccount = null;
      }
    });

    if (isCountdownActive && this.countdownId === null) {
      this.countdownId = window.setInterval(this.updateSelectionCountdown, 250);
    } else if (!isCountdownActive && this.countdownId !== null) {
      window.clearInterval(this.countdownId);
      this.countdownId = null;
    }
  }

  private async confirmImport(account: AccountData) {
    const { walletStore, routerStore } = this.injected;
    const { deviceId } = this.ledger;

    if (account.data !== null) {
      const { address: accountAddress } = account.data;

      // Switch to account importing UI
      runInAction(() => {
        this.selectedAccount = account;
        this.selectionTimeout = new Date(new Date().getTime() + 25000);
        this.updateSelectionCountdown();
      });

      // Run the actual confirmation logic
      let success: boolean;
      try {
        success = await this.ledger.confirmAccount(account.slot);
      } catch (ex) {
        success = false;
      }

      if (success && this.selectedAccount === account) {
        // login(...) and goTo(...) need to be called outside of runInAction, to avoid
        // weird order of execution and goTo(...) ending up being called before login(...)
        walletStore.login(
          accountAddress,
          {
            type: AccountType.LEDGER,
            hwId: deviceId,
            hwSlot: account.slot
          },
          true
        );
        routerStore.goTo(accountOverviewRoute, { id: accountAddress });
      } else {
        runInAction(() => {
          // Switch back to account list
          this.selectedAccount = null;
        });
      }
    }
  }

  /**
   * TODO move to LedgerStore
   */
  private accountLoader = () => {
    const accountsToLoad = 5;
    const { walletStore } = this.injected;
    const { deviceId } = this.ledger;

    this.selectedAccount = null;
    // TODO dispose the previous one
    this.accounts = observable.array();
    if (deviceId === null) {
      return;
    }

    const importedAccounts = [...walletStore.accounts.values()]
      .filter(({ type }) => type === AccountType.LEDGER)
      .filter(({ hwId }) => hwId === deviceId);

    for (let slot = 0; this.accounts.length < accountsToLoad; slot++) {
      const isImported =
        importedAccounts.filter(({ hwSlot }) => hwSlot === slot).length > 0;

      if (!isImported) {
        const acc = new AccountData(this.ledger, slot);
        this.accounts.push(acc);
      }
    }
  }
}

export default stylesDecorator(injectIntl(LedgerAccountPage));
